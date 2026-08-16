import crypto from 'crypto';

const COOKIE = 'siteeye_auth';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function timingSafeEqualStr(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

/** AUTH_USERS=user:pass,user2:pass2:siteeye|tactical */
export function parseUsers(raw) {
  const map = new Map();
  String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const [user, pass, brainsRaw] = entry.split(':');
      if (!user || !pass) return;
      const brains = brainsRaw
        ? brainsRaw.split('|').map((b) => b.trim().toLowerCase()).filter(Boolean)
        : ['*'];
      map.set(user.trim().toLowerCase(), { pass, brains });
    });
  return map;
}

/** Proprietary login is available when users are configured (or forced on). */
export function authEnabled() {
  const flag = String(process.env.AUTH_ENABLED || '').toLowerCase();
  if (flag === 'false') return false;
  if (flag === 'true') return true;
  return Boolean(process.env.AUTH_USERS?.trim());
}

/**
 * Public can browse the site. Axon voice/chat stays locked unless logged in.
 * Fail closed on Render/production.
 */
export function axonLocked() {
  const flag = String(process.env.AXON_LOCKED || '').toLowerCase();
  if (flag === 'false') return false;
  if (flag === 'true') return true;
  return process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';
}

export function getSecret() {
  return process.env.AUTH_SECRET || process.env.OPENAI_API_KEY || 'dev-insecure-secret-change-me';
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expect = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  if (!timingSafeEqualStr(sig, expect)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!data?.u || !data?.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  const parts = raw.split(';').map((p) => p.trim());
  for (const p of parts) {
    const i = p.indexOf('=');
    if (i === -1) continue;
    if (p.slice(0, i) === name) return decodeURIComponent(p.slice(i + 1));
  }
  return null;
}

export function setAuthCookie(res, session) {
  const token = sign(session);
  const secure = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
  const parts = [
    `${COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(MAX_AGE_MS / 1000)}`
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearAuthCookie(res) {
  const secure = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
  const parts = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function getSession(req) {
  return verify(readCookie(req, COOKIE));
}

export function tryLogin(username, password) {
  const users = parseUsers(process.env.AUTH_USERS);
  const row = users.get(String(username || '').trim().toLowerCase());
  if (!row || !timingSafeEqualStr(row.pass, password || '')) return null;
  return {
    u: String(username).trim().toLowerCase(),
    brains: row.brains,
    exp: Date.now() + MAX_AGE_MS
  };
}

export function canAccessBrain(session, brain) {
  if (!session?.brains?.length) return false;
  if (session.brains.includes('*')) return true;
  const b = String(brain || 'siteeye').toLowerCase();
  return session.brains.includes(b);
}

/** Only protects Axon endpoints — marketing site stays public. */
export function requireAxonAuth(req, res, next) {
  if (!axonLocked()) {
    req.auth = getSession(req) || { u: 'open', brains: ['*'] };
    return next();
  }
  const session = getSession(req);
  if (session) {
    req.auth = session;
    return next();
  }
  const wantsJson =
    req.path.startsWith('/api/') ||
    req.path === '/session' ||
    (req.headers.accept || '').includes('application/json');
  if (wantsJson) return res.status(401).json({ error: 'Axon access requires login', login: '/login.html' });
  return res.redirect(302, `/login.html?next=${encodeURIComponent(req.originalUrl || '/')}`);
}

// SiteEye Live — slides (use YOUR photos in /public/images/)

const SLIDES = [
  {
    image: '/images/slide-1.jpg',
    fallback: 'camera',
    title: 'See your job site from your phone.',
    line: 'A camera on a pole. Cell built in. Live video — from anywhere.',
    lead: 'SiteEye Live puts eyes where you can\'t be.',
    points: [
      '360° camera on a telescoping pole — 12 to 15 feet up',
      'Connects over cell service — no Wi-Fi at the site',
      'Watch on your phone, tablet, or office computer'
    ],
    axon: 'This is the big idea — you\'re not there, but you can still see everything.'
  },
  {
    image: '/images/slide-2.jpg',
    fallback: 'pool',
    title: 'Can\'t be there? Still see it.',
    line: 'Contractors on multiple sites. Parents at a pool party checking from the kitchen.',
    lead: 'Commercial crews and families — same peace of mind.',
    points: [
      'Contractors: know the crew is working without driving there',
      'Parents: pool parties, backyard events, park birthdays',
      'Other parents can check in remotely too'
    ],
    axon: 'Imagine a pool party — you\'re inside but you can still see the backyard on your phone.'
  },
  {
    image: '/images/slide-3.jpg',
    fallback: 'setup',
    title: 'Set it up in minutes.',
    line: 'No tools. No IT department. Pole up, cell signal, you\'re watching.',
    lead: 'Three steps — that\'s the whole thing.',
    points: [
      '1 — Arrive and set the pole up (minutes)',
      '2 — It connects to cell service automatically',
      '3 — Open the app and watch live'
    ],
    axon: 'Nobody needs to be tech-savvy. If you can use a phone, you can use this.'
  },
  {
    image: '/images/slide-4.jpg',
    fallback: 'phone',
    title: 'Watch live. Anywhere.',
    line: 'Office, truck, couch — same live view.',
    lead: 'Your phone becomes a window.',
    points: [
      'Works on iPhone, Android, or web browser',
      'Battery runs a full workday on the pole',
      'Pack it up and move to the next site'
    ],
    axon: 'You\'re not tied to being on location.'
  },
  {
    image: '/images/slide-5.jpg',
    fallback: 'kit',
    title: 'Simple pricing.',
    line: 'Contractor kits — monthly or buy outright. Ask Axon for your numbers.',
    lead: 'Basic for most crews. Pro for serious operations.',
    points: [
      'Basic — about $89/month plus setup, or ~$2,000 to buy',
      'Pro — about $119/month, more hardware and support',
      'Residential options coming'
    ],
    axon: 'Ask me what Basic vs Pro means — I\'ll keep it simple.'
  }
];

const FALLBACK_SVG = {
  camera: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect fill="#E2E8F0" width="400" height="300"/><rect x="185" y="80" width="30" height="120" fill="#94A3B8" rx="4"/><circle cx="200" cy="60" r="28" fill="#2563EB" opacity="0.9"/><rect x="240" y="120" width="80" height="120" rx="12" fill="#1E293B"/><rect x="252" y="135" width="56" height="80" rx="4" fill="#93C5FD"/><text x="200" y="270" text-anchor="middle" fill="#64748B" font-size="14" font-family="sans-serif">Your photo: camera on pole</text></svg>`,
  pool: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect fill="#DBEAFE" width="400" height="300"/><ellipse cx="200" cy="200" rx="120" ry="50" fill="#2563EB" opacity="0.3"/><text x="200" y="160" text-anchor="middle" fill="#1E40AF" font-size="16" font-family="sans-serif">Your photo: pool / backyard</text></svg>`,
  setup: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect fill="#F1F5F9" width="400" height="300"/><text x="200" y="140" text-anchor="middle" fill="#64748B" font-size="16" font-family="sans-serif">Your photo: deploying the unit</text></svg>`,
  phone: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect fill="#F1F5F9" width="400" height="300"/><rect x="160" y="60" width="80" height="140" rx="10" fill="#1E293B"/><rect x="170" y="75" width="60" height="100" rx="2" fill="#93C5FD"/><text x="200" y="240" text-anchor="middle" fill="#64748B" font-size="14" font-family="sans-serif">Your photo: watching on phone</text></svg>`,
  kit: `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect fill="#F1F5F9" width="400" height="300"/><text x="200" y="150" text-anchor="middle" fill="#64748B" font-size="16" font-family="sans-serif">Your photo: kit / product</text></svg>`
};

function imgSrc(slide) {
  return slide.image;
}

function thumbSrc(slide) {
  return slide.image;
}

function onImgError(img, fallbackKey) {
  const svg = FALLBACK_SVG[fallbackKey];
  if (svg) img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
}

let idx = 0;
let history = [];
let pc = null, stream = null, dc = null, connecting = false;

const chat = document.getElementById('axon-chat');
const talkBtn = document.getElementById('talk-btn');
const filmstrip = document.getElementById('filmstrip');

SLIDES.forEach((s, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'thumb' + (i === 0 ? ' on' : '');
  const img = document.createElement('img');
  img.src = thumbSrc(s);
  img.alt = `Slide ${i + 1}`;
  img.onerror = () => onImgError(img, s.fallback);
  btn.appendChild(img);
  const num = document.createElement('span');
  num.className = 'thumb-num';
  num.textContent = i + 1;
  btn.appendChild(num);
  btn.onclick = () => go(i);
  filmstrip.appendChild(btn);
});

function go(n) {
  idx = Math.max(0, Math.min(SLIDES.length - 1, n));
  const s = SLIDES[idx];
  const hero = document.getElementById('hero-img');
  hero.src = imgSrc(s);
  hero.alt = s.title;
  hero.onerror = () => onImgError(hero, s.fallback);

  document.getElementById('hero-title').textContent = s.title;
  document.getElementById('hero-line').textContent = s.line;
  document.getElementById('slide-tag').textContent = `Slide ${idx + 1}`;
  document.getElementById('slide-num').textContent = `${idx + 1} / ${SLIDES.length}`;
  document.getElementById('progress-fill').style.width = `${((idx + 1) / SLIDES.length) * 100}%`;

  document.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('on', i === idx));
  document.getElementById('btn-back').disabled = idx === 0;
  document.getElementById('btn-fwd').textContent = idx === SLIDES.length - 1 ? '✓' : '▶';

  const frame = document.getElementById('slide-frame');
  frame.style.animation = 'none';
  frame.offsetHeight;
  frame.style.animation = '';

  if (s.axon && !s._shown) {
    s._shown = true;
    bubble(s.axon, 'them');
  }
}

document.getElementById('btn-back').onclick = () => go(idx - 1);
document.getElementById('btn-fwd').onclick = () => { if (idx < SLIDES.length - 1) go(idx + 1); };

document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').hidden) {
    if (e.key === 'Escape') closeLightbox();
    return;
  }
  if (e.key === 'ArrowRight') go(idx + 1);
  if (e.key === 'ArrowLeft') go(idx - 1);
});

const lb = document.getElementById('lightbox');

function openLightbox() {
  const s = SLIDES[idx];
  const lbImg = document.getElementById('lb-img');
  lbImg.src = imgSrc(s);
  lbImg.onerror = () => onImgError(lbImg, s.fallback);
  document.getElementById('lb-title').textContent = s.title;
  document.getElementById('lb-lead').textContent = s.lead;
  document.getElementById('lb-points').innerHTML = s.points.map(p => `<li>${esc(p)}</li>`).join('');
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lb.hidden = true;
  document.body.style.overflow = '';
}

document.getElementById('hero-hit').onclick = openLightbox;
document.getElementById('lb-x').onclick = closeLightbox;
document.getElementById('lb-close').onclick = closeLightbox;

go(0);

function bubble(text, who = 'them') {
  const el = document.createElement('div');
  el.className = `bubble ${who}`;
  el.textContent = text;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function sendText() {
  const input = document.getElementById('type-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  bubble(text, 'you');
  history.push({ role: 'user', content: text });
  const wait = document.createElement('div');
  wait.className = 'bubble them';
  wait.textContent = '…';
  chat.appendChild(wait);
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history })
    });
    const data = await r.json();
    wait.remove();
    bubble(data.reply || 'Try again.', 'them');
    history.push({ role: 'assistant', content: data.reply });
  } catch {
    wait.remove();
    bubble('Connection problem.', 'them');
  }
}

document.getElementById('type-send').onclick = sendText;
document.getElementById('type-input').onkeydown = e => { if (e.key === 'Enter') sendText(); };

async function stopVoice() {
  if (dc) { try { dc.close(); } catch {} dc = null; }
  if (pc) { try { pc.close(); } catch {} pc = null; }
  if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch {} stream = null; }
  talkBtn.textContent = 'Talk to Axon';
  talkBtn.classList.remove('live');
  connecting = false;
}

async function startVoice() {
  if (pc || connecting) { await stopVoice(); return; }
  connecting = true;
  talkBtn.textContent = 'Connecting…';
  try {
    const r = await fetch('/session');
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Could not connect');
    pc = new RTCPeerConnection();
    const audio = document.createElement('audio');
    audio.autoplay = true;
    pc.ontrack = e => { if (audio.srcObject !== e.streams[0]) audio.srcObject = e.streams[0]; };
    dc = pc.createDataChannel('oai-events');
    dc.onopen = () => {
      talkBtn.textContent = 'Stop';
      talkBtn.classList.add('live');
      dc.send(JSON.stringify({ type: 'response.create', response: { modalities: ['audio', 'text'] } }));
    };
    dc.onmessage = e => {
      try {
        const ev = JSON.parse(e.data);
        if (ev.type === 'response.audio_transcript.done' && ev.transcript) bubble(ev.transcript.trim(), 'them');
        if (ev.type === 'conversation.item.input_audio_transcription.completed' && ev.transcript) bubble(ev.transcript, 'you');
      } catch {}
    };
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(stream.getTracks()[0]);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const model = data.model || 'gpt-realtime';
    const sdp = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      method: 'POST', body: offer.sdp,
      headers: { Authorization: 'Bearer ' + data.client_secret.value, 'Content-Type': 'application/sdp' }
    });
    if (!sdp.ok) throw new Error('Voice failed');
    await pc.setRemoteDescription({ type: 'answer', sdp: await sdp.text() });
    connecting = false;
  } catch (err) {
    bubble(err.message || 'Use text instead.', 'them');
    await stopVoice();
  }
}

talkBtn.onclick = startVoice;

document.getElementById('contact-form').onsubmit = async e => {
  e.preventDefault();
  const msg = document.getElementById('c-msg');
  msg.textContent = 'Sending…';
  try {
    const r = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('c-name').value,
        phone: document.getElementById('c-phone').value,
        email: document.getElementById('c-email').value
      })
    });
    msg.textContent = (await r.json()).ok ? 'Thanks — we\'ll reach out.' : 'Error.';
  } catch { msg.textContent = 'Error.'; }
};

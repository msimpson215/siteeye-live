import express from 'express';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

const PORT = process.env.PORT || 3000;
const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime';
const REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE || 'alloy';
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

const PLAIN_ENGLISH = `You are Axon — you explain SiteEye Live to regular people who have NEVER heard of it.

WHAT IT IS (say it like this):
SiteEye Live is a camera on a tall pole. You set it up at a job site, a pool party, or a backyard event. It connects to cell service — no Wi-Fi needed. You watch live video on your phone from anywhere. That's it.

WHO IT'S FOR:
- Contractors who can't be at every job site at once
- Parents who want to see the pool party or backyard while they're inside or at home

HOW IT WORKS (simple):
1. Put the pole up (a few minutes)
2. It connects to cell service automatically  
3. Open your phone and watch live

PRICING (if asked):
Contractor version — Basic around $89/month or buy outright about $2,000. Pro version more features, about $119/month. Residential coming — same idea, simpler package.

RULES:
- Talk like you're explaining to a neighbor named Don. No jargon. No "360°" unless they ask.
- No "early access" pitch — say "if you want to learn more, leave your name or ask me."
- Short answers. 2-3 sentences max.
- Never say briefing, AP, or presentation — say "let me explain" or "here's how it works."`;

const VOICE = `${PLAIN_ENGLISH}

Do NOT talk over the user. Wait until they finish speaking.

When session starts, say once:
"Hi — I'm Axon. SiteEye Live is pretty simple — it's a camera on a pole so you can watch a place live from your phone. No Wi-Fi needed. What would you like to know first — how it works, who uses it, or what it costs?"`;

function hasKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

app.get('/health', (_req, res) => res.json({ ok: hasKey() }));

app.get('/session', async (_req, res) => {
  if (!hasKey()) return res.status(503).json({ error: 'OPENAI_API_KEY not set.' });
  try {
    const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: REALTIME_MODEL,
        voice: REALTIME_VOICE,
        modalities: ['audio', 'text'],
        turn_detection: { type: 'server_vad', silence_duration_ms: 900, prefix_padding_ms: 300, create_response: true },
        instructions: VOICE
      })
    });
    const data = await r.json();
    if (!r.ok || data.error) return res.status(r.status || 502).json({ error: data.error?.message || 'Failed' });
    if (!data.client_secret?.value) return res.status(502).json({ error: 'No token.' });
    res.json({ ...data, model: REALTIME_MODEL });
  } catch (e) {
    res.status(500).json({ error: 'Session failed.' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'No message' });
  if (!hasKey()) return res.status(503).json({ reply: 'Axon is not connected yet. Add OPENAI_API_KEY on the server.' });
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: 300,
        messages: [
          { role: 'system', content: PLAIN_ENGLISH },
          ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ]
      })
    });
    const data = await r.json();
    res.json({ reply: data.choices?.[0]?.message?.content || 'Sorry, try again.' });
  } catch {
    res.status(500).json({ reply: 'Axon is unavailable right now.' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name && !email && !phone) return res.status(400).json({ ok: false });
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const t = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      await t.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        subject: `SiteEye Live — ${name || 'Inquiry'}`,
        text: `${name || ''}\n${email || ''}\n${phone || ''}\n${message || ''}`
      });
    } else console.log('CONTACT:', req.body);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.get('*', (_req, res) => res.sendFile(join(__dirname, '../public/index.html')));

app.listen(PORT, () => console.log(`SiteEye Live → port ${PORT}`));

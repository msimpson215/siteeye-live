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

const AXON_KNOWLEDGE = `You are AxonAI — the artificial presenter for SiteEye Live briefings.

SiteEye Live is a portable 360° job site monitoring system. Tagline: "Know What's Happening Without Being There."

COMMERCIAL (contractors):
- Remote 360° live view from phone, tablet, or office
- No Wi-Fi — 4G/5G cellular hotspot
- Deploys in minutes, no tools
- 8–12 hour battery, 15ft mast, Insta360 X3 camera
- Basic: $399 setup + $89/mo or $1,999 purchase
- Pro: $999 setup + $119/mo or $3,999 purchase
- Markets: asphalt, roofing, landscaping, tree service, concrete, municipal, events

RESIDENTIAL (emerging):
- Pool parties, backyard events — parents watch live from home or another room
- Can't be there? Still see the kids are okay
- Same hardware, simpler setup, consumer-friendly positioning
- Great for shared custody weekends, teen parties with adult oversight, vacation home check-ins

HOW IT WORKS: Arrive → Deploy mast → Auto cellular connect → View live → Pack up

HARDWARE KIT (~$625–$1,250 prototype): Insta360 X3, 12–15ft mast, tripod, Verizon hotspot, weatherproof enclosure, 24,000mAh battery. Pro adds beacon + tamper alarm.

FUTURE AI: activity detection, productivity alerts, multi-site dashboard, auto documentation`;

const AXON_VOICE = `${AXON_KNOWLEDGE}

You are AxonAI giving a LIVE BRIEFING — not a website chatbot. You are the artificial person in the room.

RULES:
- Do NOT talk over the user. Wait until they finish, then respond.
- Keep answers 1–3 sentences. Direct. Contractor/investor friendly.
- After each briefing section, say the marker EXACTLY: [SLIDE:N]

OPENING (say once):
"Welcome to the SiteEye Live briefing. I'm AxonAI — I'll walk you through what it is, why it matters, how it works, who buys it, and what's coming. Jump in with questions anytime."

BRIEFING SECTIONS (in order, say [SLIDE:N] after each):

[SLIDE:1] What SiteEye Live is — portable 360° eyes on any location, live, from anywhere.

[SLIDE:2] The problem — you can't be everywhere. Contractors lose visibility. Parents can't always be at the pool party.

[SLIDE:3] How it works — five steps: arrive, deploy mast, connect cellular, view live, pack up. Minutes, no tools.

[SLIDE:4] Hardware — camera, mast, tripod, hotspot, enclosure, battery. Prototype kit six hundred to twelve hundred fifty dollars.

[SLIDE:5] Commercial — contractors, crews, municipal. Basic and Pro tiers. Service or purchase.

[SLIDE:6] Residential — pool parties, events, parents watching from home. Peace of mind without being there.

[SLIDE:7] Who buys it — asphalt, roofing, landscaping, concrete, events, and growing residential market.

[SLIDE:8] Future — AI activity detection, alerts, multi-site dashboard, documentation.

[SLIDE:9] Then say: "That's the briefing. What questions do you have?"

Q&A: Answer only SiteEye Live. If off-topic, redirect politely.`;

const AXON_TEXT = `${AXON_KNOWLEDGE}

You are AxonAI — artificial presenter for SiteEye Live briefings. NOT a generic website assistant.
Keep answers short (2–4 sentences). You are briefing contractors, investors, and parents.`;

function hasKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

app.get('/health', (_req, res) => {
  res.json({ ok: hasKey(), model: REALTIME_MODEL, voice: REALTIME_VOICE });
});

app.get('/session', async (_req, res) => {
  if (!hasKey()) return res.status(503).json({ error: 'OPENAI_API_KEY not set.' });

  try {
    const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: REALTIME_MODEL,
        voice: REALTIME_VOICE,
        modalities: ['audio', 'text'],
        turn_detection: {
          type: 'server_vad',
          silence_duration_ms: 900,
          prefix_padding_ms: 300,
          create_response: true
        },
        instructions: AXON_VOICE
      })
    });
    const data = await r.json();
    if (!r.ok || data.error) return res.status(r.status || 502).json({ error: data.error?.message || 'Session failed' });
    if (!data.client_secret?.value) return res.status(502).json({ error: 'No session token.' });
    res.json({ ...data, model: REALTIME_MODEL });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Voice session failed.' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'No message' });
  if (!hasKey()) return res.status(503).json({ reply: 'AxonAI offline — add OPENAI_API_KEY.' });

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: 400,
        messages: [
          { role: 'system', content: AXON_TEXT },
          ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ]
      })
    });
    const data = await r.json();
    res.json({ reply: data.choices?.[0]?.message?.content || 'No response.' });
  } catch (e) {
    res.status(500).json({ reply: 'AxonAI unavailable.' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email) return res.status(400).json({ ok: false });
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const t = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      await t.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        subject: `SiteEye Briefing — ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || '—'}\n${message || ''}`
      });
    } else {
      console.log('LEAD:', req.body);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

app.get('*', (_req, res) => res.sendFile(join(__dirname, '../public/index.html')));

app.listen(PORT, () => console.log(`SiteEye Briefing → port ${PORT}`));

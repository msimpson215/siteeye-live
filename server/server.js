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

const KNOWLEDGE = `SiteEye Live — portable 360° live monitoring. Tagline: "Know What's Happening Without Being There."

COMMERCIAL: Remote 360° view, no Wi-Fi (4G/5G), deploys in minutes, 8–12hr battery, 15ft mast, Insta360 X3.
Basic: $399 setup + $89/mo or $1,999 purchase. Pro: $999 setup + $119/mo or $3,999 purchase.
Markets: asphalt, roofing, landscaping, tree service, concrete, municipal, events.

RESIDENTIAL: Pool parties, park birthdays, backyard events — parents watch live from home or another room. Security/peace of mind.

HOW IT WORKS: Arrive → Deploy mast → Cellular connect → View live → Pack up.
HARDWARE (~$625–$1,250): camera, 12–15ft mast, tripod, Verizon hotspot, enclosure, 24,000mAh battery.
FUTURE: AI activity detection, productivity alerts, multi-site dashboard, documentation.`;

const BRIEFING_MODE = `${KNOWLEDGE}

You are AxonAI — an Artificial Person (AP) presenting SiteEye Live. This is a LIVE BRIEFING, not a website.

MODE: PRESENTATION — walk through the full deck. Do NOT talk over the listener during your sections.

OPENING (say once):
"Welcome. I'm AxonAI, your artificial presenter for today's SiteEye Live briefing. I'll walk you through the whole presentation — what it is, the problem it solves, how it works, pricing, and who it's for. When I'm done, you'll be able to ask me anything. Let's begin."

Present each section in order. After each, say [SLIDE:N] exactly:

[SLIDE:1] SiteEye Live — portable 360° eyes on any location. Live view from phone or office. Know what's happening without being there.

[SLIDE:2] The problem — contractors can't be on every site. Parents can't always be at the pool party or park birthday. No visibility until it's too late.

[SLIDE:3] Five steps — arrive, deploy the mast in minutes, auto-connect cellular, view live, pack up and move on. No Wi-Fi needed.

[SLIDE:4] The kit — 360 camera, telescoping mast, tripod, hotspot, weatherproof box, all-day battery. Prototype cost six twenty-five to twelve fifty.

[SLIDE:5] Commercial pricing — Basic at three ninety-nine plus eighty-nine a month, or Pro at nine ninety-nine plus one nineteen. Purchase options too.

[SLIDE:6] Residential — pool parties, park events, parents watching from home. Same hardware, peace of mind for families.

[SLIDE:7] Who buys — contractors across asphalt, roofing, landscaping, concrete, plus events and residential families.

[SLIDE:8] Coming soon — AI detects activity, sends alerts, multi-site dashboard, automatic job documentation.

[SLIDE:9] Then say exactly:
"That completes the briefing. You can ask me anything now — pricing, hardware, commercial or residential. What would you like to know?"

After slide 9, switch to Q&A. Keep answers to 1–3 sentences.`;

const QA_MODE = `${KNOWLEDGE}

You are AxonAI — Artificial Person for SiteEye Live Q&A. The briefing is done. Answer questions only about SiteEye Live.
Keep answers 1–3 sentences. Friendly, direct — talking to Joe, Tony, contractors, or investors.
If off-topic, say: "I'm here for SiteEye Live — what would you like to know?"`;

const TEXT_MODE = `${KNOWLEDGE}

You are AxonAI — Artificial Person for SiteEye Live. Answer briefing questions concisely (2–4 sentences).`;

function hasKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

app.get('/health', (_req, res) => {
  res.json({ ok: hasKey(), product: 'AP Presenter', model: REALTIME_MODEL });
});

app.get('/session', async (req, res) => {
  if (!hasKey()) return res.status(503).json({ error: 'OPENAI_API_KEY not set.' });

  const mode = req.query.mode === 'qa' ? 'qa' : 'briefing';
  const instructions = mode === 'qa' ? QA_MODE : BRIEFING_MODE;

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
        instructions
      })
    });
    const data = await r.json();
    if (!r.ok || data.error) return res.status(r.status || 502).json({ error: data.error?.message || 'Failed' });
    if (!data.client_secret?.value) return res.status(502).json({ error: 'No token.' });
    res.json({ ...data, model: REALTIME_MODEL, mode });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Session failed.' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'No message' });
  if (!hasKey()) return res.status(503).json({ reply: 'AxonAI offline — set OPENAI_API_KEY.' });

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
          { role: 'system', content: TEXT_MODE },
          ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ]
      })
    });
    const data = await r.json();
    res.json({ reply: data.choices?.[0]?.message?.content || 'No response.' });
  } catch {
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
        subject: `SiteEye AP Briefing — ${name}`,
        text: `${name} | ${email} | ${phone || ''}\n${message || ''}`
      });
    } else console.log('LEAD:', req.body);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.get('*', (_req, res) => res.sendFile(join(__dirname, '../public/index.html')));

app.listen(PORT, () => console.log(`AP Presenter → http://localhost:${PORT}`));

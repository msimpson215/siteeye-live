import express from 'express';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

const PORT = process.env.PORT || 3000;
const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime';
const REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE || 'alloy';
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

const AXON_KNOWLEDGE = `You are AxonAI — the SiteEye Live product expert. You know everything about SiteEye Live, a portable 360° job site monitoring system for contractors.

PRODUCT:
- Tagline: "Know What's Happening Without Being There."
- Remote 360° live view of job sites from phone, tablet, or office
- No Wi-Fi needed — uses 4G/5G cellular hotspot
- Deploys in minutes, no tools required
- Works on iOS, Android, web browser
- USA-based support

HOW IT WORKS (5 steps):
1. Arrive at job site
2. Deploy telescoping mast (minutes, no tools)
3. Auto-connects to 4G/5G cellular
4. View live from phone or office dashboard
5. Pack up and move to next site

HARDWARE KIT:
- 360° Camera: Insta360 X3 (~$300–$350) — full panoramic live or recorded view
- Telescoping Mast: 12–15 ft fiberglass pole (~$100–$250), collapses to 3 ft
- Heavy Duty Tripod (~$75–$150)
- 4G/5G Hotspot: Verizon Jetpack M2100 (~$50–$200, $20–$50/mo service)
- Weatherproof Locking Enclosure (~$25–$75)
- Battery: 24,000mAh power bank (~$50–$150), 8–12 hours runtime
- Alarm/Beacon (Pro): flashing beacon + motion/vibration alarm (~$25–$75)
- Estimated prototype cost: $625 – $1,250

PRICING — BASIC (Affordable. Simple. Commercial Grade.):
- Service (Most Popular): $399 setup + $89/month
- Purchase: $1,999 one-time
- Includes: Basic unit, 360° camera, telescoping pole, mobile app, cloud dashboard, support

PRICING — PRO (Built for Serious Contractors):
- Service (Most Popular): $999 setup + $119/month
- Purchase: $3,999 one-time
- Includes: Commercial grade mast, premium 360° camera, dedicated cellular hotspot, lockable weatherproof enclosure, flashing beacon, motion/vibration alarm, priority support, extended cloud storage

SAFETY FEATURES:
- Flashing beacon, motion/vibration tamper alarm, cloud storage, encrypted footage, USA support, any device

FUTURE AI (coming):
- AI activity detection, productivity alerts, multi-crew dashboard, project documentation with time-stamped records

MOUNTING OPTIONS:
- Tripod (standalone), Bumper Mount (hitch/bumper), Hood Mount (suction/clamp, max height)

MARKETS:
Asphalt & Sealcoating, Roofing, Landscaping, Tree Services, Concrete, Municipal Crews, Festivals & Events, Sports Tournaments

KEY STATS: 360° live view, 4K camera, 8–12hr battery, 15ft mast height`;

const AXON_VOICE_INSTRUCTIONS = `${AXON_KNOWLEDGE}

IMPORTANT: Do NOT talk over the user. Wait until they finish speaking, then respond.

START OF SESSION (say exactly once):
"Hey — I'm AxonAI, your SiteEye Live expert. Ask me anything — how it works, what's in the kit, pricing, who it's for. What would you like to know?"

RULES:
- Answer only about SiteEye Live
- Keep answers short: 1–3 sentences, contractor-friendly, no tech jargon
- If asked for pricing/estimate on custom work, give SiteEye pricing from above
- If asked to order or early access: "Drop your name and email in the contact panel, or tell me and I'll note it."
- If unrelated: "I'm here for SiteEye Live questions. What would you like to know?"
- Friendly, confident, direct — talking to a contractor or investor`;

const AXON_TEXT_INSTRUCTIONS = `${AXON_KNOWLEDGE}

RULES:
- You are AxonAI, SiteEye Live product expert
- Answer only about SiteEye Live — specs, pricing, deployment, markets, hardware
- Keep answers concise: 2–4 sentences max unless they ask for detail
- Contractor and investor friendly — clear, confident, no fluff
- If asked to order: direct them to the contact panel on screen
- If unrelated: politely redirect to SiteEye Live topics`;

function hasOpenAIKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

app.get('/health', (_req, res) => {
  res.json({
    ok: hasOpenAIKey(),
    openai_key_configured: hasOpenAIKey(),
    model: REALTIME_MODEL,
    voice: REALTIME_VOICE
  });
});

app.get('/session', async (_req, res) => {
  if (!hasOpenAIKey()) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not set. Add it to your .env file.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
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
        instructions: AXON_VOICE_INSTRUCTIONS
      })
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return res.status(response.status || 502).json({ error: data.error?.message || 'Session failed' });
    }
    if (!data.client_secret?.value) {
      return res.status(502).json({ error: 'No session token returned.' });
    }
    res.json({ ...data, model: REALTIME_MODEL });
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'Failed to create voice session.' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'No message' });

  if (!hasOpenAIKey()) {
    return res.status(503).json({ reply: 'AxonAI is offline — OPENAI_API_KEY not configured.' });
  }

  try {
    const messages = [
      { role: 'system', content: AXON_TEXT_INSTRUCTIONS },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: 400,
        messages
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t respond right now.';
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ reply: 'AxonAI is temporarily unavailable.' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, company, type, message, subject } = req.body;
  if (!name || !email) return res.status(400).json({ ok: false, error: 'Name and email required' });

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        subject: `SiteEye Live — ${subject || 'New Inquiry'} from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || '—'}\nCompany: ${company || '—'}\nType: ${type || '—'}\nMessage: ${message || '—'}`
      });
    } else {
      console.log('CONTACT:', { name, email, phone, company, type, message, subject });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ ok: false, error: 'Failed to send' });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`SiteEye Live — AxonAI running on port ${PORT}`);
});

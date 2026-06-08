# SiteEye Live™ — AxonAI Briefing

**Know What's Happening Without Being There.**

An interactive product presentation — not a brochure site. Send the link to a contractor or investor; they talk to **AxonAI** and learn everything about SiteEye Live.

---

## What This Is

- **Briefing room layout** — topic panels + AxonAI console (not a scroll-page website)
- **AxonAI** — voice + text expert on specs, pricing, hardware, markets
- **OpenAI Realtime API** — same VoxTalk/Axon voice stack as liveai-email
- Dark, premium design

---

## Run Locally

```bash
npm install
copy .env.example .env
# Add OPENAI_API_KEY to .env
npm start
```

Open http://localhost:3000

---

## Deploy to Render

1. Push to GitHub
2. Render → New Web Service → connect repo
3. **Build:** `npm install` · **Start:** `npm start`
4. Add `OPENAI_API_KEY` in Environment (required)
5. Optional: `SMTP_USER`, `SMTP_PASS`, `CONTACT_EMAIL` for the contact form

Send the Render URL to Joe or Tony.

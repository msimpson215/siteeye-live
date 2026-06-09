# SiteEye Live — AI Briefing

**This is not a website. It's a briefing link.**

Send the URL to a room of contractors, investors, or parents. AxonAI — the artificial presenter — walks them through SiteEye Live. They ask questions. They take the link home.

---

## What to call it

| Old term | New term |
|----------|----------|
| Website | **Briefing link** |
| Chatbot | **AxonAI** (artificial presenter) |
| Nav / footer | **Slides + dots** (PowerPoint familiarity) |
| Browse | **Follow along** |

---

## Layout

- **Left:** Full-screen slides (09 deck) — no nav bar, no footer
- **Right:** AxonAI — voice briefing + text Q&A
- **Controls:** Arrow keys or dots — like PowerPoint

---

## Run locally

```bash
npm install
copy .env.example .env
# Add OPENAI_API_KEY
npm start
```

Open http://localhost:3000 → click **Start Briefing**

---

## Render

- **Build:** `npm install`
- **Start:** `npm start`
- **Env:** `OPENAI_API_KEY` (required)

Repo: https://github.com/msimpson215/siteeye-live

# SiteEye Live

Simple presentation link for explaining SiteEye Live to someone who's never heard of it.

**GitHub:** msimpson215/siteeye-live  
**Deploy:** Render — Build `npm install`, Start `npm start`

**Required env**
- `OPENAI_API_KEY`

**Public site + waitlist**
- Visitors browse the page freely
- **Ask Axon AI** → email + phone + marketing consent → “Coming soon” (lead saved)
- Leads: `data/leads.jsonl` + email if SMTP is set

**Real Axon (locked)**
- `AXON_LOCKED=true` (default on Render)
- `AUTH_USERS=marty:password` + `AUTH_SECRET=...`
- Sign in at `/login.html` — only then does Ask Axon open the real brain

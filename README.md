# SiteEye Live

Simple presentation link for explaining SiteEye Live to someone who's never heard of it.

**GitHub:** msimpson215/siteeye-live  
**Deploy:** Render — Build `npm install`, Start `npm start`

**Required env**
- `OPENAI_API_KEY`

**Private gate (dev / partners)**
- `AUTH_ENABLED=true`
- `AUTH_SECRET=` long random string
- `AUTH_USERS=` `user:pass,user2:pass2`  
  Optional brains: `user:pass:siteeye|tactical`

With auth on, the site redirects to `/login.html`. Axon `/session` and chat stay locked without a cookie.

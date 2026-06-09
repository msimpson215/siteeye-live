# SiteEye Live — AP Presenter

Deploy on Render only. GitHub repo: **msimpson215/siteeye-live**

## Render setup (one time)

1. [render.com](https://render.com) → **New** → **Web Service**
2. Connect **msimpson215/siteeye-live**
3. Render reads `render.yaml` automatically, or set manually:
   - **Build:** `npm install`
   - **Start:** `npm start`
4. **Environment** → add `OPENAI_API_KEY` (your OpenAI key)
5. Deploy

Your live URL will be something like:

**https://siteeye-live.onrender.com**

That is the link you send to Joe and Tony — not localhost.

## After code changes

Push to GitHub → Render redeploys automatically.

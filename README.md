# Arjun Kumar — Job Search Dashboard

Live job listings auto-scored against your profile, with one-click tailored resume generation via Claude AI.

---

## Features
- 🔍 **Live jobs** — Pulls from Remotive & Arbeitnow (free, no API key needed)
- 📊 **Smart scoring** — 19-skill match algorithm, title weighting, remote bonus
- ✨ **AI resume** — Claude tailors your resume to each JD in seconds
- 📱 **PWA** — installable on mobile, works offline (shell)

---

## Project Structure

```
├── index.html               # Dashboard UI (single page)
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker (offline shell)
├── vercel.json              # Vercel function config
├── package.json
└── api/
    ├── scrape.js            # Job scraper (Remotive + Arbeitnow, no auth)
    ├── score.js             # Scoring endpoint
    └── generate-resume.js   # Claude API resume tailoring
```

---

## Deployment

### 1. Clone / init
```bash
git init && git add . && git commit -m "init: job dashboard"
```

### 2. Install Vercel CLI
```bash
npm i -g vercel
```

### 3. Link project to Vercel
```bash
vercel link
```

### 4. Add the one required environment variable
```bash
vercel env add ANTHROPIC_API_KEY
# Paste your sk-ant-... key when prompted
# Get it free at https://console.anthropic.com → API Keys
```

### 5. Deploy
```bash
vercel deploy --prod
```

### 6. Open
```bash
vercel open
```

---

## Environment Variables

| Variable | Source | Required for |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | AI resume generation |

> That's the only key needed. Job scraping uses free public APIs with no authentication.

> **Never commit secrets.** Always add keys via `vercel env add` or the Vercel dashboard.

---

## Local development

```bash
npm install
vercel dev   # starts local dev server with function emulation
# open http://localhost:3000
```

> Pull env vars locally first:
> ```bash
> vercel env pull .env.local
> ```

---

## Scoring algorithm

| Signal | Points |
|---|---|
| Must-have skill match (19 skills) | up to 70 |
| Title hit | +15 |
| Nice-to-have skills (7 skills) | up to +10 |
| Remote position | +5 |
| Excluded keywords (React Native, iOS, etc.) | → 0 |

Score colours: **green** ≥75 · **amber** ≥50 · **red** <50

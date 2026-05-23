# AI Prompt — Arjun Kumar Job Dashboard (Vercel)

---

## Paste this entire prompt into Claude / ChatGPT / Cursor / v0.dev

---

Build a full-stack job search dashboard for **Arjun Kumar** (Senior Software Engineer,
Node.js · NestJS · Angular · AWS) hosted on Vercel. The app fetches live job listings,
scores them against his profile, and generates a tailored resume per job — all from
the browser with one click. No CLI required.

---

## Tech stack

- **Frontend** — plain HTML + CSS + vanilla JS (single `index.html`) OR Next.js App Router
- **Backend** — Vercel Serverless Functions (`/api/*.js`)  
- **Job scraping** — JobSpy via a Python Vercel function (`/api/scrape.py`)  
- **Resume generation** — Anthropic Claude API (`claude-sonnet-4-20250514`)  
- **Storage** — Vercel KV (Redis) to cache job results between refreshes  
- **Deployment** — one `vercel deploy` command, zero config servers

---

## File structure to generate

```
project/
├── index.html               # main dashboard UI
├── vercel.json              # routes + python runtime config
├── requirements.txt         # jobspy pandas
├── package.json             # if using Next.js
└── api/
    ├── scrape.py            # Python — runs JobSpy, returns JSON
    ├── score.js             # Node — scores jobs against Arjun's profile
    ├── generate-resume.js   # Node — calls Claude API, returns tailored resume text
    └── cache.js             # Node — get/set Vercel KV cache
```

---

## API endpoints to build

### `GET /api/scrape`
- Runs JobSpy scraper for these queries on LinkedIn + Indeed:
  ```
  "Senior Node.js Engineer Remote India"
  "NestJS Backend Engineer Hybrid India"
  "Full Stack Angular Node.js Remote India"
  "Senior Software Engineer SaaS Remote India"
  "Backend Engineer NestJS AWS India"
  ```
- Config: `location="India"`, `is_remote=True`, `hours_old=168`, `results_wanted=25`
- Deduplicates by job URL
- Scores every job (see scoring logic below)
- Caches result in Vercel KV with key `jobs_cache` and TTL 6 hours
- Returns JSON array of job objects:
  ```json
  {
    "id": "unique_hash_of_url",
    "title": "Senior Backend Engineer",
    "company": "Razorpay",
    "location": "Remote, India",
    "is_remote": true,
    "job_type": "Full-time",
    "salary": "₹30–45 LPA",
    "date_posted": "2026-05-20",
    "site": "linkedin",
    "url": "https://...",
    "description": "...(first 1000 chars)...",
    "match_score": 82,
    "matched_skills": ["node.js", "nestjs", "aws", "jwt"],
    "missing_skills": ["docker", "graphql"]
  }
  ```

### `GET /api/cache`
- Returns cached jobs from Vercel KV if still fresh (< 6 hours old)
- Returns `{ cached: true, jobs: [...], fetched_at: "..." }` or `{ cached: false }`

### `POST /api/generate-resume`
- Body: `{ job_id, title, company, description }`
- Calls Claude API with Arjun's base resume + the JD
- Returns tailored resume as structured JSON:
  ```json
  {
    "summary": "...",
    "skills": { "Backend": "...", "Frontend": "..." },
    "experience": [...],
    "projects": [...]
  }
  ```
- Also returns a plain-text version formatted for copy-paste

---

## Scoring logic (replicate exactly in `/api/score.js`)

```js
const MUST_HAVE = [
  "node.js","nodejs","nestjs","express","angular","typescript",
  "aws","rest api","rest","jwt","rbac","mysql","redis",
  "mongodb","stripe","ci/cd","cicd","microservices","git"
];
const NICE_TO_HAVE = ["react","vue","docker","kubernetes","graphql","kafka","terraform"];
const TARGET_TITLES = [
  "senior software engineer","lead backend engineer","backend engineer",
  "full stack engineer","full stack developer","node.js developer",
  "nestjs developer","tech lead","software engineer"
];
const EXCLUDE = ["react native","ios developer","android developer",
  "data scientist","machine learning","java developer",".net developer","salesforce"];

function scoreJob(job) {
  const text = `${job.title} ${job.description} ${job.job_function || ""}`.toLowerCase();
  if (EXCLUDE.some(k => text.includes(k))) return 0;
  const matched  = MUST_HAVE.filter(s => text.includes(s));
  const nice     = NICE_TO_HAVE.filter(s => text.includes(s));
  const titleHit = TARGET_TITLES.some(t => job.title.toLowerCase().includes(t.split(" ")[0]));
  const remote   = job.is_remote === true;
  let score = Math.round((matched.length / MUST_HAVE.length) * 70);
  if (titleHit) score += 15;
  score += Math.min(10, nice.length * 3);
  if (remote) score += 5;
  return Math.min(99, score);
}
```

---

## Arjun's base resume (embed this in `/api/generate-resume.js`)

```json
{
  "name": "Arjun Kumar",
  "title": "Senior Software Engineer | Full Stack & Backend",
  "contact": {
    "location": "Delhi, India",
    "phone": "+91 8949342705",
    "email": "kumar.arjun000511@gmail.com",
    "linkedin": "linkedin.com/in/arjun-kumar-b4150b10b"
  },
  "summary": "Senior Software Engineer with 7+ years of experience designing, developing, and deploying scalable enterprise and SaaS applications using Node.js, NestJS, Angular, and AWS. Strong expertise in backend architecture, REST API development, authentication systems (JWT/RBAC), CI/CD automation, and cloud deployments.",
  "skills": {
    "Backend": "Node.js, NestJS, Express.js, REST APIs, JWT, RBAC",
    "Frontend": "Angular, TypeScript, HTML, CSS",
    "Database": "MySQL, Redis, MongoDB",
    "Cloud & DevOps": "AWS, CI/CD Pipelines, Git, Deployment Automation",
    "Architecture": "System Design, Microservices, Scalable Systems",
    "Integrations": "Stripe, Google Maps SDK, Third-party APIs"
  },
  "experience": [
    {
      "role": "Software Engineer",
      "company": "Quokkalabs LLP",
      "period": "Feb 2022 – Present",
      "bullets": [
        "Engineered scalable full-stack applications using Angular, Node.js, and NestJS for enterprise-grade SaaS platforms.",
        "Designed and developed secure REST APIs with JWT authentication and RBAC authorization mechanisms.",
        "Integrated Stripe payment gateway, Google Maps SDK, and multiple third-party APIs.",
        "Managed AWS-based production deployments and CI/CD pipelines.",
        "Reduced deployment time by approximately 20% through automation and CI/CD improvements."
      ]
    },
    {
      "role": "Software Engineer",
      "company": "InsightGeeks Solutions Pvt Ltd",
      "period": "Aug 2019 – Nov 2021",
      "bullets": [
        "Developed Angular-based web applications with reusable UI components.",
        "Integrated frontend systems with backend REST APIs.",
        "Improved UI/UX and optimized frontend performance."
      ]
    },
    {
      "role": "Frontend Developer",
      "company": "Elroute Pvt Ltd",
      "period": "Jun 2018 – Jul 2019",
      "bullets": [
        "Developed responsive Angular UI modules for enterprise applications.",
        "Implemented reusable frontend components to improve maintainability.",
        "Integrated frontend modules with backend APIs."
      ]
    }
  ],
  "projects": [
    { "name": "LevelExam (EdTech)", "bullets": ["Node.js + Express REST APIs", "Moodle integration", "JWT/RBAC auth", "AWS + CI/CD"] },
    { "name": "Edique Control Panel", "bullets": ["NestJS + SQL backend", "Device monitoring APIs", "AWS infrastructure"] },
    { "name": "ESEO – Sports Booking", "bullets": ["Node.js booking APIs", "Stripe payment gateway", "React admin panel support"] }
  ],
  "education": [
    { "degree": "B.Tech – Computer Science", "school": "Jaipur National University", "year": "2014–2018" }
  ]
}
```

---

## Claude API prompt (use inside `/api/generate-resume.js`)

```js
const SYSTEM = `You are an expert resume writer. Given a base resume JSON and a job description,
return a tailored resume JSON — same structure as input.
Rules:
- Rewrite summary (3-4 sentences) to mirror the JD's priorities and language
- Reorder skills to put JD-matched skills first
- Rewrite experience bullets to emphasise JD-relevant achievements; keep all metrics
- Reorder project bullets by relevance to JD
- Never invent new skills or experience
- Return ONLY valid JSON, no markdown fences, no preamble`;

const userMsg = `Base resume: ${JSON.stringify(BASE_RESUME)}
Job at ${company}: ${description.slice(0, 3000)}
Return tailored resume JSON only.`;

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }]
  })
});
```

---

## `vercel.json` config

```json
{
  "functions": {
    "api/scrape.py": { "runtime": "python3.9", "maxDuration": 60 },
    "api/generate-resume.js": { "maxDuration": 30 },
    "api/score.js": { "maxDuration": 10 },
    "api/cache.js": { "maxDuration": 10 }
  },
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic_api_key"
  }
}
```

---

## `requirements.txt`

```
jobspy
pandas
```

---

## UI — `index.html` requirements

### Layout & design
- Clean, modern, mobile-first responsive design
- Max width 1200px centered, padding 16px on mobile
- Color scheme: white background, #185FA5 blue accent, #1a1a1a text
- Font: Inter or system-ui

### Header section
- Name: **Arjun Kumar** (large, blue)
- Title: Senior Software Engineer | Node.js · NestJS · Angular · AWS
- Two buttons side by side:
  - 🔄 **Refresh Jobs** — calls `/api/scrape`, shows spinner, updates cards
  - 📋 **Copy All** — copies full summary to clipboard
- Last fetched timestamp ("Last updated: 21 May 2026, 3:42 PM")
- Stats row: Total jobs | Avg score | Remote | Applied (updates live)

### Filter bar (sticky on scroll)
- Score filter: All / 75%+ / 60%+ / 50%+
- Work mode: All / Remote / Hybrid
- Site: All / LinkedIn / Indeed
- Sort: Score ↓ / Date ↓ / Company A–Z
- Search box: filter by company or title keyword

### Job cards (card grid — 1 col mobile, 2 col tablet, 3 col desktop)

Each card must show:
```
┌─────────────────────────────────────────────┐
│  [82%] ████████░░  STRONG MATCH            │
│                                             │
│  Senior Backend Engineer                    │  ← title (bold, 16px)
│  Razorpay  ·  Remote, India  ·  LinkedIn   │  ← meta (muted, 12px)
│  Full-time  ·  ₹30–45 LPA  ·  20 May 2026 │
│                                             │
│  Matched:  node.js  nestjs  aws  jwt  +3   │  ← green pills
│  Missing:  docker  graphql                  │  ← red pills
│                                             │
│  "We're looking for a senior backend..."   │  ← first 120 chars of JD
│                                             │
│  [Generate Resume]  [Apply →]  [Save ♡]    │  ← action buttons
│                                [Applied ✓] │  ← toggle status
└─────────────────────────────────────────────┘
```

Score ring colours:
- 75%+ → green (#27500A bg, #EAF3DE fill)
- 50–74% → amber (#633806 bg, #FAEEDA fill)
- < 50% → red (#791F1F bg, #FCEBEB fill)

### Generate Resume modal
- Opens when "Generate Resume" is clicked
- Shows spinner: "Tailoring resume for Razorpay…"
- Calls `POST /api/generate-resume` with job details
- Displays result in two tabs:
  - **Preview** — formatted HTML resume
  - **Raw text** — plain text for copy-paste
- Buttons: Copy to clipboard | Download as .txt | Close
- Error state if API fails: "Could not generate — showing base resume"

### Applied tracker (local)
- "Applied ✓" button toggles on each card
- Saves state in `localStorage` keyed by job URL
- Applied jobs show a green banner at top of card
- Stats row updates "Applied" count live

### Loading states
- Full-page skeleton cards while fetching (3 placeholder cards)
- Spinner on "Refresh Jobs" button while request is in flight
- Individual card spinner while generating resume
- Toast notification: "23 jobs found · 18 new since last refresh"

### Empty / error states
- No jobs found: illustration + "Try refreshing or check your connection"
- API error: red banner + retry button

### PWA / portability
- Add `<meta name="viewport">` and a web app manifest
- "Add to Home Screen" works on mobile
- Service worker caches the HTML shell so page loads offline
- Data refreshes only when online and user clicks Refresh

---

## Environment variables needed on Vercel

```
ANTHROPIC_API_KEY=sk-ant-...
KV_URL=...              # from Vercel KV dashboard
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

---

## Deployment steps to include in a README.md

```bash
# 1. Clone / create project
git init && git add . && git commit -m "init"

# 2. Install Vercel CLI
npm i -g vercel

# 3. Link to Vercel
vercel link

# 4. Add environment variables
vercel env add ANTHROPIC_API_KEY

# 5. Create Vercel KV store (free tier)
# Go to vercel.com → Storage → Create KV store → link to project

# 6. Deploy
vercel deploy --prod

# 7. Open dashboard
vercel open
```

---

## Additional requirements

- All API responses include `Content-Type: application/json`
- `/api/scrape` returns cached data if KV hit is fresh (< 6 hours) to avoid hammering job boards
- Cache-busting: "Refresh Jobs" button sends `?force=true` to bypass cache
- Rate limit: `/api/generate-resume` max 10 calls/minute per IP (use Vercel Edge Config or simple in-memory counter)
- All secrets in env vars — never hardcoded in JS/HTML
- Mobile touch targets minimum 44px
- ARIA labels on all icon buttons
- Works in Safari iOS, Chrome Android, Chrome desktop, Firefox

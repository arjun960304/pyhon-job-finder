// api/scrape.js — Job scraper using free, no-auth public APIs
// Sources: Remotive (remotive.com/api) + Arbeitnow (arbeitnow.com/api)
// Queries, scoring, titles and exclusions are all derived from Arjun's resume.

const crypto = require("crypto");

// ─────────────────────────────────────────────────────────────────────────────
// SCORING — built directly from Arjun_Kumar_Resume.md
// ─────────────────────────────────────────────────────────────────────────────

// Skills he definitely has — each hit adds to match score (up to 70 pts)
const MUST_HAVE = [
  // Primary backend framework & runtime (top identifiers)
  "nestjs", "node.js", "nodejs",
  // Full-stack language (used everywhere in his resume)
  "typescript",
  // Frontend framework
  "angular",
  // Cloud
  "aws",
  // API design (his core expertise)
  "rest api", "rest apis",
  // Security specialty (JWT + RBAC called out as key skill)
  "jwt", "rbac",
  // Databases he works with daily
  "mysql", "redis", "mongodb",
  // Architecture patterns listed on resume
  "microservices",
  // DevOps (20% CI/CD improvement is his headline achievement)
  "ci/cd", "cicd",
  // Source control (listed in skills)
  "git",
  // Secondary backend framework (still listed)
  "express"
];

// Skills adjacent to his stack — appear in senior JDs he'd be strong at
const NICE_TO_HAVE = [
  "docker", "kubernetes", "graphql", "kafka",
  "terraform", "react", "oauth", "rxjs",
  "stripe", "saas", "system design", "api design",
  "postgresql", "postgres", "elastic"
];

// Job titles that match his seniority (7 yrs) and direction
const TARGET_TITLES = [
  "senior software engineer",
  "senior backend engineer",
  "lead backend engineer",
  "backend engineer",
  "full stack engineer",
  "full stack developer",
  "node.js developer",
  "nestjs developer",
  "tech lead",
  "software engineer",
  "senior engineer",
  "senior developer",
  "lead developer",
  "engineering lead",
  "principal engineer",
  "staff engineer"
];

// Roles completely outside Arjun's domain — hard exclude (score → 0)
const EXCLUDE = [
  // Mobile (not his stack)
  "react native", "ios developer", "android developer", "flutter developer",
  // Data / ML (not his field)
  "data scientist", "machine learning", "ml engineer", "data engineer",
  "computer vision", "nlp engineer", "ai engineer",
  // Other backend stacks (not his)
  "java developer", "spring boot", ".net developer", "c# developer",
  "php developer", "ruby developer", "ruby on rails",
  "python developer", "django", "flask developer",
  "golang developer", "go developer", "scala developer",
  "swift developer",
  // Pure ops roles
  "devops engineer", "site reliability", "sre",
  // Other domains
  "salesforce", "blockchain", "solidity", "web3",
  "game developer", "unity developer",
  "embedded", "firmware developer"
];

function scoreJob(job) {
  const text = `${job.title} ${job.description} ${job.job_function || ""}`.toLowerCase();
  if (EXCLUDE.some(k => text.includes(k))) return { score: 0, matched: [], missing: [] };

  const matched  = MUST_HAVE.filter(s => text.includes(s));
  const nice     = NICE_TO_HAVE.filter(s => text.includes(s));
  const titleHit = TARGET_TITLES.some(t => job.title.toLowerCase().includes(t.split(" ")[0]));
  const remote   = job.is_remote === true;

  let score = Math.round((matched.length / MUST_HAVE.length) * 70);
  if (titleHit) score += 15;
  score += Math.min(10, nice.length * 3);
  if (remote)   score += 5;
  score = Math.min(99, score);

  const missing = MUST_HAVE.filter(s => !text.includes(s)).slice(0, 5);
  return { score, matched, missing };
}

function makeId(url) {
  return crypto.createHash("md5").update(url).digest("hex").slice(0, 12);
}

// Only show jobs posted in the last 30 days
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
function isRecent(dateStr) {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) || d >= THIRTY_DAYS_AGO;
}

// ─────────────────────────────────────────────────────────────────────────────
// REMOTIVE — free, no auth
// https://remotive.com/api/remote-jobs?search=...
// Queries built from resume: lead with most specific combinations first
// ─────────────────────────────────────────────────────────────────────────────
const REMOTIVE_QUERIES = [
  "senior nestjs nodejs",               // primary stack + seniority
  "nestjs typescript backend",          // framework + language he uses daily
  "node.js angular full stack",         // full-stack combo on his resume
  "senior backend engineer nodejs aws", // seniority + cloud (key resume point)
  "nestjs rest api typescript",         // API design expertise
  "senior software engineer node.js",   // broad senior Node search
  "node.js express backend senior",     // Express still on his resume
  "backend lead node typescript",       // leadership track (7 yrs exp)
  "full stack typescript angular",      // Angular-heavy full-stack
  "saas backend engineer nodejs",       // SaaS domain (all 3 companies were SaaS)
];

async function fetchRemotive(query) {
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=25`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Remotive HTTP ${res.status}`);
  return res.json();
}

function normaliseRemotive(raw) {
  return (raw["jobs"] || []).map(item => {
    const url        = item.url || "";
    const desc       = (item.description || "").replace(/<[^>]+>/g, " ").slice(0, 1000);
    const datePosted = (item.publication_date || "").slice(0, 10);
    if (!isRecent(datePosted)) return null;
    return {
      id:          makeId(url),
      title:       item.title || "",
      company:     item.company_name || "",
      location:    item.candidate_required_location || "Remote, Worldwide",
      is_remote:   true,
      job_type:    item.job_type || "Full-time",
      salary:      item.salary || "",
      date_posted: datePosted,
      site:        "remotive",
      url,
      description: desc,
    };
  }).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARBEITNOW — free, no auth
// https://arbeitnow.com/api/job-board-api?search=...
// ─────────────────────────────────────────────────────────────────────────────
const ARBEITNOW_QUERIES = [
  "nestjs typescript",                  // most specific to his primary framework
  "senior nodejs backend",              // seniority + runtime
  "node angular full stack",            // full-stack profile
  "backend engineer aws nodejs",        // cloud + runtime
  "senior nestjs backend engineer",     // leadership-level NestJS
  "full stack developer node typescript", // language-focused search
];

async function fetchArbeitnow(query) {
  const url = `https://arbeitnow.com/api/job-board-api?search=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Arbeitnow HTTP ${res.status}`);
  return res.json();
}

function normaliseArbeitnow(raw) {
  return (raw["data"] || []).map(item => {
    const url        = item.url || "";
    const desc       = (item.description || "").replace(/<[^>]+>/g, " ").slice(0, 1000);
    const datePosted = item.created_at
      ? new Date(item.created_at * 1000).toISOString().slice(0, 10)
      : "";
    if (!isRecent(datePosted)) return null;
    return {
      id:          makeId(url),
      title:       item.title || "",
      company:     item.company_name || "",
      location:    item.location || (item.remote ? "Remote" : ""),
      is_remote:   !!item.remote,
      job_type:    (item.job_types || [])[0] || "Full-time",
      salary:      "",
      date_posted: datePosted,
      site:        "arbeitnow",
      url,
      description: desc,
    };
  }).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const seen   = new Map(); // url → raw job (dedup before scoring)
  const errors = [];

  const tasks = [
    ...REMOTIVE_QUERIES.map(q =>
      fetchRemotive(q)
        .then(raw => normaliseRemotive(raw)
          .forEach(j => { if (j.url && !seen.has(j.url)) seen.set(j.url, j); }))
        .catch(err => errors.push(`Remotive "${q}": ${err.message}`))
    ),
    ...ARBEITNOW_QUERIES.map(q =>
      fetchArbeitnow(q)
        .then(raw => normaliseArbeitnow(raw)
          .forEach(j => { if (j.url && !seen.has(j.url)) seen.set(j.url, j); }))
        .catch(err => errors.push(`Arbeitnow "${q}": ${err.message}`))
    ),
  ];

  await Promise.allSettled(tasks);

  const jobs = [...seen.values()]
    .map(job => {
      const { score, matched, missing } = scoreJob(job);
      return { ...job, match_score: score, matched_skills: matched, missing_skills: missing };
    })
    .filter(j => j.match_score > 0)         // drop irrelevant results
    .sort((a, b) => b.match_score - a.match_score);

  return res.status(200).json({
    jobs,
    fetched_at: new Date().toISOString(),
    ...(errors.length && { errors }),
  });
};

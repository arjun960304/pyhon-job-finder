// api/scrape.js
// Sources  : Remotive (worldwide remote) · Jobicy India · Arbeitnow (worldwide remote)
// Regions  :
//   remote     → Remote jobs open to anyone (Anywhere)
//   hybrid-ncr → Hybrid roles located in Delhi NCR
//   ncr        → On-site roles located in Delhi NCR
//
// Jobs that are on-site / hybrid outside NCR are DROPPED — not relevant to Arjun.

const crypto = require("crypto");

// ─── NCR location detection ───────────────────────────────────────────────────
const NCR_KEYWORDS = [
  "delhi", "new delhi", "ncr", "national capital",
  "noida", "greater noida",
  "gurgaon", "gurugram",
  "faridabad", "ghaziabad",
  "manesar", "dwarka"
];
const HYBRID_KEYWORDS = ["hybrid", "work from office", "wfo", "on-site", "onsite", "in-office"];

/**
 * Returns one of:
 *   "remote"     – fully remote, open anywhere
 *   "hybrid-ncr" – hybrid and in Delhi NCR
 *   "ncr"        – on-site in Delhi NCR
 *   null         – irrelevant (on-site/hybrid outside NCR) → drop
 */
function classifyLocation(location, isRemote) {
  const loc = (location || "").toLowerCase();
  if (isRemote) return "remote";
  const inNCR    = NCR_KEYWORDS.some(k => loc.includes(k));
  const isHybrid = HYBRID_KEYWORDS.some(k => loc.includes(k));
  if (inNCR && isHybrid) return "hybrid-ncr";
  if (inNCR)             return "ncr";
  // Worldwide/remote tag in location string even without is_remote flag
  if (loc.includes("remote") || loc.includes("anywhere") || loc.includes("worldwide")) return "remote";
  return null; // drop — not relevant
}

// ─── Scoring (from Arjun_Kumar_Resume.md) ────────────────────────────────────
const MUST_HAVE = [
  "nestjs", "node.js", "nodejs",
  "typescript",
  "angular",
  "aws",
  "rest api", "rest apis",
  "jwt", "rbac",
  "mysql", "redis", "mongodb",
  "microservices",
  "ci/cd", "cicd",
  "git",
  "express"
];

const NICE_TO_HAVE = [
  "docker", "kubernetes", "graphql", "kafka",
  "terraform", "react", "oauth", "rxjs",
  "stripe", "saas", "system design", "api design",
  "postgresql", "postgres", "elastic"
];

const TARGET_TITLES = [
  "senior software engineer", "senior backend engineer",
  "lead backend engineer", "backend engineer",
  "full stack engineer", "full stack developer",
  "node.js developer", "nestjs developer",
  "tech lead", "software engineer", "senior engineer",
  "senior developer", "lead developer",
  "engineering lead", "principal engineer", "staff engineer"
];

const EXCLUDE = [
  "react native", "ios developer", "android developer", "flutter developer",
  "data scientist", "machine learning", "ml engineer", "data engineer",
  "computer vision", "nlp engineer", "ai engineer",
  "java developer", "spring boot", ".net developer", "c# developer",
  "php developer", "ruby developer", "ruby on rails",
  "python developer", "django", "flask developer",
  "golang developer", "go developer", "scala developer", "swift developer",
  "devops engineer", "site reliability", "sre",
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
  return { score: Math.min(99, score), matched, missing: MUST_HAVE.filter(s => !text.includes(s)).slice(0, 5) };
}

function makeId(url) {
  return crypto.createHash("md5").update(url).digest("hex").slice(0, 12);
}

const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
function isRecent(dateStr) {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) || d >= THIRTY_DAYS_AGO;
}

// ─── SOURCE 1: Remotive — worldwide remote ────────────────────────────────────
// https://remotive.com/api/remote-jobs  (free, no auth)
// All jobs returned are remote → work_mode always "remote"
const REMOTIVE_QUERIES = [
  "senior nestjs nodejs",
  "nestjs typescript backend",
  "node.js angular full stack",
  "senior backend engineer nodejs aws",
  "nestjs rest api typescript",
  "senior software engineer node.js",
  "node.js express backend senior",
  "backend lead node typescript",
  "full stack typescript angular",
  "saas backend engineer nodejs",
];

async function fetchRemotive(query) {
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=25`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Remotive ${res.status}`);
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
      location:    "Remote (Anywhere)",
      is_remote:   true,
      work_mode:   "remote",
      job_type:    item.job_type || "Full-time",
      salary:      item.salary || "",
      date_posted: datePosted,
      site:        "remotive",
      url,
      description: desc,
    };
  }).filter(Boolean);
}

// ─── SOURCE 2: Jobicy — India geo-filtered ────────────────────────────────────
// https://jobicy.com/api/v2/remote-jobs  (free, no auth)
// geo=india returns India-based remote/hybrid postings
const JOBICY_QUERIES = [
  "nodejs",
  "nestjs",
  "angular",
  "typescript backend",
  "full stack node",
  "backend engineer",
];

async function fetchJobicy(query) {
  const url = `https://jobicy.com/api/v2/remote-jobs?count=25&geo=india&tag=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Jobicy ${res.status}`);
  return res.json();
}

function normaliseJobicy(raw) {
  return (raw["jobs"] || []).map(item => {
    const url        = item.url || item.jobUrl || "";
    const desc       = (item.jobDescription || item.jobExcerpt || "")
                        .replace(/<[^>]+>/g, " ").slice(0, 1000);
    const datePosted = (item.pubDate || "").slice(0, 10);
    if (!isRecent(datePosted)) return null;

    const rawLocation = item.jobGeo || "India";
    // Jobicy India jobs can be remote or NCR hybrid/on-site
    const isRemote = (item.jobType || "").toLowerCase().includes("remote") ||
                     rawLocation.toLowerCase() === "anywhere" ||
                     rawLocation.toLowerCase() === "worldwide";
    const mode = classifyLocation(rawLocation, isRemote) || "remote"; // Jobicy India = still relevant

    return {
      id:          makeId(url),
      title:       item.jobTitle || "",
      company:     item.companyName || item.company || "",
      location:    isRemote ? "Remote (India)" : rawLocation,
      is_remote:   isRemote || mode === "remote",
      work_mode:   mode,
      job_type:    item.jobType || "Full-time",
      salary:      item.annualSalaryMin
                     ? `₹${item.annualSalaryMin}–${item.annualSalaryMax || item.annualSalaryMin} LPA`
                     : "",
      date_posted: datePosted,
      site:        "jobicy",
      url,
      description: desc,
    };
  }).filter(Boolean);
}

// ─── SOURCE 3: Arbeitnow — worldwide remote/hybrid ───────────────────────────
// https://arbeitnow.com/api/job-board-api  (free, no auth)
// Non-remote results are filtered: keep only remote OR NCR
const ARBEITNOW_QUERIES = [
  "nestjs typescript",
  "senior nodejs backend",
  "node angular full stack",
  "backend engineer aws nodejs",
  "senior nestjs backend engineer",
  "full stack developer node typescript",
];

async function fetchArbeitnow(query) {
  const url = `https://arbeitnow.com/api/job-board-api?search=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Arbeitnow ${res.status}`);
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

    const rawLocation = item.location || "";
    const mode = classifyLocation(rawLocation, !!item.remote);
    if (!mode) return null; // drop — on-site/hybrid outside NCR

    return {
      id:          makeId(url),
      title:       item.title || "",
      company:     item.company_name || "",
      location:    mode === "remote" ? "Remote (Anywhere)" : rawLocation,
      is_remote:   mode === "remote",
      work_mode:   mode,
      job_type:    (item.job_types || [])[0] || "Full-time",
      salary:      "",
      date_posted: datePosted,
      site:        "arbeitnow",
      url,
      description: desc,
    };
  }).filter(Boolean);
}

// ─── Handler ──────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const seen   = new Map();
  const errors = [];

  const tasks = [
    ...REMOTIVE_QUERIES.map(q =>
      fetchRemotive(q)
        .then(r => normaliseRemotive(r).forEach(j => { if (j.url && !seen.has(j.url)) seen.set(j.url, j); }))
        .catch(e => errors.push(`Remotive "${q}": ${e.message}`))
    ),
    ...JOBICY_QUERIES.map(q =>
      fetchJobicy(q)
        .then(r => normaliseJobicy(r).forEach(j => { if (j.url && !seen.has(j.url)) seen.set(j.url, j); }))
        .catch(e => errors.push(`Jobicy "${q}": ${e.message}`))
    ),
    ...ARBEITNOW_QUERIES.map(q =>
      fetchArbeitnow(q)
        .then(r => normaliseArbeitnow(r).forEach(j => { if (j.url && !seen.has(j.url)) seen.set(j.url, j); }))
        .catch(e => errors.push(`Arbeitnow "${q}": ${e.message}`))
    ),
  ];

  await Promise.allSettled(tasks);

  const jobs = [...seen.values()]
    .map(job => {
      const { score, matched, missing } = scoreJob(job);
      return { ...job, match_score: score, matched_skills: matched, missing_skills: missing };
    })
    .filter(j => j.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score);

  return res.status(200).json({
    jobs,
    fetched_at: new Date().toISOString(),
    ...(errors.length && { errors }),
  });
};

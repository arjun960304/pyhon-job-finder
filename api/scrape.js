// api/scrape.js — Job scraper using free, no-auth public APIs
// Sources: Remotive (remotive.com/api) + Arbeitnow (arbeitnow.com/api)
// No API keys required.

const crypto = require("crypto");

// ── Scoring logic ─────────────────────────────────────────────────────────────
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
const EXCLUDE = [
  "react native","ios developer","android developer",
  "data scientist","machine learning","java developer",".net developer","salesforce"
];

function scoreJob(job) {
  const text = `${job.title} ${job.description} ${job.job_function || ""}`.toLowerCase();
  if (EXCLUDE.some(k => text.includes(k))) return { score: 0, matched: [], missing: [] };
  const matched = MUST_HAVE.filter(s => text.includes(s));
  const nice    = NICE_TO_HAVE.filter(s => text.includes(s));
  const titleHit = TARGET_TITLES.some(t => job.title.toLowerCase().includes(t.split(" ")[0]));
  const remote  = job.is_remote === true;
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

// ── Remotive (free, no auth) ──────────────────────────────────────────────────
// https://remotive.com/api/remote-jobs?search=nodejs&limit=25
const REMOTIVE_QUERIES = [
  "nodejs nestjs",
  "nestjs backend",
  "node.js angular",
  "backend engineer node",
  "full stack node typescript",
];

async function fetchRemotive(query) {
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=20`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Remotive HTTP ${res.status}`);
  return res.json();
}

function normaliseRemotive(raw) {
  return (raw["jobs"] || []).map(item => {
    const url  = item.url || "";
    const desc = (item.description || "").replace(/<[^>]+>/g, " ").slice(0, 1000);
    return {
      id:          makeId(url),
      title:       item.title || "",
      company:     item.company_name || "",
      location:    item.candidate_required_location || "Remote, Worldwide",
      is_remote:   true,
      job_type:    item.job_type || "Full-time",
      salary:      item.salary || "",
      date_posted: (item.publication_date || "").slice(0, 10),
      site:        "remotive",
      url,
      description: desc,
    };
  });
}

// ── Arbeitnow (free, no auth) ─────────────────────────────────────────────────
// https://arbeitnow.com/api/job-board-api?search=nodejs
const ARBEITNOW_QUERIES = [
  "nodejs",
  "nestjs",
  "node typescript backend",
];

async function fetchArbeitnow(query) {
  const url = `https://arbeitnow.com/api/job-board-api?search=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Arbeitnow HTTP ${res.status}`);
  return res.json();
}

function normaliseArbeitnow(raw) {
  return (raw["data"] || []).map(item => {
    const url  = item.url || "";
    const desc = (item.description || "").replace(/<[^>]+>/g, " ").slice(0, 1000);
    const loc  = item.location || (item.remote ? "Remote" : "");
    return {
      id:          makeId(url),
      title:       item.title || "",
      company:     item.company_name || "",
      location:    loc,
      is_remote:   !!item.remote,
      job_type:    (item.job_types || [])[0] || "Full-time",
      salary:      "",
      date_posted: item.created_at ? new Date(item.created_at * 1000).toISOString().slice(0, 10) : "",
      site:        "arbeitnow",
      url,
      description: desc,
    };
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const seen   = new Map();   // url → job  (dedup)
  const errors = [];

  const tasks = [
    ...REMOTIVE_QUERIES.map(q =>
      fetchRemotive(q)
        .then(raw => normaliseRemotive(raw).forEach(j => { if (j.url && !seen.has(j.url)) seen.set(j.url, j); }))
        .catch(err => errors.push(`Remotive "${q}": ${err.message}`))
    ),
    ...ARBEITNOW_QUERIES.map(q =>
      fetchArbeitnow(q)
        .then(raw => normaliseArbeitnow(raw).forEach(j => { if (j.url && !seen.has(j.url)) seen.set(j.url, j); }))
        .catch(err => errors.push(`Arbeitnow "${q}": ${err.message}`))
    ),
  ];

  await Promise.allSettled(tasks);

  // Score every job, drop score-0 exclusions
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

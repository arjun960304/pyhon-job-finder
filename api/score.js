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
  const matched  = MUST_HAVE.filter(s => text.includes(s));
  const nice     = NICE_TO_HAVE.filter(s => text.includes(s));
  const titleHit = TARGET_TITLES.some(t => job.title.toLowerCase().includes(t.split(" ")[0]));
  const remote   = job.is_remote === true;
  let score = Math.round((matched.length / MUST_HAVE.length) * 70);
  if (titleHit) score += 15;
  score += Math.min(10, nice.length * 3);
  if (remote) score += 5;
  score = Math.min(99, score);
  const missing = MUST_HAVE.filter(s => !text.includes(s));
  return { score, matched, missing: missing.slice(0, 5) };
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { job } = req.body;
    if (!job) return res.status(400).json({ error: "Missing job object" });
    const result = scoreJob(job);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports.scoreJob = scoreJob;

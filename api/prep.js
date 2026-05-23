// api/prep.js — Interview preparation guide generator via Claude API
// Analyses the JD against Arjun's profile and returns a structured study plan

const rateLimitMap = new Map();
const RATE_LIMIT    = 10;
const RATE_WINDOW   = 60 * 1000;

function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) { rateLimitMap.set(ip, { count: 1, start: now }); return true; }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return true;
}

// Compact resume text for the prompt
const PROFILE = `
Name: Arjun Kumar | Senior Software Engineer | 7+ years | Delhi, India
Technical Skills: Angular, Node.js, NestJS, Express.js, REST APIs, TypeScript, JavaScript, JWT, RBAC, MySQL, Redis, MongoDB, AWS, CI/CD Pipelines, Git, Microservices, System Design, Stripe, Google Maps SDK, Moodle Web Services
Experience:
  • Software Engineer @ Quokkalabs LLP (Feb 2022–Present)
    - Full-stack Angular + Node.js apps for enterprise SaaS
    - NestJS + Express REST API architecture
    - JWT authentication & RBAC authorisation
    - Stripe payments, Google Maps SDK, third-party API integrations
    - AWS production deployments with CI/CD pipelines
    - Reduced deployment time by 20%
  • Software Engineer @ InsightGeeks Solutions (Aug 2019–Nov 2021)
    - Angular front-end, reusable UI components, REST API integration, performance optimisation
  • Frontend Developer @ Elroute Pvt Ltd (Jun 2018–Jul 2019)
    - Angular UI modules, responsive layouts, cross-browser compatibility, API integration
Projects: LevelExam (EdTech – Node.js + Moodle + JWT/RBAC + AWS), Edique Control Panel (NestJS + SQL + AWS), ESEO Sports Booking (Node.js + Stripe)
Education: B.Tech Computer Science, Jaipur National University (2014–2018)
`.trim();

const SYSTEM = `You are a senior tech interview coach. Given a candidate profile and a job description, produce a focused, actionable interview preparation guide.
Return ONLY valid JSON with no markdown fences and no preamble.`;

function fallback(title, company) {
  return {
    match_summary: `Your Node.js, NestJS, Angular, and AWS background aligns well with ${title} at ${company}. Prioritise showcasing your backend API architecture, JWT/RBAC implementation, and the 20% deployment-time improvement.`,
    strengths: ["NestJS & Node.js backend expertise", "JWT/RBAC authentication systems", "AWS deployments & CI/CD pipelines", "Full-stack Angular + Node.js delivery"],
    skills_to_brush: [
      { skill: "NestJS patterns", priority: "high",   tip: "Review guards, interceptors, pipes, middleware, custom decorators, and exception filters" },
      { skill: "System Design",   priority: "high",   tip: "Practice designing scalable REST APIs: versioning, rate limiting, caching with Redis, DB indexing" },
      { skill: "TypeScript",      priority: "medium", tip: "Generics, decorators, utility types — commonly tested in senior roles" },
      { skill: "AWS services",    priority: "medium", tip: "Be ready to name specific services: EC2, RDS, S3, Elastic Beanstalk, CodePipeline" }
    ],
    skills_gap: [],
    likely_questions: [
      { category: "Technical",     question: "Walk me through how you structured NestJS modules in a large project.", answer_tip: "Describe feature modules, shared modules, lazy loading, and dependency injection strategy." },
      { category: "Technical",     question: "How did you implement RBAC in Node.js? What were the challenges?",     answer_tip: "Cover role guards, permission decorators, database-driven roles vs. static enums, token payloads." },
      { category: "System Design", question: "Design a scalable booking/payment API that handles 10k req/min.",       answer_tip: "Mention horizontal scaling, Redis queues, idempotency keys for Stripe, DB transactions." },
      { category: "System Design", question: "How would you migrate a monolith to microservices?",                    answer_tip: "Strangler-fig pattern, domain separation, inter-service communication (REST vs. message bus)." },
      { category: "Behavioral",    question: "Tell me about the 20% deployment time reduction — what exactly did you change?", answer_tip: "STAR format: describe the bottleneck, CI/CD steps automated, tools used, measured result." },
      { category: "Behavioral",    question: "Describe a production incident you resolved. How did you handle it?",   answer_tip: "Show structured debugging, RCA, and process improvement afterwards." }
    ],
    topics_to_study: [
      "NestJS advanced — guards, interceptors, custom pipes, exception filters",
      "System design fundamentals — CAP theorem, caching strategies, load balancing",
      "AWS core services relevant to Node.js — EC2, RDS, S3, Elastic Beanstalk, CodePipeline",
      "Database optimisation — MySQL indexing, query tuning, Redis caching patterns",
      "Microservices patterns — service discovery, circuit breaker, eventual consistency",
      "API security — OAuth 2.0, rate limiting, input validation, OWASP Top 10"
    ],
    prep_plan: [
      { phase: "Day 1–2", focus: "Tech deep-dive",      tasks: ["Revise NestJS decorators, guards, interceptors", "Review your JWT/RBAC implementation end-to-end", "List 3 metrics from your current project"] },
      { phase: "Day 3–4", focus: "System design",       tasks: ["Practice 2 API design problems on paper", "Study microservices communication patterns", "Review AWS architecture decisions you made"] },
      { phase: "Day 5",   focus: "Behavioural & mock",  tasks: ["Write STAR stories for all 3 achievements", "Do 1 live mock interview (pramp.com or peer)", "Research the company's tech stack and product"] }
    ],
    resume_tips: [
      "Add team size and system scale (e.g. 'APIs serving 50k+ daily users')",
      "Name specific AWS services used instead of just 'AWS'",
      "Quantify the Stripe integration — transaction volume or revenue processed"
    ]
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip)) return res.status(429).json({ error: "Rate limit exceeded — max 10/min" });

  const { title = "", company = "", description = "" } = req.body || {};
  if (!company || !description) return res.status(400).json({ error: "Missing company or description" });

  const userMsg = `Candidate profile:\n${PROFILE}\n\nRole: ${title} at ${company}\nJob description (first 3000 chars):\n${description.slice(0, 3000)}\n\nReturn a JSON prep guide with this exact structure — values must be specific to THIS job description:\n{\n  "match_summary": "2-3 sentences: honest fit assessment, strongest selling point, one watch-out",\n  "strengths": ["strength 1 relevant to this JD", "strength 2", "strength 3"],\n  "skills_to_brush": [{"skill":"...","priority":"high|medium|low","tip":"specific review advice for this JD"}],\n  "skills_gap": [{"skill":"...","priority":"high|medium|low","tip":"how to quickly close the gap"}],\n  "likely_questions": [{"category":"Technical|System Design|Behavioral","question":"...","answer_tip":"how to answer well for THIS role"}],\n  "topics_to_study": ["Topic — brief description tied to JD"],\n  "prep_plan": [{"phase":"Day X–Y","focus":"...","tasks":["task tied to JD"]}],\n  "resume_tips": ["specific tip to tailor resume for this exact role"]\n}\nReturn ONLY valid JSON.`;

  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":          process.env.ANTHROPIC_API_KEY,
        "anthropic-version":  "2023-06-01",
        "content-type":       "application/json"
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 2500,
        system:     SYSTEM,
        messages:   [{ role: "user", content: userMsg }]
      })
    });

    if (!apiRes.ok) {
      console.error("Claude API error:", await apiRes.text());
      return res.status(200).json({ prep: fallback(title, company), fallback: true });
    }

    const data = await apiRes.json();
    const raw  = data.content?.[0]?.text || "";
    let prep;
    try   { prep = JSON.parse(raw); }
    catch { return res.status(200).json({ prep: fallback(title, company), fallback: true }); }

    return res.status(200).json({ prep, fallback: false });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ prep: fallback(title, company), fallback: true, error: err.message });
  }
};

// Rate limiting — simple in-memory counter per IP (resets per cold-start)
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return true;
}

const BASE_RESUME = {
  name: "Arjun Kumar",
  title: "Senior Software Engineer | Full Stack & Backend",
  contact: {
    location: "Delhi, India",
    phone: "+91 8949342705",
    email: "kumar.arjun000511@gmail.com",
    linkedin: "linkedin.com/in/arjun-kumar-b4150b10b"
  },
  summary: "Senior Software Engineer with 7+ years of experience designing, developing, and deploying scalable enterprise and SaaS applications using Node.js, NestJS, Angular, and AWS. Strong expertise in backend architecture, REST API development, authentication systems (JWT/RBAC), CI/CD automation, and cloud deployments.",
  skills: {
    Backend: "Node.js, NestJS, Express.js, REST APIs, JWT, RBAC",
    Frontend: "Angular, TypeScript, HTML, CSS",
    Database: "MySQL, Redis, MongoDB",
    "Cloud & DevOps": "AWS, CI/CD Pipelines, Git, Deployment Automation",
    Architecture: "System Design, Microservices, Scalable Systems",
    Integrations: "Stripe, Google Maps SDK, Third-party APIs"
  },
  experience: [
    {
      role: "Software Engineer",
      company: "Quokkalabs LLP",
      period: "Feb 2022 – Present",
      bullets: [
        "Engineered scalable full-stack applications using Angular, Node.js, and NestJS for enterprise-grade SaaS platforms.",
        "Designed and developed secure REST APIs with JWT authentication and RBAC authorization mechanisms.",
        "Integrated Stripe payment gateway, Google Maps SDK, and multiple third-party APIs.",
        "Managed AWS-based production deployments and CI/CD pipelines.",
        "Reduced deployment time by approximately 20% through automation and CI/CD improvements."
      ]
    },
    {
      role: "Software Engineer",
      company: "InsightGeeks Solutions Pvt Ltd",
      period: "Aug 2019 – Nov 2021",
      bullets: [
        "Developed Angular-based web applications with reusable UI components.",
        "Integrated frontend systems with backend REST APIs.",
        "Improved UI/UX and optimized frontend performance."
      ]
    },
    {
      role: "Frontend Developer",
      company: "Elroute Pvt Ltd",
      period: "Jun 2018 – Jul 2019",
      bullets: [
        "Developed responsive Angular UI modules for enterprise applications.",
        "Implemented reusable frontend components to improve maintainability.",
        "Integrated frontend modules with backend APIs."
      ]
    }
  ],
  projects: [
    { name: "LevelExam (EdTech)", bullets: ["Node.js + Express REST APIs", "Moodle integration", "JWT/RBAC auth", "AWS + CI/CD"] },
    { name: "Edique Control Panel", bullets: ["NestJS + SQL backend", "Device monitoring APIs", "AWS infrastructure"] },
    { name: "ESEO – Sports Booking", bullets: ["Node.js booking APIs", "Stripe payment gateway", "React admin panel support"] }
  ],
  education: [
    { degree: "B.Tech – Computer Science", school: "Jaipur National University", year: "2014–2018" }
  ]
};

const SYSTEM = `You are an expert resume writer. Given a base resume JSON and a job description,
return a tailored resume JSON — same structure as input.
Rules:
- Rewrite summary (3-4 sentences) to mirror the JD's priorities and language
- Reorder skills to put JD-matched skills first
- Rewrite experience bullets to emphasise JD-relevant achievements; keep all metrics
- Reorder project bullets by relevance to JD
- Never invent new skills or experience
- Return ONLY valid JSON, no markdown fences, no preamble`;

function resumeToPlainText(resume) {
  const lines = [];
  lines.push(resume.name);
  lines.push(resume.title);
  lines.push(`${resume.contact.location} | ${resume.contact.phone} | ${resume.contact.email}`);
  lines.push(`LinkedIn: ${resume.contact.linkedin}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(resume.summary);
  lines.push("");
  lines.push("SKILLS");
  for (const [cat, val] of Object.entries(resume.skills)) {
    lines.push(`${cat}: ${val}`);
  }
  lines.push("");
  lines.push("EXPERIENCE");
  for (const exp of resume.experience) {
    lines.push(`${exp.role} — ${exp.company} (${exp.period})`);
    for (const b of exp.bullets) lines.push(`  • ${b}`);
    lines.push("");
  }
  lines.push("PROJECTS");
  for (const p of resume.projects) {
    lines.push(p.name);
    for (const b of p.bullets) lines.push(`  • ${b}`);
    lines.push("");
  }
  lines.push("EDUCATION");
  for (const e of resume.education) {
    lines.push(`${e.degree} — ${e.school} (${e.year})`);
  }
  return lines.join("\n");
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Rate limit exceeded. Max 10 requests/minute." });
  }

  const { job_id, title, company, description } = req.body || {};
  if (!company || !description) {
    return res.status(400).json({ error: "Missing company or description" });
  }

  const userMsg = `Base resume: ${JSON.stringify(BASE_RESUME)}\nJob at ${company}: ${description.slice(0, 3000)}\nReturn tailored resume JSON only.`;

  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
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

    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      console.error("Claude API error:", errBody);
      return res.status(200).json({
        tailored: BASE_RESUME,
        plain_text: resumeToPlainText(BASE_RESUME),
        fallback: true
      });
    }

    const data = await apiRes.json();
    const raw = data.content?.[0]?.text || "";

    let tailored;
    try {
      tailored = JSON.parse(raw);
    } catch {
      // Claude returned something unparseable — fall back
      tailored = BASE_RESUME;
    }

    return res.status(200).json({
      tailored,
      plain_text: resumeToPlainText(tailored),
      fallback: false
    });
  } catch (err) {
    console.error(err);
    return res.status(200).json({
      tailored: BASE_RESUME,
      plain_text: resumeToPlainText(BASE_RESUME),
      fallback: true,
      error: err.message
    });
  }
};

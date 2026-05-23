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
  summary: "Senior Full Stack Developer with 7+ years of experience building scalable web applications using Angular, Node.js, and NestJS. Strong expertise in REST API development, authentication systems (JWT/RBAC), and AWS cloud deployments with CI/CD pipelines. Experienced in delivering SaaS and enterprise platforms across EdTech, SportsTech, and B2B domains.",
  skills: {
    "Technical":           "Angular, Node.js, NestJS, Express.js, REST APIs, TypeScript, JWT, RBAC, AWS, CI/CD, MySQL",
    "Core Competencies":   "Full Stack Development, API Design & Development, Cloud Infrastructure, Authentication & Authorisation, System Design, Microservices",
    "Databases":           "MySQL, Redis, MongoDB",
    "Integrations":        "Stripe, Google Maps SDK, Moodle Web Services, Third-party APIs",
    "Soft Skills":         "Team Lead, Team Management, Problem-solving, Communication, Adaptability"
  },
  experience: [
    {
      role: "Software Engineer",
      company: "Quokkalabs LLP",
      period: "Feb 2022 – Present",
      bullets: [
        "Engineered scalable full-stack applications leveraging Angular and Node.js, enhancing application performance and user experience.",
        "Architected REST APIs using NestJS and Express, ensuring seamless data flow and efficient backend operations.",
        "Implemented robust JWT authentication and RBAC authorisation mechanisms, bolstering application security and data protection.",
        "Orchestrated the integration of Stripe payments, Google Maps SDK, and various external APIs, expanding application functionality.",
        "Managed deployment of production systems on AWS with CI/CD pipelines, automating release processes and ensuring high availability.",
        "Streamlined deployment processes, resulting in a 20% reduction in deployment time.",
        "Improved application security posture by implementing JWT and RBAC across multiple services.",
        "Expanded application functionality by integrating Stripe payments and Google Maps SDK."
      ]
    },
    {
      role: "Software Engineer",
      company: "InsightGeeks Solutions Pvt Ltd",
      period: "Aug 2019 – Nov 2021",
      bullets: [
        "Developed Angular web applications, delivering user-friendly interfaces and robust functionality.",
        "Created reusable UI components, enhancing code maintainability and promoting design consistency.",
        "Integrated front-end applications with back-end REST APIs, facilitating seamless data exchange.",
        "Optimised front-end performance, resulting in improved application responsiveness and user satisfaction.",
        "Improved UI/UX, leading to increased user engagement and positive feedback."
      ]
    },
    {
      role: "Frontend Developer",
      company: "Elroute Pvt Ltd",
      period: "Jun 2018 – Jul 2019",
      bullets: [
        "Developed Angular UI modules for enterprise applications, enhancing front-end functionality.",
        "Implemented responsive layouts, ensuring optimal user experience across diverse devices.",
        "Ensured cross-browser compatibility, enhancing accessibility for a wider user base.",
        "Integrated front-end modules with back-end APIs, enabling seamless data flow."
      ]
    }
  ],
  projects: [
    {
      name: "LevelExam (EdTech Platform)",
      bullets: [
        "Engineered scalable REST APIs using Node.js and Express to enhance platform performance.",
        "Integrated Moodle Web Services for seamless educational content delivery.",
        "Implemented JWT and RBAC security measures, ensuring secure access to sensitive data.",
        "Managed deployment of services on AWS with CI/CD pipelines, improving deployment efficiency."
      ]
    },
    {
      name: "Edique Control Panel",
      bullets: [
        "Developed backend APIs using NestJS and SQL, enhancing system efficiency.",
        "Created device and user management services for improved administrative control.",
        "Integrated AWS infrastructure to ensure scalable and reliable deployment."
      ]
    },
    {
      name: "ESEO – Sports Booking Platform",
      bullets: [
        "Designed backend booking APIs using Node.js, optimising booking process efficiency.",
        "Integrated Stripe payment gateway, facilitating secure and seamless transactions.",
        "Provided support for the React-based admin panel, bolstering platform maintainability."
      ]
    }
  ],
  education: [
    { degree: "B.Tech – Computer Science", school: "Jaipur National University, Delhi, India", year: "2014–2018" },
    { degree: "Higher Secondary (Science)", school: "Paramount Academy, Delhi, India", year: "2012–2014" }
  ],
  languages: ["English", "Hindi"]
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

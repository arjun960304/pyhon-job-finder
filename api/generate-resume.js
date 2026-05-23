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
  title: "Senior Software Engineer — Node.js · NestJS · Angular · AWS · 7 Years",
  contact: {
    location: "Delhi, India",
    phone: "+91 8949342705",
    email: "kumar.arjun000511@gmail.com",
    linkedin: "linkedin.com/in/arjun-kumar-b4150b10b"
  },
  summary: "Senior Full Stack Engineer with 7+ years owning the complete delivery cycle of production SaaS and enterprise applications across EdTech, SportsTech, and B2B verticals. Deep expertise in backend API architecture (Node.js, NestJS), Angular front-end, AWS cloud infrastructure, and security-first design (JWT, RBAC). Delivered a 20% reduction in CI/CD pipeline time and integrated payment, mapping, and LMS ecosystems for live, client-facing products. Known for clean architecture, fast delivery, and strong cross-team ownership — actively seeking a Senior or Lead Backend / Full Stack role.",
  skills: {
    "Backend":          "Node.js, NestJS, Express.js, REST API Design, TypeScript, JWT, RBAC, OAuth 2.0, Microservices",
    "Frontend":         "Angular 12+, TypeScript, RxJS, HTML5, CSS3, Responsive Design, Component Architecture",
    "Databases":        "MySQL (indexing, query optimisation), Redis (caching, sessions), MongoDB",
    "Cloud & DevOps":   "AWS (EC2, RDS, S3, Elastic Beanstalk), CI/CD Pipelines, GitHub Actions, Git, Docker (basics)",
    "Architecture":     "System Design, RESTful API Design, Scalable Microservices, Multi-tenant SaaS",
    "Integrations":     "Stripe (payments, webhooks, refunds), Google Maps SDK, Moodle Web Services",
    "Leadership":       "Technical Mentoring, Code Reviews, Cross-functional Collaboration, Agile/Scrum"
  },
  experience: [
    {
      role: "Software Engineer",
      company: "Quokkalabs LLP",
      period: "Feb 2022 – Present",
      bullets: [
        "Architected and delivered 3+ production SaaS applications for enterprise clients across EdTech and B2B verticals using Angular (front-end) and NestJS/Node.js (back-end), consistently meeting sprint deadlines.",
        "Designed a modular NestJS REST API framework with JWT-based authentication and granular RBAC, enforcing least-privilege access across multi-tenant systems and eliminating unauthorised-access vulnerabilities.",
        "Cut CI/CD pipeline execution time by 20% by parallelising build stages, automating AWS environment provisioning (EC2, RDS, S3), and adding deployment health checks — reducing release risk significantly.",
        "Integrated Stripe payment gateway end-to-end — checkout sessions, webhook event handling, and automated refund workflows — powering secure live transactions in a SportsTech booking platform.",
        "Integrated Google Maps SDK for location-based features (venue discovery, proximity search), directly improving user engagement in the sports booking product.",
        "Led back-end architecture decisions, introduced reusable NestJS module patterns and REST API conventions, cutting new-feature development time and reducing integration bugs across the team.",
        "Mentored junior engineers through code reviews and pair programming sessions, raising team-wide code quality and reducing PR review cycles."
      ]
    },
    {
      role: "Software Engineer",
      company: "InsightGeeks Solutions Pvt Ltd",
      period: "Aug 2019 – Nov 2021",
      bullets: [
        "Built and owned 4+ Angular web applications for B2B clients, delivering pixel-accurate, fully responsive UIs with robust REST API integration.",
        "Engineered a shared Angular component library used across multiple projects, eliminating duplicated UI code and cutting per-project front-end setup time by ~40%.",
        "Optimised lazy-loading strategy and reduced Angular bundle sizes, improving initial page-load performance and measurably increasing user session depth.",
        "Acted as front-end tech lead — defined Angular-to-API integration contracts, coordinated with back-end teams, and resolved cross-team integration blockers.",
        "Improved overall UI/UX consistency by introducing shared design tokens and component standards, receiving positive client feedback across deliverables."
      ]
    },
    {
      role: "Frontend Developer",
      company: "Elroute Pvt Ltd",
      period: "Jun 2018 – Jul 2019",
      bullets: [
        "Developed Angular UI modules for enterprise applications, delivering fully responsive, cross-browser-compatible layouts (tested across Chrome, Firefox, Safari, Edge).",
        "Built a reusable UI component library adopted across 3 internal products, reducing redundant front-end development effort.",
        "Owned the API integration layer — implemented data-binding, error handling, and loading state management for all front-end to back-end REST calls.",
        "Worked closely with backend and QA teams in an Agile environment, consistently meeting sprint delivery targets."
      ]
    }
  ],
  projects: [
    {
      name: "LevelExam — EdTech Platform",
      bullets: [
        "Built a high-throughput REST API layer using Node.js and Express to power concurrent online exam sessions for thousands of students, with low-latency response requirements.",
        "Integrated Moodle Web Services for programmatic course management, assessment delivery, and grade synchronisation — replacing manual LMS workflows.",
        "Implemented a multi-role JWT + RBAC security model with separate permission scopes for students, instructors, and admins, securing sensitive assessment data.",
        "Deployed on AWS (EC2 + RDS) with fully automated CI/CD pipelines, enabling zero-downtime releases and rapid hotfix deployments.",
        "Stack: Node.js, Express.js, MySQL, JWT, RBAC, AWS EC2/RDS, CI/CD"
      ]
    },
    {
      name: "Edique Control Panel — IoT Device Management",
      bullets: [
        "Architected a NestJS + MySQL back-end for an IoT device management platform, supporting real-time device status monitoring, bulk configuration pushes, and alert management.",
        "Designed RESTful APIs for device registration, health monitoring, and administrative control, consumed by an Angular admin dashboard.",
        "Provisioned AWS infrastructure with dev/staging/prod environment separation, ensuring reliable and scalable deployments.",
        "Stack: NestJS, TypeScript, MySQL, AWS EC2/RDS, REST APIs"
      ]
    },
    {
      name: "ESEO — Sports Booking Platform",
      bullets: [
        "Architected a Node.js booking engine with concurrency-safe slot reservation logic, preventing double-bookings under simultaneous user load.",
        "Integrated Stripe payment gateway with full webhook lifecycle handling (payment confirmation, failure handling, automated refunds), enabling production-grade payment flows.",
        "Delivered dedicated management APIs (venue, schedule, bookings) consumed by a React-based admin panel, enabling real-time operational control.",
        "Stack: Node.js, Stripe API, MySQL, REST APIs, React (admin panel)"
      ]
    }
  ],
  education: [
    { degree: "B.Tech — Computer Science", school: "Jaipur National University, Delhi, India", year: "2014–2018" },
    { degree: "Higher Secondary (Science)", school: "Paramount Academy, Delhi, India", year: "2012–2014" }
  ],
  languages: ["English (Professional)", "Hindi (Native)"]
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

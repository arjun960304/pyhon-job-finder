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
  title: "Senior Backend / Full Stack Developer — Node.js · NestJS · React · AWS · 7 Years",
  contact: {
    location: "Delhi, India",
    phone: "+91 8949342705",
    email: "kumar.arjun000511@gmail.com",
    linkedin: "linkedin.com/in/arjun-kumar-b4150b10b"
  },
  summary: "Senior Full Stack Developer with 7+ years of experience building highly scalable web applications and microservices using Node.js, NestJS, and React.js (MERN stack). Deep expertise in designing RESTful APIs, cloud-native deployments on AWS (EC2, Lambda, SQS), and integrating asynchronous messaging systems (RabbitMQ, Kafka, AWS SQS) for resilient, event-driven architectures. Proven track record across EdTech, SportsTech, and B2B SaaS platforms. Self-starter who thrives in fast-paced environments — delivered 20% reduction in CI/CD pipeline time and production-grade systems serving thousands of users.",
  skills: {
    "Backend & APIs":        "Node.js, Express.js, NestJS, REST APIs, TypeScript, JWT, RBAC, OAuth 2.0, Microservices",
    "Frontend":              "React.js, Angular, TypeScript, HTML5, CSS3, Responsive Design, Component Architecture",
    "Databases":             "MongoDB, MySQL (indexing, query optimisation), Redis (caching, sessions)",
    "Cloud & DevOps":        "AWS (EC2, Lambda, S3, SQS, RDS), CI/CD Pipelines, GitHub Actions, Git",
    "Queuing & Messaging":   "AWS SQS, RabbitMQ, Kafka",
    "Architecture":          "Microservices, Scalable System Design, API Design & Integration, Multi-tenant SaaS",
    "Integrations":          "Stripe (payments, webhooks, refunds), Google Maps SDK, Moodle Web Services",
    "Leadership":            "Technical Mentoring, Code Reviews, Cross-functional Collaboration, Agile/Scrum"
  },
  experience: [
    {
      role: "Software Engineer (Backend / Full Stack)",
      company: "Quokkalabs LLP",
      period: "Feb 2022 – Present",
      bullets: [
        "Built and maintained scalable MERN-stack applications, developing MongoDB-backed REST APIs using Node.js and Express.js to power high-traffic platforms across EdTech and B2B verticals.",
        "Architected backend microservices using NestJS and Express.js, enabling independent deployment and horizontal scaling of individual services.",
        "Implemented AWS SQS and RabbitMQ for asynchronous event-driven workflows, decoupling services and improving system fault tolerance and resilience.",
        "Deployed cloud-native applications on AWS (EC2, Lambda, S3) with fully automated CI/CD pipelines, reducing deployment time by 20% and enabling zero-downtime releases.",
        "Enforced application security through JWT authentication and granular RBAC authorization across multi-tenant systems, eliminating unauthorised-access vulnerabilities.",
        "Integrated Stripe payment gateway end-to-end — checkout sessions, webhook lifecycle, and automated refunds — powering secure live transactions in a SportsTech booking platform.",
        "Mentored junior engineers through code reviews and pair programming, raising team-wide code quality and reducing PR review cycles."
      ]
    },
    {
      role: "Software Engineer",
      company: "InsightGeeks Solutions Pvt Ltd",
      period: "Aug 2019 – Nov 2021",
      bullets: [
        "Developed and integrated RESTful APIs with Node.js backends, enabling seamless frontend-to-backend data exchange across 4+ Angular and React web applications for B2B clients.",
        "Built a shared Angular component library adopted across multiple projects, eliminating duplicated UI code and cutting per-project front-end setup time by ~40%.",
        "Optimised lazy-loading strategy and reduced Angular bundle sizes, improving initial page-load performance and measurably increasing user session depth.",
        "Acted as front-end tech lead — defined Angular/React-to-API integration contracts, coordinated with back-end teams, and resolved cross-team integration blockers.",
        "Improved overall UI/UX consistency by introducing shared design tokens and component standards, receiving positive client feedback across deliverables."
      ]
    },
    {
      role: "Frontend Developer",
      company: "Elroute Pvt Ltd",
      period: "Jun 2018 – Jul 2019",
      bullets: [
        "Developed Angular UI modules for enterprise applications, delivering fully responsive, cross-browser-compatible layouts (Chrome, Firefox, Safari, Edge).",
        "Built a reusable UI component library adopted across 3 internal products, reducing redundant front-end development effort.",
        "Owned the API integration layer — implemented data-binding, error handling, and loading state management for all front-end to back-end REST calls.",
        "Worked in an Agile/Scrum environment, consistently meeting sprint delivery targets."
      ]
    }
  ],
  projects: [
    {
      name: "LevelExam — EdTech Platform",
      bullets: [
        "Engineered scalable REST APIs with Node.js, Express.js, and MongoDB to power a high-volume EdTech platform handling thousands of concurrent exam sessions.",
        "Integrated AWS SQS queues for asynchronous content processing, decoupling exam submission workflows from grading pipelines and improving throughput.",
        "Secured platform with JWT + RBAC — separate permission scopes for students, instructors, and admins.",
        "Deployed on AWS (EC2 + RDS) with fully automated CI/CD pipelines enabling zero-downtime releases and rapid hotfix deployments.",
        "Stack: Node.js, Express.js, MongoDB, MySQL, JWT, RBAC, AWS EC2/SQS, CI/CD"
      ]
    },
    {
      name: "Edique Control Panel — IoT Device Management",
      bullets: [
        "Architected NestJS + MySQL back-end for an IoT device management platform supporting real-time device monitoring, bulk configuration pushes, and alert management.",
        "Designed RESTful APIs for device registration, health monitoring, and administrative control, consumed by an Angular admin dashboard.",
        "Provisioned AWS infrastructure with dev/staging/prod environment separation for reliable, scalable deployments.",
        "Stack: NestJS, TypeScript, MySQL, AWS EC2/RDS, REST APIs, Angular"
      ]
    },
    {
      name: "ESEO — Sports Booking Platform",
      bullets: [
        "Designed booking engine in Node.js with MongoDB for concurrency-safe slot reservation, preventing double-bookings under simultaneous user load.",
        "Integrated Stripe payment gateway with full webhook lifecycle (confirmation, failure, automated refunds) enabling production-grade payment flows.",
        "Delivered management APIs (venue, schedule, bookings) consumed by a React-based admin panel, enabling real-time operational control.",
        "Stack: Node.js, MongoDB, Stripe API, MySQL, REST APIs, React (admin panel)"
      ]
    }
  ],
  education: [
    { degree: "B.Tech — Computer Science Engineering", school: "Jaipur National University, Delhi, India", year: "2014–2018" },
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

"""
JobSpy Job Scraper — configured for Arjun Kumar
Senior Software Engineer | Node.js · NestJS · Angular · AWS
Remote & Hybrid · India

Platform status (as of May 2026):
    linkedin  ✅  works reliably
    indeed    ✅  works, no rate limit
    naukri    ❌  blocks with reCAPTCHA 406
    glassdoor ❌  drops connection

Setup:
    pip install jobspy pandas

Run:
    python arjun_jobspy.py
"""

import csv
import datetime
import time
import pandas as pd
from jobspy import scrape_jobs

# ── Profile ───────────────────────────────────────────────────────────────────

MUST_HAVE_SKILLS = [
    "node.js", "nodejs", "nestjs", "express", "angular", "typescript",
    "aws", "rest api", "rest", "jwt", "rbac", "mysql", "redis",
    "mongodb", "stripe", "ci/cd", "cicd", "microservices", "git",
]

NICE_TO_HAVE = [
    "react", "vue", "docker", "kubernetes", "graphql",
    "kafka", "elasticsearch", "terraform", "python",
]

TARGET_TITLES = [
    "senior software engineer", "lead backend engineer",
    "backend engineer", "full stack engineer",
    "full stack developer", "node.js developer", "nestjs developer",
    "tech lead", "software engineer",
]

EXCLUDE_KEYWORDS = [
    "react native", "ios developer", "android developer",
    "data scientist", "machine learning", "java developer",
    ".net developer", "devops only", "salesforce",
]

# ── Search config ─────────────────────────────────────────────────────────────

# linkedin + indeed only — naukri (reCAPTCHA 406) and glassdoor (connection reset) blocked
SITES = ["linkedin", "indeed"]

QUERIES = [
    "Senior Node.js Engineer Remote India",
    "NestJS Backend Engineer Hybrid India",
    "Full Stack Angular Node.js Remote India",
    "Senior Software Engineer SaaS Remote India",
    "Backend Engineer NestJS AWS India",
]

LOCATION        = "India"
RESULTS_PER_RUN = 25      # per query per site
HOURS_OLD       = 168     # last 7 days
DELAY_SECONDS   = 3       # pause between queries to avoid rate limits

# ── Scoring ───────────────────────────────────────────────────────────────────

def score_job(row: pd.Series) -> int:
    text = " ".join([
        str(row.get("title", "")),
        str(row.get("description", "")),
        str(row.get("job_function", "")),
    ]).lower()

    if any(k in text for k in EXCLUDE_KEYWORDS):
        return 0

    matched   = sum(1 for s in MUST_HAVE_SKILLS if s in text)
    nice      = sum(1 for s in NICE_TO_HAVE if s in text)
    title_hit = any(t in str(row.get("title", "")).lower() for t in TARGET_TITLES)
    is_remote = str(row.get("is_remote", "")).lower() in ["true", "1", "yes"]

    score  = int((matched / len(MUST_HAVE_SKILLS)) * 70)
    score += 15 if title_hit else 0
    score += min(10, nice * 3)
    score += 5 if is_remote else 0
    return min(99, score)


def matched_skills(row: pd.Series) -> str:
    text = " ".join([
        str(row.get("title", "")),
        str(row.get("description", "")),
    ]).lower()
    return ", ".join(s for s in MUST_HAVE_SKILLS if s in text)


# ── Per-site scrape with error handling ───────────────────────────────────────

def scrape_site(site: str, query: str) -> pd.DataFrame | None:
    try:
        jobs = scrape_jobs(
            site_name      = [site],
            search_term    = query,
            location       = LOCATION,
            results_wanted = RESULTS_PER_RUN,
            hours_old      = HOURS_OLD,
            is_remote      = True,
            country_indeed = "India",
        )
        return jobs if jobs is not None and not jobs.empty else None
    except Exception as e:
        msg = str(e)
        if "406" in msg or "recaptcha" in msg.lower():
            print(f"      [{site}] blocked by reCAPTCHA — skipping")
        elif "10054" in msg or "ConnectionReset" in msg or "aborted" in msg.lower():
            print(f"      [{site}] connection reset — skipping")
        else:
            print(f"      [{site}] error: {msg[:80]}")
        return None


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    frames = []

    print(f"\n{'─'*58}")
    print(f"  Arjun Kumar — Job Search  |  {datetime.date.today()}")
    print(f"  Platforms : {', '.join(SITES)}  (naukri/glassdoor blocked)")
    print(f"  Location  : {LOCATION}  |  Remote / Hybrid")
    print(f"  Queries   : {len(QUERIES)}")
    print(f"{'─'*58}\n")

    for i, query in enumerate(QUERIES, 1):
        print(f"  [{i}/{len(QUERIES)}] {query}")
        query_frames = []

        for site in SITES:
            result = scrape_site(site, query)
            if result is not None:
                query_frames.append(result)
                print(f"      [{site}] {len(result)} jobs")

        if query_frames:
            frames.extend(query_frames)

        if i < len(QUERIES):
            time.sleep(DELAY_SECONDS)

    print()

    if not frames:
        print("  No jobs found. Check your connection and try again.")
        return

    # Combine & deduplicate
    df = pd.concat(frames, ignore_index=True)
    before = len(df)
    df = df.drop_duplicates(subset=["job_url"], keep="first")
    print(f"  Total unique jobs  : {len(df)}  ({before - len(df)} duplicates removed)")

    # Score & sort
    df["match_score"]    = df.apply(score_job, axis=1)
    df["matched_skills"] = df.apply(matched_skills, axis=1)
    df = df.sort_values("match_score", ascending=False)

    # Output columns
    keep = [
        "match_score", "title", "company", "location", "is_remote",
        "job_type", "min_amount", "max_amount", "currency",
        "date_posted", "matched_skills", "job_url", "site", "description",
    ]
    df_out = df[[c for c in keep if c in df.columns]].copy()

    # Save files
    df_out.to_csv("arjun_jobs.csv", index=False, quoting=csv.QUOTE_ALL)
    print(f"  All results saved  → arjun_jobs.csv")

    df_top = df_out[df_out["match_score"] >= 50].copy()
    df_top.to_csv("arjun_jobs_top.csv", index=False, quoting=csv.QUOTE_ALL)
    print(f"  Top matches (≥50)  → arjun_jobs_top.csv  ({len(df_top)} jobs)\n")

    # Summary table
    print(f"{'─'*58}")
    print(f"  Top 10 matches\n")
    for _, row in df_top.head(10).iterrows():
        title   = str(row.get("title", ""))[:40]
        company = str(row.get("company", ""))[:22]
        score   = row.get("match_score", 0)
        url     = str(row.get("job_url", ""))[:60]
        print(f"  [{score:>2}%]  {title:<40}  {company}")
        print(f"         {url}\n")
    print(f"{'─'*58}\n")


if __name__ == "__main__":
    main()
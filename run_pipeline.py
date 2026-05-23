"""
Full Pipeline — Arjun Kumar
============================
Step 1: Scrape jobs via JobSpy (main.py logic)
Step 2: Generate tailored .docx resumes via Claude API (arjun_resume_gen.py logic)

Folder structure expected:
    run_pipeline.py        ← this file
    main.py                ← your JobSpy scraper
    arjun_resume_gen.py    ← resume generator

Setup:
    pip install jobspy pandas requests python-docx
    export ANTHROPIC_API_KEY="sk-ant-..."

Run:
    python run_pipeline.py                    # full pipeline
    python run_pipeline.py --skip-scrape      # skip scraping, use existing arjun_jobs_top.csv
    python run_pipeline.py --min-score 65     # only generate for score >= 65
    python run_pipeline.py --limit 5          # generate max 5 resumes (good for testing)
    python run_pipeline.py --dry-run          # scrape only, no resume generation
"""

import os
import sys
import argparse
import importlib.util
from pathlib import Path
from datetime import datetime

# ── Helpers ───────────────────────────────────────────────────────────────────

def banner(text):
    print(f"\n{'═'*60}")
    print(f"  {text}")
    print(f"{'═'*60}\n")

def step(n, text):
    print(f"\n  ┌─ Step {n}: {text}")

def ok(text):
    print(f"  ✓  {text}")

def err(text):
    print(f"  ✗  {text}")

def load_module(filepath, module_name):
    """Dynamically import main.py or arjun_resume_gen.py by file path."""
    spec = importlib.util.spec_from_file_location(module_name, filepath)
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

# ── Pipeline ──────────────────────────────────────────────────────────────────

def run_scraper(main_py_path: Path):
    """Run main.py's scraper and return path to the top jobs CSV."""
    step(1, "Scraping jobs (main.py)")

    if not main_py_path.exists():
        err(f"main.py not found at: {main_py_path}")
        err("Place main.py in the same folder as run_pipeline.py")
        sys.exit(1)

    mod = load_module(str(main_py_path), "main")
    mod.main()   # runs scrape → saves arjun_jobs_top.csv

    csv_path = Path("arjun_jobs_top.csv")
    if not csv_path.exists():
        err("arjun_jobs_top.csv was not created by main.py. Check for scraper errors above.")
        sys.exit(1)

    ok(f"Scraper done → arjun_jobs_top.csv")
    return csv_path


def run_resume_gen(resume_gen_path: Path, csv_path: Path, min_score: int, limit: int, out_dir: str):
    """Run arjun_resume_gen.py's pipeline against the top jobs CSV."""
    step(2, "Generating tailored resumes (arjun_resume_gen.py)")

    if not resume_gen_path.exists():
        err(f"arjun_resume_gen.py not found at: {resume_gen_path}")
        err("Place arjun_resume_gen.py in the same folder as run_pipeline.py")
        sys.exit(1)

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        err("ANTHROPIC_API_KEY is not set.")
        err("Run:  export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    import pandas as pd
    df = pd.read_csv(str(csv_path))
    total_available = len(df[df["match_score"] >= min_score])
    ok(f"Found {total_available} jobs with score >= {min_score}%")

    mod = load_module(str(resume_gen_path), "arjun_resume_gen")

    import csv as csv_mod, time
    from pathlib import Path as P

    out_path = P(out_dir)
    out_path.mkdir(exist_ok=True)

    df = df[df["match_score"] >= min_score].sort_values("match_score", ascending=False)
    if limit:
        df = df.head(limit)

    total     = len(df)
    summary   = []
    generated = 0

    print(f"\n  Processing {total} jobs → {out_dir}/\n")

    for i, (_, row) in enumerate(df.iterrows(), 1):
        company = str(row.get("company", "Unknown")).strip()
        title   = str(row.get("title",   "Role")).strip()
        jd_text = str(row.get("description", "")).strip()
        score   = int(row.get("match_score", 0))
        url     = str(row.get("job_url", ""))

        print(f"  [{i:>2}/{total}]  [{score}%]  {company} — {title[:45]}")

        filename = mod.safe_filename(company, title)
        fpath    = str(out_path / filename)

        try:
            if jd_text and len(jd_text) > 100:
                tailored = mod.tailor_resume(jd_text, company)
            else:
                print(f"         No JD text — using base resume")
                tailored = mod.BASE_RESUME

            mod.build_docx(tailored, fpath)
            print(f"         → {filename}")
            summary.append({"score": score, "company": company, "title": title,
                            "file": filename, "url": url, "status": "ok"})
            generated += 1

        except Exception as e:
            print(f"         ERROR: {str(e)[:80]}")
            # Fallback: write base resume so you always get a file
            try:
                mod.build_docx(mod.BASE_RESUME, fpath)
                summary.append({"score": score, "company": company, "title": title,
                                "file": filename, "url": url, "status": "fallback"})
            except Exception:
                summary.append({"score": score, "company": company, "title": title,
                                "file": "—", "url": url, "status": f"error: {e}"})

        if i < total:
            time.sleep(2.0)

    # Save summary CSV inside output folder
    import csv as csv_mod
    summary_path = out_path / "summary.csv"
    pd.DataFrame(summary).to_csv(str(summary_path), index=False)

    ok(f"{generated}/{total} resumes generated → {out_dir}/")
    ok(f"Summary saved → {summary_path}")
    return generated, total


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Full pipeline: scrape jobs → generate tailored resumes")
    parser.add_argument("--skip-scrape", action="store_true", help="Skip scraping, use existing arjun_jobs_top.csv")
    parser.add_argument("--dry-run",     action="store_true", help="Scrape only, skip resume generation")
    parser.add_argument("--min-score",   type=int, default=50, help="Min match score to generate resume (default: 50)")
    parser.add_argument("--limit",       type=int, default=0,  help="Max resumes to generate (0 = all)")
    parser.add_argument("--out-dir",     default="output_resumes", help="Output folder for .docx files")
    parser.add_argument("--main-py",     default="main.py",    help="Path to your JobSpy main.py")
    parser.add_argument("--gen-py",      default="arjun_resume_gen.py", help="Path to resume generator script")
    args = parser.parse_args()

    banner(f"Arjun Kumar — Job Pipeline  |  {datetime.today().date()}")

    base_dir      = Path(__file__).parent
    main_py_path  = base_dir / args.main_py
    gen_py_path   = base_dir / args.gen_py
    csv_path      = Path("arjun_jobs_top.csv")

    # Step 1: Scrape
    if args.skip_scrape:
        step(1, "Scraping — SKIPPED (--skip-scrape)")
        if not csv_path.exists():
            err("arjun_jobs_top.csv not found. Run without --skip-scrape first.")
            sys.exit(1)
        ok(f"Using existing {csv_path}")
    else:
        csv_path = run_scraper(main_py_path)

    # Step 2: Generate resumes
    if args.dry_run:
        step(2, "Resume generation — SKIPPED (--dry-run)")
        ok("Scraping complete. Run without --dry-run to generate resumes.")
    else:
        generated, total = run_resume_gen(
            gen_py_path, csv_path,
            min_score=args.min_score,
            limit=args.limit,
            out_dir=args.out_dir,
        )

    banner(f"Pipeline complete ✓  |  Output → {args.out_dir}/")


if __name__ == "__main__":
    main()
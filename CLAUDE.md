# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static website for the **DevOps Micro Internship with Agentic AI** program, live at `https://dmi.pravinmishra.com`. No build step, no framework — plain HTML, CSS, and JavaScript.

This repo is one of six in a wider workspace that all funnel to a single LMS. If you have the workspace root available, its `CLAUDE.md` has the full ecosystem picture — the rules below are the subset that applies to this repo specifically, kept here so they're visible even when this repo is checked out alone.

## Ecosystem rules — read before editing prices, dates, or CTAs

- **Never state prices, cohort dates, or waitlist status on this site.** The LMS at `https://university.pravinmishra.com` (Payhip) is the single point of sale for all three DMI tracks (Foundation, Self-Paced Engineer, Live Internship) — those facts live only there and have gone stale here before (e.g. hardcoded cohort start dates in the hero/CTA). Link to University, don't restate it.
- **Brand accent is gold `#E8A020`** (ramp: `#f2bc55` / `#d4911a` / `#b87d16`) + **Mulish** font (ecosystem-wide since July 2026 — closest free match to the University storefront's Proxima Nova) — already reflected in `styles.css`'s custom properties (`--accent`, `--font`); keep new UI additions on that palette rather than introducing new colors.
- **Cross-site links need UTM params**: `utm_source=dmi&utm_medium=nav|footer|hero|cta-...`
- **Shared footer block** (same on all three static sites): University · DMI Student Hub · Pravin Mishra / The CloudAdvisory · Discord.

## Contribution workflow (for team members)

**Do not push directly to `main`.** The process is:

1. Create a new branch from `main`
2. Make your changes (data files, HTML, images)
3. Open a Pull Request — Pravin will review and merge
4. Merging to `main` automatically deploys to the live site via GitHub Actions

You never need to run AWS commands. Deployment is fully automated on merge.

```bash
git checkout main && git pull
git checkout -b update/champion-week-13
# make changes
git add <files>
git commit -m "Update champion data for week 13"
# then open a PR on GitHub
```

## Architecture

Each HTML page fetches its own data via an inline `<script>` block at the bottom using `fetch()`:

- `leaderboard.html` → fetches `data/leaderboard.csv`, parses it client-side, renders a table with group filter + name search
- `champion.html` → fetches `data/champion.json`, renders champion cards per group, browsable by week
- `graduates.html` → fetches `data/cohort1.json` and `data/cohort2.json`, renders graduate cards with cohort tabs
- `index.html` → no data fetch; static content only (curriculum, mentor bio, teaching team, CTA)

`styles.css` is a single shared stylesheet for all pages using CSS custom properties (`--accent`, `--bg-card`, `--border`, etc.).

`app.js` handles mobile nav toggle and is included in every page.

## How to update content

### Leaderboard (`data/leaderboard.csv`)

Columns: `Name, Group, Total`
- `Group` is a number (1–6)
- `Total` is the cumulative score
- Scoring: 10 pts attendance · 20 pts assignment · 10 pts LinkedIn post · 30 pts blog
- Save as plain CSV, not Excel format

### Champion of the Week (`data/champion.json`)

To add a new week:
1. Increment `"current_week"` to the new week number
2. Add a new entry to the `"weeks"` array:

```json
{
  "week": 13,
  "champions": [
    { "group": "Group 1", "name": "Full Name", "score": 210, "comment": "Mentor comment here", "linkedin": "https://linkedin.com/in/...", "photo": "" },
    { "group": "Group 2", "name": "Full Name", "score": 205, "comment": "Mentor comment here", "linkedin": "", "photo": "" },
    { "group": "Group 3", "name": "Full Name", "score": 208, "comment": "Mentor comment here", "linkedin": "", "photo": "" },
    { "group": "Group 4", "name": "Full Name", "score": 203, "comment": "Mentor comment here", "linkedin": "", "photo": "" },
    { "group": "Group 5", "name": "Full Name", "score": 207, "comment": "Mentor comment here", "linkedin": "", "photo": "" },
    { "group": "Group 6", "name": "Full Name", "score": 200, "comment": "Mentor comment here", "linkedin": "", "photo": "" }
  ]
}
```

- `photo` can be left as `""` or set to a path like `"images/filename.jpeg"` if a photo is available
- Add the image file to `images/` in the same PR if using a photo

### Graduates (`data/cohort1.json` or `data/cohort2.json`)

Add one object per graduate to the relevant cohort file:

```json
{ "name": "Jane Doe", "country": "Nigeria", "role": "Cloud & DevOps Engineer", "linkedin": "https://linkedin.com/in/janedoe", "photo": "", "group": "1" }
```

- `photo` can be `""` (initials are shown as fallback) or a path like `"images/jane-doe.jpeg"`
- `group` is the student's group number as a string

### Adding a new cohort (e.g. Cohort 3)

1. Create `data/cohort3.json` as an array of graduate objects (same schema as above)
2. In `graduates.html`, add a tab button and wire up the fetch in the inline `<script>` at the bottom of the file — follow the pattern used for Cohort 1 and Cohort 2
3. Include both files in the PR

### Updating an HTML page

Edit the relevant `.html` file directly. All pages share `styles.css` — avoid adding page-specific styles inline unless they are truly one-off; prefer adding a class to `styles.css` instead.

When editing `index.html`, sections to be aware of:
- **Curriculum timeline** — the week-by-week schedule is a list of `<div class="timeline-item">` blocks
- **Teaching Team** — mentor and co-mentor cards; add a new card following the existing pattern
- **CTA / hero** — the "Apply now" button and program dates are near the top of `<body>`

## Preview locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Chrome blocks `fetch()` on `file://` URLs, so always use a local server rather than opening HTML files directly.

## Deployment (reference only — team members do not run these)

Merging a PR to `main` triggers `.github/workflows/deploy.yml`, which:
1. Syncs all files (excluding `.git/`, `.github/`, `*.md`) to S3 bucket `dmi.pravinmishra.com` (region: `eu-west-1`)
2. Invalidates the CloudFront distribution (`E2N4UG9MOMV660`) so changes are live within ~30 seconds

The AWS credentials are stored as GitHub Actions secrets and use OIDC — no keys are stored in the repo.

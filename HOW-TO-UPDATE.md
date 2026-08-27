# DMI Website — How to Update & Deploy

This guide covers two things:
1. **First-time deployment** to AWS S3 + CloudFront
2. **Day-to-day content updates** (leaderboard, champion, graduates)

---

## PART 1 — First-Time Deployment

### Step 1 — Create the S3 Bucket

1. Go to **AWS S3 → Create bucket**
2. **Bucket name:** `dmi.pravinmishra.com` ← must match exactly
3. **Region:** same as your existing `pravinmishra.com` bucket
4. **Uncheck** "Block all public access" → confirm
5. Create bucket

### Step 2 — Enable Static Website Hosting

1. Open the bucket → **Properties** tab
2. Scroll to **Static website hosting** → Edit
3. **Enable** it
4. Index document: `index.html`
5. Error document: `index.html`
6. Save

### Step 3 — Set Bucket Policy (public read)

Go to **Permissions → Bucket policy**, paste this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::dmi.pravinmishra.com/*"
    }
  ]
}
```

### Step 4 — Upload All Files

From your terminal, run:

```bash
cd /Users/pravinkumar/Documents/workspace/dmi

aws s3 sync . s3://dmi.pravinmishra.com \
  --exclude ".claude/*" \
  --exclude "*.md" \
  --exclude ".DS_Store"
```

### Step 5 — Create CloudFront Distribution

1. Go to **CloudFront → Create distribution**
2. **Origin domain:** select your S3 bucket (`dmi.pravinmishra.com`)
3. **Origin access:** Public (since bucket is already public)
4. **Viewer protocol policy:** Redirect HTTP to HTTPS
5. **Alternate domain name (CNAME):** `dmi.pravinmishra.com`
6. **Custom SSL certificate:** Click "Request certificate"
   - Enter `dmi.pravinmishra.com`
   - Choose DNS validation → Create
   - Go to Route 53 and click "Create records in Route 53" (one click)
   - Wait ~2 minutes for certificate to show "Issued"
7. **Default root object:** `index.html`
8. Create distribution — copy the **CloudFront domain** (e.g. `d1abc123.cloudfront.net`)

### Step 6 — Point DNS to CloudFront

1. Go to **Route 53 → Hosted zones → pravinmishra.com**
2. **Create record**
   - Record name: `dmi`
   - Record type: `A`
   - Toggle **Alias** ON
   - Route traffic to: **Alias to CloudFront distribution**
   - Select your distribution
3. Save

Wait 2–5 minutes → visit `https://dmi.pravinmishra.com` ✅

---

## PART 2 — Day-to-Day Content Updates

Every update follows the same 3-step pattern:

> **Edit the file → Upload to S3 → Invalidate CloudFront cache**

The invalidation is important — without it, CloudFront serves the old cached version for up to 24 hours.

---

### Update the Leaderboard

**File:** `data/leaderboard.csv`

```bash
aws s3 cp data/leaderboard.csv s3://dmi.pravinmishra.com/data/leaderboard.csv

aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/data/leaderboard.csv"
```

---

### Update Champion of the Week

**File:** `data/champion.json`

```bash
aws s3 cp data/champion.json s3://dmi.pravinmishra.com/data/champion.json

aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/data/champion.json"
```

---

### Update Graduates

**Files:** `data/cohort1.json` or `data/cohort2.json` + `graduates.html`

```bash
aws s3 cp data/cohort2.json s3://dmi.pravinmishra.com/data/cohort2.json
aws s3 cp graduates.html s3://dmi.pravinmishra.com/graduates.html

aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/data/cohort2.json" "/graduates.html"
```

---

### Upload Everything at Once (full re-deploy)

Use this when you've made multiple changes:

```bash
cd /Users/pravinkumar/Documents/workspace/dmi

aws s3 sync . s3://dmi.pravinmishra.com \
  --exclude ".claude/*" \
  --exclude "*.md" \
  --exclude ".DS_Store"

aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

The `/*` invalidates everything — changes are live within 30 seconds.

---

### Find Your CloudFront Distribution ID

```bash
aws cloudfront list-distributions --query "DistributionList.Items[*].{ID:Id,Domain:DomainName,Aliases:Aliases.Items}"
```

Or find it in the **CloudFront console** → your distribution → copy the ID (looks like `E1ABCDEF2GHIJK`).

---

## Quick Reference

| What to update | File | Upload command |
|---|---|---|
| Leaderboard | `data/leaderboard.csv` | `aws s3 cp data/leaderboard.csv s3://dmi.pravinmishra.com/data/leaderboard.csv` |
| Champion | `data/champion.json` | `aws s3 cp data/champion.json s3://dmi.pravinmishra.com/data/champion.json` |
| Cohort 1 graduates | `data/cohort1.json` | `aws s3 cp data/cohort1.json s3://dmi.pravinmishra.com/data/cohort1.json` |
| Cohort 2 graduates | `data/cohort2.json` | `aws s3 cp data/cohort2.json s3://dmi.pravinmishra.com/data/cohort2.json` |
| Student photos | `data/student-photos.json` + `images/students/` | `aws s3 cp data/student-photos.json s3://dmi.pravinmishra.com/data/student-photos.json` |
| Any HTML page | e.g. `graduates.html` | `aws s3 cp graduates.html s3://dmi.pravinmishra.com/graduates.html` |
| Everything | all files | `aws s3 sync . s3://dmi.pravinmishra.com --exclude ".claude/*" --exclude "*.md"` |

After every upload, always run the CloudFront invalidation or changes won't be visible.

### Adding a student photo

Leaderboard avatars show a student's initials until a photo is mapped for them.

1. Save the image into `images/students/`, named after the student's **GitHub
   username** — e.g. `images/students/kachiraju.jpg`. Square crops best; ~200x200
   is plenty (it renders as a 40px circle).
2. Add one line to `data/student-photos.json`:

   ```json
   "kachiraju": "images/students/kachiraju.jpg"
   ```

   Keys are GitHub usernames, matched case-insensitively. Keys starting with `_`
   are ignored (that's how the notes at the top of the file are stored).
3. Upload both the image and the JSON, then invalidate CloudFront.

It applies to both the cohort and self-paced leaderboards at once — one map
serves both.

**Do not put photos in `data/leaderboard.csv`.** review-agent regenerates that
file every night and auto-publishes it, so a photo column there is overwritten
within a day. `data/student-photos.json` is never written by the agent.

A student with no entry shows their initials, and a broken or missing path
falls back to initials too — neither shows a broken image icon.

---

## Content Update Guide (for non-technical team members)

See the separate section below for how to edit each data file.

### Leaderboard (`data/leaderboard.csv`)

Open in Excel or any text editor. Columns: `Name, Group, Total`
- Group = just the number (1–6)
- Total = overall score
- Save as CSV, not Excel format

### Champion of the Week (`data/champion.json`)

To add a new week, open the file and:
1. Change `"current_week"` to the new week number
2. Add a new block inside `"weeks": [ ]`:

```json
{
  "week": 5,
  "champions": [
    { "group": "Group 1", "name": "Name Here", "score": 210, "comment": "Mentor comment", "linkedin": "https://linkedin.com/in/...", "photo": "" },
    { "group": "Group 2", "name": "Name Here", "score": 205, "comment": "Mentor comment", "linkedin": "", "photo": "" },
    { "group": "Group 3", "name": "Name Here", "score": 208, "comment": "Mentor comment", "linkedin": "", "photo": "" },
    { "group": "Group 4", "name": "Name Here", "score": 203, "comment": "Mentor comment", "linkedin": "", "photo": "" },
    { "group": "Group 5", "name": "Name Here", "score": 207, "comment": "Mentor comment", "linkedin": "", "photo": "" },
    { "group": "Group 6", "name": "Name Here", "score": 200, "comment": "Mentor comment", "linkedin": "", "photo": "" }
  ]
}
```

### Graduates (`data/cohort2.json`)

Add one line per student:
```json
{ "name": "Jane Doe", "country": "Nigeria", "role": "Cloud & DevOps Engineer", "linkedin": "https://linkedin.com/in/janedoe", "photo": "", "group": "1" }
```

After adding Cohort 2 graduates, also uncomment the tab in `graduates.html` — find:
```html
<!-- Cohort 2 tab will appear here after they graduate -->
```
Replace with:
```html
<button class="cohort-tab" data-cohort="2">Cohort 2</button>
```

---

*For questions: hello@thecloudadvisory.com*

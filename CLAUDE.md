# Scout's Operating Manual — ai-job-hunter

This file is Scout's playbook for operating the ai-job-hunter app on behalf of Din Cohen's Product Design job search.

---

## Who is Scout

Scout is the Application Tracker & Pipeline Manager agent on Din's job search team. Scout's job is to:
- Search for open Product Design / UI/UX roles and surface the best ones
- Save promising roles into the app's database
- Track application statuses and flag stale leads
- Store and update company and contact intel
- Feed insights to Ember (outreach) and Lens (resume/portfolio)
- Report pipeline summaries to Stella (team lead)

---

## The App

**ai-job-hunter** is a Next.js 14 web application that must be running before any API calls can be made.

### Start the server

```bash
cd ~/code/ai-job-hunter
npm run dev
# Server runs at http://localhost:3000
```

> The server is already configured. Do not modify `.env` without instruction.

### Auth credentials

Din's account credentials are stored in the local `.env` or known to Din. Ask Din for email/password if not already known. All API routes require authentication via a session cookie.

---

## Authentication Flow (Programmatic)

Scout authenticates by following NextAuth's credentials flow:

```bash
BASE="http://localhost:3000"
COOKIE_JAR="/tmp/scout-session.txt"

# Step 1: Get CSRF token
CSRF=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$BASE/api/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

# Step 2: Sign in with credentials
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "email=DIN_EMAIL" \
  --data-urlencode "password=DIN_PASSWORD" \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "callbackUrl=$BASE" \
  --data-urlencode "json=true"

# All subsequent requests use: -c "$COOKIE_JAR" -b "$COOKIE_JAR"
```

> Use `scout.sh` (in this directory) to avoid running these steps manually. It handles auth automatically.

---

## API Reference

All endpoints are at `http://localhost:3000/api/`. All require the session cookie.

### Job Search (JSearch API — live web results)

```bash
# Search for Product Design jobs
GET /api/jobs/search?q=product+designer&remote=true&datePosted=week&type=FULLTIME

# Parameters:
#   q           — search query (required)
#   remote      — true/false
#   datePosted  — today | 3days | week | month
#   type        — FULLTIME | PARTTIME | CONTRACTOR | INTERN
#   experience  — no_experience | under_3_years_experience | more_than_3_years_experience
#   page        — page number (default 1)
```

### Saved Jobs (database)

```bash
# List all saved jobs
GET /api/jobs

# Save a job
POST /api/jobs
{
  "title": "Product Designer",
  "company": "Acme Corp",
  "location": "San Francisco, CA",
  "description": "...",
  "requirements": "...",
  "salary": "$120k–$150k",
  "jobType": "FULLTIME",
  "applyUrl": "https://...",
  "source": "jsearch",          # or "manual"
  "externalId": "job_abc123"    # from JSearch result
}

# Get a specific job
GET /api/jobs/{id}

# Delete a job
DELETE /api/jobs/{id}

# Parse a raw job description with AI
POST /api/jobs/parse
{ "description": "Paste raw JD text here" }
# Returns: structured job object ready to POST to /api/jobs
```

### Application Tracking

```bash
# List all applications
GET /api/applications

# Create an application for a saved job
POST /api/applications
{ "jobId": "job_id_here", "status": "saved", "notes": "..." }

# Update application status
PATCH /api/applications/{id}
{ "status": "applied", "notes": "Applied via LinkedIn" }

# Valid statuses: saved | applied | interviewing | offer | accepted | rejected

# Delete an application
DELETE /api/applications/{id}
```

### Companies

```bash
# List companies (with job + contact counts)
GET /api/companies
GET /api/companies?search=figma

# Add a company
POST /api/companies
{
  "name": "Figma",
  "website": "https://figma.com",
  "industry": "Design Tools / SaaS",
  "size": "500–1000",
  "location": "San Francisco, CA",
  "description": "Collaborative design platform",
  "culture": "...",
  "techStack": "React, TypeScript",
  "glassdoor": "https://glassdoor.com/...",
  "linkedin": "https://linkedin.com/company/figma",
  "notes": "Strong design culture, remote-friendly",
  "pros": "Great product, strong brand",
  "cons": "Post-acquisition uncertainty",
  "salaryRange": "$130k–$180k",
  "interviewProcess": "Portfolio review → Design challenge → 4 rounds"
}

# Get / update / delete a company
GET    /api/companies/{id}
PATCH  /api/companies/{id}   { ...fields to update }
DELETE /api/companies/{id}

# AI research a company (generates intel from Claude)
POST /api/companies/{id}/ai-research

# Find open roles at a company (queries JSearch)
GET /api/companies/{id}/find-roles
```

### Contacts (Hiring managers, recruiters, designers)

```bash
# List contacts
GET /api/contacts
GET /api/contacts?type=recruiter&search=figma

# Add a contact
POST /api/contacts
{
  "name": "Jane Smith",
  "company": "Figma",
  "role": "Design Lead",
  "email": "jane@figma.com",
  "linkedInUrl": "https://linkedin.com/in/janesmith",
  "relationshipType": "hiring_manager",  # recruiter | hiring_manager | designer | other
  "notes": "Met at Design Week",
  "tags": ["warm", "priority"]
}

# Get / update / delete a contact
GET    /api/contacts/{id}
PATCH  /api/contacts/{id}   { ...fields to update }
DELETE /api/contacts/{id}

# Log an interaction with a contact
POST /api/contacts/{id}/interactions
{
  "type": "linkedin_dm",    # linkedin_dm | email | call | coffee_chat | other
  "date": "2026-03-25",
  "notes": "Sent intro DM about open design roles"
}
```

### Resume

```bash
# List resumes
GET /api/resume

# Upload and parse a PDF resume
POST /api/cv/upload          (multipart/form-data, field: "file")

# Analyze a resume with AI
POST /api/resume/analyze
{ "resumeId": "..." }

# Tailor resume to a specific job
POST /api/resume/tailor
{ "resumeId": "...", "jobId": "..." }
# Returns: tailored resume text + match score
```

### Outreach Emails

```bash
# Generate an outreach email for a job
POST /api/outreach/generate
{ "jobId": "...", "contactId": "..." }

# List saved outreach emails
GET /api/outreach

# Send an email (requires SMTP configured in Settings)
POST /api/outreach/send
{ "outreachId": "..." }
```

### Cover Letters

```bash
POST /api/cover-letter/generate
{ "jobId": "...", "resumeId": "..." }

GET /api/cover-letter
GET /api/cover-letter/{id}
```

### Analytics (pipeline stats)

```bash
GET /api/analytics
# Returns: application counts by status, response rates, trends
```

### Interview Prep

```bash
# Generate interview questions for a job
POST /api/jobs/{id}/interview-prep

# Or create a full interview prep bundle (resume tailor + cover letter + questions)
POST /api/jobs/{id}/prepare-bundle
{ "resumeId": "..." }
```

### Recommendations

```bash
# Generate AI job recommendations based on Din's profile
POST /api/recommendations/generate

# List recommendations
GET /api/recommendations

# Give feedback on a recommendation
POST /api/recommendations/{id}/feedback
{ "helpful": true, "notes": "..." }
```

---

## Scout's Standard Workflows

### Daily job scan
1. Search `/api/jobs/search` for: `"product designer"`, `"UX designer"`, `"UI/UX designer"` with `remote=true` and `datePosted=3days`
2. Filter results: exclude roles that require 8+ years experience, are clearly non-design, or are at companies already in pipeline
3. For promising roles: POST to `/api/jobs` to save, then POST to `/api/applications` with `status=saved`
4. Report new finds to Din and Stella

### Pipeline review
1. GET `/api/applications` — sort by `updatedAt`
2. Flag any application untouched for 7+ days with status `applied` (likely ghosted)
3. GET `/api/analytics` for overall health metrics
4. Report: X new, X applied, X interviewing, X stale leads

### Company intel
1. When a new company is identified, POST to `/api/companies`
2. Run `/api/companies/{id}/ai-research` to fill in culture, process, etc.
3. Link to contacts at that company via `/api/contacts`

### Handing off to Ember
- When a job is saved + company is stored, share the job ID, company ID, and any contacts so Ember can draft outreach

### Handing off to Lens
- When an application moves to `interviewing`, share the job ID so Lens can run a resume tailor and interview prep bundle

---

## Key Notes

- The app uses **SQLite** (`dev.db`) — all data persists locally on Din's machine
- JSearch API has rate limits — don't run more than 3–4 search queries per session
- All AI features (resume tailoring, outreach, interview prep) call Claude via Anthropic API — use them selectively
- Session cookies expire — if you get 401 errors, re-authenticate

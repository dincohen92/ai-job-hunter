# AI Job Hunter

An AI-powered job hunting assistant that helps you search for jobs, tailor your resume, track applications, and generate outreach emails — all from one dashboard.

## Features

- **Job Search** — Search millions of job listings via the JSearch API with filters for date posted, job type, experience level, and remote work
- **Paste & Parse** — Paste any job description and let Claude AI extract structured details (title, company, requirements, salary, etc.)
- **Resume Management** — Upload PDF resumes, parse and analyze them with AI
- **AI Resume Tailoring** — Generate a tailored version of your resume for any saved job, with match scoring
- **Application Tracking** — Track application status (Saved, Applied, Interviewing, Offer, Accepted, Rejected)
- **Outreach Emails** — Generate personalized outreach emails with AI and send them directly via SMTP
- **Auth** — User registration and login with secure password hashing

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Database | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| ORM | [Prisma 7](https://www.prisma.io/) with better-sqlite3 adapter |
| Auth | [NextAuth.js](https://next-auth.js.org/) (Credentials provider, JWT strategy) |
| AI | [Anthropic Claude API](https://www.anthropic.com/) (resume parsing, tailoring, email generation) |
| Job Data | [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/) via RapidAPI |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind) |
| PDF Parsing | [unpdf](https://github.com/unjs/unpdf) |
| Email | [Nodemailer](https://nodemailer.com/) |

## Prerequisites

- Node.js 18+ (tested on v25.3.0)
- npm

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/dincohen92/ai-job-hunter.git
cd ai-job-hunter
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your API keys:

```bash
cp .env.example .env
```

Then edit `.env` with your values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite database path. Default `file:./dev.db` works out of the box |
| `NEXTAUTH_SECRET` | Yes | Random string for encrypting session tokens. Generate one with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Your app URL. Use `http://localhost:3000` for local dev |
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com/) |
| `CLAUDE_MODEL` | No | Claude model to use. Defaults to `claude-sonnet-4-20250514` |
| `RAPIDAPI_KEY` | Yes | Your RapidAPI key (see below) |

### 4. Get your API keys

**Anthropic (Claude AI):**
1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Create an API key
3. Add it as `ANTHROPIC_API_KEY` in your `.env`

**RapidAPI (JSearch):**
1. Sign up at [rapidapi.com](https://rapidapi.com/)
2. Subscribe to the [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/) (free tier available)
3. Copy your API key from the JSearch API page
4. Add it as `RAPIDAPI_KEY` in your `.env`

> **Note:** You must subscribe to the JSearch API on RapidAPI for job search to work. Just having a RapidAPI account isn't enough — you need to click "Subscribe to Test" on the JSearch API page.

### 5. Set up the database

Generate the Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Create an account to get started.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login & registration pages
│   ├── (dashboard)/         # Main app pages
│   │   ├── dashboard/       # Overview dashboard
│   │   ├── jobs/            # Job search & saved jobs
│   │   │   └── [id]/        # Job detail page
│   │   ├── resume/          # Resume management
│   │   │   └── tailor/      # AI resume tailoring
│   │   ├── outreach/        # Email outreach
│   │   └── settings/        # SMTP configuration
│   └── api/                 # API routes
│       ├── auth/            # NextAuth + registration
│       ├── jobs/            # Job CRUD + search + AI parsing
│       ├── resume/          # Resume upload, analyze, tailor
│       ├── applications/    # Application status tracking
│       ├── outreach/        # Email generation + sending
│       └── settings/        # SMTP config
├── components/
│   ├── layout/              # Sidebar, header
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── claude.ts            # Anthropic SDK wrapper
│   ├── email.ts             # Nodemailer helper
│   ├── jsearch.ts           # JSearch API client
│   ├── prisma.ts            # Prisma client singleton
│   ├── prompts.ts           # AI prompt templates
│   └── session.ts           # Auth session helper
└── types/                   # TypeScript type extensions
prisma/
├── schema.prisma            # Database schema
└── migrations/              # Migration history
```

## Optional: SMTP for Outreach Emails

To send outreach emails directly from the app, configure your SMTP settings in the **Settings** page after logging in. You'll need:

- SMTP host (e.g., `smtp.gmail.com`)
- Port (typically 587 for TLS)
- Username and password (for Gmail, use an [App Password](https://support.google.com/accounts/answer/185833))

## License

MIT

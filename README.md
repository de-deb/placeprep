# PlacePrep — Placement Preparation & Management Portal

> B.Tech CSE Software Engineering course project (VIT Chennai).
> A polished placement platform built around five pillars: **Student Readiness,
> Preparation Workspace, Recruitment/Applications, Career Profile/Resume,
> Placement-Cell Analytics**.

Students prepare (readiness command center, coding workspace, timed aptitude,
interview bank + mock mode, resume center, company intelligence, drives with
auto-eligibility); the placement cell runs recruitment (applicant funnel, status
workflow with history + notifications, drive/student intelligence, analytics).

---

## 1. Project Overview

| | |
|---|---|
| **Problem** | Placement prep is scattered across many sites; progress and drives are hard to track. |
| **Solution** | One portal covering the full journey: readiness → preparation → application → selection, plus admin recruitment tooling. |
| **Users** | `STUDENT` (default) and `ADMIN` (placement cell), enforced by JWT + role middleware. |
| **Status** | End-to-end flows verified locally and in Docker (see §16 Verification). |

### Features

**Student — Readiness**
- Command-center dashboard: readiness score + grade + 14-day trend sparkline, strongest/weakest areas, profile completeness, headline recommendation ("Next best move")
- Top 3–5 data-driven next-best actions (eligible closing drives first), opportunity cards with urgency (open/closing soon/deadline today/closed) + auto-eligibility with reasons, activity feed
- Notifications bell (unread count, dropdown) + notifications page, global search (`/search`), settings (account, password, notification prefs)

**Student — Preparation workspace**
- Coding: 12 problems with samples/constraints/explanations/company tags, detail modal, honest self-check submissions (SOLVED/ATTEMPTED + notes), solve/bookmark, `/coding/progress` analytics (by difficulty, topic mastery, weakest tag, recent attempts)
- Aptitude: quiz builder (category/difficulty/count/timer), timed runner (navigator, mark-for-review, submit confirm), graded review (per-question correct answer + explanation, topic bars), analytics (average/best/by-category/trend)
- Interview: 27-question bank across 9 categories with guidance + key points, NOT_STARTED→PRACTICED→CONFIDENT tracking, per-category progress, mock interview mode with readiness % + weak topics

**Student — Recruitment**
- Drives with automatic eligibility (CGPA/branch/year/skills + reasons), eligible-only filter, one-click apply, duplicate/closed guards
- Applications with visual pipeline timeline, status history, next-step hints, withdraw (kept as history, terminal apps blocked)

**Student — Career profile / Resume**
- Extended profile (contact, education, links) feeding one shared record
- Resume Center (`/resume`): summary + experience/projects/achievements/certifications CRUD, data-driven strength score (0–100) with suggestions, one-page preview, print-to-PDF via print CSS

**Admin (placement cell)**
- Command center: readiness distribution, application funnel by status, applications by company, placement rate, prep health, branch chart
- Students: search/branch/CGPA filters, sortable-paginated tables, 360° student detail (readiness, completeness, resume strength, applications, prep)
- Drives: structured eligibility rules in the form, drive detail with funnel + applicant filters + per-row status moves + bulk updates (students notified)
- Companies / Resources (tags/company/featured) / Announcements (fans out notifications) CRUD with validation + confirmations

**Platform**
- Register/login (JWT, bcrypt, rate-limited auth, stronger passwords), demo mode for every module, Docker Compose, tests, API docs (`docs/api.md`)

---

## 2. Technology Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS 4, React Router 7, Axios
- **Backend:** Node.js 22, Express 4, TypeScript, Zod validation, Helmet + CORS + Morgan
- **Database:** PostgreSQL 16 + Prisma ORM 5
- **Auth:** JWT (`Authorization: Bearer`), bcryptjs hashing
- **Dev/Test:** Docker + Compose, Vitest (+ Supertest on backend, Testing Library on frontend)
- **No extra infra** (no Redis/Kafka/GraphQL) — kept viva-explainable on purpose.

---

## 3. Architecture

```text
Browser (Student / Admin)
  │
  ▼
React Frontend (Vite + TS + Tailwind)
  │  HTTP / REST + JWT  { success, data }
  ▼
Express API ──► Controllers (thin) ──► Services (business logic)
  │                    │                        │
  │              auth middleware          Prisma Data Access
  │              zod validation                 │
  │                                              ▼
  │                                         PostgreSQL
```

See `docs/design/architecture.png` (+ `.drawio` source) and
`docs/design/component-diagram.png`. UI screenshots in `docs/design/ui/`
are real captures from the running app.

---

## 4. Folder Structure

```text
placeprep/
├── frontend/
│   ├── src/
│   │   ├── components/{ui,layout,dashboard}  # Button, Card, Input, Badge, Modal, Table/DataTable, States (Skeleton/Sparkline/BarList)…
│   │   ├── pages/ + pages/admin/             # dashboard, resume, coding[/progress], aptitude, interview,
│   │   │                                     # drives, applications, companies[/:id], resources, announcements,
│   │   │                                     # notifications, search, settings (+ admin overview/students[/:id],
│   │   │                                     # companies, drives[/:id], resources, announcements)
│   │   ├── services/                         # api.ts (axios) + index.ts (per-module calls)
│   │   ├── context/AuthContext.tsx           # session, token, demo mode
│   │   ├── hooks/useApi.ts                   # loading/error/empty handling
│   │   ├── routes/ProtectedRoute.tsx         # auth + role guard
│   │   ├── types/  utils/  data/mockData.ts  # shared types, format, demo fallback
│   ├── Dockerfile  .env.example
├── backend/
│   ├── src/
│   │   ├── config/ (env, db)  middleware/ (auth, errorHandler, asyncHandler, rate-limit on /api/auth)
│   │   ├── controllers/ (auth, student, catalog, resume, engagement)  routes/  services/  validations/  utils/
│   │   │   # utils: readiness, eligibility, completeness, recommendations, constants (status machine)
│   ├── prisma/{schema.prisma, seed.ts, migrations/}
│   ├── tests/ (readiness, auth, validation, http, engines)  Dockerfile  .env.example
├── docs/{api.md, design/{architecture.*, component-diagram.*, ui/*.png, README.md}}
├── compose.yaml  .env.example  README.md
```

---

## 5. Database

Prisma models (`backend/prisma/schema.prisma`) — v2 added only what features needed:

- `User` (role `STUDENT|ADMIN`, `notificationPrefs` JSON) → `StudentProfile` (1-1, now with contact/education/links), `Resume` (1-1) → `ResumeExperience|ResumeProject|ResumeAchievement|ResumeCertification`
- `Company` → `Drive` (now with `minCgpa/allowedBranches/allowedYears/requiredSkills`) → `Application` (unique `userId+driveId`, validated status Strings + `updatedAt`) → `ApplicationStatusHistory`
- `Notification` (per-user, `ref` dedupe), `ReadinessSnapshot` (daily trend)
- `Resource` (+`tags/company/featured`) → `ResourceBookmark`
- `CodingProblem` (samples, constraints, explanation, companies) → `CodingProgress` + `CodingAttempt`
- `AptitudeQuestion` (+`difficulty/topic`) → `QuizAttempt` (+`timeTakenSeconds/difficulty`)
- `InterviewQuestion` → `InterviewProgress`

Statuses stay validated Strings (not DB enums) deliberately: v1 rows migrate untouched and the state machine (`utils/constants.ts` + service enforcement + tests) is viva-explainable. Migrations: `20260910165333_init`, `20260911065758_v2_product_upgrade` (additive; one hand-tuned backfill default for `Application.updatedAt`).

---

## 6. Environment Setup

```bash
# root example (docker)
cp .env.example .env          # JWT_SECRET, VITE_API_URL, postgres creds

# backend local
cp backend/.env.example backend/.env   # edit DATABASE_URL, JWT_SECRET, PORT, CLIENT_URL

# frontend local
cp frontend/.env.example frontend/.env # VITE_API_URL=http://localhost:5001 (note macOS uses :5000 for AirPlay)
```

Never commit real secrets (`.env` is gitignored; only `.env.example` is tracked).

Demo credentials (seeded, local/dev only):

```text
student@placeprep.local / Student@123
admin@placeprep.local   / Admin@123
```

---

## 7. Installation

```bash
git clone <repo-url> && cd placeprep
npm install --prefix backend
npm install --prefix frontend
```

---

## 8. Running Locally (without Docker)

```bash
# 1. start postgres (docker for DB only, or any local postgres 16)
docker compose up -d postgres

# 2. backend
npm run prisma:migrate --prefix backend   # or: npx prisma migrate dev (in backend/)
npm run seed --prefix backend
PORT=5001 npm run dev --prefix backend    # :5001 avoids macOS AirPlay on :5000

# 3. frontend (new terminal)
echo 'VITE_API_URL="http://localhost:5001"' > frontend/.env
npm run dev --prefix frontend             # http://localhost:5173
```

Student flow: Register → Login → Complete Profile → Dashboard → Prepare → Drives → Apply.
Admin flow: login as admin → `/admin` → Students/Companies/Drives/Resources/Announcements.
No backend? Use **Demo as Student/Admin** on the login page (sample data, banner shown).

---

## 9. Docker Setup

```bash
docker compose up --build        # frontend :5173, backend :5001 (host), postgres :5432
docker compose logs -f backend   # backend runs: prisma migrate deploy && seed && node
docker compose down              # stop; add -v to drop pgdata
```

Verified: full stack rebuilt and E2E-tested in Docker (health, login, resume,
dashboard recs/trend, eligibility, coding/aptitude/interview, status workflow,
admin analytics, notifications, search). Frontend nginx includes SPA fallback
(`nginx.conf`), so deep links like `/dashboard` work in production.

---

## 10. API Overview

Full contract: [`docs/api.md`](docs/api.md). Base `http://localhost:5001`, envelope `{ success, data }`.

```text
POST /api/auth/register {name,email,password(8+, letter+number)} → 201 / 409
POST /api/auth/login  → 200 / 401 · GET /api/auth/me
GET  /api/dashboard   # readiness + completeness + headline + trend + recs + opportunities + activity
GET|PUT /api/students/profile   # extended: contact/education/links
GET|PUT /api/resume   POST|PUT|DELETE /api/resume/:kind[/:id]
GET  /api/drives      # + applied + eligibilityResult per drive
GET|POST /api/applications  GET|DELETE /api/applications/:id  PUT /api/applications/:id/status
GET  /api/coding/problems[/:id]  PUT .../progress  POST .../attempts  GET /api/coding/summary
GET  /api/aptitude/meta  GET /api/aptitude/questions  POST /api/aptitude/submit  GET /api/aptitude/analytics
GET  /api/interview/questions  PUT .../progress  GET /api/interview/summary
GET  /api/resources (+bookmark)  PUT /api/resources/:id/bookmark
GET  /api/notifications  PUT .../read · /read-all   GET /api/search?q=
PUT  /api/users/me  PUT /api/users/password  GET|PUT /api/users/prefs

ADMIN (403 otherwise): /api/admin/overview|students[/:id]|drives/:id,
  /api/drives/:id/applicants, POST /api/applications/bulk-status, CRUD on
  companies/drives/resources/announcements, POST /api/notifications
```

Errors: Zod → 400, dup → 409, missing → 404, no token → 401, wrong role → 403,
bad status transition → 400, auth rate limit → 429. No stacks leak to clients.

---

## 11. Testing

```bash
npm test --prefix backend    # 22 tests: readiness, auth, validation, http + engines (status machine, eligibility, completeness, recommendations)
npm test --prefix frontend   # 10 tests: format/time utils + UI primitives (badge, states, urgency, DataTable sort/paginate)
npm run build --prefix backend
npm run build --prefix frontend
```

Backend tests run without a DB (pure utils + HTTP layer). Live E2E verified twice
with curl against Docker Postgres (v1 flows + v2: resume strength, dashboard
recs/trend/snapshots, eligibility per drive, coding detail/summary, aptitude
meta/graded review with hidden answers, interview bank/summary, application
timeline + valid/invalid transitions + student-forbidden 403, admin overview
funnel/placement/readiness, notifications, search). Test mutations reverted afterwards.

---

## 12. Software Design (for viva)

- **Layered:** component → API service → REST → controller (thin) → service → Prisma → Postgres.
- **Abstraction:** pages call domain services; controllers stay thin; pure engines (`calculateReadiness`, `checkEligibility`, `profileCompleteness`/`resumeStrength`, `buildRecommendations`, status machine) are isolated + tested.
- **Modularity:** one module per concern on both sides (resume, notifications, search, interview, applications…); new code extends services, never duplicates them.
- **High cohesion:** each service/controller/page does one job; no `api.ts` god-file (split `services/index.ts` per domain; `catalog.service.ts` groups only tiny CRUD).
- **Low coupling:** frontend never imports Prisma; backend routes never embed SQL; changing the DB only touches services/prisma.
- **Maintainability:** shared UI kit + `useApi` (uniform loading/empty/error), Zod on backend + inline checks on frontend, consistent envelopes, seed + migrations documented.

**Why this way?** A course project must be explainable: REST + layered monolith + Postgres covers every requirement with the fewest moving parts. Anything heavier (microservices, Redis, GraphQL) would add ops cost without user value.

---

## 13. Figma & screenshots

Review-1 produced 6 wireframe screens (login, dashboard, profile, preparation, company, admin).
Current captures in `docs/design/ui/` match the upgraded code
(login, dashboard, profile, preparation/coding, company, admin, **resume**).
`docs/design/README.md` explains how to regenerate them. Full API contract: `docs/api.md`.

---

## 14. Contributors

- Suraj R (24BPS1131)
- Devananda P (24BDS1130)

---

## 15. Future Improvements

- Real code runner (sandboxed judge) replacing practice self-check
- Timed leaderboards, study planner, CSV analytics export
- AI interviewer / resume ATS scoring (explicitly out of scope for this upgrade)

---

## 16. Remaining Limitations (honest)

- Coding practice is self-reported (no execution); clearly labeled "Practice mode" in UI.
- No email/push — notifications are in-app only, by design.
- `?demo=` shortcut exists in production builds (docs/screenshot convenience); demo writes are blocked server-side by auth.
- macOS occupies port 5000 (AirPlay); host backend port is `5001` (container still `:5000`).
- Analytics loops are in-memory over college-scale rows (documented, no Redis introduced).

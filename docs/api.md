# PlacePrep API Contract

Base URL: `http://localhost:5001` (local Mac) · `http://localhost:5000` (Docker network host port is `5001` on macOS — see README).
All responses use `{ "success": true, "data": ... }` or `{ "success": false, "message": ... }`.

Auth: `Authorization: Bearer <jwt>` on every `/api/*` route except `/api/auth/*` and `/health`.

| Code | Meaning |
|---|---|
| 200/201 | Success (201 on create) |
| 400 | Zod validation / bad transition / business rule |
| 401 | Missing or invalid JWT |
| 403 | Valid JWT but wrong role |
| 404 | Record or route not found |
| 409 | Duplicate (email, application, bookmark) |
| 429 | Auth rate limit (60 req / 15 min per IP) |

Statuses (`Application.status`, validated Strings, not DB enums so v1 rows keep working):
`APPLIED → SHORTLISTED → ONLINE_ASSESSMENT → INTERVIEW → SELECTED`, plus `REJECTED`, `WITHDRAWN`.
Allowed transitions are enforced in `application.service.setStatus`; every change writes
`ApplicationStatusHistory` and notifies the student (preference-aware).

---

## Authentication

```http
POST /api/auth/register   {name, email, password(min 8, letter+number)} → 201 {user, token}
POST /api/auth/login      {email, password} → 200 {user, token} / 401
GET  /api/auth/me         → 200 {…user, profile}
```

## Student

```http
GET  /api/students/profile   PUT /api/students/profile
# profile: cgpa, branch, year, skills[], phone, resumeHeadline, location,
# college, degree, graduationYear, github, linkedin, portfolio

GET  /api/dashboard
# → { user, profile, readiness{score,grade,breakdown,weakAreas,strongest,weakest},
#     completeness{score,missing,sections}, headline, trend{points,previousScore,change},
#     stats, recommendations[≤5], opportunities[{…drive, eligibilityResult, applied, urgency}],
#     activity[≤6], applications[≤5], announcements, recentAttempts }
# Side effects: upserts today's ReadinessSnapshot; emits DRIVE_DEADLINE reminders (deduped).
```

## Resume (`/api/resume*`, owner-scoped)

```http
GET  /api/resume            → { user, profile, resume{experiences,projects,achievements,certifications}, strength{score,suggestions} }
PUT  /api/resume            {summary}
POST /api/resume/:kind      kind=experience|project|achievement|certification → 201 {id}
PUT  /api/resume/:kind/:id
DELETE /api/resume/:kind/:id
```

## Recruitment

```http
GET  /api/companies  (?search)        GET /api/companies/:id  (+relevantProblems, interviewQuestions, resources)
GET  /api/drives (?status)            # each item: {…drive, applied, eligibilityResult{eligible,reasons}}
GET  /api/drives/:id
GET  /api/applications                # own, newest first
POST /api/applications        {driveId} → 201 / 409 already applied / 400 closed
GET  /api/applications/:id            # + history timeline
DELETE /api/applications/:id          # withdraw = WITHDRAWN + history (terminal apps blocked)
PUT  /api/applications/:id/status {status, note?}
# student: WITHDRAWN only · admin: any valid transition
```

## Preparation

```http
GET  /api/coding/problems (?difficulty&search&tag)   # + solved/bookmarked flags
GET  /api/coding/problems/:id                        # full statement, samples, explanation, attempts, relevant
PUT  /api/coding/problems/:id/progress   {solved?, bookmarked?}
POST /api/coding/problems/:id/attempts   {verdict: SOLVED|ATTEMPTED, note?}  # practice self-check, no code runner
GET  /api/coding/summary                             # byDifficulty, tags, weakestTag, recentAttempts

GET  /api/aptitude/meta                              # categories/difficulties/topics + counts
GET  /api/aptitude/questions (?category&difficulty&topic&take≤50)  # answers + explanations hidden
POST /api/aptitude/submit   {answers[{questionId,selectedIndex}], timeTakenSeconds?, difficulty?}
# → {score,total,percentage,correct,incorrect,unanswered,timeTakenSeconds,topics[],review[]}
# review includes correct answers + explanations (only after submit) and records QuizAttempt
GET  /api/aptitude/attempts   GET /api/aptitude/analytics  # average/best/byCategory/trend

GET  /api/interview/categories
GET  /api/interview/questions (?category&difficulty&search)  # + myStatus
PUT  /api/interview/questions/:id/progress  {status: PRACTICED|CONFIDENT}
GET  /api/interview/summary   # pct, per-category, weakestCategory
```

## Resources / announcements / notifications / search / settings

```http
GET  /api/resources (?category&search&level&tag&featured&company&bookmarked)  # + bookmarked flags
PUT  /api/resources/:id/bookmark   → {resourceId, bookmarked}
GET  /api/announcements
GET  /api/notifications (?unread=true) → {items, unread}
PUT  /api/notifications/:id/read   PUT /api/notifications/read-all
GET  /api/search?q=... (min 2 chars) → {companies, drives(+applied), problems, resources, interview, announcements}
PUT  /api/users/me            {name}
PUT  /api/users/password      {currentPassword, newPassword}
GET  /api/users/prefs         PUT /api/users/prefs   # notifyDeadlines/Status/Announcements/Preparation
```

## Admin (`ADMIN` only, else 403)

```http
GET  /api/admin/overview
# students, companies, openDrives, applications, resources, announcements, avgCgpa, byBranch,
# avgReadiness, readinessDistribution[4], applicationsByStatus, applicationsByCompany,
# placed, placementRate, codingSolved, aptitudeAvg
GET  /api/admin/students (?search&branch&minCgpa)
GET  /api/admin/students/:id      # 360° read-only: readiness, completeness, resumeStrength, stats, applications, attempts
GET  /api/admin/drives/:id        # funnel, totalApplicants, applicants[]
GET  /api/drives/:id/applicants (?search&branch&minCgpa&status)
POST /api/applications/bulk-status  {ids[≤100], status, note?} → {updated, skipped}
POST|PUT|DELETE  /api/companies /api/drives /api/resources /api/announcements
# drive payload adds: minCgpa, allowedBranches[], allowedYears[], requiredSkills[]
# resource payload adds: tags[], company, featured
# announcement creation fans out ANNOUNCEMENT notifications to students (preference-aware)
POST /api/notifications  {userId, title, message, link?}   # manual SYSTEM notice
```

## Worked examples

```bash
TOKEN=...  # from POST /api/auth/login

# eligibility-aware drives
curl -H "Authorization: Bearer $TOKEN" localhost:5001/api/drives | head -c 300

# timed quiz submit
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:5001/api/aptitude/submit \
  -d '{"answers":[{"questionId":"...","selectedIndex":1}],"timeTakenSeconds":300}'

# admin moves applicant forward (notifies student)
curl -X PUT -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  localhost:5001/api/applications/<id>/status -d '{"status":"SHORTLISTED"}'
```

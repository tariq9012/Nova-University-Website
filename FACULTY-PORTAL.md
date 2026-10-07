# Phase 6 faculty portal

The existing application, public directory, authentication, student portal and academic entities are retained. Teaching authority is `users → faculty_profiles → course_sections.instructor_id`. No duplicate faculty or assignment model was introduced.

## Setup

Preserve `.env`, install with `npm ci`, run `npm run db:migrate`, then typecheck/lint/tests/build. Migration 0008 is additive; never edit applied migrations or reset the database.

Optional sample setup requires a loopback `AUTH_ORIGIN`, `AUTH_ALLOW_DEV_ACCOUNTS=true` and `ALLOW_DEV_SEED=true`:

```sh
npm run db:seed:auth
npm run db:seed:student
npm run db:seed:faculty
```

Faculty/student A retain their original accounts. Faculty/student B use `faculty2.dev@nova.example` and `student2.dev@nova.example` with a separate sample section. Newly generated random passwords are written only to `.auth-dev/accounts.json` (`facultyB`/`studentB`). Existing users/passwords are never overwritten. The ZIP excludes all credentials. If accounts already exist and the local password file is missing, use the private recovery CLI in `AUTHENTICATION.md`; rerunning seed does not reset passwords. Faculty B links an existing unclaimed active profile; missing prerequisites cause an explicit setup error rather than a duplicate faculty profile.

## Pages and API

`/portal/faculty` includes dashboard, profile, courses, students, attendance, assignments, submissions, exams, grades, timetable, announcements, notifications and settings. Owned course, student, class, assessment, submission, announcement and final-grade detail pages are available. Assignments, exams and announcements have `/new` forms.

Public `/api/v1/faculty` and `/api/v1/faculty/[slug]` retain their existing directory behavior. **Private teaching endpoints use `/api/v1/faculty-portal/*`** to avoid a routing conflict.

| Method | Private suffix | Function |
|---|---|---|
| GET | dashboard, profile, settings, sections | Own overview, identity, safe session records and section choices |
| GET | courses, students, attendance, assignments, submissions, exams, grades, timetable, announcements, notifications | Paginated owned records |
| GET | courses/:id, students/:id, attendance/:id, assignments/:id, submissions/:id, exams/:id, grades/:id, announcements/:id | Owned detail |
| GET | attendance-summary | Course ratios, paginated student summaries and configured alerts |
| POST | assignments, exams, announcements | Create in an assigned section |
| PATCH | assignments/:id, exams/:id, announcements/:id | Version-checked edit/publication |
| POST | attendance | Atomic selected-student batch, 1–100 rows |
| PATCH | submissions/:id | Draft/publish assignment marks and feedback |
| POST | exams/:examId/grades/:enrollmentId | Draft/publish exam marks and feedback |
| PATCH | grades/:enrollmentId | Draft/publish final course grade |
| PATCH | profile, settings | Personal contact/office hours and preferences |
| PATCH | notifications/:id, notifications/read-all | Owned read state |
| POST | sessions/revoke-others | Audited session invalidation |
| GET | submissions/:id/download | Ownership/file checks, then unconfigured storage boundary |

Filters: page, search, semester, course, section, assignment, status (pending/graded/late), week (valid YYYY-MM-DD). Pages contain 20 rows. Section and recent-assignment choices are bounded at 250. Course detail IDs are section IDs; student IDs are profile IDs; attendance IDs are class-session IDs; final-grade IDs are enrollment IDs.

## Security and academic rules

Every private operation checks session, active account, faculty role, active faculty profile and assigned section/resource. IDs choose a resource; they do not grant authority. Student finances/documents/applications and unrelated grades are excluded. Admin is not an implicit faculty bypass; existing admin user management is separate.

Writes use strict Zod schemas, same-origin validation, bounded JSON, shared account rate limits (60/minute), optimistic versions and safe errors. Private routes are no-store/noindex. Login/logout/password handling reuse existing authentication. Faculty profile queries are cached only within a request.

Academic writes lock the authoritative section and repeat ownership inside the write. Student submission takes a compatible share lock. Future registrar assignment/enrollment writers must follow this protocol. Notifications, grading history and audit records share the academic transaction.

Attendance validates the full selected batch before writing; a mixed invalid/valid batch writes nothing. Unselected students remain unchanged. Only completed, non-cancelled classes are markable. Ratios use present/(present+absent); excused/future/cancelled classes are excluded. Alert threshold is an optional preference, not a university policy.

Assignment content, maximum marks, format and late policy lock after submissions exist. Faculty can extend deadlines and close/reopen submission. No delete endpoint exists. Publication timestamps come from the server. Form dates are UTC; displayed times use the saved faculty timezone.

Assessment drafts never overwrite published marks/feedback. Published edits record actor, time, previous/new values and reason. Submission content and storage keys are excluded from grade-history snapshots. Students see only published values.

Final grades must belong to the student's assigned grading policy. Raw assessment totals do not imply weights or automatic letter-grade conversion. Publishing a final grade completes the enrollment and enables existing GPA eligibility rules. Subsequent corrections remain versioned and audited.

Exam schedules must fit the semester and cannot overlap a non-cancelled exam in the same section. Existing results lock maximum marks, type, start and duration. Legacy maximum marks remain null until configured; no maximum is invented. Cross-section room allocation is a future central scheduling responsibility.

Announcements target assigned sections only, support draft/publication/expiry, notify enrolled students, and disappear from student course resources after expiry. Faculty cannot publish university-wide content. Profile editing allows phone and office hours only.

## Integrations and tests

Private storage remains unconfigured through `PrivateStudentStorage` in `lib/server/student-integrations.ts`. Future adapters must validate/scan uploads, keep objects private and deliver short-lived authorized downloads. No upload/download success is faked. Email preferences are saved; notification email delivery is not configured. Existing recovery/verification delivery contracts are documented in `AUTHENTICATION.md`.

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run test:database:faculty
npm run test:integration:faculty
npm run test:integration:student
npm run test:integration
npm run test:integration:cms
node tests/migrations.mjs
node tests/student-migrations.mjs
node tests/faculty-migrations.mjs
node tests/faculty-sql.mjs
node tests/browser/faculty.mjs
```

Integration/browser tests need a running production build with matching `TEST_BASE_URL` and `AUTH_ORIGIN` plus sample prerequisites. Database snapshot tests must run without concurrent mutation/browser tests. PGlite and Playwright are optional QA dependencies; `PGLITE_MODULE`, `PLAYWRIGHT_MODULE`, `CHROMIUM_EXECUTABLE` can point to installed tools. SQL planning tests use EXPLAIN without executing writes. HTTP integration creates/removes isolated fixtures; browser grading creates/removes its own assessment. Current example semester dates are in 2026; future QA must update fixtures instead of weakening production policy.

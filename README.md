# Nova University — Phase 6

Existing Next.js 16, React 19, TypeScript, Tailwind, Drizzle and Neon PostgreSQL project. Phases 4–6 add secure authentication, private applications, student academic services and the faculty teaching workspace while preserving the public university systems.

## Update and run

Keep a backup of your existing `.env`. The downloadable archive intentionally excludes credentials, dependencies and build output.

Use Node.js 22 LTS or newer. npm is the supported package manager; the committed npm lockfile is authoritative.

```sh
npm ci
```

Copy `.env.example` to `.env` only if you do not already have one. Set `DATABASE_URL` to your Neon PostgreSQL URL and `NEXT_PUBLIC_SITE_URL` to your site origin.

```sh
npm run db:migrate
npm run db:seed
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

Open http://localhost:3000. For production mode, run `npm run start` after building.

`db:migrate` applies the existing Drizzle SQL journal over Neon HTTP. It uses an advisory lock, checks recorded checksums, and applies pending migrations atomically. `db:generate` still uses Drizzle Kit; only run it when intentionally changing the schema. Never edit a migration that has already been applied.

`db:seed` is for development. It runs the academic and CMS development seeds in separate atomic transactions, preserves existing values, skips existing records and can be rerun. The default seed does not create login accounts; development accounts use the separate opt-in `db:seed:auth` command. Do not treat sample names, curricula or dates as an approved university prospectus.

## Academic features

- Database-backed school, department, program, course and faculty listings/details.
- Server-side search, filters, sorting and pagination.
- Program campus, admission requirements, optional deadline/tuition, outcomes, careers, faculty and related programs.
- Course prerequisites, learning outcomes, topics, teaching faculty and containing programs.
- Semester curriculum with real credit totals and course-type labels. A notice appears if published credits differ from the degree requirement.
- Program comparison for up to three programs; mobile uses a stacked layout.
- Calendar year, semester, category and date-range filters.
- Global academic search with one shared pagination sequence across seven categories (including news and events).
- Dynamic metadata, database-derived sitemap, loading/error/empty/not-found states.

The seed contains 5 schools, 15 departments, 21 programs, 27 courses, 5 faculty profiles and 8 example calendar events. The provided curriculum remains a partial sample: the system correctly shows its actual published credits rather than inventing a full degree plan. Official fees, deadlines, photos, publications and approved entry requirements must be supplied by the university. Phase 3 admissions examples are explicitly marked Development sample. Faculty photo rendering and publications are supported without fabricating records.

## Verify locally

Check `/api/health` for database connectivity. Browse `/academics/programs`, use filters and pagination, open BS Computer Science, compare it with MS Computer Science, inspect a course’s prerequisites, and search across categories.

With the app running and development seed installed:

```sh
npm run test:integration
```

The integration suite uses `http://127.0.0.1:3000` by default. Set `TEST_BASE_URL` if you use another port. These tests read data and assume the included development seed. They do not create or remove database records.

See `PHASE-2-REPORT.md` for checks, schema/API details, limitations and the exact changed-file list.

## Phase 3 admissions and publishing

- `/admissions`: overview, seven-step process, degree-level guides, international guidance and FAQ.
- `/admissions/requirements`, `/admissions/deadlines`, `/admissions/fees`: scoped database records, filters and pagination. Deadline status uses UTC calendar days; closing dates are inclusive.
- `/admissions/scholarships`: searchable/filterable funding listings and details.
- `/admissions/apply`: public program/intake planner with links into the authenticated application workflow.
- `/news`, `/events`, `/announcements`: database listings/details, filters, pagination, publication controls, SEO and sitemap integration.
- CMS management APIs now require a verified admin; private applications require authenticated ownership. Student, faculty and admin portals are available.

Public publishing requires `status=published` and a non-future `published_at`. Announcements must also be unexpired and addressed to `everyone` or `applicants`; student/faculty/staff notices stay private. Scholarships must be active. Public pages, APIs, search, related content and sitemap use the same visibility predicates.

Content body blocks are typed text, headings, lists and quotes. Raw HTML is not rendered. Optional images and registration URLs use HTTP(S) validation; failed article images have an accessible fallback.

School, department and degree filters narrow global search to academic records; news/events do not have academic scope relations. Sample results are identified in search.

Additional checks (development database and seed required):

```sh
npm run test:integration:cms
npm run test:database:cms
```

The database check reruns the additive development CMS seed and compares all rows before/after. It is a development check, not a production health endpoint. `npm run db:seed:cms` can seed only Phase 3 examples.

## Phase 4 authentication and portals

Read `AUTHENTICATION.md` for configuration, development credentials, email integration, API access rules and security boundaries. Public registration always creates a student account; it never grants admin/faculty roles.

Local setup: preserve `.env`, add `AUTH_ORIGIN=http://localhost:3000`, and enable `ALLOW_DEV_SEED=true` plus `AUTH_ALLOW_DEV_ACCOUNTS=true` only for local development. Then run:

```sh
npm run db:migrate
npm run db:seed:auth
npm run build
npm run dev
```

Open `.auth-dev/accounts.json` locally for the generated student/faculty/admin development passwords. This private file is intentionally excluded from the ZIP. If accounts already exist and the file is missing, use the documented `auth:dev-token` recovery command; seeding never replaces existing passwords.

- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- `/portal/student`: profile, applications, notifications and settings.
- `/portal/faculty`: profile, notifications and settings.
- `/admin`: profile, settings and user management.
- Student applications: create, save draft, continue, review, submit and view status/history. Verification is required before submission.

Email delivery and private document storage are not configured. Recovery/verification has a private local CLI testing mechanism and a documented HTTPS gateway contract. Document uploads explicitly return service unavailable after ownership checks; form submission is real and does not pretend files were uploaded.

With the server running and development accounts created:

```sh
npm run test:integration:auth
npm run test:database:auth
npm run test:integration:auth:recovery
```

`TEST_BASE_URL` must match the server's `AUTH_ORIGIN` (the default integration URL is `http://127.0.0.1:3000`; set both accordingly if using it). The authentication integration suite creates/removes its own test user, exercises application ownership/recovery, and temporarily suspends/reactivates its own temporary applicant. Run it against a development database, separate from interactive use of those test accounts. The database suite repeats the non-overwriting development seed. See `tests/browser/README.md` for reproducible browser checks. A fresh isolated PostgreSQL-compatible migration check is available as `node tests/migrations.mjs` with the optional `@electric-sql/pglite` QA package installed (or `PGLITE_MODULE` pointing to its ES module). It never connects to or resets Neon.

## Next phase

Phase 7 expands the complete admin/CMS and explicitly authorized registrar workflows. Real email delivery, approved institutional content and any private file-storage integration must be configured before live operations. See `PHASE-4-REPORT.md` for the exact changed files and verification results.

Run database seed-idempotency suites separately from interactive login, browser tests and API mutation suites: their full-row snapshots intentionally detect any concurrent account/application changes. The focused recovery suite creates a random temporary account and restricts all password/status changes to that account; it removes the fixture afterwards.

## Phase 5 — Student portal

The authenticated student information system extends the Phase 4 portal without replacing authentication or public routes. It includes owned academic records, courses, timetable, attendance, assignment submissions, exams, published grades, configurable GPA/CGPA, an unofficial print transcript, curriculum progress, fee/payment ledgers, private document metadata, notifications, preferences and session revocation.

Run `npm run db:migrate` for additive migration 0007. See [STUDENT-PORTAL.md](STUDENT-PORTAL.md) for API contracts, grading/attendance assumptions, the opt-in sample seed, test commands and the deliberately closed registration, storage, payment and certified-transcript integration boundaries. See [PHASE-5-REPORT.md](PHASE-5-REPORT.md) for verified results and the exact changed-file manifest.

## Phase 6 — Faculty teaching workspace

Assigned courses/students, attendance, assignments/submissions, exams, draft/published grades with history, section announcements, notifications and settings now extend the existing portal. See [FACULTY-PORTAL.md](FACULTY-PORTAL.md) for setup, sample credentials, API contracts and integration limits. Private APIs use `/api/v1/faculty-portal/*`; the public faculty directory remains unchanged. See [PHASE-6-REPORT.md](PHASE-6-REPORT.md) for results and exact changed files.

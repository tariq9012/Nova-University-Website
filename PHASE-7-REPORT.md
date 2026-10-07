# Phase 7 Report — Admin Portal & University Management

Built on the Phase-6 codebase. **Verification status is explicit throughout: PASS = actually executed and passed, FAIL = executed and failed, NOT RUN = not possible in the build sandbox (no network, no `node_modules`, no Neon, no browser).**

> **Important:** the code below has never been compiled, linted, built, migrated or exercised against a database. Run the local verification commands in section 22 before merging. Expect to fix some TypeScript/SQL errors on first typecheck/integration run.

## 1. Implementation summary
| Area | Status | Where |
|---|---|---|
| Permission + audit foundation | Implemented | `db/admin-schema.ts`, `drizzle/0009_phase7_admin.sql`, `lib/permissions.ts`, `lib/server/admin-auth.ts` |
| Dashboard (real aggregates, permission-filtered) | Implemented | `app/admin/page.tsx`, `db/queries/admin-dashboard.ts` |
| Users: list/detail/status/session revocation | Implemented | `app/admin/users/**`, `db/queries/admin-users.ts`, `accounts.ts` |
| Schools, departments, programs, courses, semesters, sections | Implemented (create/edit/archive/restore) | generic engine `lib/admin/resources.ts` + `db/queries/admin-resources.ts` |
| Curriculum + prerequisites (duplicate + cycle protection) | Implemented | `db/queries/admin-curriculum.ts` |
| Students / faculty lists + detail (10 student tabs) | Implemented (read-only) | `db/queries/admin-lists.ts`, `admin-people.ts` |
| Enrollments, attendance (aggregate only), assignments, submissions, exams (room-conflict flag) | Implemented (read-only oversight) | `admin-lists.ts` |
| Grades list + **audited correction** with history | Implemented | `admin-grades.ts`, `app/admin/grades/[id]` |
| Applications list/detail, workflow via existing transition map | Implemented | `app/admin/applications/[id]`, existing `/api/v1/applications/[id]/status` |
| Admissions (intakes, deadlines, requirements), fee structures | Implemented (CRUD/archive) | resources `intakes/deadlines/requirements/fees` |
| Scholarships, news, events, announcements CMS + bulk publish/archive | Implemented, reusing existing `/api/v1/manage/*` | `components/admin-cms*.tsx`, `db/queries/admin-cms.ts` |
| Invoices, payments | **Read-only lists only** | `admin-lists.ts` |
| Notifications (user/students/faculty/applicants/everyone, dedupe) | Implemented, in-app only | `admin-notifications.ts` |
| Audit-log viewer with actor/action/entity/date filters | Implemented, read-only | `admin-audit.ts` |
| Settings: permission overrides, integration status | Implemented | `app/admin/settings/page.tsx`, `admin-permissions.ts` |

## 2. Architecture changes
* **Permissions extend the existing RBAC** (`roles`, `user_roles`): new `permissions`, `role_permissions`, `user_permission_overrides` (allow/deny; deny wins; `*.manage` implies `*.view`). Roles `admin` and `super_admin` receive all 18 permissions by migration, so existing admins keep working.
* Guards: `requireAdminPermission(p)` (APIs: authenticated → active account [session query] → `admin` role → verified email → permission) and `adminPage(p?)` (pages). Permissions are recomputed server-side from the session user; nothing comes from the client. The existing `proxy.ts` still gates `/admin/*` by role.
* Existing callers moved from role-only to permissions: users API (`users.view/manage`), application status (`applications.manage`), CMS management (`cms.manage`).
* Admin CRUD is **declarative** (`lib/admin/resources.ts`), so validation, archive rules and audit are uniform. Only values are bound parameters; identifiers come from trusted config.
* Neon-HTTP has no interactive transactions, so each mutation is a **single SQL statement** (CTE: guard → change → audit insert), which is atomic. Where existing code used `db.batch`, that is kept.

## 3–4. Database & migrations
`drizzle/0009_phase7_admin.sql` (additive; snapshot + journal updated, previous migrations untouched):
* new tables `permissions`, `role_permissions`, `user_permission_overrides`;
* `semesters.status` check widened to include `archived` (no row changes);
* seeds the 18 permission keys and grants them to `admin`/`super_admin` (`ON CONFLICT DO NOTHING`);
* **audit immutability**: trigger `audit_logs_guard` blocks UPDATE/DELETE/TRUNCATE. The only allowed update is the FK `ON DELETE SET NULL` on `actor_user_id`. A controlled maintenance operation may set `nova.audit_maintenance='on'` in-session (documented as a separate system operation; never exposed by the application).
* The hand-written snapshot `0009_snapshot.json` was generated from `0008` by script; run `npx drizzle-kit generate` locally to confirm it reports **no diff**.

## 5. Permission model
Keys: users, students, faculty, academics, grades, applications, cms, finance, audit `.view` / `.manage` (+ `settings.manage`). Per-admin exceptions via Settings → overrides (requires `settings.manage`, reason, audited, cannot target yourself).

## 6. Audit model
`audit_logs` reused. Every admin mutation writes an `admin.*` row in the same statement as the change (actor, action, entity, entity id, metadata incl. reason/before/after). Grade corrections additionally write `grade_history` (previous/new/reason/actor/time). Append-only enforced in DB and no application code updates/deletes it (static test).

## 7. Security model
Server-side authorization on every route; same-origin check + rate limit on every mutation; strict zod schemas (unknown keys such as `role`, `userId` rejected); reasons required for archive, session revocation, deactivate/suspend, grade correction, curriculum removal, bulk actions, permission changes; admin cannot change own status/sessions/permissions; last active admin cannot be disabled (existing advisory-lock guard); credential/token columns are never selected; all admin pages `noindex` (layout + robots + proxy headers); no hard delete of academic entities (archive/restore only); no bulk delete.

## 8. API routes (new, all under `/api/v1/admin`)
`GET|POST resources/[resource]`, `GET|PUT|POST resources/[resource]/[id]` (POST = archive/restore), `GET|POST curriculum/[programId]`, `POST grades/[id]`, `POST cms` (bulk publish/archive), `POST notifications`, `GET|POST permissions`, `POST users/[id]/sessions`. Changed: `users`, `users/[id]` (reason, rate limit), `applications/[id]/status` (reason required for reject/withdraw).

## 9. Seed
`db/seed-admin.ts` (`npm run db:seed:admin`) re-syncs the permission catalogue/grants idempotently (`ON CONFLICT DO NOTHING`); it never touches users, credentials or content. Sample data comes from the existing Phase 1–6 seeds; no new sample rows were added.

## 10. Exact changed files
See `PHASE-7-CHANGED-FILES.txt` in the ZIP root (16 modified, ~44 new).

## 11. Tests actually executed
Executed with Node's built-in type stripping on copies of the pure modules (the project's own runner `tsx` is not installed here):
| Test file | Result |
|---|---|
| `tests/admin-permissions.test.ts` (5 tests) | **PASS** |
| `tests/admin-cms.test.ts` (6 tests) | **PASS** |
| `tests/admin-security.test.ts` (11 static invariant tests over the source tree) | **PASS** |
| Node `--check` syntax check of all new `.ts` files | **PASS** |
| Crude bracket-balance check of new `.tsx` files | no imbalance found (not a substitute for typecheck) |

## 12. NOT RUN — environment limitation
TypeScript typecheck · ESLint · production build · existing unit tests (`npm test`) · integration/DB tests · migration test on fresh DB and on an existing Phase-6 DB · seed idempotency · RBAC/permission tests against a live DB · CMS publication tests · application workflow tests · grade-correction tests · financial data access tests · student and faculty regression tests · responsive/browser tests (320–1440px) · accessibility checks · data-preservation test · Neon verification · ZIP install/build check.

## 13. Preserved
No Phase 1–6 file was deleted or rewritten except: `components/portal-shell.tsx` (admin nav now permission-filtered; student/faculty nav unchanged), `lib/server/cms-auth.ts`, `db/queries/{accounts,applications,cms-management}.ts` (guards moved to permissions; CMS save now records `cms.published` vs `cms.saved`), `db/index.ts`, `drizzle.config.ts`, `db/student-schema.ts` (semester check text only), `package.json` (two scripts). Student/faculty portals, public pages, sessions and authentication were not modified.

## 14. V0 verification
Repository scan for `v0.dev`, `__v0`, `.v0`, `@v0`, `v0-` outside `node_modules`/lockfile: **no matches**. Historical mentions exist only in `PHASE-4/5/6-REPORT.md` (acceptable).

## 15. Unconfigured integrations (nothing is faked)
* **Email delivery** — notifications are in-app only. To activate: integrate a transactional email provider behind the existing recovery-email boundary and set its credentials.
* **Payment gateway** — none exists; `/admin/payments` shows recorded bookkeeping rows only; invoices cannot be created or paid from the portal.
* **Private file storage** — application/student document contents are not served; only metadata is shown.

## 16. Remaining limitations (honest list) — superseded in part by Phase 7.1 below; items 2–7 have since been implemented
1. Not compiled or run — first `typecheck` will likely surface errors (Next 16.3 specifics were not verifiable; existing code patterns were followed).
2. **Invoice/payment creation and financial corrections are not implemented** (read-only). Fee structures are editable.
3. **Attendance corrections, exam scheduling edits, assignment edits** are not implemented in admin (oversight only, by design for faculty-owned content; attendance correction UI absent).
4. Student/faculty records are viewable, not editable (no profile edit, no faculty assignment change beyond section `instructor` via Sections form).
5. Section **room/schedule** are not editable (they live in `class_sessions`).
6. Admin role assignment/changes UI is not implemented (roles remain seeded/controlled).
7. Enrollment changes (enroll/withdraw) not implemented in admin.
8. Dashboard "applications over time", "attendance overview" charts not included; charts are simple bar lists.
9. CMS content editor is a structured plain-text editor, not WYSIWYG; images are URL fields (no upload).
10. Scheduled announcements rely on `published_at` in the future being honoured by the existing public queries (not re-verified).
11. Student detail "Transcript" is presented through the Grades tab; "Notifications" tab intentionally omitted (private to the student).
12. Bulk actions: CMS publish/archive only (page-scoped).

## 17. Public/student/faculty regression review (static only)
Public queries and student/faculty routes were not edited. Risks to check at runtime: admin CMS saves now require `cms.manage` (granted to admin by default); application list access for admins now requires `applications.view`.

## 18–21. Recommended Phase 8
Run/repair verification; invoice + payment ledger with gateway boundary; attendance/enrollment corrections with audit; admin role management with step-up auth; email delivery + document storage; WYSIWYG CMS + uploads; analytics over time; browser E2E suite.

## 22. Local verification commands (from `package.json`)
```
npm ci
npx tsc --noEmit            # npm run typecheck
npm run lint
npm run build
npm test                    # existing unit tests
npm run test:admin          # new admin unit + static security tests
npx drizzle-kit generate    # must report "No schema changes"
npm run db:migrate          # applies 0009 (Neon)
npm run db:seed:admin
npm run test:integration && npm run test:integration:cms && npm run test:integration:auth && npm run test:integration:student
npm run test:database:cms && npm run test:database:auth
# migration tests (PGlite): node tests/migrations.mjs ; node tests/student-migrations.mjs ; node tests/faculty-migrations.mjs
# browser/responsive: see tests/browser (existing Playwright fixtures) — extend with /admin at 320–1440px
```
Environment variables are unchanged (`.env.example`); no new variables were added.


---

## Phase 7.1 Final Completion Pass

Environment during this pass: still **no network, no `node_modules`, no Neon, no browser** (`npm ping` fails; registry returns HTTP 403). Everything below is implemented and statically validated only, unless marked PASS.

### Newly implemented
| Requirement | Implementation |
|---|---|
| 1 Role management | `/admin/users/[id]`: current roles, effective permissions, add/remove role. `db/queries/admin-roles.ts`, `POST /api/v1/admin/users/[id]/roles`. Never on yourself; `admin`/`super_admin` changes need `settings.manage` plus typed-email confirmation; last active admin cannot lose `admin` (advisory lock + guard); a user always keeps ≥1 role; granting admin needs an active verified target; sessions revoked and `auth_version` bumped; reason required; audited in the same statement. |
| 2 Enrollments | `/admin/enrollments` (existing filters) + enroll form + `/admin/enrollments/[id]` withdraw. Enroll checks: active student (by student number), open section of an active course in an upcoming/active semester, capacity (section row locked), no duplicate (withdrawn rows may be re-enrolled), course in the student's program curriculum when the program has one. Withdraw: reason, only enrolled/in-progress, blocked after a published final grade or semester close. Audited + student notified. |
| 3 Attendance corrections | `/admin/attendance/[sectionId]`: select an existing record; section↔session↔enrollment pairing verified in SQL; old/new/reason/actor in audit. Existing records only (no creation). Faculty marking untouched. |
| 4 Exams | Create/edit/archive (cancel)/restore at `/admin/exams/new`, `/admin/exams/[id]`. End>start, inside an upcoming/active semester, section/room/instructor overlap check, optimistic `version`, locked structure once results exist, reason required to change a published exam, students notified. |
| 5 Assignments | Create/edit/archive (close)/restore. Faculty ownership kept (instructor unchanged). With submissions: content, marks, mode and late policy are locked, deadline can only be extended; submissions never deleted. Reason required for published edits. |
| 6 Schedule | `/admin/sessions` (+new/[id]) over existing `class_sessions` (room, building, start/end; weekday derived). Section, room and instructor conflicts checked; cancel/restore instead of delete. Linked from Sections. |
| 7 Student profile | Editable on `/admin/students/[id]` (overview): name, phone, program, enrollment year, academic status. Email/password/sessions/history not editable. Address and emergency contact do not exist in the schema, so are not offered. Before/after audited with reason. |
| 8 Faculty profile | Editable on `/admin/faculty/[id]`: name, title, position, office, hours, public email, bio, research areas, department (school follows), active flag. Deactivation blocked while teaching open sections in upcoming/active semesters. |
| 9 Instructor assignment | Sections page: assign/reassign/unassign with active + same-school + no-session-overlap validation; previous/new faculty, reason, actor audited. |
| 10 Invoices | `/admin/invoices/new`, `/admin/invoices/[id]`: create (draft), edit draft, issue (student notified), cancel (reason; blocked if any non-failed payment). Issued/paid invoices immutable. Reference unique (DB), generated when blank. Drafts hidden from the student portal and from dashboard totals. |
| 11 Payments | Still view-only. Gateway banner on invoices, payments and settings. The portal never inserts/updates payments (static test). No second payment abstraction created; the existing `studentPaymentGateway()` is untouched. |
| 12 Applications | Reviewed: search/filters, detail, valid transitions, reason required to reject/withdraw (also enforced in the API), history, audit. No separate "review notes" table exists; the status note is the review note. |
| 13 Analytics | Added students by department, applications per month (12 mo), attendance by status, scholarships by state. Empty states shown when no data. |
| 14 CMS | Reviewed public queries: `status='published' AND published_at<=now()` hides drafts/scheduled; announcements also require unexpired; bulk publish/archive requires `cms.manage`; every publish/archive is audited. URL images only. |
| 15 Navigation | Permission-filtered; added Curriculum (→ programs, where curriculum is managed) and Schedule. Server authorization unchanged and mandatory. |

### Database / migration
`drizzle/0010_phase71_invoice_draft.sql` (additive): `student_invoices.is_draft boolean NOT NULL DEFAULT false` (existing rows stay "issued"). Snapshot `0010_snapshot.json` (hand-generated from 0009) and journal updated; `db/student-schema.ts` updated. Migrations 0001–0009 byte-identical to their previous versions (PASS, file comparison against the Phase-6 zip for 0001–0008; 0009 unchanged since Phase 7).

### New API routes
`POST /api/v1/admin/operations/[op]` — `enroll`, `attendance-correction`, `exam-create`, `assignment-create`, `session-create`, `instructor-assign`, `invoice-create`.
`POST /api/v1/admin/operations/[op]/[id]` — `enrollment-withdraw`, `exam-update`, `exam-state`, `assignment-update`, `assignment-state`, `session-update`, `session-state`, `student-profile`, `faculty-profile`, `invoice-update`, `invoice-action`.
`POST /api/v1/admin/users/[id]/roles`.
Each operation maps to a fixed permission in `lib/admin/op-registry.ts` (route guard) and re-checks inside the query layer. All use same-origin + rate limit + strict zod schemas (unknown keys such as fake `userId`, `role`, `actorId`, `permissions` are rejected).

### Security changes
Strict schemas everywhere; client identity never read; ownership pairing verified in SQL (attendance, exams, assignments, sessions); optimistic versions on exams/assignments; reasons on sensitive changes; `audit_logs` still append-only (DB trigger + no application path; static test).

### Tests actually executed (Node type stripping; project runner unavailable)
| Suite | Result |
|---|---|
| `tests/admin-permissions.test.ts` (5) | PASS |
| `tests/admin-cms.test.ts` (6) | PASS |
| `tests/admin-rules.test.ts` (7: overlap, exact money parsing, invoice lines/state/immutability, privileged roles, capacity) | PASS |
| `tests/admin-security.test.ts` (19 static invariants incl. every 7.1 mutator authorizes-before-validating and audits, strict schemas, registry↔route coverage, migration 0010 additive, drafts hidden from students, role/last-admin guards, no payment writes, attendance pairing) | PASS |
| `node --check` syntax of all new `.ts` | PASS |
| V0 artifact scan (excluding historical `*.md`) | PASS — none found |
| Secrets scan of source | PASS — only the pre-existing placeholder fallback string in `db/index.ts`; no `.env*` files |

### NOT RUN — environment limitation
typecheck · ESLint · production build · `npm test` · `npm run test:admin` via tsx · `drizzle-kit generate` (snapshot diff check) · `db:migrate` · `db:seed:admin` · migration tests (fresh and Phase-6 DB) · seed idempotency · all database/integration tests (role changes, last-admin, enrollment ownership/capacity/withdrawal, attendance correction, exam/assignment editing, scheduling conflicts, invoices, grade correction, CMS publication, audit immutability trigger) · RBAC tests against a live DB · student/faculty/public regression · responsive tests at 320–1440px · accessibility checks · data-preservation test · Neon verification. **None of the SQL added in Phase 7 or 7.1 has been executed**; it was written against column names verified from the migration files, but expect some fixes on first run.

### Known limitations
1. Unexecuted code: first `tsc`, lint and DB runs may surface errors (Next 16.3 specifics unverified).
2. Enrollment requires the course to be in the student's program curriculum when the program has any curriculum rows; cross-program electives need an exception path (not built).
3. Attendance corrections cannot create missing records.
4. Invoices: no partial-payment recording, refunds or financial corrections; invoice student is fixed once created.
5. Exam/assignment "archive" map to cancel/close (no separate archived flag exists in the schema).
6. Admin-created exam and session changes do not email anyone (in-app notification for published exams only).
7. Faculty-section assignment does not check the faculty's department, only school.
8. No image upload (URL only); no WYSIWYG.
9. Student "address/emergency contact" editing is impossible without new schema.
10. `sessions` list/detail has no bulk-creation for recurring weekly patterns.

### Local verification commands (from `package.json`)
```
npm ci
npx tsc --noEmit
npm run lint
npm run build
npm test
npm run test:admin
npx drizzle-kit generate        # expect "No schema changes"; if it emits a diff, regenerate 0009/0010 snapshots
npm run db:migrate              # applies 0009, 0010
npm run db:seed:admin
npm run test:integration && npm run test:integration:cms && npm run test:integration:auth && npm run test:integration:student
node tests/migrations.mjs && node tests/student-migrations.mjs && node tests/faculty-migrations.mjs
```
Before migrating production, capture counts (users, students, faculty, courses, programs, enrollments, grades, applications, CMS tables) and compare after; this has **not** been performed here.

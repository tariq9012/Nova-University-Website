# Student portal — Phase 5

This extends the existing Phase 4 Next.js App Router, Neon HTTP, Drizzle, auth and design system. Do not reset the database. Apply `npm run db:migrate`; all previous migrations are unchanged.

## Access and APIs

The student layout and proxy enforce the student role; every student repository verifies a current active server session and derives the profile from that user. Faculty and admin do **not** implicitly enter the student-private API. Registrar/faculty management belongs to later explicitly authorized workflows.

`/api/v1/student/[...segments]` dispatches only allowlisted routes:

| Method | Path after `/api/v1/student/` | Behavior |
| --- | --- | --- |
| GET | profile, dashboard | Authenticated identity and own aggregates |
| GET | academics, results, transcript, progress | Published own academic record; server calculations |
| GET | courses, timetable, attendance, assignments, exams, fees, payments, documents, notifications | Own records, pagination and applicable semester filters |
| GET | courses/:enrollmentId, assignments/:assignmentId | Object-level ownership before returning detail |
| GET | documents/:id/download | Own document first; storage adapter unavailable by default |
| GET | settings | Own preferences and safe active-session timestamps; no session secrets or identifiers |
| GET | registration | Closed boundary with explanatory state |
| PATCH | profile | Reuses Phase 4 strict personal-details validator; cannot edit program, grades or roles |
| PATCH | settings | Validated timezone and display/email preferences |
| PATCH | notifications/:id, notifications/read-all | Own notifications only |
| POST | sessions/revoke-others | Revokes all other sessions and audits the action |
| POST | assignments/:id/submit | Enrollment, publication, deadline, duplicate and mode checks; text submission only |
| POST | assignments/:id/upload | Metadata validation and owned file-assignment checks; 503 until storage integration |
| POST | fees/:id/checkout | Own unpaid invoice; 503 until payment gateway integration |
| POST | registration | Closed, 409; no enrollment changes |

Existing `/api/v1/applications/*`, `/api/v1/account/*`, `/api/auth/*` and admin APIs retain their established contracts. Application detail now includes published matching admission requirements. New application notifications link to the owned application. Submitted applications retain the original locking rules.

Mutations require same-origin JSON, bounded bodies, strict input schemas and a shared database rate limit (60 student mutations/user/minute). Unknown operations fail closed. Private APIs and portal pages send no-store/noindex directives. Raw storage keys, passwords, hashes and session tokens are never returned.

## Records and calculations

Migration 0007 adds 19 tables: semesters, grading policies/scales, student policy assignments, registration policies, course sections/enrollments, dated classes/attendance, assignments/submissions, exams/grades, invoice items/invoices/payments, student documents/resources/preferences. Existing user notifications gain category, safe internal link and nullable unique deduplication key. Composite foreign keys prevent attendance/submissions crossing course sections. Enrollment uniqueness covers student/course/semester, including alternate sections. Grades, submissions, attendance, invoices and notification events have uniqueness constraints.

The assigned grading policy specifies `all`, `latest` or `best` repeated-attempt treatment. Only published grades on completed, positive-credit enrollments can enter GPA. Grade scale entries explicitly state GPA eligibility, points and earned credit. No policy means “Not available”, never a fabricated GPA. Incomplete, withdrawn, ungraded and zero-credit attempts do not contribute. Each term's GPA applies the same repeat policy within that term; CGPA applies it across all eligible terms. Latest compares semester end dates; a student cannot have two enrollments for one course in one semester. Registrar workflows must ensure overlapping terms have an unambiguous ordering before assigning a latest-repeat policy.

Earned credits count a passed course once (maximum earned credit snapshot among repeats). Curriculum progress counts each published curriculum course once, using its current curriculum credit value; repeated placements are grouped at their earliest semester. Required program credits remain authoritative; unpublished curriculum requirements remain unallocated rather than invented. Requirement categories preserve the database's core, required, general-education and elective labels.

Attendance percentage is present / (present + absent), with excused shown separately. Only recorded, finished, noncancelled classes count. Missing attendance is not silently marked absent. The overall percentage aggregates all matching records independently of pagination.

Money is stored as integer minor units; this implementation's ledger assumes 100 minor units per displayed currency unit. Before enabling another currency or a gateway, configure/validate its exponent. Invoice status and amount due derive from invoice items and settled payments, avoiding stale stored totals. Refunded and failed payments do not reduce the balance. A partial unpaid invoice past its due date is overdue.

Times are stored as timezone-aware timestamps. Date formatting respects the saved valid IANA timezone. Weekly date filters use database UTC boundaries; the UI groups class dates in the student's display timezone. Current semesters are database-status/date driven, never hardcoded in components. Upcoming/late indicators use server time. The sample term dates are development fixtures, not production defaults.

## Registration boundary

No approved university registration, prerequisites, credit-limit, capacity or academic-status policy existed in Phase 4. The portal therefore does not invent rules or permit enrollment writes. The additive model includes periods, deadlines, section capacities, prerequisite links (existing), registration policies and an approval timestamp. A future registrar workflow must explicitly publish policies and implement transactional add/remove/confirm with per-student/section locking, capacity, prerequisites, duplicate and credit-load checks before opening registration. A published policy row alone does not enable student writes in this version.

## External integrations

- **Private storage:** `lib/server/student-integrations.ts` defines `PrivateStudentStorage`. Default access returns 503 after ownership validation. Implement private object storage with server-generated keys, content/magic-byte verification, quarantine/malware scanning, size/type/extension/name checks, short-lived signed downloads and expiry tests. No upload bytes or fake signed URL are accepted today. Sample documents contain metadata only.
- **Payments:** `StudentPaymentGateway` defines checkout. Default is unavailable; the interface never fabricates a payment success. A provider must verify signed webhooks, currency/exponent, amount and invoice; insert an idempotent reference in a transaction. The ledger derives invoice state from recorded settled payments. Test double delivery, refund and failure handling before enabling checkout.
- **Email:** Phase 4 email delivery adapter remains unchanged. Preference opt-in is stored, but no notification email is claimed to be sent. A future queue must honor preferences and deduplicate delivery.
- **Transcript:** Browser printing produces an explicitly unofficial student copy. Certified PDF generation, digital signatures and official requests are not enabled.
- **Profile photo:** No photo/upload source exists in the current user model; none is fabricated. Connect private storage and the authorized personal-profile workflow before enabling photo edits. Date of birth is not collected by the existing schema.

## Development seed and tests

First use the existing academic/CMS/auth seeds if necessary. Then run:

```sh
ALLOW_DEV_SEED=true AUTH_ALLOW_DEV_ACCOUNTS=true AUTH_ORIGIN=http://localhost:3000 npm run db:seed:student
```

The seed requires the existing `student.dev@nova.example` marked `is_development`. It links existing curriculum and faculty rows, writes explicitly marked sample records and uses `ON CONFLICT DO NOTHING`. It never overwrites users, passwords, profile affiliations, grades or existing rows. Sample invoices/payment ledger entries are clearly not real money. Generated development credentials remain in the private local `.auth-dev/accounts.json`; they are excluded from delivery archives. No public admin/seed endpoint is added.

Verification commands:

```sh
npm run typecheck
npm run lint
npm test
npm run build
PGLITE_MODULE=/path/to/pglite/dist/index.js node tests/migrations.mjs
PGLITE_MODULE=/path/to/pglite/dist/index.js node tests/student-migrations.mjs
npm run test:integration:student
npm run test:database:student
```

Integration tests require a running server at TEST_BASE_URL, matching AUTH_ORIGIN, explicitly enabled development accounts and the sample seed. They create uniquely named temporary users and delete only their own fixtures. Database seed verification must run **without concurrent writes**, because it compares full row contents, including login timestamps and notification read state. Browser tests use `tests/browser/student.mjs` with optional PLAYWRIGHT_MODULE and CHROMIUM_EXECUTABLE. These QA dependencies are optional and not production dependencies.

The database-backed list pages paginate 20 rows. Full academic history is intentionally available to the server for complete GPA/transcript calculations; it is not computed from a paginated subset. Dashboard collections are bounded, while counts and academic totals cover all owned records. React server request caching shares student identity within a render.

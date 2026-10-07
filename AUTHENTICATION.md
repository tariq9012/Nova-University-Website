# Authentication and authorization — Phase 4

## Architecture

Nova retains Next.js App Router, Neon HTTP and Drizzle. Authentication uses Node's built-in scrypt and opaque database sessions; no browser token store, external identity provider or separate user database is introduced. Existing `users`, `roles`, `user_roles` and `faculty_profiles` are reused. `student_profiles` links a user to a program, deriving department and school through that program.

Passwords use scrypt N=131072, r=8, p=1, a random 128-bit salt and timing-safe verification. Passwords accept 15–128 characters, including spaces, without forced character substitutions. Passwords and confirmation values never enter logs or URL query strings. Password hashing follows the [OWASP Password Storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

Sessions use random 256-bit cookie tokens, storing only SHA-256 digests in `auth_sessions`. Normal sessions expire after 12 hours and use a non-persistent browser cookie. “Keep me signed in” sets a persistent cookie and a 30-day absolute expiry. Cookies are HttpOnly, SameSite=Lax, path `/`, and Secure on HTTPS; HTTPS uses the `__Host-` cookie prefix. Public production origins cannot use HTTP.

Each authenticated request joins the session to the current user, checks expiry, active status and credential version, then reads current database roles. A React request cache avoids repeated page checks; an AsyncLocalStorage scope shares the same session lookup within a single API request, never across requests. Logout deletes the current database session. Password changes/reset and administrative status changes revoke all sessions and increment the credential version.

## Configuration

Preserve your existing `.env` and add:

```dotenv
AUTH_ORIGIN=http://localhost:3000
ALLOW_DEV_SEED=false
AUTH_ALLOW_DEV_ACCOUNTS=false
AUTH_EMAIL_WEBHOOK_URL=
AUTH_EMAIL_WEBHOOK_SECRET=
```

`AUTH_ORIGIN` must exactly match the browser origin, including scheme and port. In production set both `AUTH_ORIGIN` and `NEXT_PUBLIC_SITE_URL` to your HTTPS origin. Never derive the trusted origin from a request Host header. The origin guard rejects unsafe requests with missing/different Origin; mutation APIs require JSON. No untrusted forwarded-IP header is used for throttling.

Rate limits use atomic PostgreSQL counters shared by all application instances. Login permits 10 attempts per normalized account per 15 minutes; registration/recovery and password actions have bounded per-identifier windows, plus a global 100-attempt/minute auth ceiling. This global ceiling is intentionally conservative; tune it with trusted ingress protection before high-volume deployment. Application creation is also rate-limited. Counters store identifier digests rather than email addresses. Run `npm run auth:prune` periodically to remove expired sessions/tokens/counters; audit history is retained.

## Development accounts

Development accounts are explicitly disabled on non-loopback origins, even if the allow flag is accidentally set. They cannot be used as production administrators.

For local development, set both flags to `true`:

```dotenv
ALLOW_DEV_SEED=true
AUTH_ALLOW_DEV_ACCOUNTS=true
```

Then run:

```sh
npm run db:migrate
npm run db:seed
npm run db:seed:auth
```

The setup creates, without overwriting existing users:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student.dev@nova.example` | Randomly generated in `.auth-dev/accounts.json` |
| Faculty | `faculty.dev@nova.example` | Randomly generated in `.auth-dev/accounts.json` |
| Admin | `admin.dev@nova.example` | Randomly generated in `.auth-dev/accounts.json` |

The private local credentials file has restrictive permissions, is ignored by git and is excluded from distributable archives. Open it locally to see your generated passwords. A rerun does not reset passwords. If you imported a database where these accounts already exist but lost that local file, use the private recovery command below; existing passwords are never silently overwritten.

The faculty account attaches to the existing `leila-okafor` development profile only if it is unassigned. No duplicate faculty record is created. The development student receives an explicitly marked sample identity (`DEMO-001`) and existing BSCS program link. New public registrations are prospective student accounts with no assigned student number/program and unverified email; registration does not claim enrollment.

### Controlled production administrator provisioning

Use the normal registration flow for a named operator account, set a unique password, and complete real email verification. An authorized database operator can then grant the existing `admin` role to that exact verified, active, non-development user through a controlled database transaction. Check the user's ID/email and verification first; add a `user_roles` link rather than modifying application code or enabling development accounts. Record the provisioning action in `audit_logs` and revoke existing sessions so the operator signs in again. No public endpoint can perform this elevation. Never grant roles by accepting a role field from a registration request.

Public registration rejects role/status/ID fields. Only `student` is assigned server-side. A real non-development administrator must be provisioned through a controlled database/account workflow by the deployment operator; there is no public admin-registration route.

## Recovery and email verification

Reset/verification tokens use random 256-bit secrets with only digests in `auth_tokens`. Reset links expire after 30 minutes; verification links after 24 hours. Tokens are single-use, bound to the current credential version, and consumed atomically. A reset revokes all sessions. Email verification is required for application submission and administrative CMS actions.

Links carry secrets in the URL fragment (`#token=...`), not the query string. The browser reads the fragment into the form and immediately removes it from history; no third-party script is needed. Secrets are sent only in same-origin POST JSON. Auth/private pages use noindex, no-store and a no-referrer policy. See [OWASP recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

Email is **not configured in this deliverable**. Public recovery/verification requests return an explicit service-unavailable message; they do not claim mail was sent or expose tokens.

For private local testing:

```sh
npm run auth:dev-token -- student.dev@nova.example reset
npm run auth:dev-token -- someone@example.test verify
```

Both development flags and a loopback origin are required. The command writes a private link to `.auth-dev/latest-link.txt` rather than returning secrets through an API or log. Open the file locally and follow the link. Treat it like a temporary password. This command does not send email.

### Email gateway integration point

Set `AUTH_EMAIL_WEBHOOK_URL` to your own trusted HTTPS delivery gateway and `AUTH_EMAIL_WEBHOOK_SECRET` to its server-only bearer secret. The server sends:

```json
{"to":"recipient@example.com","template":"reset","link":"https://university.example/reset-password#token=...","expiresInMinutes":30}
```

`template` is `reset` or `verify`. The gateway must validate the bearer secret, send the correct transactional email through an approved provider, avoid logging the body/link, and return 2xx only when the delivery request is accepted. No real gateway was available for end-to-end delivery testing. This is a provider integration contract, not a simulated email service.

## Authorization map

| Routes | Access |
| --- | --- |
| Existing academic/CMS/admissions read APIs and `/api/health`, `/api/ready` | Public, existing publication rules retained |
| `POST /api/auth/register`, `/login`, recovery/verification actions | Public but same-origin, validated and rate-limited |
| `GET /api/auth/session`; password change | Authenticated; password change also verifies current password |
| `POST /api/auth/logout` | Current cookie revoked, same-origin; safe to call when already signed out |
| `/portal/student/*` | Student, checked in layout and each data/page boundary |
| `/portal/faculty/*` | Faculty, checked in layout and each data/page boundary |
| `/admin/*`, `/api/v1/admin/users*` | Admin; sensitive account operations require verified email |
| `/api/v1/account/profile`, `/notifications` | Current authenticated user only |
| `/api/v1/applications` list/create | Student; server supplies owner and program degree |
| `/api/v1/applications/[id]` read | Owner student or admin |
| Draft save and submission | Owner student; verified email for submission |
| `/api/v1/applications/[id]/status` | Verified admin; legal transitions only |
| `/api/v1/applications/[id]/documents` | Owner student/admin read; owner mutation boundary |
| Existing `/api/v1/manage/[kind]*` | Verified admin; same-origin required for writes |

Unauthorized APIs return 401, wrong roles 403, and another student's resource ID returns 404. An early Next.js Proxy returns login redirects and actual HTTP 403 responses for wrong-role portal navigation before streaming begins. Pages independently redirect unauthenticated visitors and use Next.js `forbidden()` for a wrong role. This uses the installed Next.js `authInterrupts` option. Sessions are always checked server-side; middleware is not the security boundary.

## Application workflow

Create a student account → sign in → select program/intake → save draft → review → verify email if needed → confirm declaration → submit.

The server checks active program/department/school/intake, derives degree from the program and requires a published open deadline. Program-specific deadlines take precedence over degree-level and university-wide windows. Submission validates saved education, statement and contact details, atomically changes status, records submission/declaration time, appends history, creates a notification and writes an audit event. Duplicate submission cannot append a second submission history entry. Submitted forms cannot be edited unless an admin explicitly requests additional information.

Document metadata stays behind owner/admin checks and never exposes storage keys. **Private document storage is not configured**: upload returns 503 only after authentication and ownership checks. This phase submits form data, not document uploads. Do not put passport numbers or document copies in free-text fields. Add private object storage, authenticated download, file scanning and retention controls before collecting documents.

## Audit and deployment boundaries

Audit records include account registration, login/failure, logout, password reset/change, verification, profile updates, admin status actions, CMS changes, and application creation/submission/status changes. Records omit credentials and token values. Self-deactivation is prohibited, and serialized admin status changes preserve at least one active administrator.

Next.js security headers include frame denial, nosniff, no-referrer, restricted browser features, form/base/object CSP restrictions, private no-store/noindex, and HSTS for a configured HTTPS origin. The CSP intentionally does not claim a strict nonce-based script policy; Next's existing inline bootstrap remains functional.

Before live deployment configure actual email delivery, HTTPS/origin, non-development privileged accounts, private document storage when required, audit retention/monitoring, and ingress abuse protection. Existing approved public content must remain publication-gated. Development samples are not official admissions policy.

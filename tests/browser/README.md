# Production browser checks

Run against the built server with development accounts enabled on a loopback origin and the matching `AUTH_ORIGIN`. These scripts use a locally installed Playwright package and browser; they are optional QA dependencies, not application runtime dependencies.

```sh
npm run build
AUTH_ORIGIN=http://127.0.0.1:3007 AUTH_ALLOW_DEV_ACCOUNTS=true npm start -- --hostname 127.0.0.1 --port 3007
# In a second terminal, with Playwright installed:
TEST_BASE_URL=http://127.0.0.1:3007 node tests/browser/academic.mjs
TEST_BASE_URL=http://127.0.0.1:3007 node tests/browser/cms.mjs
TEST_BASE_URL=http://127.0.0.1:3007 node tests/browser/auth.mjs
```

`PLAYWRIGHT_MODULE` can point to a Playwright ES module entry and `CHROMIUM_EXECUTABLE` to a custom Chromium binary. Default Playwright resolution/browser installation works without these variables.

Results and screenshots are written to ignored `test-results/`. All suites check widths 320, 375, 390, 430, 768, 1024, 1280 and 1440. The authentication suite uses the private `.auth-dev/accounts.json` created by the opt-in seed. It exercises real login, logout, user filters, draft saving and submission. It leaves a clearly marked development application in the development student's account for review. The API suite suspends only its own temporary applicant account; it does not alter the browser suite’s development student. These suites target development sample admissions windows; update the sample fixture/window for future test dates rather than changing production admission policy.

Phase 6: `TEST_BASE_URL=http://127.0.0.1:3007 node tests/browser/faculty.mjs` checks eight widths, labels/noindex, faculty assignment publication/grading/closure/logout and student exam rendering. It uses the existing private sample accounts and removes its temporary assessment.

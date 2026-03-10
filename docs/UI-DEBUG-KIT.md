# UI Debug Kit (Fast Repro -> Patch -> Verify)

This kit is the fastest path to catch obvious UI regressions locally before manual QA.

## What it covers

- **Smoke checks** for high-value auth + onboarding UI paths
- **Screenshot capture** for quick visual diffs and bug reports
- **One-command workflow** to run smoke + screenshots

## Commands

From repo root:

```powershell
npm run ui:prep
```
One-time (or when DB/env looks broken): installs deps, ensures `.env.local`, and runs Prisma setup.

```powershell
npm run ui:dev
```
Starts local app on `http://localhost:3000` with env checks via `scripts/windows/run-local.ps1`.

```powershell
npm run ui:smoke
```
Runs Playwright smoke tests in `tests/e2e/ui-smoke.spec.ts`:
1. Root redirects to login and login UI renders
2. Register page renders and sign-in link works
3. New user can register and reach the Dependents step

```powershell
npm run ui:screenshots
```
Captures full-page screenshots for:
- login
- register
- personal information (wizard start)

Saved under:

```text
artifacts/ui-debug/screenshots/<timestamp>/
```

```powershell
npm run ui:debug
```
Runs smoke then screenshots in one shot.

## Typical local workflow

1. Run `npm run ui:prep` (first run only)
2. Start app (`npm run ui:dev`) in terminal A
3. Reproduce bug manually in browser
4. Patch code
5. Run `npm run ui:smoke`
6. Run `npm run ui:screenshots` if visual confirmation is useful
7. Attach screenshot path + failing step details to PR/issue

## Fast UI bug report template

Copy/paste this into GitHub issue or PR comment:

```md
### UI Bug
- **Area/Page:**
- **URL:**
- **Expected:**
- **Actual:**
- **Repro steps:**
  1.
  2.
  3.
- **Environment:** local dev / branch / commit
- **Evidence:** screenshot path(s) from artifacts/ui-debug/screenshots/<timestamp>/
- **Regression?:** yes/no (if yes, last known good commit)
```

## Notes

- Playwright config auto-starts dev server if not already running.
- Smoke tests intentionally focus on high-signal failures, not exhaustive form validation.
- For deeper gates, continue using existing `npm run qa` and release-gate flows.

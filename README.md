# 2025 Tax Preparation Software

A tax preparation app for the 2025 tax year built with Next.js 16, React 19, TypeScript, Tailwind CSS, Prisma, and SQLite.

## Fast Path (Windows)

For a complete first-use walkthrough (create account in-app, save, sign out, sign in), see [`FIRST-RUN.md`](./FIRST-RUN.md).

```powershell
cd C:\Users\Andy\tax-software-2025
npm run win:setup
npm run win:run
```

In a second terminal:

```powershell
cd C:\Users\Andy\tax-software-2025
npm run win:verify   # expects app running on localhost:3000
npm run win:qa
```

## Features

- Guided tax prep workflow across common personal tax scenarios
- Built-in calculations for 2025 tax logic
- Auth + saved return flow
- OCR-assisted document upload support (W-2 / 1099-INT)
- PDF output generation

## Requirements

- Node.js 20+ (tested on Node 24)
- npm

## Install

> Windows users should follow the full setup in [`SETUP-WINDOWS.md`](./SETUP-WINDOWS.md).

```powershell
cd C:\Users\Stryx\tax-software
npm install
npx prisma db push
```

Create `.env.local` if needed:

```env
# Generate a strong secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET=replace-with-a-random-secret
NEXTAUTH_URL=http://localhost:3000
# Optional: set to false to disable first-user admin assignment
# PERSONAL_MODE_FIRST_USER_ADMIN=true
```

Run locally:

```powershell
npm run dev
```

Open http://localhost:3000

## QA / Testing

```powershell
npm run qa:quick
npm run qa
npm run qa:release-gate
```

Artifacts are written to `artifacts/qa/<timestamp>/` with:
- `summary.json`
- `summary.md`
- step logs (`lint.log`, `typecheck.log`, `build.log`, etc.)

Manual scenario testing:
- [`TESTING.md`](./TESTING.md)
- [`TESTING-WINDOWS.md`](./TESTING-WINDOWS.md)

UI debug kit (fast local repro/verify):
- [`docs/UI-DEBUG-KIT.md`](./docs/UI-DEBUG-KIT.md)
- `npm run ui:prep`
- `npm run ui:smoke`
- `npm run ui:screenshots`
- `npm run ui:debug`

## Tech Stack

- Next.js 16.1.6
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- Prisma 7 + SQLite
- NextAuth 5 beta
- pdf-lib
- tesseract.js

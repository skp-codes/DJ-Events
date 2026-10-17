# AGENTS.md

## What this is
Multi-user port of a single-file offline app ("ReY Events Manager"). The UI must stay visually and functionally identical to the original. The original file is kept at `.netlify/assets/6ac297f24a9bad50a9301c49/ReYEvents-Manager.html` for reference.

## Layout
- `index.html`: HTML shell and all CSS (copied from the original, plus a few extra styles under `/* online accounts / admin */`).
- `public/app.js`: the whole app, a classic (non-module) IIFE using ES5-style code and string-built HTML. Inline `onclick` handlers call functions exported on `window` at the bottom of the file. Keep that style.
- `public/vendor/xlsx.full.min.js`: SheetJS for the Excel export/import.
- `public/__forms.html`: static skeleton so Netlify detects the `admin-requests` form.
- `src/auth.ts`: the only bundled module. It exposes `window.ReyAuth` (Identity email-link callbacks, session hydrate/refresh, sign-out). `app.js` waits for the `reyauth-ready` event.
- `netlify/functions/`: `auth` (signup/login/logout/recover/help), `me`, `data` (workspace GET/PUT), `account` (change password), `admin` (users + requests).
- `lib/server.ts`: shared server helpers (`getSession`, `ensureProfile`, `ADMIN_EMAIL`).
- `db/schema.ts`: Drizzle schema. Migrations go in `netlify/database/migrations/`.

## Key decisions
- **One JSON document per user** (`workspaces.data`) holds the same `DB` object the original app kept in localStorage. `saveData()` keeps its old name and call sites but now debounces a PUT to `/api/data`. Writes carry `version`. On a mismatch the server returns 409 with the latest copy, and the client swaps it in.
- **Login is by username or email.** The server maps username → email and calls Identity `login()`, which sets the `nf_jwt` cookie. Functions read it with `getUser()`.
- **Admin** = profile with `role='admin'`. It is assigned automatically to the email in `ADMIN_EMAIL` (default `dj.events.mgr.1980@gmail.com`). Email confirmation must stay ON in Identity settings so nobody else can claim that address.
- **Approval:** new profiles start as `pending`. `/api/data` rejects anyone who isn't `active` (admins are exempt).
- Admins open another user's workspace via `/api/data?user=<id>`. The client tracks this in `VIEW_USER` and shows a banner.
- The original "Export full app (.html)" feature was removed because an offline copy doesn't work with server-side accounts.

## Deploys are manual
Every commit pushed to GitHub must include `[skip netlify]` in its message so Netlify doesn't build automatically (to save build credits). The owner deploys manually from Netlify → Deploys → Trigger deploy. Link this repo to the EXISTING dj-events Netlify project (it holds the Identity users and Netlify Database); never create a new project from it.

# ReY Events Manager

An online, multi-user version of the ReY Events Manager: a mobile-first tracker for event inquiries, follow-ups, bookings, equipment/transport allocation, payments and capital payback. It has the same screens, look and features as the original single-file app. Data now lives on the server, and each person gets a private account.

## Features

- **Everything from the original app:** dashboard with health ring and tiles, inquiries and follow-up reminders, inquiry → booking conversion, resource allocation, payments, search, business and capital settings, JSON/Excel backup and restore, browser notifications.
- **Private accounts:** people sign up with a username, email and password (8+ characters). Each workspace is visible only to its owner and the admin.
- **Admin approval:** new accounts stay locked until the admin approves them.
- **Password recovery:** "Forgot password?" emails a reset link. If someone can't get into their email, they can send a reset request to the admin instead.
- **Admin tools** (More → Admin): approve, disable or delete accounts, set a new password for anyone, review help requests, and open any user's workspace to view or edit their data.
- **Sync across devices:** edits save automatically. If two devices edit at the same time, the app detects the clash and shows the latest version instead of silently overwriting it.

The admin is whoever signs up with `dj.events.mgr.1980@gmail.com`. To use a different address, set the `ADMIN_EMAIL` environment variable.

## Tech

- Static front end (`index.html` + `public/app.js`, plain JS), built with Vite
- Netlify Identity (`@netlify/identity`) for accounts, email confirmation and password recovery
- Netlify Database (Postgres) + Drizzle ORM for profiles, workspaces and help requests
- Netlify Functions (`netlify/functions/*.mts`) for the API
- Netlify Forms (`admin-requests`) for email notifications to the admin

## Running locally

```bash
npm install
npm run dev      # netlify dev on http://localhost:8889 (emulates Identity, Database, Functions)
```

After changing `db/schema.ts`, generate a migration with `npx drizzle-kit generate --name <change>`. Netlify applies migrations on deploy.

## Deploys are manual
Every commit pushed to GitHub must include `[skip netlify]` in its message so Netlify doesn't build automatically (to save build credits). The owner deploys manually from Netlify → Deploys → Trigger deploy. Link this repo to the EXISTING dj-events Netlify project (it holds the Identity users and Netlify Database); never create a new project from it.

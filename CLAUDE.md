# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with nodemon (auto-reload)
npm start            # Start production server (node server/index.js)
npm test             # Run Playwright E2E tests (headless)
npm run test:ui      # Run Playwright E2E tests with interactive UI
npx playwright test tests/search.spec.js  # Run a single test file
```

The server runs on port 3000 by default. A health check endpoint is at `GET /api/health`.

## Architecture

Monolithic full-stack app: Express serves both the REST API and static frontend files from `public/`.

**No build step** — the frontend is vanilla HTML/CSS/JS with no framework or bundler.

### Backend (`server/`)

- **`index.js`** — Express entrypoint: middleware, route mounting, MongoDB connection, static file serving
- **`config/database.js`** — Mongoose connection setup
- **`middleware/auth.js`** — JWT verification middleware, attaches `req.user` and `req.userId`
- **`models/`** — Mongoose schemas: `User` (auth + preferences), `Review` (rating + review text linked to user and TMDB movie)
- **`routes/`** — REST endpoints: `auth.js` (signup/login/password-reset), `movies.js` (search/trending/detail via TMDB), `reviews.js` (CRUD)
- **`services/`** — External API clients: `tmdb.js` (TMDB API), `omdb.js` (OMDb for IMDb/RT/Metascore), `email.js` (Resend for transactional emails)

### Frontend (`public/`)

- **`index.html`** — SPA shell with all views defined as hidden sections (home, reviews, stats, search) plus modals
- **`app.js`** — All frontend logic: auth state management, API calls, view switching, carousel, autocomplete search, review CRUD
- **`styles.css`** — All styling
- **`reset-password.html` / `reset-password.js`** — Standalone password reset flow (linked from email)

Auth uses JWT stored in `localStorage`. The frontend sends `Authorization: Bearer <token>` on authenticated requests.

### Tests (`tests/`)

Playwright E2E tests using route mocking (`page.route()`) — no real API calls are made. Tests inject a fake `authToken` via `page.addInitScript()`. Currently only Chromium is configured.

## Environment Variables

Requires a `.env` file (not committed) with:
`PORT`, `MONGODB_URI`, `JWT_SECRET`, `TMDB_API_KEY`, `OMDB_API_KEY`, `RESEND_API_KEY`, `CORS_ORIGIN`, `FRONTEND_URL`

## Key Patterns

- User passwords are hashed via a bcrypt pre-save hook in the User model
- Reviews have a compound index on `{ userId, tmdbId }` (one review per user per movie)
- Movie data comes from TMDB; supplemental ratings (IMDb, Rotten Tomatoes, Metascore) come from OMDb
- The frontend is a single-page app using `display: none`/`block` view switching (no router library)

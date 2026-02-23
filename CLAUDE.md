# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server with nodemon (auto-reload)
npm start                # Start production server (node server/start.js)
npm test                 # Run Playwright E2E tests (headless)
npm run test:ui          # Run Playwright E2E tests with interactive UI
npm run test:unit        # Run Jest unit tests
npm run test:integration # Run Jest integration tests (Supertest + in-memory MongoDB)
npm run test:all         # Run all Jest tests, then Playwright E2E tests
npx playwright test tests/e2e/search.spec.js  # Run a single E2E test file
```

The server runs on port 3000 by default. A health check endpoint is at `GET /api/health`.

## Architecture

Monolithic full-stack app: Express serves both the REST API and static frontend files from `public/`.

**No build step** — the frontend is vanilla HTML/CSS/JS with no framework or bundler.

### Backend (`server/`)

Uses a **controller-service** layered architecture:

- **`start.js`** — Production entrypoint: connects to MongoDB, starts the HTTP server
- **`index.js`** — Express app setup: middleware, route mounting, error handler. Exports `app` for testing (no side effects)
- **`config/database.js`** — Mongoose connection setup
- **`middleware/`** — `auth.js` (JWT verification), `asyncHandler.js` (async error wrapper), `validate.js` (Joi validation middleware), `errorHandler.js` (centralized error handler)
- **`errors/`** — `AppError.js` (custom error class), `index.js` (factory functions: `badRequest`, `unauthorized`, `notFound`, `conflict`)
- **`validators/`** — Joi schemas for request validation: `auth.validator.js`, `movies.validator.js`, `reviews.validator.js`
- **`routes/`** — Thin route wiring (method + path + middleware + controller): `auth.js`, `movies.js`, `reviews.js`
- **`controllers/`** — HTTP adapters (parse request, call service, send response): `auth.controller.js`, `movies.controller.js`, `reviews.controller.js`
- **`services/`** — Business logic (HTTP-agnostic, testable): `auth.service.js`, `movie.service.js`, `review.service.js`
- **`services/external/`** — Third-party API clients: `tmdb.js` (TMDB API), `omdb.js` (OMDb for IMDb/RT/Metascore), `email.js` (Resend for transactional emails)
- **`models/`** — Mongoose schemas: `User` (auth + preferences), `Review` (rating + review text linked to user and TMDB movie)

### Frontend (`public/`)

- **`index.html`** — SPA shell with all views defined as hidden sections (home, reviews, stats, search) plus modals
- **`app.js`** — All frontend logic: auth state management, API calls, view switching, carousel, autocomplete search, review CRUD
- **`styles.css`** — All styling
- **`reset-password.html` / `reset-password.js`** — Standalone password reset flow (linked from email)

Auth uses JWT stored in `localStorage`. The frontend sends `Authorization: Bearer <token>` on authenticated requests.

### Tests (`tests/`)

- **`e2e/`** — Playwright E2E tests using route mocking (`page.route()`). No real API calls. Chromium only.
- **`unit/services/`** — Jest unit tests for service layer. Uses `mongodb-memory-server` for database, mocks external APIs.
- **`integration/`** — Jest + Supertest integration tests. Full HTTP request/response flow with in-memory MongoDB.
- **`helpers/`** — `setup.js` (in-memory MongoDB lifecycle), `fixtures.js` (test data factories)

## Environment Variables

Requires a `.env` file (not committed) with:
`PORT`, `MONGODB_URI`, `JWT_SECRET`, `TMDB_API_KEY`, `OMDB_API_KEY`, `RESEND_API_KEY`, `CORS_ORIGIN`, `FRONTEND_URL`

## Key Patterns

- **Layered architecture**: Routes → Controllers → Services → Models/External APIs
- **Centralized error handling**: Throw `AppError` (or use `badRequest`/`unauthorized`/`notFound` factories) from anywhere; the `errorHandler` middleware catches all errors
- **Joi validation**: Declarative schemas in `validators/`, applied via `validate()` middleware in routes
- **asyncHandler wrapper**: Eliminates try/catch in controllers — async errors auto-forward to error middleware
- User passwords are hashed via a bcrypt pre-save hook in the User model
- Reviews have a compound index on `{ userId, tmdbId }` (one review per user per movie)
- Movie data comes from TMDB; supplemental ratings (IMDb, Rotten Tomatoes, Metascore) come from OMDb
- The frontend is a single-page app using `display: none`/`block` view switching (no router library)

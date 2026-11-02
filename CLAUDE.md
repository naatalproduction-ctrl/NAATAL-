# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NAATAL Studio is the full-stack site of an audiovisual production company in Abidjan, Côte d'Ivoire (naatalstudio.com): a public marketing site plus a private back office at `/admin` (CRM, accounting, projects, storyboards, content). All user-facing content is in French.

`README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md` and `AGENTS.md` describe an early frontend-only version and include placeholder content (Paris address, fictional team). Trust the code over them. The `session-*.md` and `*_SUMMARY.md` files at the root are old working notes.

## Commands

No test runner is configured. `npm run lint` fails because ESLint isn't installed.

### Frontend (repo root)
```bash
npm run dev          # Vite on port 3000
npm run build        # vite build, then build:seo
npm run build:seo    # Regenerate SEO output, then run check:seo (needs an existing dist/)
npm run check:seo    # Audit dist/: titles, descriptions, h1, JSON-LD, internal links, hidden prices
npm run check:secrets  # Scan tracked files for secrets
npm run release -- patch|minor|major [--push]  # See Versioning
npm run preview      # Preview production build
```

### Backend (server/)
```bash
npm run dev          # nodemon; PORT from server/.env (5001 locally, 5000 if unset)
npm start            # Production server
ADMIN_PASSWORD='...' npm run admin:create -- <username> <email>  # First admin account
```

The server exits at startup if `JWT_SECRET` is unset.

### Running against a local API

`.env` sets `VITE_API_URL=/api` and `vite.config.js` proxies `/api` to **production** (`https://naatalstudio.com`). Plain `npm run dev` therefore reads and writes live data, including from `/admin`. To use the local backend instead:

```bash
VITE_API_URL=http://localhost:5001/api npm run dev
```

The proxy only forwards `/api`, so `/uploads/...` images don't load in the default dev setup.

### Database

For a new database, from `server/`:

```bash
createdb naatal_db
npm run db:init
```

Seed data only goes into empty tables, so the SQL files can be rerun on an existing database, apart from harmless `CREATE TRIGGER` errors. Don't rely on `ON CONFLICT DO NOTHING` for seeds: these tables have no unique constraint, so it never fires.

`CREATE TABLE IF NOT EXISTS` never changes an existing table, so schema changes also go in `server/scripts/migrate.js` (`npm run db:migrate`), which can be rerun and which `deploy.sh` runs on production.

Production is the source of truth for content. `npm run db:sync` (in `server/`) replaces the local `medias`, `cinema_items` and `portfolio_*` rows with production's public API data, and refuses to run on a non-local database.

On this Mac, PostgreSQL 15 comes from Homebrew and isn't on `PATH`; its tools are in `/opt/homebrew/opt/postgresql@15/bin`.

## Architecture

- **Frontend:** React 18, Vite 5, React Router 6, Framer Motion, GSAP. Plain JavaScript, ES modules.
- **Backend:** Express 4, PostgreSQL via `pg` (no ORM), JWT, Multer. Plain JavaScript, CommonJS.

### Frontend

- `src/App.jsx` holds the routes. `/` stacks section components; `/boutique`, `/cinema`, `/offres` and `/services/:slug` are lazy-loaded pages; `/admin` is lazy-loaded and renders without the Header, Footer and WhatsApp button.
- `src/data/site.js` is the single source for business facts, visible home copy, service pages, route meta, prices and the FAQ. It has no JSX or imports so the Node SEO scripts can load it too.
- `src/context/SiteContext.jsx` only covers auth, medias, messages and public settings. Every other module calls its `*API` object from `src/services/api.js` directly in the component.
- The site name, email and phone are edited in the admin's Paramètres tab and stored in `settings`. The Footer, `Contact`, `Cinema`, `FAQ`, `Offres` and `WhatsAppCTA` read them from `siteInfo` and fall back to `BUSINESS`; SEO files always use `BUSINESS`, so a contact change must be made in both places.
- `src/services/api.js` wraps all API calls and attaches the JWT stored in `localStorage` as `naatal_token`. Responses are unwrapped by checking `success` and reading `data`.
- `src/components/Admin.jsx` (about 7,200 lines) is one component containing nearly every back-office module. It switches on `activeTab` (persisted in `sessionStorage`), and per-tab effects load each module's data. `Storyboard.jsx` and `PortfolioAdmin.jsx` are the separate modules it embeds.
- `Hero.jsx` and `src/data/defaultData.js` aren't imported anywhere.

### Backend

- Each domain is a `server/routes/<name>.js` plus a `server/controllers/<name>Controller.js`, mounted under `/api/<name>` in `server/server.js`. `server/models/` is empty.
- Controllers run parameterized SQL through `query()` from `config/database.js` and return `{ success: true, data }` or `{ success: false, error }`, with errors in French.
- Routers declare public routes (usually `/public`) before `/:id`. Admin routes use `authMiddleware` (also exported as `authenticateToken`), and user management adds `superAdminMiddleware`. `POST /api/messages` and `POST /api/leads` are public because the site's forms use them.
- `/api/portfolio/public*` feeds the external Soukavisuals site and has open CORS, unlike the rest of the API.
- Prospect search returns 503 unless `SERPER_API_KEY` is set.
- Rate limits live in `server.js`: a global limit, one on login, and 30 per hour on `POST /api/messages`.

### Offres flag

The `offres_enabled` row in the `settings` table (`true` = actif, `false` = désactivé, default `false`) reaches the frontend as `siteInfo.offresEnabled`, and the admin's Paramètres tab switches it. It controls the home section, the header link and the `/offres` route, which redirects to `/` when off. `Offres.jsx` reads the `offres` table and falls back to hard-coded packages.

The SEO build reads the same flag from the production API. When it's off or unreadable, the build leaves out `/offres` and all prices, so changing the flag only reaches the SEO files at the next frontend deploy.

### SEO build

After Vite, `npm run build` writes static files for crawlers into `dist/`. It reads live prestations, films, videos and products from the production API, so the build needs network access; without it, those pages fall back to reduced content.

- `scripts/seo-content.mjs` builds one content model per page, used by both generators so HTML and Markdown stay identical.
- `scripts/generate-seo-pages.mjs`: `seo/<page>.html` bot pages, `sitemap.xml`, and the JSON-LD and `<noscript>` content injected into `dist/index.html`.
- `scripts/generate-llms-and-mirrors.mjs`: `llms.txt`, `llms-full.txt` (from `rag/naatal-knowledge-base.md`), `md/<page>.md` and `robots.txt`.
- `scripts/check-seo.mjs` fails the build on a broken rule.

Crawlers must read what visitors see, so put new copy in `src/data/site.js` and render it in the component. An empty boutique is `noindex` and left out of the sitemap and llms files. The generators overwrite the `public/` copies of `robots.txt` and `sitemap.xml`, so edit the scripts, not those files.

`seo/SEO-LLM-PLAYBOOK.md` explains the approach. In production, the nginx `is_bot` block rewrites `/`, `/cinema`, `/boutique` and `/offres` to `dist/seo/` one route at a time. Any other route returns 404 to bots, because `try_files` doesn't apply inside that `if`, so `/services/*` needs the rule in `scripts/nginx-update.sh`. The nginx config isn't in the repo; `seo/nginx-seo.conf` lists the settings still to apply there.

### Business facts outside `src/data/site.js`

- **Prices:** `database/offres.sql`, fallbacks in `Offres.jsx`, `rag/naatal-knowledge-base.md`
- **Contact details:** `rag/naatal-knowledge-base.md`, `database/init.sql`
- **New public route:** `App.jsx`, `ROUTE_META`, a page in `scripts/seo-content.mjs`, and a rewrite rule in production nginx

## Conventions

- 2-space indentation, single quotes, trailing commas.
- Semicolons vary: `server/`, `src/services/` and `src/context/` use them; `src/components/` and `scripts/` mostly don't. Match the file.
- Functional components with `export default function ComponentName()`, each with a co-located `.css` file. PascalCase components, camelCase variables, kebab-case CSS classes.
- Import order: React, third-party, local components, CSS.
- Scroll animations use Framer Motion `whileInView` with `viewport={{ once: true }}`.
- Comments are sparse and mostly in French.
- Conventional commits (`feat:`, `fix:`, `style:`, `docs:`, `refactor:`, `perf:`, `test:`, `chore:`) with French descriptions.

## Design System

- Dark cinema theme with a gold accent. Tokens are CSS variables in `src/index.css` (background `#060606`, text `#f0f0f0`, accent `#c9a84c`). The full guide is `brand-identity/NAATAL-Brand-Identity.md`.
- Breakpoints: mobile <768px, tablet 768-1024px, desktop >1024px, large >1400px.
- Self-hosted videos: MP4 H.264, `autoPlay muted loop playsInline` with error handling.
- Favicons show only the N mark, because the word "STUDIO" is illegible at small sizes. `public/favicon-512x512.png` keeps the full logo because the SEO pages use it as the organization logo.

## Environment Variables

- Root `.env`: `VITE_API_URL` is the only one `src/` reads. `VITE_CONTACT_EMAIL`, `VITE_PHONE` and `VITE_ADDRESS` are unused there.
- `server/.env`: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `NODE_ENV`, `JWT_SECRET`, `CLIENT_URL`, `SERPER_API_KEY`.

## Versioning

The GitHub repo is public. Pushing to GitHub never deploys: no workflow or webhook reaches the server.

- `package.json` and `server/package.json` share one semantic version. Note each change under `## [Non publié]` in `CHANGELOG.md`, in French.
- `npm run release -- patch|minor|major` runs from a clean `main`. It checks secrets, builds, bumps both versions, updates the changelog, commits and creates a `vX.Y.Z` tag. `--push` also pushes `main` and the tag, and nothing else.
- `npm install` sets `core.hooksPath` to `.githooks`. `pre-commit` and `pre-push` run `scripts/check-secrets.mjs`, and `pre-push` refuses anything but branches and tags, which keeps local backup refs off GitHub.
- The build writes `dist/version.json` (version, commit, date). After a deploy, `https://naatalstudio.com/version.json` shows what is live; the admin's Paramètres tab and `/api` show the version too.

Commit normal work on a branch, merge it into `main`, then release. Never push with `--mirror`.

## Deployment

Deploy to the server only when the user explicitly asks in the current conversation. A push or a release is not a deploy.

- **Host:** `$NAATAL_DEPLOY_HOST`, defined in `CLAUDE.local.md`, which git ignores; domain `naatalstudio.com` (SSL via Certbot)
- **Paths:** nginx serves `/var/www/naatal/dist/` and PM2 runs `/var/www/naatal/server/`. The other files directly in `/var/www/naatal/` are stale copies.
- **Backend:** Express on port `5002`, managed by PM2 as `naatal-api`
- **Database:** PostgreSQL `naatal_db`, user `naatal_user`
- **Nginx:** proxies `/api/` to `127.0.0.1:5002`, SPA `try_files`, asset caching

Deploys authenticate with an SSH key. Keep credentials out of tracked files, because the GitHub repo is public.

```bash
bash scripts/deploy.sh --dry-run  # Show what would change, without writing to the server
bash scripts/deploy.sh            # Back up the server, deploy the backend, then the frontend
bash scripts/deploy.sh --nginx    # Apply scripts/nginx-update.sh; asks for the sudo password
```

- `deploy.sh` runs from a clean `main`, builds, and restores the backup if the API fails its health check. It prints the rollback command at the end; backups are in `~/naatal-backups` on the server.
- `joseph` has no passwordless sudo, so nginx changes need the user, in the macOS Terminal app: text typed in the desktop app's Terminal panel never reached the `sudo` prompt. `nginx-update.sh` restores the previous config if `nginx -t` fails.
- `nginx-update.sh` also sets `expires -1` on `location /`. Until it's applied, HTML has no `Cache-Control`, so browsers can reuse the previous page and its old bundle after a deploy.
- `deploy.sh` skips `controllers/prospectsController.js` while the server's `.env` has no `SERPER_API_KEY`, so prospect search keeps working on the old file.
- It never touches `.env`, `node_modules` or `uploads`.
- `public/videos/` is gitignored and holds only READMEs locally, so the frontend's delete step removes any video that exists only on the server.
- It runs `server/scripts/migrate.js` after the API restarts. Any other SQL change has to be run on the server separately.

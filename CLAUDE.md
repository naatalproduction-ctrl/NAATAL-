# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NAATAL is a full-stack web application for an audiovisual production company based in Abidjan, Cote d'Ivoire. All user-facing content is in French.

## Development Commands

### Frontend (root directory)
```bash
npm run dev          # Vite dev server on port 3000
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

### Backend (server/ directory)
```bash
cd server
npm run dev          # Express + nodemon on port 5000
npm start            # Production server
npm run db:init      # Initialize PostgreSQL from database/init.sql
npm run db:seed      # Seed sample data
```

No test runner or linter is currently configured.

## Architecture

### Stack
- **Frontend:** React 18 + Vite 5, React Router 6, Framer Motion, GSAP
- **Backend:** Express 4 + PostgreSQL (pg), JWT auth, Multer uploads
- **No TypeScript** — vanilla JavaScript throughout

### Frontend Structure
- `src/main.jsx` → `App.jsx` → React Router with `SiteProvider` context wrapper
- `src/context/SiteContext.jsx` — global state via React Context (auth, medias, messages, settings)
- `src/services/api.js` — centralized fetch wrapper with JWT Bearer token from `localStorage`
- `src/components/` — one `.jsx` + one `.css` file per component (co-located styles)

### Routes (App.jsx)
- `/` — Hero + Audiovisuel + Contact (single-page sections)
- `/boutique` — Shop page
- `/cinema` — Films section
- `/admin` — Admin dashboard (Header/Footer hidden)

### Backend Structure (server/)
- `server.js` — Express entry point, middleware, route mounting
- `config/database.js` — PostgreSQL connection pool
- `middleware/auth.js` — JWT verification middleware
- `controllers/` — business logic (auth, medias, messages, settings, cinema, boutique, comptabilite, projets, attachments, storyboard)
- `routes/` — Express routers matching each controller
- `uploads/` — user-uploaded files (covers, projets, transactions)

### API Pattern
All API endpoints are under `/api/*`. The frontend reads `VITE_API_URL` (defaults to `http://localhost:5001/api`). Auth tokens are stored in `localStorage` as `naatal_token`.

## Code Conventions

- 2-space indentation, single quotes, semicolons required, trailing commas
- Functional components with `export default function ComponentName()`
- PascalCase components, camelCase variables/functions, kebab-case CSS classes
- Import order: React → third-party → local components → CSS
- Framer Motion `whileInView` with `viewport={{ once: true }}` for scroll animations
- French for UI text, English for code comments (minimal comments)

## Git Conventions

Conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`

## Environment Variables

- Frontend `.env`: `VITE_API_URL`, `VITE_CONTACT_EMAIL`, `VITE_PHONE`, `VITE_ADDRESS`
- Backend `server/.env`: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `NODE_ENV`, `JWT_SECRET`, `CLIENT_URL`

See `.env.example` and `server/.env.example` for templates.

## Design System

- Black/white theme: background `#000`, text `#fff`, accents `#b0b0b0` / `#808080`
- Responsive breakpoints: mobile <768px, tablet 768-1024px, desktop >1024px, large >1400px
- Videos: MP4 H.264, `autoPlay muted loop playsInline` with error handling

## Deployment

### Server
- **Host:** `$NAATAL_DEPLOY_HOST` (serveur tribalprint)
- **Domain:** `naatalstudio.com` (SSL via Certbot)
- **Path:** tout est dans `/var/www/naatal/` (frontend + backend + uploads)
- **Backend:** Express sur port `5002`, géré par PM2 (`naatal-api`)
- **Database:** PostgreSQL `naatal_db`, user `naatal_user`
- **Nginx:** proxy `/api/` → `127.0.0.1:5002`, SPA `try_files`, cache assets

### Deploy Commands

**Frontend only** (après modif de fichiers `src/`):
```bash
VITE_API_URL=https://naatalstudio.com/api npm run build
sshpass -p 'REDACTED' rsync -avz --delete --exclude='server.js' --exclude='package.json' --exclude='package-lock.json' --exclude='node_modules' --exclude='.env' --exclude='.env.example' --exclude='config' --exclude='controllers' --exclude='middleware' --exclude='models' --exclude='routes' --exclude='uploads' --exclude='init.sql' -e "ssh -o StrictHostKeyChecking=no" dist/ $NAATAL_DEPLOY_HOST:/var/www/naatal/
```

**Backend only** (après modif de fichiers `server/`):
```bash
sshpass -p 'REDACTED' rsync -avz --exclude='node_modules' --exclude='.env' -e "ssh -o StrictHostKeyChecking=no" server/ $NAATAL_DEPLOY_HOST:/var/www/naatal/
sshpass -p 'REDACTED' ssh -o StrictHostKeyChecking=no $NAATAL_DEPLOY_HOST "cd /var/www/naatal && pm2 restart naatal-api"
```

**Full deploy** (frontend + backend):
```bash
# 1. Build frontend
VITE_API_URL=https://naatalstudio.com/api npm run build
# 2. Rsync frontend
sshpass -p 'REDACTED' rsync -avz --delete --exclude='server.js' --exclude='package.json' --exclude='package-lock.json' --exclude='node_modules' --exclude='.env' --exclude='.env.example' --exclude='config' --exclude='controllers' --exclude='middleware' --exclude='models' --exclude='routes' --exclude='uploads' --exclude='init.sql' -e "ssh -o StrictHostKeyChecking=no" dist/ $NAATAL_DEPLOY_HOST:/var/www/naatal/
# 3. Rsync backend
sshpass -p 'REDACTED' rsync -avz --exclude='node_modules' --exclude='.env' -e "ssh -o StrictHostKeyChecking=no" server/ $NAATAL_DEPLOY_HOST:/var/www/naatal/
# 4. Restart backend
sshpass -p 'REDACTED' ssh -o StrictHostKeyChecking=no $NAATAL_DEPLOY_HOST "cd /var/www/naatal && pm2 restart naatal-api"
```

### Rules
- **Build avant chaque deploy frontend** avec `VITE_API_URL=https://naatalstudio.com/api`
- **Rsync uniquement les fichiers modifiés** — ne jamais écraser `.env`, `node_modules` ou `uploads` sur le serveur
- **Restart PM2** uniquement si le backend a été modifié
- Attendre **~10s entre les connexions SSH** pour éviter le rate-limit du serveur

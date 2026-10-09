# Octave Chime

WhatsApp-native account alerts simulation. Banks onboard customers who link bank
accounts; a simulated (or live Termii) WhatsApp bot sends debit/credit alerts and
a daily summary. Delivered as a TypeScript monorepo with two deployable apps and
a managed Postgres database.

## Stack

| Layer | Choice |
|---|---|
| Web UI | Next.js 16 (React 19), Tailwind CSS v4, deployed on **Vercel** |
| API / services / cron / webhooks | Express 5, TypeScript, deployed on **Render** |
| Database | Prisma ORM on **Neon** (Lakebase) PostgreSQL |
| Messaging | Termii (mock by default — no network calls) |
| Account linking | Mono (simulated "off" mode by default) |

## Repository layout

```
api/          Express API (services, cron, webhooks, Prisma schema + seed)
web/          Next.js UI (enroll links, bank admin console, status page)
api/render.yaml   Render blueprint (web service + daily-summary cron)
```

`api/` and `web/` are independent pnpm projects (each has its own lockfile).

## Local setup

Requirements: Node ≥ 22, pnpm ≥ 9.

```bash
# API
cd api
cp .env.example .env          # fill DATABASE_URL, secrets (see env tables below)
pnpm install
pnpm db:deploy                # migrate an empty database
pnpm db:seed                  # seed the demo banks/admins/customers (optional, once)
pnpm dev                      # http://localhost:4000

# Web (second terminal)
cd web
cp .env.example .env.local
pnpm install
pnpm dev                      # http://localhost:3000
```

`pnpm build` in `api/` regenerates the Prisma client before compiling; `pnpm
db:deploy` applies committed migrations (never dev migrations in CI/CD).

## Environment contract

### API (Render) — filled from `api/.env.example`

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `APP_URL` | the Vercel domain (CORS + enroll links + session cookie) |
| `API_URL` | the Render service URL (`https://<render>.onrender.com`) |
| `DATABASE_URL` | Neon **pooled** connection string (host contains `-pooler`) |
| `DATABASE_URL_UNPOOLED` | Neon **direct** connection string (Prisma Migrate) |
| `SESSION_SECRET` | fresh random string |
| `JWT_SECRET` | fresh random string |
| `CRON_SECRET` | fresh random string (cron bearer token, shared with the cron job) |
| `TERMII_MODE` | `mock` for the demo; `live` + `TERMII_API_KEY`/`TERMII_DEVICE_ID` to go live |
| `MONO_MODE` | `off` (simulated) or `sandbox`/`live` with `MONO_PUBLIC_KEY`/`MONO_SECRET_KEY` |
| `PORT` | set by Render |

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Web (Vercel) — filled from `web/.env.example`

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<render>.onrender.com` |
| `NEXT_PUBLIC_MONO_PUBLIC_KEY` | Mono Connect public key; empty = simulated linking |

## Deploy

1. **GitHub** — push `main` (and `develop`) to the project repository.
2. **Neon** — create a `production` branch in the project; copy its pooled and
   direct connection strings.
3. **Render** — *New > Blueprint* against the repo and `api/render.yaml`. After the
   first apply, fill the `sync: false` env vars (secrets + `DATABASE_URL`s + the
   service URL) in the Render dashboard, then redeploy. Migrations run
   automatically via the `preDeployCommand`.
4. **Vercel** — import the repo, root directory `web`, framework Next.js, set the
   web env vars, deploy `main`. Afterwards set the API's `APP_URL` to the Vercel
   URL in Render and redeploy the API once.

Order matters: **Render first**, then Vercel, then point `APP_URL` back at
Vercel and redeploy Render (enrollment links and the session cookie depend on
`APP_URL`).

## Operations

- Live health: `GET /api/health` → `{ ok: true, db: "ok", termiiMode: "mock" }`.
- Daily summary: the Render cron job fires at `21:00 UTC`
  (`POST /cron/daily-summary`, `Authorization: Bearer <CRON_SECRET>`). Free-tier
  cron runs at most once per day.
- Termii webhook endpoint: `https://<render>.onrender.com/webhooks/termii`
  (a no-op while `TERMII_MODE=mock`).
- Seeding is manual and never part of a deploy: `pnpm db:seed` (exactly once).
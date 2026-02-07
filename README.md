# Roast Board

A private, friends-only scoreboard for tracking incidents of flaking, ghosting, lateness, and general unreliability. Built with Next.js 15, Fastify 5, and Postgres.

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm
- PostgreSQL
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in your `.env`:

| Variable | Where to find it |
|----------|-----------------|
| `DATABASE_URL` | Your Postgres connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same page, under "publishable" (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | Same page, under "secret" (`sb_secret_...`) — keep secret |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` for local dev |

### 3. Run database migrations

```bash
pnpm db:migrate
```

### 4. Start the dev servers

```bash
pnpm dev
```

This starts both apps in parallel:

- **Web** — http://localhost:3000
- **API** — http://localhost:3001

You can also run them individually:

```bash
pnpm dev:web   # Next.js only
pnpm dev:api   # Fastify only
```

### 5. Use the app

1. Go to http://localhost:3000 — you'll be redirected to sign up
2. Create an account, then create a group
3. Share the invite code with friends so they can join
4. Start filing incidents

## Project Structure

```
apps/
  api/          Fastify API server
  web/          Next.js frontend
packages/
  db/           Postgres client, migrations, and types
```

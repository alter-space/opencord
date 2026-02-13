# Backend

Hono server running on Node.js, port 3000.

## Route Structure

All route mounting happens in `src/index.ts`:
- `/api/auth/*` — Better Auth handler (from `@opencord/auth`)
- `/trpc/*` — tRPC server (router from `@opencord/api`, context includes session)
- `/ai` — AI streaming endpoint using Vercel AI SDK + Google Gemini
- `/` — health check

## Key Patterns

- CORS configured via `@opencord/env/server` (`CORS_ORIGIN`).
- tRPC context extracts session from request headers using `@opencord/auth`.
- Do not define business logic here; put tRPC procedures in `@opencord/api`.
- AI routes use `streamText` + `convertToModelMessages` from Vercel AI SDK.

## Build & Run

```bash
pnpm dev:server          # dev with tsx watch
pnpm build --filter backend  # production build via tsdown
```

## Env

Backend `.env` lives at `apps/backend/.env`. This file is also read by `@opencord/db` for Drizzle config.

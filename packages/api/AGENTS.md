# @opencord/api

tRPC v11 router layer. All API procedures and business logic live here.

## Structure

- `src/index.ts` — tRPC init, exports `router`, `publicProcedure`, `protectedProcedure`
- `src/context.ts` — creates tRPC context from Hono request (extracts auth session)
- `src/routers/` — router definitions, merged into `appRouter`
- `src/lib/redis.ts` — Upstash Redis client singleton

## Adding a New Router

1. Create `src/routers/<name>.ts`
2. Use `publicProcedure` or `protectedProcedure` from `../index`
3. Merge into `appRouter` in `src/routers/index.ts`

## WebSocket Authentication

The `ws.getTicket` procedure generates single-use tickets for WebSocket auth:

- Protected procedure (requires auth)
- Generates UUID ticket
- Stores `ws_ticket:<ticket>` → `userId` in Redis with 30s TTL
- Returns ticket for client to connect to `/ws?ticket=<ticket>` on Go gateway

## Conventions

- `protectedProcedure` guarantees `ctx.session` exists (throws UNAUTHORIZED otherwise)
- Input validation: always use Zod schemas via `.input()`
- Exports use subpath: consumers import `@opencord/api/routers/index`, `@opencord/api/context`
- This package is consumed by both `apps/backend` (server-side) and `apps/web` (type imports only)
- Redis operations use the singleton client from `src/lib/redis.ts`

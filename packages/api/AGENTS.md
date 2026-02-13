# @opencord/api

tRPC v11 router layer. All API procedures and business logic live here.

## Structure

- `src/index.ts` — tRPC init, exports `router`, `publicProcedure`, `protectedProcedure`
- `src/context.ts` — creates tRPC context from Hono request (extracts auth session)
- `src/routers/` — router definitions, merged into `appRouter`

## Adding a New Router

1. Create `src/routers/<name>.ts`
2. Use `publicProcedure` or `protectedProcedure` from `../index`
3. Merge into `appRouter` in `src/routers/index.ts`

## Conventions

- `protectedProcedure` guarantees `ctx.session` exists (throws UNAUTHORIZED otherwise)
- Input validation: always use Zod schemas via `.input()`
- Exports use subpath: consumers import `@opencord/api/routers/index`, `@opencord/api/context`
- This package is consumed by both `apps/backend` (server-side) and `apps/web` (type imports only)

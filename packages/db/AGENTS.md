# @opencord/db

Drizzle ORM + Neon (serverless PostgreSQL).

## Structure

- `src/index.ts` — Neon connection + Drizzle instance, exports `db`
- `src/schema/` — Drizzle table definitions
- `src/schema/auth.ts` — Better Auth tables (managed by auth, don't edit manually)
- `src/migrations/` — generated migration files
- `drizzle.config.ts` — Drizzle Kit config (reads `.env` from `apps/backend/.env`)

## Adding a Table

1. Create or edit a file in `src/schema/`
2. Export it from `src/schema/index.ts`
3. Run `pnpm db:generate` to create a migration
4. Run `pnpm db:push` to apply (dev) or `pnpm db:migrate` (prod)

## Commands

```bash
pnpm db:push       # push schema directly (dev)
pnpm db:generate   # generate SQL migration
pnpm db:migrate    # run pending migrations
pnpm db:studio     # open Drizzle Studio GUI
```

# AGENTS.md

Opencord is a real-time communication platform built as a TypeScript monorepo.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: React 19, Vite, TanStack Router, TailwindCSS v4, shadcn/ui
- **Backend**: Hono, tRPC, AI SDK (Vercel)
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Auth**: Better Auth
- **Env validation**: @t3-oss/env-core + Zod
- **Desktop**: Tauri
- **Linting/Formatting**: oxlint + oxfmt

## Commands

| Task | Command |
|------|---------|
| Dev (all) | `pnpm dev` |
| Dev (web only) | `pnpm dev:web` |
| Dev (backend only) | `pnpm dev:server` |
| Build | `pnpm build` |
| Type check | `pnpm check-types` |
| Lint + format | `pnpm check` |
| DB push schema | `pnpm db:push` |
| DB generate migrations | `pnpm db:generate` |
| DB run migrations | `pnpm db:migrate` |
| DB studio | `pnpm db:studio` |

## Installing Dependencies

Always use `pnpm add <pkg> --filter <workspace>` from the root.

Workspace filter names: `web`, `backend`, `@opencord/api`, `@opencord/auth`, `@opencord/db`, `@opencord/env`, `@opencord/config`.

For shared version pinning, add to the `catalog:` section in `pnpm-workspace.yaml` and reference with `"catalog:"` in package.json.

## Architecture

```
apps/web        → frontend, talks to backend via tRPC client + AI SDK
apps/backend    → Hono server, mounts tRPC router from @opencord/api, auth from @opencord/auth
packages/api    → tRPC router definitions, procedures, context creation
packages/auth   → Better Auth config, uses @opencord/db for storage
packages/db     → Drizzle schema, Neon connection, migrations
packages/env    → Zod-validated env vars, exports ./server and ./web
packages/config → shared tsconfig base
```

## Dependency Flow

```
web → @opencord/api, @opencord/auth, @opencord/env/web
backend → @opencord/api, @opencord/auth, @opencord/db, @opencord/env/server
api → @opencord/auth, @opencord/db, @opencord/env
auth → @opencord/db, @opencord/env
db → @opencord/env
```

## Code Style

- Never use comments in code
- Do not overengineer; keep implementations minimal and direct
- Use `catalog:` versions for any dependency shared across 2+ packages
- Internal packages use `workspace:*` protocol

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give a list of unresolved questions to answer, if any.

## Package-Level Guidance

See each package's `AGENTS.md` for specific conventions:
- `apps/web/AGENTS.md` — frontend patterns
- `apps/backend/AGENTS.md` — server patterns
- `packages/api/AGENTS.md` — tRPC conventions
- `packages/auth/AGENTS.md` — auth setup
- `packages/db/AGENTS.md` — schema and migrations

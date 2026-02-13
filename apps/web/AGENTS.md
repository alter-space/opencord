# Web App

React 19 SPA with file-based routing (TanStack Router), TailwindCSS v4, and shadcn/ui (base-lyra style).

## Key Patterns

- Routing: file-based via TanStack Router. Add routes in `src/routes/`. Route tree auto-generates to `src/routeTree.gen.ts`.
- State: TanStack Query for server state, managed through tRPC proxy (`src/utils/trpc.ts`).
- API calls: use the `trpc` proxy from `@/utils/trpc`, never raw fetch for tRPC endpoints.
- AI streaming: use `@ai-sdk/react` hooks, backend streams at `/ai`.
- Styling: TailwindCSS v4 utility classes. CSS in `src/index.css`. Never use inline style objects.
- Theme: dark mode default via `next-themes` ThemeProvider wrapping the app.
- Toasts: `sonner` via `<Toaster richColors />` mounted in root.

## Adding shadcn Components

```bash
pnpm dlx shadcn@latest add <component> --filter web
```

Components land in `src/components/ui/`. Utils in `src/lib/utils.ts`.

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig + vite).

## Dev

```bash
pnpm dev:web
```

Runs Vite on port 3001. Backend must be running on port 3000 for API/auth to work.

## Tauri (Desktop)

```bash
cd apps/web && pnpm desktop:dev
cd apps/web && pnpm desktop:build
```

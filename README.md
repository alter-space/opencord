# opencord

This project was created with a modern TypeScript stack that combines React, TanStack Router, Hono, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **Node.js** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **Neon PostgreSQL** - Serverless Postgres database
- **Upstash Redis** - Serverless Redis for caching and real-time features
- **Authentication** - Better-Auth
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Tauri** - Build native desktop applications
- **Turborepo** - Optimized monorepo build system

## Prerequisites

You need accounts on the following services (all have generous free tiers):

1. **[Neon](https://neon.tech)** - Create a project and grab the PostgreSQL connection string
2. **[Upstash](https://upstash.com)** - Create a Redis database and grab the REST URL + token

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create env files:

`apps/backend/.env`

```bash
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=<your-neon-connection-string>
UPSTASH_REDIS_REST_URL=<your-upstash-redis-rest-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-redis-rest-token>
```

`apps/web/.env`

```bash
VITE_SERVER_URL=http://localhost:3000
```

Generate `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Database Setup

This project uses Neon (serverless PostgreSQL) with Drizzle ORM.

1. Create a project on [neon.tech](https://neon.tech) and copy the connection string.
2. Set `DATABASE_URL` in `apps/backend/.env` to your Neon connection string.
3. Push the schema to your database:

```bash
pnpm db:push
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## Git Hooks and Formatting

- Format and lint fix: `pnpm check`

## Project Structure

```
opencord/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   └── backend/     # Backend API (Hono, tRPC)
├── packages/
│   ├── api/         # tRPC router definitions and procedures
│   ├── auth/        # Better Auth configuration
│   ├── db/          # Drizzle schema, Neon connection, migrations
│   ├── env/         # Zod-validated environment variables
│   └── config/      # Shared TypeScript config
```

## Available Scripts

- `pnpm dev` - Start all applications in development mode
- `pnpm build` - Build all applications
- `pnpm dev:web` - Start only the web application
- `pnpm dev:server` - Start only the backend
- `pnpm check-types` - Check TypeScript types across all apps
- `pnpm db:push` - Push schema changes to database
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio GUI
- `pnpm check` - Run Oxlint and Oxfmt
- `cd apps/web && pnpm desktop:dev` - Start Tauri desktop app in development
- `cd apps/web && pnpm desktop:build` - Build Tauri desktop app

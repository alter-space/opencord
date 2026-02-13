# @opencord/auth

Better Auth configuration. Single export: `auth` from `src/index.ts`.

## Setup

- Uses Drizzle adapter with `@opencord/db` for persistence
- Auth schema lives in `@opencord/db` at `src/schema/auth.ts`
- Email + password enabled
- Cookies: `sameSite: none`, `secure: true`, `httpOnly: true`
- Trusted origins from `env.CORS_ORIGIN`

## Adding Auth Features

Better Auth plugins go in the `plugins: []` array in `src/index.ts`. After adding a plugin that requires new tables, regenerate the auth schema in `@opencord/db`.

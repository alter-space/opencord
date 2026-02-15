# apps/gateway

High-performance WebSocket gateway written in Go for zero-allocation real-time communication.

## Stack

- **Language**: Go 1.26
- **HTTP**: stdlib net/http
- **Port**: 8081

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Run development server with hot reload via `go run` |
| `pnpm build` | Compile binary to `bin/gateway` |

## Architecture

Barebones HTTP server with `/health` endpoint. WebSocket handling to be implemented.

## Development

From monorepo root:
```bash
pnpm -F @opencord/gateway run dev
```

Or from this directory:
```bash
go run main.go
```

## Building

```bash
pnpm -F @opencord/gateway run build
./bin/gateway
```

## Integration

The `package.json` acts as a bridge for Turborepo. The `dev` script is picked up by `turbo dev` at the root, allowing the Go server to run alongside Node.js apps in the monorepo pipeline.

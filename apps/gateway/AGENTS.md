# apps/gateway

High-performance WebSocket gateway written in Go for zero-allocation real-time communication.

## Stack

- **Language**: Go 1.26
- **HTTP**: stdlib net/http
- **WebSocket**: github.com/gorilla/websocket
- **Port**: 8081

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Run development server with hot reload via `go run` |
| `pnpm build` | Compile binary to `bin/gateway` |

## Architecture

HTTP server with:
- `/health` — health check endpoint
- `/ws` — WebSocket upgrade endpoint

### Zero-Allocation Design

Uses `sync.Pool` for byte buffer recycling to minimize GC pressure:
- 4KB buffer pool for read/write operations
- Pooled buffers returned immediately after use
- Client struct holds WebSocket connection
- Read loop recycles buffers on every message

### WebSocket Upgrader

Configured with:
- 4KB read/write buffers
- Origin check disabled for dev (allows all origins)
- Automatic protocol upgrade from HTTP

## Development

From monorepo root:
```bash
pnpm -F @opencord/gateway run dev
```

Or from this directory:
```bash
go run *.go
```

## Building

```bash
pnpm -F @opencord/gateway run build
./bin/gateway
```

## Integration

The `package.json` acts as a bridge for Turborepo. The `dev` script is picked up by `turbo dev` at the root, allowing the Go server to run alongside Node.js apps in the monorepo pipeline.

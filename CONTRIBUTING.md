# Contributing to StravaMCP

Thank you for your interest in contributing to StravaMCP! This guide covers everything you need to get started.

## Prerequisites

- **Go 1.25+** (match [go.mod](go.mod))
- **Git**
- A **Strava API application** — create one at https://www.strava.com/settings/api

## Development Setup

```bash
git clone https://github.com/Stealinglight/StravaMCP.git
cd StravaMCP
go build .
go test ./...
```

## Environment Setup

Required environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `STRAVA_CLIENT_ID` | Yes | Your Strava API application client ID |
| `STRAVA_CLIENT_SECRET` | Yes | Your Strava API application client secret |
| `STRAVA_TOKEN_PATH` | No | Path to token storage (default: `~/.strava/tokens.json`) |

Authenticate with the OAuth browser flow:

```bash
export STRAVA_CLIENT_ID=your_id
export STRAVA_CLIENT_SECRET=your_secret
./strava-mcp auth
```

This opens your browser to complete Strava authorization and saves tokens locally.

## Running Tests

```bash
# Run all tests
go test ./...

# Run with verbose output
go test -v ./...

# Run specific package tests
go test ./internal/tools/...
go test ./internal/strava/...
go test ./internal/auth/...
```

## Project Structure

```
internal/
  auth/       - OAuth browser flow and file-based token store
  config/     - Environment variable loading and validation
  server/     - MCP server setup and tool registration
  strava/     - Strava HTTP client with auto-refresh
  tools/      - MCP tool handlers (11 tools across 5 categories)
main.go       - Entry point (auth subcommand + MCP server mode)
```

## Adding a New Tool

1. Create a handler in `internal/tools/` following the existing pattern (e.g., `activities.go`)
2. Handler function signature: `func HandleXxx(client *strava.Client) mcp.ToolHandlerFunc`
3. Register in `internal/tools/register.go` via a `registerXxx` function
4. Add tests in the corresponding `_test.go` file

## Pull Request Guidelines

- Branch from `main`
- Run `go test ./...` before submitting
- Follow conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Keep PRs focused on a single concern

## Code Style

- Follow standard Go conventions (`gofmt`, `go vet`)
- All logging to stderr via `slog` (stdout is MCP JSON-RPC)
- Use the established handler closure pattern: `HandleXxx(client)` returns `ToolHandlerFunc`
- Error handling: use `FormatResponse`/`HandleToolError` helpers from `internal/tools/helpers.go`

## License

By contributing, you agree that your contributions will be licensed under the [ISC License](LICENSE).

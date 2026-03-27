# Stack Recommendations

**Domain:** Go-based MCP server for Strava API
**Researched:** 2026-03-26
**Confidence:** HIGH (cross-validated with architecture, features, and pitfalls research)

## Recommended Stack

### Language & Runtime

| Choice | Version | Rationale | Confidence |
|--------|---------|-----------|------------|
| **Go** | 1.22+ | Target language per project goals. Ecosystem fit with RustyClaw. Single-binary distribution. | HIGH |

### MCP Framework

| Choice | Version | Rationale | Confidence |
|--------|---------|-----------|------------|
| **mark3labs/mcp-go** | v0.26+ (pin exact) | Most mature Go MCP SDK. Implements MCP spec 2025-11-25. Provides `ServeStdio` for stdio transport, `AddTool` for declarative registration, typed parameter builders. Active development, 4k+ stars. | HIGH |

**What NOT to use:**
- `metoro-io/mcp-golang` — Less mature, smaller community, different API patterns
- Hand-rolling JSON-RPC — Unnecessary complexity; mcp-go handles protocol correctly
- Any HTTP-based MCP transport — Project requires stdio only

### HTTP Client (Strava API)

| Choice | Version | Rationale | Confidence |
|--------|---------|-----------|------------|
| **net/http** (stdlib) | Go 1.22+ | Zero dependencies. Sufficient for REST API calls. Go's stdlib HTTP client is production-grade. Keeps binary small. | HIGH |

**What NOT to use:**
- `go-resty/resty` — Unnecessary dependency for simple REST calls
- `hashicorp/go-retryablehttp` — Overkill; we need custom retry logic for OAuth refresh anyway

### OAuth / Auth

| Choice | Version | Rationale | Confidence |
|--------|---------|-----------|------------|
| **Manual OAuth implementation** | N/A | Strava's OAuth is simple (authorization code + refresh). `golang.org/x/oauth2` doesn't handle file-based token persistence, so we'd need a custom `TokenSource` wrapper anyway. Fewer dependencies, more control over the atomic file write pattern. | HIGH |
| **pkg/browser** (or `exec.Command`) | latest | Open system browser for OAuth authorization URL during initial setup. | MEDIUM |

**What NOT to use:**
- `golang.org/x/oauth2` — Adds dependency without solving our core problem (file persistence + atomic writes). The complexity of wrapping it exceeds just doing the HTTP calls directly.

### Token Storage

| Choice | Version | Rationale | Confidence |
|--------|---------|-----------|------------|
| **JSON file at ~/.strava/tokens.json** | N/A | Matches RustyClaw pattern. Atomic write-then-rename for crash safety (critical — refresh tokens rotate and old ones are immediately invalid). | HIGH |

### Structured Logging

| Choice | Version | Rationale | Confidence |
|--------|---------|-----------|------------|
| **log/slog** (stdlib) | Go 1.21+ | Built-in structured logging. Configure to write to stderr only (stdout is sacred — MCP JSON-RPC transport). Zero dependencies. | HIGH |

**What NOT to use:**
- `uber-go/zap` — Unnecessary dependency for a CLI tool
- `fmt.Println` — Writes to stdout, corrupts MCP transport (critical pitfall #1)

### CLI / Config

| Choice | Version | Rationale | Confidence |
|--------|---------|-----------|------------|
| **Environment variables + .env** | N/A | Simple config: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_TOKEN_FILE`. Matches existing pattern. | HIGH |
| **joho/godotenv** (optional) | latest | Load .env files automatically. Small dependency, widely used. Could also skip and use pure env vars. | MEDIUM |

### Testing

| Choice | Version | Rationale | Confidence |
|--------|---------|-----------|------------|
| **testing** (stdlib) | Go 1.22+ | Standard Go test framework. Table-driven tests for tool handlers. | HIGH |
| **net/http/httptest** | stdlib | Mock Strava API responses for unit tests. | HIGH |

### Build & Distribution

| Choice | Version | Rationale | Confidence |
|--------|---------|-----------|------------|
| **go build** | Go 1.22+ | Single binary, cross-compile with GOOS/GOARCH. No runtime dependencies. | HIGH |
| **goreleaser** (optional) | latest | Automated release builds for multiple platforms. Good for portfolio GitHub releases. | MEDIUM |

## Dependency Summary

**Required (3 external dependencies):**
1. `github.com/mark3labs/mcp-go` — MCP protocol
2. `github.com/joho/godotenv` (optional) — .env file loading
3. `github.com/pkg/browser` (optional) — Open browser for OAuth

**Everything else is Go stdlib.** This is a deliberate choice — minimal dependencies mean smaller binary, fewer supply chain risks, and easier maintenance.

## Anti-Recommendations

| Avoid | Reason |
|-------|--------|
| Express-style HTTP frameworks (gin, echo, fiber) | No HTTP server needed — stdio only |
| DynamoDB / any database | File-based token store is sufficient |
| Docker for distribution | Go produces static binaries — Docker adds unnecessary complexity |
| Cobra/Viper for CLI | This isn't a multi-command CLI — it's a single-purpose MCP server |
| Protocol Buffers | MCP uses JSON-RPC, not protobuf |

---
*Stack research: 2026-03-26*

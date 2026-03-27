---
phase: 01-foundation-and-auth
plan: 01
subsystem: infra
tags: [go, mcp, mcp-go, token-store, config, slog, stdio]

# Dependency graph
requires: []
provides:
  - "Go module (strava-mcp) with mcp-go, x/sync, pkg/browser dependencies"
  - "Config loader (config.Load) reading STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_TOKEN_PATH"
  - "FileTokenStore with atomic write-then-rename, 0600 permissions, 5-min expiry buffer"
  - "MCP server shell via mcp-go ServeStdio with empty tool list"
  - "main.go entry point with --version, --debug, auth subcommand dispatch"
  - "tools.RegisterAll wiring point for Phase 2 tool registration"
affects: [01-02, phase-2-tools]

# Tech tracking
tech-stack:
  added: [go-1.25.7, mcp-go-v0.46.0, golang.org/x/sync-v0.20.0, pkg/browser]
  patterns: [atomic-write-then-rename, slog-stderr-only, stdio-mcp-transport, env-var-config]

key-files:
  created:
    - go.mod
    - go.sum
    - main.go
    - internal/config/config.go
    - internal/config/config_test.go
    - internal/auth/tokenstore.go
    - internal/auth/tokenstore_test.go
    - internal/server/server.go
    - internal/server/server_test.go
    - internal/tools/register.go
  modified:
    - .gitignore

key-decisions:
  - "mcp-go v0.46.0 pinned as MCP SDK (latest stable at execution time)"
  - "All logging to stderr via slog; stdout reserved for MCP JSON-RPC"
  - "Token file stores only access_token, refresh_token, expires_at; no client credentials"
  - "pkg/browser Stdout/Stderr redirected to os.Stderr at startup as safety net"

patterns-established:
  - "Atomic file write: write to .tmp, fsync, os.Rename for crash safety"
  - "Stderr-only logging: slog.NewTextHandler(os.Stderr), log.SetOutput(os.Stderr)"
  - "Config from env vars: config.Load() validates required vars, returns actionable errors"
  - "Internal package layout: internal/config, internal/auth, internal/server, internal/tools"

requirements-completed: [INFRA-01, INFRA-02, INFRA-05]

# Metrics
duration: 5min
completed: 2026-03-27
---

# Phase 1 Plan 01: Go Project Scaffold Summary

**Go binary with mcp-go stdio server shell, file-based token store with atomic writes, and env-var config loader with validation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T07:22:56Z
- **Completed:** 2026-03-27T07:28:13Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Go project scaffolded from scratch with go.mod, all dependencies pinned
- Config loader validates STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET with actionable error messages pointing to Strava API settings page
- FileTokenStore implements atomic write-then-rename with 0600 file permissions, 5-minute expiry buffer, and directory auto-creation
- MCP server shell responds to protocol handshake via stdio with empty tool list
- main.go dispatches auth/server/version subcommands with all output to stderr
- 16 tests pass including race detector (5 config + 9 token store + 2 server)

## Task Commits

Each task was committed atomically:

1. **Task 1: Go project scaffold, config loader, and file-based token store**
   - `98ddd1d` (test: failing tests for config and token store - TDD RED)
   - `af91568` (feat: config loader and token store implementation - TDD GREEN)
2. **Task 2: MCP server shell, tool registration wiring, and main.go** - `1d77dee` (feat)

## Files Created/Modified
- `go.mod` - Module definition with mcp-go v0.46.0, x/sync v0.20.0, pkg/browser
- `go.sum` - Dependency checksums
- `main.go` - Entry point with subcommand dispatch, slog stderr logging, version flags
- `internal/config/config.go` - Environment variable loading with defaults and validation
- `internal/config/config_test.go` - 5 config tests covering env vars, validation, defaults
- `internal/auth/tokenstore.go` - TokenStore interface and FileTokenStore with atomic writes
- `internal/auth/tokenstore_test.go` - 9 token store tests covering CRUD, atomicity, permissions, expiry
- `internal/server/server.go` - MCP server creation and tool registration orchestration
- `internal/server/server_test.go` - 2 server creation tests
- `internal/tools/register.go` - Empty RegisterAll wiring point for Phase 2
- `.gitignore` - Added Go binary and build artifacts

## Decisions Made
- Pinned mcp-go v0.46.0 (latest at execution time) per research recommendation
- Used `mcpserver` alias for mcp-go/server to avoid collision with internal/server package
- Token file stores only access_token, refresh_token, expires_at per CONTEXT.md (no client credentials)
- Set browser.Stdout and browser.Stderr to os.Stderr at main() startup as stdout safety net

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all implemented functionality is fully wired.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness
- Config loader ready for Plan 02 to use in OAuth flow and Strava client
- Token store ready for Plan 02 to persist OAuth tokens
- MCP server shell ready for Phase 2 tool registration via tools.RegisterAll
- Blocker for Plan 02: OAuth redirect URI (http://localhost:19876/callback) must be registered in Strava developer console

## Self-Check: PASSED

All 12 files verified present. All 3 commit hashes verified in git log.

---
*Phase: 01-foundation-and-auth*
*Completed: 2026-03-27*

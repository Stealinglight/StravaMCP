---
phase: 01-foundation-and-auth
plan: 02
subsystem: auth
tags: [oauth, strava, singleflight, http-client, token-refresh, rate-limiting]

# Dependency graph
requires:
  - phase: 01-foundation-and-auth/01
    provides: "Config struct, TokenStore interface, FileTokenStore, MCP server shell, main.go entry point"
provides:
  - "Strava HTTP client with auto-refresh, singleflight, rate limit tracking (strava.Client, strava.NewClient)"
  - "OAuth browser flow with callback server, code exchange, GET /athlete validation (auth.RunOAuthFlow)"
  - "main.go fully wired: auth subcommand runs OAuth, default mode creates Strava client and starts MCP server"
  - "server.New() and tools.RegisterAll() accept *strava.Client for Phase 2 tool registration"
affects: [02-strava-tools, 03-polish]

# Tech tracking
tech-stack:
  added: [golang.org/x/sync/singleflight]
  patterns: [singleflight-for-concurrent-refresh, httptest-mock-servers, test-url-override-via-setters]

key-files:
  created:
    - internal/strava/client.go
    - internal/strava/client_test.go
    - internal/auth/oauth.go
    - internal/auth/oauth_test.go
  modified:
    - main.go
    - internal/server/server.go
    - internal/server/server_test.go
    - internal/tools/register.go
    - go.mod
    - go.sum

key-decisions:
  - "Token URL and base URL overridable via SetBaseURL/SetTokenURL for test isolation"
  - "ExchangeCode and FetchAthleteName accept endpoint URL parameter for testability"
  - "NewCallbackHandler returns http.Handler for direct httptest testing without starting server"
  - "Error page uses 'try again' phrasing per CONTEXT.md; success page auto-closes via setTimeout"

patterns-established:
  - "httptest.NewServer for Strava API mocking: all client tests use local mock servers, never hit real Strava"
  - "singleflight.Group for concurrent token refresh: refreshGroup.Do('refresh', ...) coalesces N callers"
  - "Token persistence before use: store.Write() called before access token is used for any API call"
  - "AsStravaError() helper for errors.As type checking on StravaError"

requirements-completed: [INFRA-03, INFRA-04]

# Metrics
duration: 8min
completed: 2026-03-27
---

# Phase 01 Plan 02: Strava Client and OAuth Summary

**Strava HTTP client with singleflight token refresh and browser OAuth flow with GET /athlete end-to-end validation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-27T07:32:46Z
- **Completed:** 2026-03-27T07:40:25Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Strava HTTP client (Get/Post/Put) with automatic token refresh coalesced via singleflight, 401 retry, and rate limit tracking from X-RateLimit headers
- OAuth browser flow on port 19876 with CSRF state validation, code exchange, token persistence, and GET /athlete validation confirming end-to-end auth chain
- main.go fully wired: `strava-mcp auth` runs real OAuth flow, bare `strava-mcp` creates config + token store + Strava client + MCP server
- 31 total tests across all packages pass with -race detector, go vet clean, binary compiles

## Task Commits

Each task was committed atomically (TDD: test then feat):

1. **Task 1: Strava HTTP client** - `7673e35` (test: failing tests) + `be6e024` (feat: full implementation)
2. **Task 2: OAuth browser flow and main.go wiring** - `1f5f965` (test: failing tests) + `eb0f738` (feat: full implementation)

_Note: TDD tasks have two commits each (RED: test, GREEN: feat). No refactor commits needed._

## Files Created/Modified

- `internal/strava/client.go` - Strava API HTTP client with auto-refresh, singleflight, rate limits, StravaError
- `internal/strava/client_test.go` - 12 tests: Bearer auth, auto-refresh, singleflight, 401 retry, errors, rate limits, POST/PUT
- `internal/auth/oauth.go` - OAuth browser flow: callback handler, code exchange, fetchAthleteName, RunOAuthFlow
- `internal/auth/oauth_test.go` - 10 tests: callback extraction, state validation, error handling, URL params, GET /athlete
- `main.go` - runAuth() calls real OAuth, runServer() creates Strava client and passes to server
- `internal/server/server.go` - New() accepts *strava.Client parameter
- `internal/server/server_test.go` - Updated to pass nil client for Phase 1
- `internal/tools/register.go` - RegisterAll() accepts *strava.Client for Phase 2
- `go.mod` - Added golang.org/x/sync dependency
- `go.sum` - Updated checksums

## Decisions Made

- Token URL and API base URL are overridable via setter methods (SetBaseURL/SetTokenURL) rather than constructor params, keeping production constructor clean while enabling test isolation
- ExchangeCode() and FetchAthleteName() accept endpoint URL as parameter for testability without global variable mutation
- Callback handler exposed as NewCallbackHandler() returning http.Handler, enabling direct httptest.NewRecorder testing without starting a real HTTP server
- Error page phrasing "Please try again by running strava-mcp auth" to match CONTEXT.md "try again" requirement while being grammatically clear

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Error page HTML template had "try running ... again" with "try" and "again" separated by HTML tags, causing test assertion failure. Fixed by rephrasing to "try again by running" to keep the "try again" substring adjacent. Trivial fix, not a deviation.

## User Setup Required

**External services require manual configuration.** Per plan frontmatter user_setup:
- Set `STRAVA_CLIENT_ID` env var (from https://www.strava.com/settings/api)
- Set `STRAVA_CLIENT_SECRET` env var (from https://www.strava.com/settings/api)
- Set Authorization Callback Domain to `localhost` in Strava developer console

## Next Phase Readiness

- Full auth chain operational: OAuth -> token persistence -> auto-refresh client -> MCP server
- tools.RegisterAll(s, client) accepts *strava.Client, ready for Phase 2 tool implementation
- Rate limit tracking operational, RateLimitWarning() available for tool responses
- All infrastructure requirements (INFRA-01 through INFRA-05) complete

## Self-Check: PASSED

- All 4 created files verified present on disk
- All 4 commit hashes verified in git log
- All acceptance criteria patterns verified in source code
- 31 tests pass with -race, go vet clean, binary compiles

---
*Phase: 01-foundation-and-auth*
*Completed: 2026-03-27*

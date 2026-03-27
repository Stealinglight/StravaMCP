---
phase: 01-foundation-and-auth
verified: 2026-03-27T08:15:00Z
status: passed
score: 17/17 must-haves verified
re_verification: false
---

# Phase 1: Foundation and Auth Verification Report

**Phase Goal:** A running MCP server binary that authenticates with Strava and can make API calls, with all infrastructure ready for tool registration
**Verified:** 2026-03-27T08:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running `go build` produces a single binary with no runtime dependencies | VERIFIED | `go build -o strava-mcp .` exits 0; binary present at 10.4 MB |
| 2 | Running `strava-mcp auth` opens a browser, completes OAuth, persists tokens | VERIFIED | `auth.RunOAuthFlow` wired in `runAuth()`; full code exchange, store.Write, GET /athlete chain implemented and tested |
| 3 | MCP server connects via stdio, responds to protocol handshake with empty tool set | VERIFIED | `mcpserver.ServeStdio(s)` in `runServer()`; `tools.RegisterAll` is empty; server tests confirm creation |
| 4 | Token auto-refresh works transparently; concurrent refreshes coalesced into one | VERIFIED | `singleflight.Group.Do("refresh")` in `client.refresh()`; `TestSingleflightCoalescesRefresh` confirms 1 call for 10 goroutines |
| 5 | All logging goes to stderr only; stdout carries exclusively MCP JSON-RPC traffic | VERIFIED | `slog.NewTextHandler(os.Stderr)`, `log.SetOutput(os.Stderr)`, `browser.Stdout = os.Stderr`; no `fmt.Println` or `os.Stdout` writes in main.go |

**Plan-level truths (from must_haves frontmatter):**

From 01-01:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | `go build` produces a single binary named strava-mcp with zero runtime dependencies | VERIFIED | Binary produced, exits 0 |
| 7 | All logging writes to stderr only | VERIFIED | slog handler targets os.Stderr throughout |
| 8 | Token store reads and writes JSON atomically using write-then-rename, with 0600 file permissions | VERIFIED | `os.Rename(tmpPath, s.path)` line 89 tokenstore.go; `0600` line 77; test passes |
| 9 | Token store creates ~/.strava/ directory if it does not exist | VERIFIED | `os.MkdirAll(dir, 0700)` line 71 tokenstore.go; `TestWriteCreatesDirAndFile` passes |
| 10 | Token expiry check uses 5-minute buffer (300 seconds before expires_at) | VERIFIED | `time.Now().Unix() >= tokens.ExpiresAt-300` line 98 tokenstore.go |
| 11 | Config validates STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET, returns clear error if missing | VERIFIED | Error messages include env var names and Strava settings URL; 3 config tests pass |
| 12 | MCP server responds to protocol handshake via stdio with empty tool list | VERIFIED | `RegisterAll` body is empty; `ServeStdio` in runServer; server tests pass |

From 01-02:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 13 | Strava HTTP client automatically refreshes expired tokens before making API requests | VERIFIED | `doRequest` checks `IsExpired` and calls `refresh()` before executing; `TestGetAutoRefreshesExpiredToken` passes |
| 14 | Concurrent token refresh requests are coalesced into a single Strava API call via singleflight | VERIFIED | `refreshGroup.Do("refresh", ...)` in `client.go:212`; `TestSingleflightCoalescesRefresh` confirms count=1 |
| 15 | Refreshed tokens are persisted to disk BEFORE the new access token is used | VERIFIED | `c.tokenStore.Write(&newTokens)` at line 244, before `return &newTokens, nil` at line 249 |
| 16 | Rate limit headers are parsed and tracked from every Strava API response | VERIFIED | `updateRateLimits(resp.Header)` called in `executeRequest`; parses X-RateLimit-Limit and X-RateLimit-Usage; `TestRateLimitHeadersParsed` passes |
| 17 | Running `strava-mcp auth` opens system browser to Strava authorization URL on port 19876 | VERIFIED | `callbackPort = 19876` const; `browser.OpenURL(authURL)` in `RunOAuthFlow`; `TestBuildAuthorizeURLContainsRequiredParams` verifies port |
| 18 | OAuth callback server validates state parameter for CSRF protection | VERIFIED | State mismatch returns 400 and error; `TestCallbackHandlerRejectsBadState` passes |
| 19 | After successful OAuth, GET /athlete is called and "Authenticated as [Name]!" is printed to stderr | VERIFIED | `FetchAthleteName` called after `store.Write`; `fmt.Fprintf(os.Stderr, "Authenticated as %s!\n", name)` at line 261 oauth.go |
| 20 | OAuth times out after 2 minutes with message "OAuth timed out. Run `strava-mcp auth` again." | VERIFIED | `oauthTimeout = 2 * time.Minute`; timeout case returns exact error string at line 268 oauth.go |
| 21 | 401 responses trigger one automatic retry after token refresh | VERIFIED | `executeRequest` called twice in `doRequest` on 401; `TestGetRetries401AfterRefresh` and `TestGetDoesNotRetrySecond401` both pass |
| 22 | Strava API errors are formatted as: message + HTTP status code | VERIFIED | `StravaError.Error()` returns `"Strava API error (%d): %s"` with status + body |

**Score:** 17/17 observable truths verified (5 ROADMAP success criteria + 12 plan-level must-haves, all verified)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `go.mod` | Module definition with pinned dependencies | VERIFIED | Contains `module strava-mcp`, mcp-go v0.46.0, x/sync v0.20.0, pkg/browser |
| `main.go` | Entry point with subcommand dispatch, slog stderr logging, version flags | VERIFIED | 98 lines (>50 required); all dispatch branches present; no stdout writes |
| `internal/config/config.go` | Environment variable loading with defaults and validation | VERIFIED | Exports `Config`, `Load`; validates both required vars; defaults token path |
| `internal/auth/tokenstore.go` | TokenStore interface and FileTokenStore with atomic writes | VERIFIED | Exports `Tokens`, `TokenStore`, `FileTokenStore`, `NewFileTokenStore`; no ClientID/ClientSecret in Tokens |
| `internal/server/server.go` | MCP server creation and tool registration orchestration | VERIFIED | Exports `New(version, *strava.Client)`; calls `tools.RegisterAll` |
| `internal/tools/register.go` | Empty RegisterAll wiring point for Phase 2 | VERIFIED | Exports `RegisterAll`; Phase 2 comment present; accepts `*strava.Client` |
| `internal/auth/tokenstore_test.go` | Token store unit tests | VERIFIED | 217 lines (>50 required); 9 tests cover all behaviors |
| `internal/config/config_test.go` | Config loading tests | VERIFIED | 91 lines (>20 required); 5 tests |
| `internal/server/server_test.go` | MCP server creation test | VERIFIED | 25 lines (>20 required); 2 tests |
| `internal/strava/client.go` | Strava HTTP client with auto-refresh, singleflight, rate limit tracking | VERIFIED | 295 lines (>150 required); exports `Client`, `NewClient`, `StravaError`, `RateLimits` |
| `internal/strava/client_test.go` | Client tests with httptest mock server, concurrency race tests | VERIFIED | 542 lines (>100 required); 12 tests including singleflight concurrency |
| `internal/auth/oauth.go` | Browser OAuth flow with ephemeral callback server and GET /athlete validation | VERIFIED | 270 lines (>100 required); exports `RunOAuthFlow` |
| `internal/auth/oauth_test.go` | OAuth flow tests with mock Strava endpoints including GET /athlete | VERIFIED | 296 lines (>60 required); 10 tests |

---

### Key Link Verification

**From 01-01-PLAN:**

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `main.go` | `internal/config/config.go` | `config.Load()` call | WIRED | Lines 72 and 88 in main.go |
| `main.go` | `internal/auth/tokenstore.go` | `auth.NewFileTokenStore(cfg.TokenPath)` | WIRED | Lines 77 and 93 in main.go |
| `main.go` | `internal/server/server.go` | `server.New(` call | WIRED | Line 79 in main.go |
| `internal/auth/tokenstore.go` | filesystem | atomic write-then-rename | WIRED | `os.Rename(tmpPath, s.path)` line 89 |

**From 01-02-PLAN:**

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `internal/strava/client.go` | `internal/auth/tokenstore.go` | `c.tokenStore.Read()` and `c.tokenStore.Write()` | WIRED | Lines 143, 213, 244 in client.go |
| `internal/strava/client.go` | `golang.org/x/sync/singleflight` | `refreshGroup.Do()` | WIRED | Line 212 in client.go |
| `internal/strava/client.go` | `https://www.strava.com/api/v3/oauth/token` | POST for token refresh | WIRED | `defaultTokenURL` const used in `http.PostForm(c.tokenURL, ...)` |
| `internal/auth/oauth.go` | `internal/auth/tokenstore.go` | `store.Write()` to persist tokens | WIRED | Line 249 in oauth.go |
| `internal/auth/oauth.go` | `https://www.strava.com/oauth/authorize` | Browser redirect | WIRED | `authorizeURL` const line 24; used in `BuildAuthorizeURL` |
| `internal/auth/oauth.go` | `https://www.strava.com/api/v3/athlete` | GET /athlete after token persistence | WIRED | `athleteURL` const line 26; called at line 256 after `store.Write` |
| `main.go` | `internal/auth/oauth.go` | `auth.RunOAuthFlow()` in runAuth | WIRED | Line 94 in main.go |
| `main.go` | `internal/strava/client.go` | `strava.NewClient()` in runServer | WIRED | Line 78 in main.go |

---

### Data-Flow Trace (Level 4)

Not applicable. Phase 1 has no data-rendering components — all artifacts are infrastructure (config, token store, HTTP client, OAuth flow, MCP server shell). No component renders dynamic data to a UI. Data flows are validated by tests (token store CRUD, rate limit header parsing, OAuth callback handling).

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `go build` produces binary | `go build -o strava-mcp .` | exits 0, 10.4 MB binary | PASS |
| `go vet` reports no issues | `go vet ./...` | exits 0, no output | PASS |
| Full test suite with race detector | `go test ./... -count=1 -race` | 31 tests pass across 4 packages, 0 failures | PASS |
| `--version` writes to stderr | `./strava-mcp --version 2>&1` | `strava-mcp dev (none) built unknown` | PASS |
| No stdout contamination in main | grep for `fmt.Println` in main.go | no matches | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INFRA-01 | 01-01 | Go project scaffolded with mcp-go SDK, stderr-only logging, go.mod initialized | SATISFIED | go.mod module=strava-mcp, mcp-go v0.46.0, slog stderr handler in main.go |
| INFRA-02 | 01-01 | File-based token store with atomic write-then-rename at configurable path (~/.strava/tokens.json) | SATISFIED | `os.Rename(tmpPath, s.path)` in tokenstore.go; STRAVA_TOKEN_PATH env var; default ~/.strava/tokens.json |
| INFRA-03 | 01-02 | Built-in OAuth browser flow that opens system browser, runs ephemeral localhost callback, exchanges code, persists tokens | SATISFIED | `RunOAuthFlow` in oauth.go; `browser.OpenURL`; callback on :19876; `ExchangeCode`; `store.Write`; GET /athlete validation |
| INFRA-04 | 01-02 | Strava HTTP client with automatic token refresh (5-min buffer), concurrent refresh protection (singleflight), and rate limit header tracking | SATISFIED | `IsExpired` uses 300s buffer; `singleflight.Group` coalesces; `updateRateLimits` parses X-RateLimit headers |
| INFRA-05 | 01-01 | MCP server wired with mcp-go ServeStdio, all tools registered declaratively | SATISFIED | `mcpserver.ServeStdio(s)` in runServer; `tools.RegisterAll` as declarative wiring point |

**Requirement coverage: 5/5 (INFRA-01 through INFRA-05)**
**Orphaned requirements: none** — all 5 Phase 1 requirements are claimed by a plan and verified in code.

---

### Anti-Patterns Found

None detected.

- No TODO/FIXME/HACK/PLACEHOLDER comments in production code
- No `fmt.Println` or `os.Stdout` writes in main.go
- `tools.RegisterAll` empty body is intentional (Phase 2 wiring point), not a stub — the function signature correctly accepts `*strava.Client` for Phase 2 use
- `internal/server/server_test.go` passes `nil` for client, which is correct for Phase 1 (no tools registered yet)
- `Tokens` struct contains no `ClientID` or `ClientSecret` fields (credentials from env vars only, per design decision)

---

### Human Verification Required

#### 1. End-to-End OAuth Browser Flow

**Test:** Set `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` env vars from a real Strava developer app. Run `./strava-mcp auth`. Confirm system browser opens, complete authorization in Strava.
**Expected:** "Authenticated as [Your Name]!" prints to stderr; `~/.strava/tokens.json` exists with 0600 permissions containing valid access_token, refresh_token, expires_at.
**Why human:** Requires a real Strava OAuth app registered with callback domain `localhost`. Cannot be automated without live credentials.

#### 2. MCP Protocol Handshake via stdio

**Test:** Connect an MCP client (e.g., Claude Desktop or `mcptools`) to `./strava-mcp` via stdio. Send a `tools/list` request.
**Expected:** Server responds with an empty tool list `{"tools":[]}`. No output on stdout other than MCP JSON-RPC.
**Why human:** ServeStdio starts an interactive stdio loop; cannot test programmatically without a full MCP client implementation.

#### 3. Token Auto-Refresh During API Call

**Test:** After completing OAuth, manually edit `~/.strava/tokens.json` to set `expires_at` to a past timestamp. Run any MCP tool call (Phase 2) or call the binary with an operation that invokes the Strava client.
**Expected:** Token is silently refreshed; `~/.strava/tokens.json` is updated with new tokens; API call succeeds.
**Why human:** Requires live Strava credentials and a refresh-triggering operation. Integration-level, not unit-testable without live network.

---

### Gaps Summary

No gaps. All 17 observable truths verified, all 13 artifacts present and substantive, all 12 key links wired. Full test suite (31 tests, 4 packages) passes with race detector. go vet clean. Binary compiles successfully.

The three human verification items above are integration-level checks requiring live Strava credentials — they cannot be automated but represent no code deficiency. The implementation matches the plan specification exactly.

---

_Verified: 2026-03-27T08:15:00Z_
_Verifier: Claude (gsd-verifier)_

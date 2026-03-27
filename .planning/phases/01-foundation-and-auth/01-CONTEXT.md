# Phase 1: Foundation and Auth - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

A running MCP server binary that authenticates with Strava and can make API calls, with all infrastructure ready for tool registration. Covers: Go project scaffold, file-based token store, OAuth browser flow, Strava HTTP client with auto-refresh, and MCP server wiring via mcp-go ServeStdio. Tool implementations are Phase 2.

</domain>

<decisions>
## Implementation Decisions

### OAuth flow experience
- Fixed callback port 19876 — user registers `http://localhost:19876/callback` once in Strava developer console
- Success page auto-closes the browser tab via JavaScript after a brief "Done!" flash
- 2-minute timeout — if user doesn't complete OAuth, server shuts down with stderr message: "OAuth timed out. Run `strava-mcp auth` again."
- Failure shows error in both browser (what went wrong + "try again") and terminal stderr (technical details)
- After successful OAuth, validate by calling GET /athlete and print "Authenticated as [Name]!" to confirm end-to-end

### Configuration approach
- Env vars only for credentials: `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` — no config file, no .env loading
- Token path defaults to `~/.strava/tokens.json`, overridable via `STRAVA_TOKEN_PATH` env var
- All OAuth scopes requested upfront: `read,read_all,profile:read_all,profile:write,activity:read_all,activity:write` — no incremental re-auth

### CLI surface design
- `strava-mcp auth` subcommand runs OAuth flow; bare `strava-mcp` starts MCP server
- `--version` flag prints version, commit hash, and build date (via Go ldflags)
- `--debug` flag enables verbose logging: all HTTP requests, token refreshes, rate limit status
- Normal mode (no --debug): minimal stderr output

### Error and logging behavior
- Structured logging via Go `log/slog` with timestamps to stderr (e.g., `2026-03-26T10:15:00 INFO server started`)
- Normal mode logs: server startup, auth events, errors only — no individual tool calls or token refreshes
- Debug mode (--debug) adds: HTTP requests, token refresh events, rate limit tracking
- Strava API errors surface in MCP tool results as: Strava error message + HTTP status code (e.g., "403 Forbidden: Rate limit exceeded. Try again in 15 minutes.")
- Rate limit proximity warning appended to tool results when >80% of 15-min quota is used (e.g., "Note: 85/100 API calls used in this 15-min window.")

### Claude's Discretion
- Exact HTML/CSS for OAuth success and failure browser pages
- slog handler configuration details
- Internal package naming within the five-layer structure
- Token backup file strategy (.backup alongside tokens.json)
- Exact rate limit threshold percentage (80% is the guideline, not hard requirement)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Strava API and OAuth
- `.planning/research/STACK.md` — SDK choice (mcp-go v0.26+), dependency strategy, manual OAuth rationale
- `.planning/research/ARCHITECTURE.md` — Five-layer package structure, component boundaries, data flow
- `.planning/research/PITFALLS.md` — Critical pitfalls: stdout corruption (#1), token rotation loss (#2), concurrent refresh race (#3), JSON type mismatches (#4)
- `.planning/research/FEATURES.md` — Tool descriptions as product requirement, scope tiers, anti-features

### Existing TypeScript reference
- `src/lib/strava-client.ts` — Token refresh pattern with 5-min buffer and concurrent refresh protection (port to Go singleflight)
- `src/config/types.ts` — StravaTokens interface (access_token, refresh_token, expires_at) — token file format reference
- `src/tools/activities.ts` — Tool registration pattern and Zod schema style (reference for mcp-go equivalent)

### Project context
- `.planning/REQUIREMENTS.md` — INFRA-01 through INFRA-05 requirements for this phase
- `.planning/PROJECT.md` — RustyClaw ecosystem context, portfolio piece goals, constraints

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/strava-client.ts` — StravaClient class with token refresh logic, 5-min buffer, concurrent refresh protection via promise deduplication. Port the refresh pattern to Go using `singleflight`.
- `src/config/types.ts` — StravaTokens interface defines the token file format: `{ access_token, refresh_token, expires_at }`. Go token store should persist the same JSON shape.
- `src/tools/activities.ts` — Tool registration pattern using Zod schemas and `withErrorHandling` wrapper. Reference for how tools are structured (schema + handler + error wrapping).

### Established Patterns
- **Token refresh**: 5-minute expiry buffer, promise-based deduplication for concurrent callers (maps to `singleflight` in Go)
- **API base URL**: `https://www.strava.com/api/v3` — hardcoded, no per-environment variation
- **Auth header**: `Bearer {access_token}` on every request
- **Error logging**: All logging to stderr via `console.error()` — Go version enforces this via `slog` to stderr

### Integration Points
- Token file at `~/.strava/tokens.json` — same location used by RustyClaw ecosystem
- MCP stdio transport — stdout is exclusively MCP JSON-RPC traffic, stderr for all logging
- Strava OAuth token endpoint: `https://www.strava.com/oauth/token` for refresh
- Strava OAuth authorize URL: `https://www.strava.com/oauth/authorize` for initial auth

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The research summary already provides detailed architectural guidance that should be followed.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-and-auth*
*Context gathered: 2026-03-26*

# Project Research Summary

**Project:** Strava MCP — Go rewrite of TypeScript MCP server for Strava API v3
**Domain:** Go-based MCP tool server wrapping a third-party REST API (stdio transport)
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

This project is a rewrite of an existing 11-tool TypeScript MCP server into Go, targeting the `mark3labs/mcp-go` SDK with stdio transport and zero external infrastructure. The product category is well-understood: a local binary that Claude and other MCP clients call to interact with a user's Strava data. The recommended approach is a five-layer internal package structure (config -> tokenstore -> strava client -> tools -> MCP server) built bottom-up in strict dependency order. Minimal external dependencies (essentially one: `mcp-go`) keep the binary small, distribution simple, and the supply chain clean. The project has a clear competitive benchmark in `r-huijts/strava-mcp` (302 stars, TypeScript, 25 tools) and meaningful differentiators: write operations (create/update activity), upload support, single Go binary with no runtime dependency, and a new built-in OAuth browser flow that eliminates manual token setup.

The key risk is the OAuth/token layer. Strava rotates refresh tokens on every refresh, which means a failed atomic write to disk causes permanent authentication loss requiring the user to re-authenticate. This risk is compounded by concurrent token refresh races when an LLM issues parallel tool calls — a pattern that is common in real MCP usage. Both must be solved in Phase 2 before any tool implementation begins. The secondary risk is the MCP stdio transport constraint: any non-JSON output on stdout corrupts the protocol, and Go's stdlib makes this easy to violate accidentally (fmt.Println vs log to stderr). This must be enforced from day one as a project-wide convention.

The phased build order is dictated by the dependency graph: token store and config first (no deps), then the Strava HTTP client (depends on token store), then core tools porting the existing 11, then the OAuth browser flow (can be parallelized), then extended tools (segments, routes, gear, laps) to reach 28 tools and beat the competitor on coverage. The project is scope-controlled by a clear anti-feature list: no webhooks, no bulk operations, no segment leaderboard (undocumented endpoint), no SSE transport. V1 ships 11 tools at parity with the existing TypeScript version. V1.x expands to 28 tools. V2+ adds social tools and advanced streams.

## Key Findings

### Recommended Stack

The stack is intentionally minimal. `mark3labs/mcp-go` (v0.26+, pinned to exact version) is the only critical external dependency — it implements the MCP spec (2025-11-25), provides `ServeStdio`, and handles all JSON-RPC dispatch. Everything else is Go stdlib: `net/http` for Strava API calls, `log/slog` writing exclusively to stderr, `encoding/json` for serialization, `net/http/httptest` for testing. OAuth token management is implemented manually rather than via `golang.org/x/oauth2` because Strava's token rotation requires atomic file writes that the `oauth2` package's `TokenSource` interface doesn't support cleanly. Tokens persist as JSON at `~/.strava/tokens.json` using a write-then-rename atomic pattern.

Two optional dependencies (`joho/godotenv` for .env loading, `pkg/browser` for opening the OAuth URL in a system browser) bring the total to 3 external packages at most. `goreleaser` is recommended for release builds. The official Go MCP SDK (`modelcontextprotocol/go-sdk`) is explicitly avoided in favor of `mark3labs/mcp-go` because it has a documented rough edges list and MCPGODEBUG behavioral changes between minor versions.

**Core technologies:**
- `mark3labs/mcp-go` v0.26+: MCP protocol implementation — most mature Go SDK, 4k+ stars, implements MCP 2025-11-25
- `net/http` (stdlib): Strava API HTTP client — zero dependencies, production-grade, keeps binary small
- `log/slog` (stdlib): Structured logging to stderr — never writes to stdout, no external logging library needed
- Manual OAuth implementation: Token refresh + browser flow — `golang.org/x/oauth2` doesn't handle file-based rotation without a complex custom `TokenSource` wrapper
- JSON file at `~/.strava/tokens.json`: Token persistence — atomic write-then-rename, matches RustyClaw pattern, crash-safe
- `testing` + `net/http/httptest` (stdlib): Test framework + mock server — captures real Strava responses as golden files in `testdata/`

### Expected Features

The features research is comprehensive — it maps all 33 documented Strava API v3 endpoints to planned tools, defines three priority tiers, and provides a competitor comparison table. The tool description quality (long, workflow-aware descriptions in the TypeScript originals) is identified as a first-class product requirement, not just documentation.

**Must have (table stakes, P1 — 11 tools + auth + README):**
- OAuth token auto-refresh with atomic file persistence — nothing works without it
- Built-in OAuth browser flow (`strava-mcp auth` subcommand) — eliminates manual token setup, new in Go version
- `list_activities`, `get_activity`, `create_activity`, `update_activity`, `get_activity_zones` — core activity operations
- `get_athlete`, `get_athlete_stats` — identity and training volume
- `get_activity_streams` — deep performance telemetry (HR, pace, power, GPS)
- `get_club_activities` — social/team feature
- `upload_activity` (proper multipart), `get_upload_status` — import from non-integrated devices
- Portfolio-quality README — this is a portfolio piece; README quality is launch-blocking

**Should have (differentiators, P2 — 17 additional tools targeting 28 total):**
- Segment tools: `list_starred_segments`, `get_segment`, `explore_segments`, `star_segment`, `list_segment_efforts`, `get_segment_effort`
- Route tools: `list_athlete_routes`, `get_route`, `export_route_gpx`, `export_route_tcx`
- Laps and gear: `get_activity_laps`, `get_gear`, `list_athlete_shoes`, `list_athlete_bikes`
- Athlete zones: `get_athlete_zones` (configured HR/power zone boundaries)
- Club expansion: `list_athlete_clubs`, `get_club`

**Defer (v2+, P3 — 8+ tools):**
- Activity social: `get_activity_comments`, `get_activity_kudos`, `get_activity_photos` (photos uses undocumented endpoint)
- Advanced streams: segment streams, segment effort streams, route streams
- Club admin tools (`list_club_members`, `list_club_admins`)
- Muscle group heat map integration (separate project per PROJECT.md)

**Explicit anti-features (never build):**
- Segment leaderboard (undocumented, requires Strava Summit subscription, may break)
- Webhook subscription management (requires public HTTP server, contradicts zero-infrastructure design)
- Activity deletion (destructive, no undo, LLM could delete activities by mistake)
- Bulk operations (rate limit risk, amplifies AI error surface)
- SSE/HTTP transport (out of scope, stdio only)

### Architecture Approach

The architecture is a five-layer internal package hierarchy with strict unidirectional dependencies and interface-based boundaries throughout. `main.go` at the root wires everything via dependency injection, dispatching to either `runOAuthFlow()` or `runServer()` based on a subcommand check. Tools are organized by Strava API domain (activities, athlete, streams, clubs, uploads, segments, routes, gear) in separate files under `internal/tools/`, each exporting a `Register(server, client)` factory function. A central `register.go` calls all of them in one `RegisterAll()` function. The `StravaClient` is an interface, enabling mock injection for unit tests.

**Major components:**
1. `internal/auth/tokenstore` — FileTokenStore with `sync.RWMutex`, write-then-rename atomic persistence, 5-minute expiry buffer
2. `internal/auth/oauth` — Ephemeral localhost HTTP server for OAuth callback, PKCE flow, separate `auth` subcommand lifecycle
3. `internal/strava` — HTTPClient implementing the Client interface; handles auto-refresh with `singleflight` to prevent concurrent refresh races; parses `X-RateLimit-*` headers; passes `context.Context` to all HTTP requests
4. `internal/tools/*` — Domain-grouped tool files; closure-based handler construction; return errors as `mcp.CallToolResult` with `isError: true`, never as Go errors; manual JSON schema definitions for complex parameter types
5. `internal/server` — MCP server setup and `RegisterAll()` orchestration via `mcp-go`'s `AddTool`

### Critical Pitfalls

1. **stdout corruption** — Any `fmt.Println` or library writing to os.Stdout corrupts the MCP JSON-RPC stream. Set `log.SetOutput(os.Stderr)` before anything else in `main()`. Use `slog` with stderr handler. Never use `fmt` for output in production code. Audit all dependencies. Test with MCP Inspector against stdio transport.

2. **Strava refresh token rotation loss** — Strava invalidates the old refresh token the moment a new one is issued. If the file write fails after the HTTP response succeeds, the token is permanently lost. Use write-then-rename atomic pattern. Persist new tokens BEFORE using the new access token. Add fsync. Keep a `.backup` token file for manual recovery.

3. **Concurrent token refresh race** — LLMs issue parallel tool calls; multiple goroutines simultaneously detect token expiry and fire concurrent refresh requests. Use `golang.org/x/sync/singleflight` for the refresh operation to coalesce concurrent callers into one refresh, with all waiters receiving the same result. Protect token state with `sync.RWMutex`.

4. **Go JSON type mismatches with Strava API** — Strava returns polymorphic JSON (latlng as `[[float,float]]` arrays, nullable fields, large int64 IDs that TypeScript `any` absorbs silently). All optional fields must be pointer types in Go structs (`*string`, `*float64`, `*int64`). Use `json.RawMessage` for stream data. Define `type LatLng [2]float64` with custom `UnmarshalJSON`. Capture real API responses as golden test fixtures from the working TypeScript version.

5. **Feature parity loss during rewrite** — The existing TypeScript tools have 50+ line descriptions that drive LLM behavior. These descriptions ARE the product. A Go rewrite that ports the API calls but truncates descriptions will ship a worse product. Store all descriptions as named string constants in a `descriptions.go` file, copied verbatim. Write a parity test.

## Implications for Roadmap

Based on the architecture's dependency graph and the pitfall phase warnings, the build order is non-negotiable at the lower layers and flexible at the upper layers.

### Phase 1: Project Scaffolding and Foundation

**Rationale:** The stdout corruption pitfall (Pitfall 1) and SDK pinning (Pitfall 4) must be addressed before a single line of application code is written. The project conventions that prevent these issues — stderr-only logging, pinned `go.mod`, interface-based architecture — are cheaper to establish at the start than to retrofit. This phase has no Strava API or OAuth dependencies; it is purely Go project setup.
**Delivers:** Go module initialized with pinned `mcp-go` dependency; `internal/config` loading env vars; stderr-only logging convention enforced; project layout scaffolded per architecture spec; CI build passing; MCP Inspector able to connect to an empty server.
**Addresses:** Configuration loading, project structure
**Avoids:** Pitfall 1 (stdout corruption), Pitfall 4 (SDK breaking changes)

### Phase 2: OAuth and Token Management

**Rationale:** OAuth is the absolute dependency of every tool. Building it second (not last) means the rest of the project can be tested against a real Strava API from day one. The three critical pitfalls (2, 3, 9) all live here and are interdependent — atomic writes, singleflight refresh, and the browser flow subcommand must be built together and tested as a unit before any tool touches the client.
**Delivers:** `internal/auth/tokenstore` with atomic write-then-rename and sync.RWMutex; `internal/auth/oauth` with ephemeral localhost callback server; `strava-mcp auth` subcommand that completes the full browser OAuth flow; token file persisted with all scopes (`read,read_all,profile:read_all,profile:write,activity:read_all,activity:write`); unit tests for tokenstore; end-to-end OAuth flow validated with real Strava credentials.
**Uses:** Manual OAuth implementation, `pkg/browser`, `sync.RWMutex`, `golang.org/x/sync/singleflight`
**Avoids:** Pitfall 2 (token rotation loss), Pitfall 3 (concurrent refresh race), Pitfall 9 (browser flow lifecycle)

### Phase 3: Strava HTTP Client

**Rationale:** The Strava client is the single dependency of all 33 tools. Build it once, correctly, with the interface boundary that enables testing. This phase also establishes the JSON type patterns (pointer fields, LatLng custom type, int64 IDs) that all tool implementations will follow. Establishing error handling patterns and rate limit tracking here prevents those concerns from being inconsistently handled across 28 tool files.
**Delivers:** `internal/strava/client.go` implementing the `Client` interface with auto-refresh (singleflight), context propagation, rate limit header parsing; `internal/strava/types.go` with all Strava API response structs (pointer fields for optionals, int64 for IDs, custom stream types); `testdata/` golden fixture files captured from real API responses; httptest-based unit tests covering all HTTP methods and error cases.
**Uses:** `net/http` stdlib, `encoding/json`, `golang.org/x/sync/singleflight`, `sync.RWMutex`
**Avoids:** Pitfall 5 (JSON type mismatches), Pitfall 8 (rate limits), Pitfall 11 (error handling verbosity), Pitfall 13 (int64 IDs), Pitfall 14 (context cancellation)

### Phase 4: Core Tools (Port Existing 11)

**Rationale:** Port the existing TypeScript tools to establish the tool registration pattern, validate the full chain from MCP client through tool handler through Strava client to API, and reach feature parity with the current deployed server. This phase must copy tool descriptions verbatim — they are the product UI. The upload tool's multipart form encoding requires special care (Pitfall 6) and should be implemented correctly here rather than deferred.
**Delivers:** 11 tools at full feature parity with the TypeScript version: `list_activities`, `get_activity`, `create_activity`, `update_activity`, `get_activity_zones`, `get_athlete`, `get_athlete_stats`, `get_activity_streams`, `get_club_activities`, `upload_activity` (proper multipart), `get_upload_status`; `descriptions.go` with all tool descriptions as named constants; `register.go` with `RegisterAll()`; MCP Inspector verification of all tool schemas; test that compares description length/content against TypeScript originals.
**Addresses:** All P1 table-stakes features
**Avoids:** Pitfall 6 (multipart upload encoding), Pitfall 7 (schema generation gaps), Pitfall 10 (feature parity loss), Pitfall 12 (omitempty on updates)

### Phase 5: Extended Tools (Segments, Routes, Gear, Laps — 17 new tools)

**Rationale:** With the patterns proven in Phase 4, adding 17 more tools is largely mechanical. Group them by Strava API domain (segments, routes, gear/laps) to match the file structure. The segment tool group is the most complex due to the explore-by-location endpoint and effort streams. Route export (GPX/TCX) requires handling binary/text responses differently from JSON. Gear tools are the simplest (extract from existing athlete profile response).
**Delivers:** 28 total tools; beats the competitor (r-huijts/strava-mcp) on coverage while maintaining single-binary Go advantage; `get_activity_laps`, `get_athlete_zones`, full segment suite (6 tools), full route suite (5 tools), gear suite (3 tools), extended club suite (2 tools).
**Addresses:** All P2 should-have features from FEATURES.md
**Uses:** Established patterns from Phase 4; route export tools use `io.ReadAll` + `base64.StdEncoding` to handle binary GPX/TCX responses

### Phase 6: Polish, README, and Release Pipeline

**Rationale:** The README is explicitly identified as launch-blocking for a portfolio piece. Polish includes rate limit exposure in tool responses, improved error messages, build pipeline (goreleaser for cross-platform binaries), and validation that all tool schemas correctly describe parameters (particularly enum arrays like stream `keys`). This phase should not start until all 28 tools are tested end-to-end.
**Delivers:** Portfolio-quality README with installation, authentication, tool reference, and usage examples; goreleaser config for macOS/Linux/Windows binaries; `get_rate_limit_status` tool exposing current quota state; final MCP Inspector verification of complete tool list; GitHub Actions release workflow.
**Addresses:** Portfolio README (P1 launch-blocking feature), binary distribution
**Avoids:** Pitfall 10 (descriptions as product), ensures README is not an afterthought

### Phase Ordering Rationale

- Phases 1-3 are strictly ordered by the dependency graph: config has no deps, tokenstore depends on config, OAuth depends on tokenstore, the Strava client depends on tokenstore — there is no valid reordering.
- Phase 4 (core tools) cannot start before Phase 3 (client) is complete and tested. The client interface must be stable before tool handlers are written against it.
- Phase 5 (extended tools) could be parallelized across tool groups (segments, routes, gear can be built simultaneously) but all depend on Phase 3's client and Phase 4's established patterns.
- Phase 6 cannot meaningfully start until Phase 5 is complete — a README written before all tools are implemented will be incomplete and require rewrite.
- The OAuth browser flow (Phase 2) is independent of the tool implementation (Phases 4-5) and could be parallelized with Phase 3 if resources allow, but it must precede any real API testing.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (OAuth flow):** The ephemeral localhost HTTP server pattern for OAuth in a stdio binary has edge cases (port conflicts, redirect URI mismatch with Strava app registration, PKCE vs implicit flow choice). Recommend verifying the exact Strava OAuth flow requirements against current API documentation at planning time.
- **Phase 5 (route export):** GPX/TCX export endpoints return raw XML, not JSON. The handling of binary/text vs JSON responses in `mcp-go` tool results needs verification — the `mcp.NewToolResultText` approach should work for XML strings but needs confirmation with the actual API response format.
- **Phase 5 (segment explore):** The `GET /segments/explore` bounds parameter format (SW lat/lng, NE lat/lng as a comma-separated string) is not clearly documented and the competitor's implementation should be reviewed at planning time.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Standard Go project scaffolding. Well-documented, no unknowns.
- **Phase 3:** Standard HTTP client with token management. The singleflight and atomic write patterns are established Go idioms.
- **Phase 4 (activities, athlete, streams, clubs):** Porting existing TypeScript tools to Go. The source is available; this is translation work, not research work.
- **Phase 6:** goreleaser and GitHub Actions patterns are well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All choices are cross-validated. `mcp-go` is confirmed as the right SDK. Minimal deps strategy is deliberate and well-reasoned. One uncertainty: `mcp-go` vs the official `modelcontextprotocol/go-sdk` — PITFALLS research recommends `mcp-go` but STACK.md also notes the official SDK has more contributors. Pin the version and isolate behind interfaces either way. |
| Features | HIGH | Based on official Strava API v3 Swagger spec and direct code review of the competitor. All 33 documented endpoints mapped. Anti-features are clearly reasoned. The only uncertainty is the undocumented photos endpoint (deferred to P3 deliberately). |
| Architecture | HIGH | Component boundaries, data flow, and build order are all clearly derived from the dependency graph. Patterns (closure-based handlers, interface injection, central error handling) are idiomatic Go. The subcommand architecture for auth vs serve is well-established for CLI OAuth tools. |
| Pitfalls | HIGH | 15 pitfalls documented, 5 critical. All critical pitfalls are confirmed with either official documentation (Strava token rotation, MCP spec stdout rule), SDK issue tracker evidence (schema generation gaps, race conditions), or direct analysis of the existing TypeScript codebase (token refresh promise pattern, type coercion with `any`). |

**Overall confidence:** HIGH

### Gaps to Address

- **OAuth redirect URI registration:** The Strava API application settings must have `http://localhost:19876/callback` (or whatever port is chosen) registered as an allowed redirect URI. This is a developer console configuration step that must happen before Phase 2 can be tested. Document this clearly in the setup guide.
- **`mcp-go` vs official SDK final decision:** STACK.md recommends `mcp-go` and PITFALLS.md warns about the official SDK's rough edges. This is already a clear recommendation for `mcp-go`, but the decision should be documented in a comment in `go.mod` for future maintainers.
- **Activity photos endpoint path:** The competitor implements this but it uses an undocumented Strava API endpoint. The actual path is unverified. Deferred to P3 correctly, but the path needs verification before implementation.
- **`/athletes/{id}/routes` vs `/routes/athletes/{id}` ambiguity:** FEATURES.md notes the route list endpoint path is inconsistent across documentation versions. Verify against the Strava API Swagger spec at planning time for Phase 5.
- **Rate limit tracking strategy:** PITFALLS.md recommends a token bucket in the Strava HTTP client, but FEATURES.md recommends exposing rate limit info to the LLM and letting it pace itself. These are not mutually exclusive — the client tracks limits and informs tool results — but the exact implementation needs a decision at Phase 3 planning time.

## Sources

### Primary (HIGH confidence)
- Strava API v3 Swagger spec: https://developers.strava.com/swagger/swagger.json — all endpoint definitions, field types, required/optional designations
- Strava Authentication docs: https://developers.strava.com/docs/authentication/ — OAuth flow, token rotation behavior, scope definitions
- Strava Rate Limits docs: https://developers.strava.com/docs/rate-limits — limit values and header names
- mark3labs/mcp-go GitHub: https://github.com/mark3labs/mcp-go — SDK API patterns, `AddTool`, `ServeStdio`, tool result types
- MCP Protocol specification: https://modelcontextprotocol.io/docs/learn/architecture — stdio transport constraints, JSON-RPC message format
- Go MCP SDK issue #572: https://github.com/modelcontextprotocol/go-sdk/issues/572 — stdout enforcement gap confirmation
- Existing TypeScript codebase: `/Volumes/DataDeuce/Projects/StravaMCP/src/` — tool descriptions, OAuth refresh pattern, type definitions
- Existing OpenClaw plugin: `/Volumes/DataDeuce/Projects/StravaMCP/openclaw-plugin/` — token file format, tool structure reference

### Secondary (MEDIUM confidence)
- r-huijts/strava-mcp (302 stars): https://github.com/r-huijts/strava-mcp — competitor feature set, undocumented endpoint patterns (segment leaderboard, activity photos)
- Go MCP SDK rough_edges.md: https://github.com/modelcontextprotocol/go-sdk/blob/main/docs/rough_edges.md — schema generation issues, API instability warnings
- Go MCP SDK issue #747, #437: schema generation gap details — confirms manual schema approach for complex tool parameters
- golang.org/x/sync/singleflight docs: https://pkg.go.dev/golang.org/x/sync/singleflight — concurrent refresh coalescing pattern

### Tertiary (LOW confidence — needs validation at implementation)
- Activity photos endpoint path — undocumented, inferred from competitor implementation
- `/athletes/{id}/routes` endpoint path — ambiguous across Strava documentation versions
- `pkg/browser` cross-platform behavior — assumed to work on macOS/Linux/Windows but not tested

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*

# Phase 2: Tool Suite - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Port all 11 existing Strava tools from the TypeScript implementation to Go MCP tools with full feature parity. Covers: activities (list, get, create, update, zones), athlete (profile, stats), streams, clubs, and uploads. Tools register via `tools.RegisterAll()` and use the `strava.Client` from Phase 1. No new Strava API coverage beyond what the TypeScript version provides.

</domain>

<decisions>
## Implementation Decisions

### Tool response format
- **D-01:** Return raw pretty-printed JSON from Strava API responses (`json.MarshalIndent` with 2-space indent). LLMs handle JSON well; the client/LLM summarizes as needed.
- **D-02:** Rate limit warning appended to tool response text only when usage exceeds 80% of the 15-minute window (carries forward from Phase 1 decision). No usage info in normal responses.

### Upload file handling
- **D-03:** Upload tool accepts a local file path string as input. The tool reads the file from disk and uploads via multipart form data to Strava.
- **D-04:** Auto-detect `data_type` (gpx/tcx/fit) from file extension. Accept optional explicit `data_type` param as override. Error if extension is unrecognized and no explicit type given.

### Tool description depth
- **D-05:** Port existing TypeScript descriptions as baseline, then improve any that are vague or missing context. Every parameter description should tell the LLM the expected format and valid range (e.g., "Items per page (1-200, default 30)").
- **D-06:** Tool names match the existing TypeScript names exactly (e.g., `get_activities`, `get_activity_by_id`, `create_activity`). Zero migration friction for existing MCP client configurations.

### Tool grouping and organization
- **D-07:** One Go file per Strava resource: `activities.go`, `athlete.go`, `streams.go`, `clubs.go`, `uploads.go` in `internal/tools/`. Each file contains tool definitions and handlers for that resource. `register.go` wires them all via `RegisterAll`.
- **D-08:** Co-located test files: `activities_test.go` next to `activities.go`, etc. Standard Go convention.

### Claude's Discretion
- Error handling wrapper pattern (Go equivalent of `withErrorHandling`)
- Internal helper functions for common patterns (param building, response formatting)
- Test mock server structure and shared test utilities
- Whether to split activities.go further if it gets too large (5 tools in one file)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing TypeScript tools (port source)
- `src/tools/activities.ts` -- 5 tools: get_activities, get_activity_by_id, create_activity, update_activity, get_activity_zones. Schemas define params, descriptions, and response types.
- `src/tools/athlete.ts` -- 2 tools: get_athlete, get_athlete_stats. Simple GET endpoints.
- `src/tools/streams.ts` -- 1 tool: get_activity_streams. Stream type enum and key selection.
- `src/tools/clubs.ts` -- 1 tool: get_club_activities. Paginated club member activities.
- `src/tools/uploads.ts` -- 2 tools: upload_activity, get_upload_status. Multipart upload and status polling.

### Go infrastructure (Phase 1 output)
- `internal/strava/client.go` -- Strava HTTP client with Get/Post/Put, auto-refresh, singleflight, rate limits
- `internal/tools/register.go` -- RegisterAll(s *MCPServer, client *Client) wiring point
- `internal/auth/tokenstore.go` -- TokenStore interface used by client

### Type references
- `src/config/types.ts` -- TypeScript type definitions for ActivitySummary, DetailedActivity, ActivityZones, Athlete, etc. Reference for what fields Strava returns.

### Codebase patterns
- `.planning/codebase/CONVENTIONS.md` -- Naming patterns, error handling, function design
- `.planning/codebase/ARCHITECTURE.md` -- Layer structure, tool execution flow, error handling strategy
- `.planning/research/FEATURES.md` -- Tool descriptions as product requirement, scope tiers
- `.planning/research/PITFALLS.md` -- Critical pitfalls: stdout corruption, token rotation, JSON type mismatches

### Project context
- `.planning/REQUIREMENTS.md` -- ACT-01 through ACT-05, ATH-01, ATH-02, STR-01, CLB-01, UPL-01, UPL-02
- `.planning/PROJECT.md` -- RustyClaw ecosystem context, portfolio piece goals

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `internal/strava/client.go` -- Client.Get(), Client.Post(), Client.Put() handle auth headers, token refresh, rate limit tracking, and error formatting. Tools just call these methods.
- `internal/strava/client.go` -- Client.RateLimitWarning() returns warning string when >80% of 15-min quota used. Tools append this to response text.
- `internal/strava/client.go` -- StravaError type with StatusCode and Body. Tools can type-assert errors to provide specific messages.

### Established Patterns
- **mcp-go tool registration:** `server.AddTool(tool, handler)` pattern from mcp-go SDK. Each tool defined with `mcp.NewTool()` and a handler function.
- **Error format:** "Strava API error (STATUS): BODY" from StravaError.Error(). Tools should surface this in MCP error responses.
- **Logging:** `slog.Debug/Info/Warn/Error` to stderr. Tools should log at Debug level for requests, Error for failures.

### Integration Points
- `internal/tools/register.go` -- RegisterAll(s, client) is the single entry point. Each resource file exports a register function called from here.
- `internal/strava/client.go` -- Client is passed to all tool handlers. Provides Get/Post/Put with transparent auth.
- `main.go` -- Already creates Client and passes to server.New(), which calls tools.RegisterAll().

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- the TypeScript tool implementations define the feature set. Port faithfully, improve descriptions where weak.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 02-tool-suite*
*Context gathered: 2026-03-27*

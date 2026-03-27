---
phase: 02-tool-suite
plan: 01
subsystem: api
tags: [mcp, strava, activities, go, mcp-go]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "strava.Client with Get/Post/Put, StravaError, RateLimitWarning, auth.TokenStore"
provides:
  - "FormatResponse and HandleToolError shared helpers for all tool files"
  - "newTestClient test factory for all tool test files"
  - "5 activity MCP tools: get_activities, get_activity_by_id, create_activity, update_activity, get_activity_zones"
  - "registerActivities function wired into RegisterAll"
affects: [02-tool-suite, 03-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Closure-over-client handler pattern: HandleXxx(client) returns server.ToolHandlerFunc"
    - "Map-based PUT body to avoid zero-value overwrite (request.GetArguments() for key existence)"
    - "FormatResponse for JSON pretty-print + rate limit warning (D-01, D-02)"
    - "HandleToolError for StravaError vs generic error formatting"

key-files:
  created:
    - internal/tools/helpers.go
    - internal/tools/helpers_test.go
    - internal/tools/activities.go
    - internal/tools/activities_test.go
  modified:
    - internal/tools/register.go

key-decisions:
  - "Used exported FormatResponse/HandleToolError (not lowercase) so _test package can access them directly"
  - "Used mcp-go v0.46.0 method-style API (request.GetInt, request.GetBool) instead of plan's mcp.ParseInt64 which does not exist in this SDK version"
  - "Tool descriptions ported verbatim from TypeScript including enrichment workflow guidance"

patterns-established:
  - "Handler closure pattern: func HandleXxx(client *strava.Client) server.ToolHandlerFunc"
  - "Test factory: newTestClient(serverURL) + mockTokenStore for httptest-based tool testing"
  - "Map-based partial update: iterate known fields against request.GetArguments() for PUT operations"

requirements-completed: [ACT-01, ACT-02, ACT-03, ACT-04, ACT-05]

# Metrics
duration: 7min
completed: 2026-03-27
---

# Phase 02 Plan 01: Shared Helpers and Activity Tools Summary

**FormatResponse/HandleToolError shared helpers plus 5 activity MCP tools (get, get_by_id, create, update, zones) with map-based partial update and 18 tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-27T23:25:39Z
- **Completed:** 2026-03-27T23:33:05Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Shared helpers FormatResponse (D-01 pretty JSON, D-02 rate limit warning) and HandleToolError (StravaError vs generic) established as foundation for all tool files
- All 5 activity tools implemented with exact TypeScript name parity (D-06) and full ported descriptions (D-05)
- update_activity uses map-based body via request.GetArguments() to prevent zero-value overwrite -- verified by dedicated test
- Test factory (newTestClient, mockTokenStore) reusable by all future tool test files
- 18 new tests passing, 49 total project tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared helpers and test utilities** - `f99c758` (test: RED) + `e93c76e` (feat: GREEN)
2. **Task 2: Five activity tool definitions, handlers, and tests** - `8c2bdcb` (test: RED) + `996097e` (feat: GREEN)

_TDD tasks have separate RED (failing test) and GREEN (implementation) commits._

## Files Created/Modified
- `internal/tools/helpers.go` - FormatResponse (pretty JSON + rate limit) and HandleToolError (StravaError formatting)
- `internal/tools/helpers_test.go` - 7 helper tests plus newTestClient/mockTokenStore test factories
- `internal/tools/activities.go` - 5 tool definitions, 5 handlers, registerActivities function
- `internal/tools/activities_test.go` - 11 activity tests including zero-value overwrite prevention
- `internal/tools/register.go` - Wired registerActivities into RegisterAll

## Decisions Made
- **Exported helper names:** Used FormatResponse/HandleToolError (uppercase) instead of plan's lowercase formatResponse/handleToolError so external test package (tools_test) can call them. Activity handlers in same package call them directly.
- **SDK API adaptation:** Plan referenced `mcp.ParseInt64` which doesn't exist in mcp-go v0.46.0. Used `request.GetInt()` method-style API instead (Rule 3: blocking issue).
- **Verbatim descriptions:** Ported TypeScript tool descriptions including enrichment workflow guidance, Apple Watch examples, and coaching perspective notes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted to mcp-go v0.46.0 method-style API**
- **Found during:** Task 2 (activity handler implementation)
- **Issue:** Plan referenced `mcp.ParseInt64(request, name, default)` and `mcp.ParseString()` which don't exist in mcp-go v0.46.0. The SDK uses method-style: `request.GetInt()`, `request.GetString()`, `request.GetBool()`.
- **Fix:** Used `request.GetInt("field", 0)`, `request.GetString("field", "")`, `request.GetBool("field", false)` throughout all handlers
- **Files modified:** internal/tools/activities.go
- **Verification:** All 18 tests pass, go vet clean
- **Committed in:** 996097e (Task 2 commit)

**2. [Rule 3 - Blocking] Exported helper function names for test access**
- **Found during:** Task 1 (helper test compilation)
- **Issue:** Plan specified lowercase `formatResponse`/`handleToolError` but tests are in `tools_test` package (external), needing exported names
- **Fix:** Named functions `FormatResponse` and `HandleToolError` (exported)
- **Files modified:** internal/tools/helpers.go, internal/tools/helpers_test.go
- **Verification:** Tests compile and pass
- **Committed in:** e93c76e (Task 1 commit)

**3. [Rule 3 - Blocking] Fixed CallToolRequest struct construction in tests**
- **Found during:** Task 2 (activity test compilation)
- **Issue:** Plan used anonymous struct for request.Params with `mcp.RequestMeta` which doesn't exist. SDK uses `mcp.CallToolParams` struct.
- **Fix:** Used `mcp.CallToolParams{Arguments: args}` in test helper
- **Files modified:** internal/tools/activities_test.go
- **Verification:** Tests compile and pass
- **Committed in:** 8c2bdcb (Task 2 RED commit)

---

**Total deviations:** 3 auto-fixed (3 blocking -- all SDK API adaptation)
**Impact on plan:** All auto-fixes necessary to work with actual mcp-go v0.46.0 API. No scope creep. Behavior and architecture exactly as planned.

## Issues Encountered
None beyond the SDK API differences documented as deviations.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all tools are fully wired to strava.Client API calls.

## Next Phase Readiness
- FormatResponse, HandleToolError, and newTestClient are ready for use by all subsequent tool files (athlete, streams, clubs, uploads)
- registerActivities pattern established for other resource files to follow
- RegisterAll in register.go ready to add more register calls

## Self-Check: PASSED

All created files verified present. All 4 commit hashes verified in git log.

---
*Phase: 02-tool-suite*
*Completed: 2026-03-27*

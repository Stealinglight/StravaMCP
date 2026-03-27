---
phase: 02-tool-suite
plan: 02
subsystem: api
tags: [mcp, strava, athlete, streams, clubs, go]

requires:
  - phase: 02-01
    provides: "FormatResponse, HandleToolError helpers; newTestClient test factory; activities tools pattern"
provides:
  - "get_athlete tool for profile retrieval"
  - "get_athlete_stats tool with auto-fetch athlete ID when omitted"
  - "get_activity_streams tool with keys array join and default all-types"
  - "get_club_activities tool with pagination"
  - "registerAthlete, registerStreams, registerClubs registration functions"
affects: [02-03-uploads, 03-polish]

tech-stack:
  added: []
  patterns:
    - "Auto-fetch pattern: get_athlete_stats fetches authenticated athlete ID when not provided"
    - "Array-to-CSV pattern: streams keys array joined with strings.Join for query param"

key-files:
  created:
    - internal/tools/athlete.go
    - internal/tools/athlete_test.go
    - internal/tools/streams.go
    - internal/tools/streams_test.go
    - internal/tools/clubs.go
    - internal/tools/clubs_test.go
  modified:
    - internal/tools/register.go

key-decisions:
  - "Used request.GetInt/GetBool/GetArguments API (established in Plan 01) instead of mcp.ParseInt64/ParseString/ParseBoolean from plan spec"
  - "Ported tool descriptions verbatim from TypeScript source files for D-05 compliance"

patterns-established:
  - "Auto-fetch ID: when athlete ID is optional, fetch /athlete to extract ID before making dependent call"
  - "Array param handling: type-assert []interface{} from GetArguments, convert to []string, join with comma"

requirements-completed: [ATH-01, ATH-02, STR-01, CLB-01]

duration: 4min
completed: 2026-03-27
---

# Phase 02 Plan 02: Athlete, Streams, and Clubs Tools Summary

**4 MCP tools (athlete profile/stats, activity streams, club activities) with auto-fetch athlete ID and array-to-CSV key joining, all following Plan 01 closure-over-client pattern**

## Performance

- **Duration:** 4min
- **Started:** 2026-03-27T23:39:05Z
- **Completed:** 2026-03-27T23:43:32Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

### Task 1: Athlete Tools (get_athlete + get_athlete_stats)
- `get_athlete`: GET /athlete with no params, returns pretty-printed JSON profile
- `get_athlete_stats`: accepts optional `id` param; when omitted, auto-fetches authenticated athlete ID via GET /athlete, unmarshals minimal `struct { ID int64 }`, then calls GET /athletes/{id}/stats
- `registerAthlete` wires both tools to MCP server
- 6 tests: basic profile, no-query-params, 403 error, explicit ID stats, auto-fetch ID stats, auto-fetch error

### Task 2: Streams and Clubs Tools
- `get_activity_streams`: joins keys array into comma-separated query param via `strings.Join`; defaults to all 11 stream types when keys omitted; passes `key_by_type` as boolean query param
- `get_club_activities`: GET /clubs/{id}/activities with page and per_page pagination params
- `registerStreams` and `registerClubs` wire tools to MCP server
- `RegisterAll` updated to call all 4 registration functions (activities, athlete, streams, clubs)
- 9 tests: specific keys, default all keys, key_by_type, missing id, Strava error for streams; basic, missing id, pagination, Strava error for clubs

## Verification Results

- All 31 tool tests pass (`go test ./internal/tools/... -v -count=1`)
- Full project suite passes (`go test ./... -count=1`) -- 5 packages OK
- `go vet ./internal/tools/...` clean
- Tool names match TypeScript exactly: get_athlete, get_athlete_stats, get_activity_streams, get_club_activities

## Commits

| Hash | Type | Description |
|------|------|-------------|
| ac42b94 | test | Add failing tests for athlete tool handlers |
| c995ee2 | feat | Implement athlete profile and stats tools with auto-fetch ID |
| 4ac77ce | test | Add failing tests for streams and clubs tool handlers |
| 280bb7c | feat | Implement streams and clubs tools with registration wiring |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used request.GetInt instead of mcp.ParseInt64**
- **Found during:** Task 1
- **Issue:** Plan specified `mcp.ParseInt64(request, "id", 0)` but the mcp-go v0.46.0 SDK and established codebase use `request.GetInt("id", 0)` (same for GetBool, GetArguments)
- **Fix:** Used the actual SDK API matching the established pattern from Plan 01's activities.go
- **Files modified:** internal/tools/athlete.go, internal/tools/streams.go, internal/tools/clubs.go

## Known Stubs

None -- all tools are fully wired with real data paths through the Strava client.

## Self-Check: PASSED

All 6 created files verified on disk. All 4 commit hashes verified in git log.

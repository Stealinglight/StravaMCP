---
phase: 02-tool-suite
plan: 03
subsystem: api
tags: [multipart, file-upload, strava, mcp, go]

# Dependency graph
requires:
  - phase: 02-tool-suite (plans 01, 02)
    provides: registerActivities, registerAthlete, registerStreams, registerClubs, shared helpers
  - phase: 01-foundation
    provides: Strava HTTP client with doRequest, token refresh, rate limits
provides:
  - PostMultipart method on strava.Client for multipart/form-data uploads
  - create_upload MCP tool with local file reading and auto-detect extension
  - get_upload MCP tool for checking upload status
  - RegisterAll wiring all 11 tools from 5 resource files
  - Complete Phase 2 tool suite (11 tools)
affects: [03-polish, future-segment-tools, future-route-tools]

# Tech tracking
tech-stack:
  added: [mime/multipart]
  patterns: [multipart form builder, extension auto-detection, file security validation]

key-files:
  created:
    - internal/tools/uploads.go
    - internal/tools/uploads_test.go
  modified:
    - internal/strava/client.go
    - internal/strava/client_test.go
    - internal/tools/register.go

key-decisions:
  - "PostMultipart delegates to doRequest (thin wrapper) rather than duplicating auth/refresh logic"
  - "Extension auto-detection with explicit override option; rejects unknown extensions for security"
  - "validDataTypes map for O(1) security validation of data_type values"

patterns-established:
  - "PostMultipart pattern: pre-build io.Reader + contentType, delegate to doRequest"
  - "Extension detection: filepath.Ext with .gz compound extension handling"
  - "FormDataContentType() always used (never hardcoded Content-Type boundary)"

requirements-completed: [UPL-01, UPL-02]

# Metrics
duration: 4min
completed: 2026-03-27
---

# Phase 2 Plan 3: Upload Tools and RegisterAll Wiring Summary

**PostMultipart client method, create_upload/get_upload MCP tools with extension auto-detection, and RegisterAll wiring all 11 tools from 5 resource files**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-27T23:47:06Z
- **Completed:** 2026-03-27T23:50:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added PostMultipart to strava.Client as thin wrapper over doRequest for multipart/form-data requests
- Implemented create_upload tool with local file reading, auto-detect extension (gpx/fit/tcx/gz variants), and multipart form construction
- Implemented get_upload tool for checking upload processing status
- Wired RegisterAll with all 5 register functions (11 tools total across activities, athlete, streams, clubs, uploads)
- Full test suite passing: 76 tests across all packages, go vet clean, binary compiles

## Task Commits

Each task was committed atomically:

1. **Task 1: PostMultipart client method and upload tools with tests**
   - `f520781` (test) - Add failing tests for PostMultipart and upload tools
   - `9eb1b50` (feat) - Implement PostMultipart and upload tools with handlers
2. **Task 2: Wire RegisterAll with all 11 tools** - `83dfa9b` (feat)

## Files Created/Modified
- `internal/strava/client.go` - Added PostMultipart method (thin wrapper over doRequest)
- `internal/strava/client_test.go` - Added 2 PostMultipart tests (content type + error handling)
- `internal/tools/uploads.go` - create_upload and get_upload tools with handlers and registerUploads
- `internal/tools/uploads_test.go` - 13 upload tool tests (extension detection, file content, optional fields, errors)
- `internal/tools/register.go` - Wired registerUploads into RegisterAll, documented all 11 tool names

## Decisions Made
- PostMultipart is a thin delegation to doRequest rather than a full implementation -- avoids duplicating auth, token refresh, rate limit, and retry logic
- Extension auto-detection covers .fit, .tcx, .gpx, and compound .gz extensions; unknown extensions rejected with clear error message
- validDataTypes whitelist map provides O(1) security validation preventing arbitrary file reads through data_type manipulation
- Used request.GetArguments() + type assertions for optional fields (consistent with Plan 01/02 patterns)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all tools are fully wired with real Strava API client calls.

## Next Phase Readiness
- Phase 2 complete: all 11 MCP tools registered and tested
- Binary compiles cleanly with full tool suite
- Ready for Phase 3 polish (README, docs, packaging)

## Self-Check: PASSED

All 5 files verified present. All 3 commit hashes verified in git log.

---
*Phase: 02-tool-suite*
*Completed: 2026-03-27*

---
phase: 03-polish-and-distribution
plan: 01
subsystem: infra
tags: [go-modules, module-path, license, gitignore, legacy-cleanup]

# Dependency graph
requires:
  - phase: 02-tool-suite
    provides: "Complete Go codebase with 11 MCP tools and 80+ tests"
provides:
  - "Installable Go module path (github.com/Stealinglight/StravaMCP)"
  - "ISC LICENSE file for goreleaser archives and badges"
  - "Go-focused .gitignore (no TypeScript/Node patterns)"
  - "Clean repository with zero legacy artifacts"
affects: [03-02-PLAN, 03-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: ["github.com/Stealinglight/StravaMCP import path prefix"]

key-files:
  created:
    - LICENSE
  modified:
    - go.mod
    - go.sum
    - main.go
    - .gitignore
    - "internal/**/*.go (22 files - import path update)"

key-decisions:
  - "Added StravaMCP binary name to .gitignore alongside strava-mcp since go build names binary after module's last path component"
  - "golang.org/x/sync promoted from indirect to direct dependency by go mod tidy (used by singleflight in strava client)"

patterns-established:
  - "Module path: github.com/Stealinglight/StravaMCP for all internal imports"

requirements-completed: [DOCS-02]

# Metrics
duration: 3min
completed: 2026-04-01
---

# Phase 3 Plan 1: Module Path Migration and Legacy Cleanup Summary

**Go module migrated to github.com/Stealinglight/StravaMCP, all TypeScript/Lambda artifacts deleted, ISC license created, .gitignore rewritten for Go**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T16:20:45Z
- **Completed:** 2026-04-01T16:23:45Z
- **Tasks:** 2
- **Files modified:** 72 (23 Go files updated + 48 legacy files deleted + LICENSE created)

## Accomplishments
- Migrated Go module path from `strava-mcp` to `github.com/Stealinglight/StravaMCP` across 22 source/test files (32 import replacements)
- Deleted 48 legacy TypeScript/Lambda/Node artifacts including src/, package.json, tsconfig.json, template.yaml, openclaw-plugin/, and 4 obsolete GitHub Actions workflows
- Created ISC LICENSE file for goreleaser archive inclusion and shields.io badge
- Rewrote .gitignore with Go-focused patterns; removed all TypeScript/Node patterns
- All 80+ tests continue to pass, binary builds successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate go.mod module path and update all imports** - `f18aaac` (feat)
2. **Task 2: Delete legacy artifacts, create LICENSE, rewrite .gitignore** - `e202684` (chore)

## Files Created/Modified
- `go.mod` - Module path changed from strava-mcp to github.com/Stealinglight/StravaMCP
- `go.sum` - Updated by go mod tidy (golang.org/x/sync promoted to direct)
- `main.go` - 4 import paths updated
- `internal/auth/oauth.go` - 1 import path updated
- `internal/server/server.go` - 2 import paths updated
- `internal/strava/client.go` - 2 import paths updated
- `internal/tools/*.go` - All tool and test files updated (18 files)
- `LICENSE` - Created with ISC license text
- `.gitignore` - Rewritten for Go project patterns

## Decisions Made
- Added `StravaMCP` (capital case) to .gitignore alongside `strava-mcp` since `go build .` names the binary after the module's last path component
- golang.org/x/sync promoted from indirect to direct dependency by go mod tidy (correct behavior, used by singleflight)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - no stubs or placeholders detected.

## Next Phase Readiness
- Module path is now `github.com/Stealinglight/StravaMCP`, enabling `go install` distribution
- Repository is clean Go-only, ready for goreleaser config (Plan 02)
- ISC LICENSE ready for goreleaser archive inclusion
- GitHub Actions workflows retained: claude.yml and claude-code-review.yml

## Self-Check: PASSED

All artifacts verified:
- LICENSE: FOUND
- .gitignore: FOUND
- SUMMARY.md: FOUND
- Task 1 commit f18aaac: FOUND
- Task 2 commit e202684: FOUND
- Metadata commit f4053aa: FOUND

---
*Phase: 03-polish-and-distribution*
*Completed: 2026-04-01*

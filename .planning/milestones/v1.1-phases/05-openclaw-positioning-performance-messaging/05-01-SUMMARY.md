---
phase: 05-openclaw-positioning-performance-messaging
plan: 01
subsystem: docs
tags: [readme, mermaid, positioning, openclaw, zeroclaw, performance, go]

# Dependency graph
requires:
  - phase: 03-polish-and-distribution
    provides: "Portfolio-quality README with badges, Mermaid diagrams, tool reference"
provides:
  - "Production-grade README positioning with agent framework messaging"
  - "Why Go? performance comparison table (Go vs Python vs Node.js)"
  - "Agent Framework Integration section with ecosystem Mermaid diagram"
  - "JSON config snippet for wiring StravaMCP into agent frameworks"
affects: [05-02-docs-site-update]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Production-grade tone throughout README", "Ecosystem Mermaid diagram pattern (graph TD with MCP servers)"]

key-files:
  created: []
  modified: ["README.md"]

key-decisions:
  - "Replaced HTML comment demo.tape/demo.gif references with record.tape/usage.gif to fully eliminate banned word 'demo' even in comments"
  - "Kept Agent Framework Integration JSON config snippet identical to existing Quick Start config pattern for consistency"

patterns-established:
  - "OpenClaw/ZeroClaw ecosystem positioning: agent framework > portfolio piece"
  - "Reliability-first feature bullets: singleflight, atomic writes, zero-CGO"
  - "Performance comparison table with disclaimer footnote for non-benchmark estimates"

requirements-completed: [MSG-01, MSG-02, MSG-04]

# Metrics
duration: 2min
completed: 2026-04-04
---

# Phase 5 Plan 1: README Positioning Summary

**README rewritten with production-grade agent framework positioning, Why Go? comparison table, and OpenClaw/ZeroClaw ecosystem Mermaid diagram**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-04T20:36:01Z
- **Completed:** 2026-04-04T20:37:49Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Rewrote hero tagline to lead with "production-grade" and "agent frameworks" instead of "fast Go binary"
- Added "Why Go?" section with Go/Python/Node.js comparison table covering startup time, memory, binary size, dependencies, and runtime requirements -- with disclaimer footnote
- Added "Agent Framework Integration" section with ecosystem Mermaid diagram showing StravaMCP alongside SlackMCP, WebResearchMCP, and VideoMCP in the OpenClaw/ZeroClaw framework
- Updated feature bullets to emphasize reliability: singleflight token refresh, atomic write-then-rename token store, zero-CGO static binary
- Removed all banned positioning words (portfolio, showcase, demo, toy, experiment, hobby, personal, side project) from entire file including HTML comments

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite README hero, features, and add Why Go? section** - `0e46e2e` (feat)

## Files Created/Modified
- `README.md` - Rewritten hero tagline, updated feature bullets, added Why Go? performance table, added Agent Framework Integration section with ecosystem diagram and JSON config snippet

## Decisions Made
- Replaced demo.tape/demo.gif HTML comment references with record.tape/usage.gif to pass strict banned-word grep check (even though comments are not user-facing, the acceptance criteria requires zero occurrences)
- Used `&middot;` HTML entity in Mermaid diagram for "Go &middot; 7MB" label as specified in plan

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed banned word "demo" from HTML comments**
- **Found during:** Task 1 (tone sweep verification)
- **Issue:** HTML comments on lines 16-18 contained "demo.tape", "demo.gif", and "Demo" -- acceptance criteria requires zero banned words case-insensitive across the entire file
- **Fix:** Replaced demo.tape with record.tape, demo.gif with usage.gif, Demo with Usage, and "Claude Desktop" with "an MCP client" in the comment
- **Files modified:** README.md
- **Verification:** `grep -ciE "demo" README.md` returns 0
- **Committed in:** 0e46e2e (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor cosmetic fix to HTML comments to satisfy strict banned-word check. No scope creep.

## Issues Encountered
None

## Known Stubs
None -- all content is final, no placeholder text or empty data sources.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- README.md is now the canonical source for production-grade messaging
- Plan 02 (docs site update) can mirror this content to docs/index.md and create docs/integration.md
- The ecosystem Mermaid diagram in README can be duplicated to docs/integration.md as specified in the content overlap matrix

## Self-Check: PASSED

- [x] README.md exists
- [x] 05-01-SUMMARY.md exists
- [x] Commit 0e46e2e exists in git history

---
*Phase: 05-openclaw-positioning-performance-messaging*
*Completed: 2026-04-04*

# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — StravaMCP Go Rewrite

**Shipped:** 2026-04-01
**Phases:** 3 | **Plans:** 8

### What Was Built
- Complete Go rewrite of Strava MCP server with 11 tools across 5 categories
- OAuth browser flow with singleflight token refresh and file-based token store
- goreleaser v2 cross-platform release pipeline with Homebrew cask distribution
- Portfolio-quality README with 8 badges, Mermaid architecture diagrams, 11-tool reference
- GitHub Actions release workflow triggered on v* tags

### What Worked
- Strict 3-phase dependency chain (infra → tools → polish) prevented rework
- Raw JSON pass-through for Strava data avoided schema coupling and maintenance burden
- Handler closure pattern (HandleXxx(client) returns ToolHandlerFunc) made tool registration clean and testable
- Map-based PUT body for update_activity avoided Go zero-value overwrite trap
- singleflight.Group for token refresh coalescing was elegant and correct

### What Was Inefficient
- Phase 3 plan 03-01 (module path migration) required touching all 22 Go files for import path changes — could have been the module path from the start in Phase 1
- VHS terminal recording requires live OAuth which blocks automated execution — deferred to manual step

### Patterns Established
- stderr-only logging via slog (stdout reserved for MCP JSON-RPC)
- Closure-over-client handler pattern for all MCP tools
- FormatResponse/HandleToolError shared helpers for consistent tool output
- Atomic write-then-rename for file-based token persistence
- Tag-triggered releases via goreleaser + GitHub Actions

### Key Lessons
1. Set the correct Go module path from day one — migrating later touches every file
2. goreleaser v2 homebrew_casks requires a separate PAT for cross-repo tap push — GITHUB_TOKEN is scoped to current repo only
3. Raw JSON pass-through is the right default for API wrapper tools — Go structs add maintenance without value when the LLM consumes the JSON directly

### Cost Observations
- Model mix: primarily opus for execution, sonnet for verification
- 3 phases completed across multiple sessions
- Notable: parallel wave execution (plans 03-02 + 03-03) saved time in the final phase

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 3 | 8 | Initial milestone — established GSD workflow with strict phase dependencies |

### Cumulative Quality

| Milestone | Tests | Packages | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 80+ | 5 | 3 (mcp-go, browser, sync) |

### Top Lessons (Verified Across Milestones)

1. Set canonical identifiers (module paths, package names) in the first phase
2. Raw JSON pass-through beats typed structs for API wrapper tools consumed by LLMs

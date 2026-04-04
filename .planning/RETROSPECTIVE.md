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

## Milestone: v1.1 — Docs, Pages & OpenClaw Positioning

**Shipped:** 2026-04-04
**Phases:** 2 | **Plans:** 3

### What Was Built
- Restored GitHub Pages deployment workflow from deleted commit, docs site live at stealinglight.github.io/StravaMCP
- README rewritten with production-grade hero tagline, reliability-focused feature bullets, Why Go? performance comparison table
- Agent Framework Integration section with OpenClaw/ZeroClaw ecosystem Mermaid diagram and JSON config snippet
- New docs/integration.md page with ecosystem explainer, wiring configuration, 3 example workflows
- docs/index.md mirrored with matching tagline, features, and performance table

### What Worked
- Wave dependency (README first → docs second) ensured docs could mirror canonical README content accurately
- Human-verify checkpoint at Task 3 of Plan 02 gated deployment verification — right pattern for docs-only phases
- Tone sweep with banned word list (portfolio, showcase, demo, etc.) systematically enforced positioning shift
- UI-SPEC content contract defined exact copy for each section — executor had zero ambiguity

### What Was Inefficient
- REQUIREMENTS.md checkboxes for MSG-01 through MSG-04 weren't auto-updated during execution — required manual fix during milestone completion
- 05-01-SUMMARY.md frontmatter didn't list requirements_completed for MSG-01/MSG-02 — caused "partial" status in 3-source cross-reference even though verification confirmed them

### Patterns Established
- Content Overlap Matrix in UI-SPEC for multi-file messaging consistency (README ↔ docs)
- Banned word enforcement as a verification check (grep-based, zero tolerance)
- Estimated performance numbers with explicit disclaimer footnote — avoids benchmark scope while showing Go advantages

### Key Lessons
1. For docs-only phases, the security gate passes trivially — SECURITY.md still gets created for audit trail consistency
2. Wave structure for content phases should always have the canonical source (README) in Wave 1 and derived content (docs site) in Wave 2
3. SUMMARY frontmatter `requirements_completed` should be enforced by the executor — the verifier shouldn't be the first to catch missing entries

### Cost Observations
- Model mix: opus for execution, sonnet for verification and integration check
- 2 phases completed in single session
- Notable: docs-only milestone completed in ~20 minutes of wall clock time

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 3 | 8 | Initial milestone — established GSD workflow with strict phase dependencies |
| v1.1 | 2 | 3 | Docs-only milestone — UI-SPEC content contracts, banned word enforcement, wave-ordered content sourcing |

### Cumulative Quality

| Milestone | Tests | Packages | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 80+ | 5 | 3 (mcp-go, browser, sync) |
| v1.1 | 80+ (unchanged) | 5 (unchanged) | 0 (docs-only) |

### Top Lessons (Verified Across Milestones)

1. Set canonical identifiers (module paths, package names) in the first phase
2. Raw JSON pass-through beats typed structs for API wrapper tools consumed by LLMs
3. For multi-file messaging, update the canonical source first (Wave 1), then derive — prevents drift

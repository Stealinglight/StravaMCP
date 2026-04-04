# Requirements: StravaMCP v1.1 — Docs, Pages & OpenClaw Positioning

**Defined:** 2026-04-01
**Core Value:** A fast, self-contained Go binary that gives any MCP client full access to the Strava API with zero cloud infrastructure required.

## v1.1 Requirements

### GitHub Pages

- [x] **PAGES-01**: GitHub Pages deployment workflow exists and docs/ site is live at stealinglight.github.io/StravaMCP
- [x] **PAGES-02**: Docs site renders correctly with just-the-docs theme, dark mode, Go-focused content

### Messaging

- [x] **MSG-01**: README has OpenClaw/ZeroClaw ecosystem section explaining agent framework compatibility
- [x] **MSG-02**: README highlights Go performance advantages over Python/JavaScript MCPs (startup time, memory footprint, binary size)
- [x] **MSG-03**: Docs site has OpenClaw/ZeroClaw compatibility page or section with integration instructions
- [x] **MSG-04**: Project positioned as production-grade MCP server for agent frameworks, not just portfolio piece

## Future Requirements (v2.0 — Expanded Strava Coverage)

- [ ] Segment tools: starred segments, segment efforts, leaderboards
- [ ] Route tools: route details, export GPX, athlete routes
- [ ] Gear tools: gear details, manage equipment
- [ ] Laps & efforts tools: activity laps, segment efforts, best efforts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Actual performance benchmarks (measured) | Would require building Python/JS equivalents for apples-to-apples comparison; use known Go vs Python/JS characteristics instead |
| New Strava API tools | Deferred to v2.0 milestone |
| OpenClaw plugin packaging | StravaMCP is a standalone binary; OpenClaw integration is via MCP stdio transport, not a plugin format |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAGES-01 | Phase 4 | Complete |
| PAGES-02 | Phase 4 | Complete |
| MSG-01 | Phase 5 | Complete |
| MSG-02 | Phase 5 | Complete |
| MSG-03 | Phase 5 | Complete |
| MSG-04 | Phase 5 | Complete |

**Coverage:**
- v1.1 requirements: 6 total
- Mapped to phases: 6/6
- Unmapped: 0

---
*Requirements defined: 2026-04-01*

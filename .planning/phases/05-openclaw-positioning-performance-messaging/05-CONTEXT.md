# Phase 5: OpenClaw Positioning & Performance Messaging - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Update README.md, docs site (docs/index.md + new docs/integration.md), and project metadata to position StravaMCP as a production-grade, high-performance MCP server for agent frameworks (OpenClaw/ZeroClaw ecosystem). Covers: ecosystem section with Mermaid diagram, Go performance comparison table, docs site expansion, tone reframing from portfolio piece to production-grade tooling, and metadata updates. No new code, no new Strava API tools, no measured benchmarks.

</domain>

<decisions>
## Implementation Decisions

### Ecosystem section (README)
- **D-01:** Dedicated `## Agent Framework Integration` section in README with Mermaid diagram showing StravaMCP's place in the OpenClaw/ZeroClaw ecosystem alongside real RustyClaw servers (SlackMCP, WebResearchMCP, VideoMCP, etc.)
- **D-02:** Include a brief 1-2 sentence explainer of what OpenClaw/ZeroClaw is for readers unfamiliar with the ecosystem — keeps the section self-contained
- **D-03:** Include a JSON config snippet showing how to wire StravaMCP into an agent framework as a tool provider

### Performance claims (README)
- **D-04:** Dedicated `## Why Go?` section near the top of README (after Features, before Quick Start) with a markdown comparison table: Go vs Python vs Node.js across startup time, memory, binary size, and dependencies
- **D-05:** Table uses known language characteristics (not measured benchmarks) with estimated representative numbers (~10ms startup, ~8MB memory, 12MB binary, etc.)
- **D-06:** Italic footnote disclaimer under the table: "*Estimates based on known Go/Python/Node.js characteristics. Not formal benchmarks.*"

### Docs site expansion
- **D-07:** Add new `docs/integration.md` page with full OpenClaw/ZeroClaw integration guide: wiring config, agent framework setup, example workflows
- **D-08:** Update `docs/index.md` with new ecosystem positioning and "Why Go?" performance content — the docs site should stand on its own, mirroring key README content rather than just linking to GitHub

### Tone and positioning pivot
- **D-09:** Confident reframing throughout — rewrite hero tagline to lead with "production-grade" and "agent frameworks", emphasize reliability features (singleflight, atomic token writes, zero-CGO), remove any "portfolio" or "project" language
- **D-10:** Update `docs/_config.yml` description to match new production-grade positioning
- **D-11:** Note for user: update GitHub repo "About" description to match new positioning (manual step on GitHub)

### Claude's Discretion
- Exact section ordering in README (where ecosystem and performance sections land relative to existing sections)
- Mermaid diagram styling and node labels
- Exact wording of hero tagline and feature bullets
- How much content overlap between README and docs/index.md vs. unique content per file
- Integration page depth and example workflow specifics

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to modify
- `README.md` -- Current README to be updated with ecosystem section, performance table, and tone reframing
- `docs/index.md` -- Docs site home page to be updated with matching content
- `docs/_config.yml` -- Site config description to be updated

### Files to create
- `docs/integration.md` -- New OpenClaw/ZeroClaw integration guide page

### Content source files (read for accuracy)
- `internal/strava/client.go` -- Singleflight, auto-refresh, rate limiting (reliability features to emphasize)
- `internal/auth/tokenstore.go` -- Atomic write-then-rename (reliability feature)
- `go.mod` -- Module path, Go version, dependency count for binary size claims
- `main.go` -- Entry point, CLI flags (for integration config examples)

### Project context
- `.planning/REQUIREMENTS.md` -- MSG-01 through MSG-04 requirements for this phase
- `.planning/PROJECT.md` -- RustyClaw/ZeroClaw ecosystem context, "Part of the RustyClaw/ZeroClaw ecosystem"
- `.planning/phases/03-polish-and-distribution/03-CONTEXT.md` -- Phase 3 README decisions (D-02 visual polish, D-06 Mermaid diagrams) to maintain consistency

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `README.md` -- Well-structured existing README (190 lines) with badges, Mermaid diagrams, collapsible sections, tool reference table. New sections integrate into this structure.
- `docs/_config.yml` -- just-the-docs theme config with dark mode, search, aux links, callouts already configured. New pages automatically appear in nav.
- Existing Mermaid diagrams in README (flow diagram + architecture) -- new ecosystem diagram follows the same visual pattern.

### Established Patterns
- **Mermaid diagrams** in README rendered by GitHub (Phase 3 D-06)
- **Collapsible `<details>` blocks** for Tool Reference and Architecture sections
- **Badge row** at top of README for key project metrics
- **just-the-docs** dark theme with callouts (note, warning, tip) for docs site

### Integration Points
- `docs/` directory -- new pages auto-discovered by just-the-docs via frontmatter `nav_order`
- README badge row -- could add "Production Grade" or "OpenClaw Compatible" badge
- `docs/_config.yml` aux_links -- could add OpenClaw docs link

</code_context>

<specifics>
## Specific Ideas

- Ecosystem diagram should show real RustyClaw servers (StravaMCP, SlackMCP, WebResearchMCP, VideoMCP) not generic placeholders
- Hero tagline shifts from "fast, self-contained Go binary" to "production-grade MCP server for agent frameworks"
- Performance table uses approximate representative numbers with italic footnote disclaimer
- Integration page should include actual JSON config snippets for wiring StravaMCP into an agent

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 05-openclaw-positioning-performance-messaging*
*Context gathered: 2026-04-03*

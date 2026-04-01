# Phase 3: Polish and Distribution - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the project portfolio-ready: complete README rewrite with premium visual polish, cross-platform binary distribution via goreleaser with Homebrew tap, and cleanup of all legacy TypeScript/Lambda artifacts. Also folds in three pending todos: contributing guide, repo metadata, and release workflow setup.

</domain>

<decisions>
## Implementation Decisions

### README structure and content
- **D-01:** Complete rewrite of README.md — the existing README describes the old TypeScript/Lambda version and shares nothing with the Go binary project. Start fresh.
- **D-02:** Premium visual polish — badges row, custom hero section, feature highlights with icons/emoji, collapsible sections, tool reference table, architecture diagrams, terminal recording.
- **D-03:** Include terminal recording (asciinema or SVG) showing the auth flow and a tool call in action. High portfolio impact.
- **D-04:** All three badge categories: standard Go badges (Go version, Go Report Card, GoDoc, License), CI/release badges (build status, latest release, downloads), project badges (MCP version, tool count, coverage).
- **D-05:** Tool reference as grouped table with descriptions — categories: Activities (5), Athlete (2), Streams (1), Clubs (1), Uploads (2). One-line description per tool.

### Architecture diagrams
- **D-06:** Mermaid format — GitHub renders natively, version-controlled, easy to maintain.
- **D-07:** Two diagrams: high-level flow at top of README (MCP Client -> stdio -> Go Binary -> Strava API), detailed internal structure in Architecture section (config -> auth/token store -> Strava client -> tool handlers -> MCP server).

### Release and installation
- **D-08:** Two equal installation paths in Quick Start: `go install` for Go developers, binary download from GitHub Releases for everyone else.
- **D-09:** goreleaser targets macOS + Linux: darwin/amd64, darwin/arm64, linux/amd64, linux/arm64.
- **D-10:** Set up Homebrew tap via goreleaser auto-generation. `brew install Stealinglight/tap/strava-mcp`.
- **D-11:** GitHub Actions release workflow triggered on version tags. Replaces all old Lambda/docs workflows.

### Legacy cleanup
- **D-12:** Remove ALL TypeScript/Lambda artifacts: src/, docs/, template.yaml, package.json, bun.lockb, tsconfig.json, samconfig.toml, get-token.js, node_modules references, and any other non-Go files from the old project.
- **D-13:** Replace GitHub Pages docs site with simple Go-focused pages. Strip Lambda content, add basic documentation for the Go binary. Keep the GitHub Pages URL alive.
- **D-14:** Remove all old GitHub Actions workflows: deploy-lambda.yml, deploy-docs.yml, release-openclaw-plugin.yml. Keep claude.yml and claude-code-review.yml. Add new goreleaser release workflow.

### Community and metadata
- **D-15:** Create/update CONTRIBUTING.md for the Go project — build instructions, test commands, PR guidelines.
- **D-16:** Update GitHub repo description, topics, and homepage URL to reflect the Go rewrite.

### Claude's Discretion
- README section ordering and exact heading hierarchy
- Mermaid diagram styling and color scheme
- goreleaser configuration details (archive format, changelog generation, etc.)
- Exact badge service URLs and shield.io parameters
- Terminal recording tool choice (asciinema vs svg-term vs vhs)
- docs/ page structure and content depth

### Folded Todos
- **Contributing guide and open source community setup** — Create CONTRIBUTING.md with Go-specific build/test/PR instructions. Add issue templates if appropriate.
- **Update GitHub repo description and metadata** — Reflect Go rewrite in repo About section, topics (go, mcp, strava, cli), homepage URL.
- **Set up GitHub Actions release workflow for binary releases** — Subsumed by D-11 (goreleaser workflow on version tags).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Go project files (implementation targets)
- `README.md` — Current README to be completely rewritten (old TypeScript content)
- `CONTRIBUTING.md` — Existing contributing guide to be rewritten for Go
- `.github/workflows/` — Current workflows to be cleaned up and replaced

### Phase 1-2 outputs (content source for README)
- `internal/strava/client.go` — Strava HTTP client architecture (for architecture diagram)
- `internal/tools/register.go` — RegisterAll wiring (for tool count verification)
- `internal/tools/activities.go` — Activity tool definitions (for tool reference table)
- `internal/tools/athlete.go` — Athlete tool definitions
- `internal/tools/streams.go` — Streams tool definitions
- `internal/tools/clubs.go` — Club tool definitions
- `internal/tools/uploads.go` — Upload tool definitions
- `internal/auth/oauth.go` — OAuth browser flow (for quick-start auth instructions)
- `internal/config/config.go` — Config/env var requirements (for configuration docs)
- `go.mod` — Module path for `go install` command

### Project context
- `.planning/PROJECT.md` — Portfolio piece goals, RustyClaw ecosystem context
- `.planning/REQUIREMENTS.md` — DOCS-01, DOCS-02 requirements
- `.planning/phases/02-tool-suite/02-CONTEXT.md` — Tool naming (D-06) and description (D-05) decisions

### External references
- goreleaser documentation — for release configuration
- GitHub Actions documentation — for workflow setup
- Homebrew tap documentation — for formula auto-generation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing README.md has a good tool category table format — can reuse the table structure (Activities, Athlete, Streams, Clubs, Uploads) while rewriting content
- `.github/workflows/claude.yml` and `claude-code-review.yml` — keep these as-is

### Established Patterns
- Go module path: `strava-mcp` (from go.mod)
- Binary name: `strava-mcp` (from main.go)
- Config via env vars: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_TOKEN_PATH
- All tool names match TypeScript exactly (D-06 from Phase 2)

### Integration Points
- `main.go` — Entry point for binary, source of CLI subcommands (auth, serve)
- `.github/workflows/` — Where new release workflow goes
- Root directory — README.md, CONTRIBUTING.md, LICENSE, .goreleaser.yml all live here

</code_context>

<specifics>
## Specific Ideas

- Terminal recording should show the auth flow (browser opens, token saved) and then a tool call working through an MCP client
- Homebrew tap auto-generated by goreleaser — no manual tap repo maintenance
- README hero section should communicate "zero cloud infrastructure" as the key differentiator from the old Lambda version

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-polish-and-distribution*
*Context gathered: 2026-04-01*

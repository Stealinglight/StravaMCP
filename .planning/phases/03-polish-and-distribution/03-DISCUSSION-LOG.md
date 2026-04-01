# Phase 3: Polish and Distribution - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 03-polish-and-distribution
**Areas discussed:** README structure and tone, Architecture diagram format, Release and install strategy, Old TypeScript cleanup

---

## Folded Todos

All 3 matching todos were folded into Phase 3 scope:
- Contributing guide and open source community setup (relevance: 0.9)
- Update GitHub repo description and metadata (relevance: 0.7)
- Set up GitHub Actions release workflow for binary releases (relevance: 0.6)

---

## README Structure and Tone

### README Base Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Complete rewrite (Recommended) | Start fresh — Go version is fundamentally different from Lambda version | ✓ |
| Preserve framing, rewrite content | Keep narrative structure, rewrite all sections | |
| Minimal README | Short and functional, let code speak | |

**User's choice:** Complete rewrite
**Notes:** The old README is 300+ lines about TypeScript/Lambda — nothing applies to the Go binary.

### Visual Polish Level

| Option | Description | Selected |
|--------|-------------|----------|
| Premium polish | Badges, hero section, icons/emoji, collapsible sections, diagrams, screenshots/GIFs | ✓ |
| Clean professional | Badges, clear sections, tool table, diagram. No emoji overload. | |
| Developer-focused | Sparse, technical, no frills. Go stdlib style. | |

**User's choice:** Premium polish
**Notes:** Portfolio piece requires maximum visual impact.

### Demo Media

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — terminal recording | asciinema or SVG recording showing auth + tool call | ✓ |
| Maybe later | Nice-to-have, don't block Phase 3 | |
| No — text only | Screenshots go stale, code examples enough | |

**User's choice:** Yes — terminal recording

### Badges

| Option | Description | Selected |
|--------|-------------|----------|
| Standard Go badges | Go version, Report Card, GoDoc, License | ✓ |
| CI/release badges | Build status, latest release, downloads | ✓ |
| Project badges | MCP version, tool count, coverage | ✓ |

**User's choice:** All three categories (multiselect)

### Tool Reference Format

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped table with descriptions (Recommended) | Table by category with tool name + one-liner | ✓ |
| Collapsible detailed reference | Each tool in details block with full params | |
| Simple list | Just names grouped by category | |

**User's choice:** Grouped table with descriptions

---

## Architecture Diagram Format

### Diagram Format

| Option | Description | Selected |
|--------|-------------|----------|
| Mermaid (Recommended) | GitHub-native rendering, version-controlled | ✓ |
| ASCII art | Universal rendering, limited visual appeal | |
| SVG image file | Maximum control, harder to maintain | |

**User's choice:** Mermaid

### Diagram Detail Level

| Option | Description | Selected |
|--------|-------------|----------|
| High-level flow | 3-4 boxes showing key architecture insight | |
| Internal structure | Shows internal layers and components | |
| Both | High-level at top, detailed lower down | ✓ |

**User's choice:** Both — two diagrams at different abstraction levels

---

## Release and Install Strategy

### Primary Install Method

| Option | Description | Selected |
|--------|-------------|----------|
| go install (Recommended) | Zero friction for Go developers | |
| Binary download | goreleaser builds, download from Releases | |
| Both equally | Two paths in Quick Start for different audiences | ✓ |

**User's choice:** Both equally

### Target Platforms

| Option | Description | Selected |
|--------|-------------|----------|
| macOS + Linux (Recommended) | darwin + linux, amd64 + arm64. Covers 95%+ MCP users. | ✓ |
| macOS + Linux + Windows | Add windows/amd64 for broader coverage | |
| macOS only | Simplest, most MCP Desktop users on Mac | |

**User's choice:** macOS + Linux

### Homebrew Tap

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — Homebrew tap | goreleaser auto-generates tap formula | ✓ |
| Not now | Skip for v1, add later | |
| Document but don't automate | Show how it would work without setting up | |

**User's choice:** Yes — Homebrew tap

---

## Old TypeScript Cleanup

### TypeScript Source Artifacts

| Option | Description | Selected |
|--------|-------------|----------|
| Remove everything (Recommended) | Delete all TS/Lambda artifacts, old code in git history | ✓ |
| Move to legacy/ folder | Preserve in legacy/ directory | |
| Keep src/ only | Keep TS tool definitions as reference | |

**User's choice:** Remove everything

### GitHub Pages Docs Site

| Option | Description | Selected |
|--------|-------------|----------|
| Remove it | README is comprehensive enough | |
| Keep and update later | Leave docs/, update in future milestone | |
| Replace with simple docs | Strip Lambda docs, add basic Go pages | ✓ |

**User's choice:** Replace with simple docs — keep GitHub Pages URL alive

### Old GitHub Actions Workflows

| Option | Description | Selected |
|--------|-------------|----------|
| Remove all old workflows (Recommended) | Delete deploy-lambda, deploy-docs, release-openclaw-plugin. Keep claude workflows. | ✓ |
| Keep claude workflows only | Same as above | |
| Keep all | Add new alongside old | |

**User's choice:** Remove all old workflows

---

## Claude's Discretion

- README section ordering and heading hierarchy
- Mermaid diagram styling and colors
- goreleaser configuration details
- Badge service URLs and parameters
- Terminal recording tool choice
- docs/ page structure and content depth

## Deferred Ideas

None — discussion stayed within phase scope.

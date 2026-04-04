---
phase: 5
slug: openclaw-positioning-performance-messaging
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-03
---

# Phase 5 — UI Design Contract

> Visual and content contract for a documentation-only phase. All "UI" is GitHub-rendered markdown (README.md) and Jekyll/just-the-docs (docs site). No frontend code, no interactive components, no JavaScript.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (documentation-only phase) |
| Preset | not applicable |
| Component library | none -- content is pure markdown |
| Icon library | shields.io badges (existing pattern) |
| Font | System defaults -- GitHub uses its own sans-serif stack; just-the-docs dark theme uses its built-in font stack |

---

## Rendering Contexts

This phase produces content for two distinct rendering contexts. All visual decisions must work in both.

| Context | Renderer | Theme | Source Files |
|---------|----------|-------|-------------|
| GitHub | GitHub Flavored Markdown | GitHub dark/light (reader preference) | README.md |
| Docs site | Jekyll + just-the-docs | Dark mode (forced via `color_scheme: dark` in _config.yml) | docs/index.md, docs/integration.md |

---

## Spacing Scale

Markdown spacing is controlled by blank lines and heading hierarchy, not pixel values. The following conventions ensure consistent visual rhythm across all files.

| Token | Markdown Equivalent | Usage |
|-------|-------------------|-------|
| Tight | No blank line (list items) | Within bullet lists, table rows |
| Standard | 1 blank line | Between paragraphs, after headings |
| Section break | `---` (horizontal rule) | Between major sections on docs site only |
| Major break | `## Heading` | New conceptual section in README and docs |

Exceptions: none

**Indentation rule:** All code blocks use 4-space indentation for JSON, 0-space (fenced) for bash/mermaid. No tabs in any markdown file.

---

## Typography

### GitHub README (README.md)

GitHub applies its own type scale. Authors control hierarchy through heading levels only.

| Role | Markdown | Rendered Behavior |
|------|----------|------------------|
| Page title | `# StravaMCP` | Largest heading, appears once at top |
| Major section | `## Why Go?`, `## Agent Framework Integration` | Section-level heading, appears in GitHub TOC |
| Subsection | `### Install`, `### Wiring Configuration` | Subsection heading |
| Body | Plain paragraph text | 16px equivalent, system sans-serif |
| Emphasis | `**bold text**` | Bold weight for key terms and feature names |
| Disclaimer | `*italic text*` | Italic for footnotes and caveats (D-06 disclaimer) |

**Rule:** Never use `####` or deeper. Maximum heading depth is `###`.

### Docs Site (docs/index.md, docs/integration.md)

just-the-docs provides kramdown attribute classes for typography control.

| Role | Class | Usage |
|------|-------|-------|
| Page title | `{: .fs-9 }` | `# Page Title` on every docs page, exactly once |
| Subtitle/tagline | `{: .fs-6 .fw-300 }` | Description paragraph directly below page title |
| Section heading | `## Heading` (no class) | Standard section divisions |
| Body | Plain text (no class) | Default just-the-docs body rendering |
| Button (primary) | `{: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }` | Primary CTA button (one per page max) |
| Button (secondary) | `{: .btn .fs-5 .mb-4 .mb-md-0 }` | Secondary action button |

**Rule:** Every docs page must start with exactly this pattern:
```markdown
# Page Title
{: .fs-9 }

One-line description.
{: .fs-6 .fw-300 }
```

---

## Color

No custom colors are authored in this phase. Colors come from two sources:

### GitHub README

GitHub applies its own syntax highlighting and chrome. Authors control color through:

| Element | Mechanism | Result |
|---------|-----------|--------|
| Badges | shields.io badge URLs | Blue badges (existing pattern), add new badge in blue |
| Code blocks | Fenced blocks with language hints | GitHub syntax highlighting |
| Mermaid diagrams | Mermaid default palette | GitHub renders with its own Mermaid theme |
| Links | Standard markdown links | GitHub link blue |

### Docs Site (just-the-docs dark theme)

| Element | Mechanism | Result |
|---------|-----------|--------|
| Background | `color_scheme: dark` in _config.yml | Dark surface (just-the-docs default dark) |
| Callouts | `{: .note }`, `{: .warning }`, `{: .tip }` | Blue (note), red (warning), green (tip) |
| Buttons | `{: .btn .btn-primary }` | Purple/blue primary action (just-the-docs default) |
| Code blocks | Fenced blocks with language hints | just-the-docs dark syntax highlighting |

**Rule:** Do NOT add custom CSS or SCSS files. All styling comes from the just-the-docs remote theme. Do NOT modify `_config.yml` color settings beyond the description field (D-10).

**Accent reserved for:** Primary CTA buttons only (one per docs page: "Get Started" on index.md, "View Configuration" or equivalent on integration.md).

---

## Copywriting Contract

### Hero Taglines

| File | Current Copy | New Copy (D-09) |
|------|-------------|-----------------|
| README.md | "A fast, self-contained Go binary that gives any MCP client full access to the Strava API -- zero cloud infrastructure required." | "A production-grade MCP server that gives agent frameworks full access to the Strava API -- single Go binary, zero infrastructure." |
| docs/index.md | "A fast Go binary that gives any MCP client full access to the Strava API -- zero cloud infrastructure required." | "A production-grade MCP server that gives agent frameworks full access to the Strava API -- single Go binary, zero infrastructure." |
| docs/_config.yml `description` | "MCP server for Strava API - a fast Go binary with zero cloud infrastructure" | "Production-grade MCP server for Strava API -- built in Go for agent frameworks" |

### Section Headings (New Content)

| Section | Heading Copy | File(s) |
|---------|-------------|---------|
| Performance comparison | `## Why Go?` | README.md, docs/index.md |
| Ecosystem diagram | `## Agent Framework Integration` | README.md |
| Integration page title | `# Agent Framework Integration` | docs/integration.md |
| Ecosystem explainer | `### What is OpenClaw/ZeroClaw?` | docs/integration.md |

### Performance Table Copy (D-04, D-05, D-06)

The comparison table must use exactly these column headers and row labels:

| | Go (StravaMCP) | Python | Node.js |
|---|---|---|---|
| **Startup time** | ~10ms | ~500ms | ~200ms |
| **Memory footprint** | ~8MB | ~30MB | ~40MB |
| **Binary size** | 7MB (single file) | ~50MB+ (runtime + deps) | ~60MB+ (runtime + node_modules) |
| **Dependencies** | 3 direct | Varies (pip) | Varies (npm) |
| **Runtime required** | None | Python interpreter | Node.js runtime |

Mandatory disclaimer (italic, immediately below table):
> *Estimates based on known Go/Python/Node.js runtime characteristics for comparable MCP servers. Not formal benchmarks.*

### Ecosystem Explainer Copy (D-02)

1-2 sentences explaining OpenClaw/ZeroClaw for unfamiliar readers. Must convey:
- It is an agent framework ecosystem
- StravaMCP connects via stdio transport
- Other servers in the ecosystem (SlackMCP, WebResearchMCP, VideoMCP)

### Feature Bullets (Updated for D-09 Tone)

Rewritten feature list must emphasize reliability. Required bullets (at minimum):

- Single binary, zero runtime dependencies
- 11 MCP tools (activities, athlete, streams, clubs, uploads)
- Automatic OAuth with browser flow
- Concurrent token refresh via singleflight (no thundering herd)
- Atomic write-then-rename token store (crash-safe credentials)
- Zero-CGO static binary (no C library dependencies)
- Cross-platform (macOS Intel + Apple Silicon, Linux amd64 + arm64)

### Banned Words (D-09 Tone Enforcement)

The following words must NOT appear in any modified file (README.md, docs/index.md, docs/integration.md, docs/_config.yml):

| Banned | Replace With |
|--------|-------------|
| portfolio | production-grade |
| side project | purpose-built |
| personal | (remove or rephrase) |
| hobby | (remove or rephrase) |
| showcase | (remove or rephrase) |
| demo | example |
| toy | (remove or rephrase) |
| experiment | (remove or rephrase) |

### JSON Config Snippet (D-03)

Must use this exact structure (matches existing README pattern):
```json
{
  "mcpServers": {
    "strava": {
      "command": "strava-mcp",
      "env": {
        "STRAVA_CLIENT_ID": "your_client_id",
        "STRAVA_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Empty States

Not applicable -- documentation pages always have content. No dynamic empty states exist.

### Error States

Not applicable -- static documentation. No runtime error states.

### Destructive Actions

Not applicable -- no destructive user actions in documentation.

---

## Mermaid Diagram Contract

### Existing Diagrams (DO NOT MODIFY)

Two Mermaid diagrams already exist in README.md and must not be touched:

1. **How It Works** (`graph LR`) -- MCP Client -> strava-mcp -> Strava API flow
2. **Architecture** (`graph TD`) -- Internal component architecture

### New Ecosystem Diagram (D-01)

Must use `graph TD` (top-down) to match the Architecture diagram pattern.

Required nodes (from CONTEXT.md and PROJECT.md):
- Agent Framework (OpenClaw / ZeroClaw) -- top node
- StravaMCP (Go) -- with "7MB" size annotation
- SlackMCP (Rust)
- WebResearchMCP (Rust)
- VideoMCP (Rust)
- Downstream APIs (Strava API v3, Slack API, Web Search APIs, Video APIs)

Required edges:
- Agent Framework to each MCP server: labeled `stdio`
- Each MCP server to its API: labeled `HTTPS`

Node label format: `["ServerName<br/>Language"]` (matches existing Mermaid patterns in README).

**Placement:** In the `## Agent Framework Integration` section, after the ecosystem explainer text, before the JSON config snippet.

**Duplication:** The same diagram appears in both README.md and docs/integration.md. Keep them identical.

---

## Content Structure Contract

### README.md Section Order (Claude's Discretion -- Decided)

1. Badge row (existing + add new badge if appropriate)
2. `# StravaMCP` + **updated hero tagline** (D-09)
3. Updated intro paragraph (production-grade framing)
4. `## How It Works` (existing Mermaid -- DO NOT MODIFY)
5. `## Features` (updated bullets -- reliability emphasis)
6. `## Why Go?` (NEW -- D-04 comparison table + D-06 disclaimer)
7. `## Quick Start` (existing -- no changes)
8. `## Agent Framework Integration` (NEW -- D-01 diagram, D-02 explainer, D-03 config snippet)
9. `<details>` Tool Reference (existing -- no changes)
10. `<details>` Architecture (existing -- no changes)
11. `## Configuration` (existing -- no changes)
12. `## Development` (existing -- no changes)
13. `## License` (existing -- no changes)
14. `## Links` (existing -- no changes)

### docs/index.md Structure

1. Frontmatter (`layout: default`, `title: Home`, `nav_order: 1`)
2. `# StravaMCP` `{: .fs-9 }` + **updated tagline** `{: .fs-6 .fw-300 }`
3. CTA buttons (Get Started + View on GitHub)
4. `---` horizontal rule
5. `## What is this?` (updated intro paragraph -- production-grade framing)
6. `### Key Features` (updated bullets matching README)
7. `## Why Go?` (full comparison table + disclaimer -- D-08 says docs should stand alone)
8. `## Quick Start` (existing -- no changes)
9. `## Available Tools` (existing -- no changes)
10. `## Links` (existing -- add link to integration page)

### docs/integration.md Structure (NEW -- D-07)

1. Frontmatter (`layout: default`, `title: Agent Framework Integration`, `nav_order: 2`)
2. `# Agent Framework Integration` `{: .fs-9 }`
3. Subtitle: "Wire StravaMCP into OpenClaw/ZeroClaw agent frameworks as a stdio tool provider." `{: .fs-6 .fw-300 }`
4. CTA button (link to Quick Start or GitHub)
5. `---` horizontal rule
6. `## What is OpenClaw/ZeroClaw?` (1-2 paragraph explainer)
7. `## Ecosystem Architecture` (Mermaid diagram -- same as README)
8. `## Wiring Configuration` (JSON config snippet + env var explanation)
9. `## Example Workflows` (2-3 example agent workflow descriptions)
10. `## Performance Characteristics` (brief summary with link to README Why Go section)

### docs/_config.yml Changes

Only the `description` field is modified (D-10). All other config values remain unchanged.

---

## Content Overlap Matrix (Claude's Discretion -- Decided)

| Content | README.md | docs/index.md | docs/integration.md |
|---------|-----------|---------------|---------------------|
| Hero tagline | Full (rewritten) | Full (rewritten, matching) | N/A |
| Why Go? table | Full table + disclaimer | Full table + disclaimer | Brief summary, link to README |
| Ecosystem diagram | Full Mermaid | Brief mention, link to integration page | Full Mermaid |
| JSON config snippet | Abbreviated (1 example) | N/A | Full (with explanation) |
| Ecosystem explainer | 1-2 sentences | 1-2 sentences | Full section |
| Feature bullets | Updated (reliability focus) | Updated (matching) | N/A |
| Reliability features | Listed in feature bullets | Listed in feature bullets | Mentioned in performance section |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable -- no frontend components |
| Third-party | none | not applicable |

This phase uses no component registries. All output is markdown content.

---

## Validation Checklist (for Checker)

Content-specific validation since this is a documentation phase:

- [ ] Hero taglines match across README.md and docs/index.md
- [ ] Performance table appears in both README.md and docs/index.md with identical numbers
- [ ] Disclaimer footnote (D-06) appears immediately below every performance table instance
- [ ] Ecosystem Mermaid diagram appears in README.md and docs/integration.md identically
- [ ] docs/integration.md has correct frontmatter (`layout: default`, `title: Agent Framework Integration`, `nav_order: 2`)
- [ ] No banned words ("portfolio", "showcase", "demo", "toy", "experiment", "hobby", "personal", "side project") in modified files
- [ ] Existing Mermaid diagrams in README.md are unmodified
- [ ] `docs/_config.yml` changes limited to `description` field only
- [ ] All heading depths are `###` or shallower (no `####`)
- [ ] JSON config snippets use the canonical format with `mcpServers.strava` key

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

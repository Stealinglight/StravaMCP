# Phase 5: OpenClaw Positioning & Performance Messaging - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 05-openclaw-positioning-performance-messaging
**Areas discussed:** Ecosystem section depth, Performance claims style, Docs site expansion, Tone and positioning pivot

---

## Ecosystem Section Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated section with diagram | New '## Agent Framework Integration' section with Mermaid diagram + 2-3 paragraphs | ✓ |
| Brief positioning paragraph | Short paragraph under Features mentioning OpenClaw/ZeroClaw | |
| Feature bullet + section | Bullet in Features list + shorter dedicated section | |

**User's choice:** Dedicated section with diagram
**Notes:** None

---

### Ecosystem explainer depth

| Option | Description | Selected |
|--------|-------------|----------|
| Brief explainer included | 1-2 sentences defining OpenClaw/ZeroClaw for newcomers | ✓ |
| Assume familiarity | Reference by name with link, don't explain | |
| You decide | Claude picks | |

**User's choice:** Brief explainer included
**Notes:** None

---

### Diagram server labels

| Option | Description | Selected |
|--------|-------------|----------|
| Real RustyClaw servers | Show actual servers (SlackMCP, WebResearchMCP, VideoMCP) | ✓ |
| Generic placeholders | Generic labels like 'Tool Server A' | |
| You decide | Claude picks | |

**User's choice:** Real RustyClaw servers
**Notes:** None

---

### Integration config snippet in README

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, JSON config example | Minimal agent config snippet showing StravaMCP as tool provider | ✓ |
| No, just description | Keep conceptual, integration code in docs site only | |
| You decide | Claude decides based on flow | |

**User's choice:** Yes, JSON config example
**Notes:** None

---

## Performance Claims Style

| Option | Description | Selected |
|--------|-------------|----------|
| Comparison table | Markdown table: Go vs Python vs Node.js across startup, memory, binary, deps | ✓ |
| Qualitative prose | Feature-style bullets without numbers | |
| Estimated numbers in prose | Approximate numbers in sentences | |

**User's choice:** Comparison table
**Notes:** None

---

### Disclaimer

| Option | Description | Selected |
|--------|-------------|----------|
| Italic footnote | Small italic note: "Estimates based on known characteristics. Not formal benchmarks." | ✓ |
| No disclaimer | Let table speak for itself | |
| You decide | Claude picks tone | |

**User's choice:** Italic footnote
**Notes:** None

---

### Table placement

| Option | Description | Selected |
|--------|-------------|----------|
| Own section: 'Why Go?' | Dedicated ## section near top, after Features before Quick Start | ✓ |
| Inside ecosystem section | Fold into Agent Framework Integration section | |
| Collapsible details block | Performance table in <details> collapse | |

**User's choice:** Own section: 'Why Go?'
**Notes:** None

---

## Docs Site Expansion

| Option | Description | Selected |
|--------|-------------|----------|
| Add dedicated integration page | New docs/integration.md with full OpenClaw/ZeroClaw integration guide | ✓ |
| Expand index.md only | Add sections to existing page | |
| Multiple new pages | integration.md + performance.md as separate pages | |

**User's choice:** Add dedicated integration page
**Notes:** None

---

### Docs index.md content strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror key content | Update index.md with performance and ecosystem content, docs site stands alone | ✓ |
| Link to README | Keep lean, link to GitHub for details | |
| You decide | Claude picks | |

**User's choice:** Mirror key content
**Notes:** None

---

## Tone and Positioning Pivot

| Option | Description | Selected |
|--------|-------------|----------|
| Confident reframing | Reframe language: 'production-grade' hero, emphasize reliability, remove portfolio language | ✓ |
| Subtle adjustments | Keep current voice, let new sections do repositioning | |
| Full tone overhaul | Enterprise-grade assertive voice throughout | |

**User's choice:** Confident reframing
**Notes:** None

---

### Hero tagline

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, rewrite hero | Lead with 'production-grade' and 'agent frameworks' | ✓ |
| Keep current hero | Current tagline is good, let sections do work | |
| You decide | Claude picks based on flow | |

**User's choice:** Yes, rewrite hero
**Notes:** None

---

### Metadata updates

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, update both | Update _config.yml description + note to update GitHub repo About | ✓ |
| Just _config.yml | Docs site only, GitHub is manual | |
| Neither | Focus on content only | |

**User's choice:** Yes, update both
**Notes:** None

---

## Claude's Discretion

- Exact README section ordering
- Mermaid diagram styling and node labels
- Exact hero tagline wording
- Content overlap balance between README and docs/index.md
- Integration page depth and example workflows

## Deferred Ideas

None -- discussion stayed within phase scope.

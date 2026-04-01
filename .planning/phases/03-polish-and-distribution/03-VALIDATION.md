---
phase: 03
slug: polish-and-distribution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | go test (built-in) |
| **Config file** | none — standard Go testing |
| **Quick run command** | `go test ./... -count=1` |
| **Full suite command** | `go test ./... -v -count=1 -race` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `go test ./... -count=1`
- **After every plan wave:** Run `go test ./... -v -count=1 -race`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DOCS-02 | build | `go build ./...` | N/A | pending |
| 03-01-02 | 01 | 1 | DOCS-01 | content | `grep '## Quick Start' README.md` | N/A | pending |
| 03-02-01 | 02 | 2 | DOCS-02 | config | `test -f .goreleaser.yml` | N/A | pending |
| 03-02-02 | 02 | 2 | DOCS-02 | workflow | `test -f .github/workflows/release.yml` | N/A | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — go test already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| README visual rendering | DOCS-01 | GitHub-specific Mermaid and badge rendering | View README.md on GitHub after push |
| Homebrew tap install | DOCS-02 | Requires published tap repo and GitHub release | `brew install Stealinglight/tap/strava-mcp` after first release |
| Terminal recording playback | DOCS-01 | Visual quality assessment | View SVG/GIF in browser |
| Zero-to-working quickstart | DOCS-01 | End-to-end user journey | Follow README instructions from scratch |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

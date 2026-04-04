---
phase: 5
slug: openclaw-positioning-performance-messaging
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Go testing (go test) |
| **Config file** | Built-in Go test runner, no config file |
| **Quick run command** | `go test ./...` |
| **Full suite command** | `go test -v ./...` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `go test ./...`
- **After every plan wave:** Run `go test -v ./...`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | MSG-01 | manual-only | Visual inspection of README.md | N/A | pending |
| 05-01-02 | 01 | 1 | MSG-02 | manual-only | Visual inspection of README.md | N/A | pending |
| 05-01-03 | 01 | 1 | MSG-04 | manual-only | Grep for banned words + tone review | N/A | pending |
| 05-02-01 | 02 | 1 | MSG-03 | manual-only | Visual inspection of docs/ pages | N/A | pending |
| 05-02-02 | 02 | 1 | MSG-04 | manual-only | Grep for banned words + tone review | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase is pure documentation content — no new test infrastructure needed. `go test ./...` serves as a regression check that no source code was accidentally modified.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| README ecosystem section | MSG-01 | Content authoring — no code to test | Verify README.md contains OpenClaw/ZeroClaw section explaining stdio MCP server role |
| README performance claims | MSG-02 | Content authoring — no code to test | Verify README.md contrasts Go performance (startup, memory, binary size) vs Python/JS |
| Docs integration page | MSG-03 | Content authoring — no code to test | Verify docs/ has integration page with nav_order and agent wiring instructions |
| Production-grade tone | MSG-04 | Subjective tone assessment | Grep for absence of "portfolio", "showcase", "demo" in modified files; review tone |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---
phase: 02
slug: tool-suite
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | go test (stdlib) |
| **Config file** | none — go test works out of the box |
| **Quick run command** | `go test ./internal/tools/... -count=1` |
| **Full suite command** | `go test ./... -count=1 -race` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `go test ./internal/tools/... -count=1`
- **After every plan wave:** Run `go test ./... -count=1 -race`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | ACT-01..05, ATH-01..02 | unit | `go test ./internal/tools/... -count=1 -v -run "TestActivities\|TestAthlete"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | STR-01, CLB-01, UPL-01..02 | unit | `go test ./internal/tools/... -count=1 -v -run "TestStreams\|TestClubs\|TestUpload"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `internal/tools/activities_test.go` — stubs for ACT-01 through ACT-05
- [ ] `internal/tools/athlete_test.go` — stubs for ATH-01, ATH-02
- [ ] `internal/tools/streams_test.go` — stubs for STR-01
- [ ] `internal/tools/clubs_test.go` — stubs for CLB-01
- [ ] `internal/tools/uploads_test.go` — stubs for UPL-01, UPL-02

*Existing go test infrastructure covers all phase requirements. Test files created by TDD approach in plan tasks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OAuth flow opens browser | INFRA-03 (Phase 1) | Requires real browser | Run `strava-mcp auth` and verify browser opens |
| Upload to real Strava | UPL-01 | Requires valid API credentials | Upload a test GPX file with real tokens |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---
phase: 1
slug: foundation-and-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Go testing (stdlib) + net/http/httptest |
| **Config file** | None needed — `go test ./...` works out of the box |
| **Quick run command** | `go test ./internal/... -count=1 -short` |
| **Full suite command** | `go test ./... -count=1 -race` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `go test ./internal/... -count=1 -short`
- **After every plan wave:** Run `go test ./... -count=1 -race`
- **Before `/gsd:verify-work`:** Full suite must be green + `go build` produces binary + `go vet ./...` clean
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFRA-01 | build + unit | `go build -o /dev/null . && go test ./internal/config/... -count=1` | No — Wave 0 | pending |
| 01-02-01 | 02 | 1 | INFRA-02 | unit | `go test ./internal/auth/... -run TestTokenStore -count=1` | No — Wave 0 | pending |
| 01-02-02 | 02 | 1 | INFRA-03 | unit + integration | `go test ./internal/auth/... -run TestOAuth -count=1` | No — Wave 0 | pending |
| 01-02-03 | 02 | 1 | INFRA-04 | unit | `go test ./internal/strava/... -count=1 -race` | No — Wave 0 | pending |
| 01-02-04 | 02 | 1 | INFRA-05 | integration | `go test ./internal/server/... -count=1` | No — Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `go.mod` / `go.sum` — module initialization (`go mod init strava-mcp`)
- [ ] `internal/config/config_test.go` — covers INFRA-01 (env var loading, defaults, missing required vars)
- [ ] `internal/auth/tokenstore_test.go` — covers INFRA-02 (atomic write, read, expiry check, missing directory creation)
- [ ] `internal/auth/oauth_test.go` — covers INFRA-03 (callback handler, code exchange with mock Strava, timeout)
- [ ] `internal/strava/client_test.go` — covers INFRA-04 (auto-refresh via httptest, singleflight concurrency test with -race, rate limit header parsing)
- [ ] `internal/server/server_test.go` — covers INFRA-05 (MCP server creation, tool listing returns empty set)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browser opens for OAuth | INFRA-03 | Requires real browser + user interaction | Run `strava-mcp auth`, verify browser opens to Strava authorize page |
| MCP Inspector handshake | INFRA-05 | Requires MCP Inspector tool | Connect MCP Inspector to `strava-mcp` via stdio, verify handshake completes |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

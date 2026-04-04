# StravaMCP — Go Rewrite

## What This Is

A Go-based MCP (Model Context Protocol) server for the Strava API, designed to run as a local stdio-based tool server within the ZeroClaw/RustyClaw ecosystem. This is a full rewrite of the existing TypeScript implementation, simplified from a Lambda+DynamoDB deployment to a standalone Go binary with file-based token storage and built-in OAuth for initial setup. It's also a portfolio piece — the README and project presentation need to be polished and visually rich.

## Core Value

A fast, self-contained Go binary that gives any MCP client full access to the Strava API with zero cloud infrastructure required.

## Requirements

### Validated

- ✓ Full rewrite in Go with stdio MCP transport — v1.0
- ✓ Go MCP SDK integration (mcp-go v0.46.0) — v1.0
- ✓ Built-in OAuth browser flow for initial token acquisition — v1.0
- ✓ File-based token store with automatic refresh persistence — v1.0
- ✓ 11 MCP tools with full TypeScript feature parity — v1.0
- ✓ Portfolio-quality README with badges, diagrams, tool reference — v1.0
- ✓ Single-binary distribution via goreleaser with Homebrew — v1.0
- ✓ Cross-platform builds (darwin/linux, amd64/arm64) — v1.0

### Active

<!-- Remaining scope for future milestones -->

- [ ] Segment tools: starred segments, segment efforts, leaderboards
- [ ] Route tools: route details, export GPX, athlete routes
- [ ] Gear tools: gear details, manage equipment
- [ ] Laps & efforts tools: activity laps, segment efforts, best efforts


### Out of Scope

- AWS Lambda deployment — simplifying to local binary only
- DynamoDB integration — replaced by file-based storage
- Express/HTTP server mode — stdio only (MCP standard)
- SSE transport — not needed for local stdio
- OAuth 2.1 server for external clients — only built-in OAuth for the user's own Strava auth
- OpenAI-compatible tool definitions — Go version is MCP-native only
- Muscle group heat map renderer — separate project, future milestone integration

## Context

- v1.0 shipped: 4,791 LOC Go across 5 packages (auth, config, server, strava, tools)
- 80+ tests passing, all packages covered
- Tech stack: Go 1.25, mcp-go v0.46.0, goreleaser v2, GitHub Actions
- Part of the RustyClaw/ZeroClaw ecosystem (local MCP servers for Strava, Slack, video, web-research)
- All TypeScript/Lambda code removed — clean Go-only repository
- Portfolio piece with polished README, badges, Mermaid diagrams
- The muscle group heat map renderer is being built separately and will integrate in a future milestone

## Constraints

- **Language**: Go — fits the RustyClaw ecosystem and portfolio goals
- **Transport**: stdio only — MCP standard for local tool servers
- **Auth**: File-based token store + built-in OAuth browser flow for setup
- **Distribution**: Single binary with no runtime dependencies
- **Strava API**: Must work within Strava's rate limits (100 req/15min, 1000/day)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rewrite in Go (not incremental refactor) | Ecosystem fit with RustyClaw, portfolio signal, clean break from AWS dependencies | ✓ Phase 1 |
| Stdio transport only | Local MCP standard, matches RustyClaw pattern, eliminates server complexity | ✓ Phase 1 |
| mcp-go v0.46.0 as MCP SDK | Best maintained Go MCP library, active development, clean API | ✓ Phase 1 |
| Drop all AWS infrastructure | Simplify to standalone binary, no cloud dependencies | ✓ Phase 1 |
| All logging to stderr, stdout reserved for MCP JSON-RPC | Prevents protocol corruption from stray output | ✓ Phase 1 |
| singleflight for token refresh coalescing | Prevents thundering herd on concurrent expired-token requests | ✓ Phase 1 |
| Raw JSON responses (no Go structs for Strava data) | D-01: pass through Strava JSON with pretty-printing, avoid schema coupling | ✓ Phase 2 |
| Map-based PUT body for update_activity | Avoids Go zero-value trap — only sends user-provided fields | ✓ Phase 2 |
| Auto-detect upload data_type from file extension | D-04: .gpx/.fit/.tcx/.tcx.gz mapped automatically, explicit override available | ✓ Phase 2 |
| Module path github.com/Stealinglight/StravaMCP | Enables `go install` and proper Go module ecosystem integration | ✓ Phase 3 |
| goreleaser v2 with homebrew_casks | Cross-platform binary distribution + Homebrew tap | ✓ Phase 3 |
| ISC License | Simple permissive license for open source distribution | ✓ Phase 3 |
| Add segments/routes/gear/laps | Expand beyond current 11 tools to comprehensive Strava coverage | — v2.0 |
| Heat map as future milestone | Separate project, don't couple it to the core rewrite | — v2.0+ |

## Current Milestone: v1.1 Docs, Pages & OpenClaw Positioning

**Goal:** Fix GitHub Pages deployment, position StravaMCP as a high-performance Go MCP server for OpenClaw/ZeroClaw agent frameworks, and highlight Go speed advantages over Python/JavaScript MCPs.

**Target features:**
- Fix GitHub Pages deployment workflow (deleted during v1.0 cleanup)
- Update README with OpenClaw/ZeroClaw ecosystem positioning and Go performance messaging
- Update docs/ site with OpenClaw compatibility and performance claims
- Position as production-grade MCP server for agent frameworks, not just a portfolio piece

## Current State

v1.0 milestone shipped (2026-04-01). Complete Go rewrite with 11 MCP tools, OAuth browser flow, singleflight token refresh, goreleaser cross-platform release pipeline with Homebrew distribution, and portfolio-quality README. 4,791 LOC Go, 80+ tests, all TypeScript/Lambda artifacts removed. Deployed to RustyClaw bot-delta (v1.0.1). Phase 4 complete — GitHub Pages docs site restored and live at stealinglight.github.io/StravaMCP with just-the-docs dark theme.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-03 after Phase 4 completion*

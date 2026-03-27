# StravaMCP — Go Rewrite

## What This Is

A Go-based MCP (Model Context Protocol) server for the Strava API, designed to run as a local stdio-based tool server within the ZeroClaw/RustyClaw ecosystem. This is a full rewrite of the existing TypeScript implementation, simplified from a Lambda+DynamoDB deployment to a standalone Go binary with file-based token storage and built-in OAuth for initial setup. It's also a portfolio piece — the README and project presentation need to be polished and visually rich.

## Core Value

A fast, self-contained Go binary that gives any MCP client full access to the Strava API with zero cloud infrastructure required.

## Requirements

### Validated

<!-- Inferred from existing TypeScript codebase -->

- ✓ List athlete activities with date filtering and pagination — existing
- ✓ Get detailed activity by ID — existing
- ✓ Create manual activities — existing
- ✓ Update existing activities (name, description, gear, metadata) — existing
- ✓ Get activity heart rate and power zones — existing
- ✓ Get authenticated athlete profile — existing
- ✓ Get athlete aggregate statistics — existing
- ✓ Get activity time-series streams (HR, GPS, power, cadence, etc.) — existing
- ✓ Get club activities — existing
- ✓ Upload activity files (GPX, TCX, FIT) — existing
- ✓ Check upload status — existing
- ✓ Automatic OAuth token refresh with expiry buffer — existing
- ✓ File-based token storage (Rusty Claw pattern) — existing in RustyClaw

### Active

<!-- New scope for Go rewrite -->

- [ ] Full rewrite in Go with stdio MCP transport
- [ ] Go MCP SDK integration (research best library)
- [ ] Built-in OAuth browser flow for initial token acquisition
- [ ] File-based token store with automatic refresh persistence
- [ ] Segment tools: starred segments, segment efforts, leaderboards
- [ ] Route tools: route details, export GPX, athlete routes
- [ ] Gear tools: gear details, manage equipment
- [ ] Laps & efforts tools: activity laps, segment efforts, best efforts
- [ ] Portfolio-quality README with badges, architecture diagram, feature highlights, and visual polish
- [ ] Single-binary distribution (go build, no runtime dependencies)

### Out of Scope

- AWS Lambda deployment — simplifying to local binary only
- DynamoDB integration — replaced by file-based storage
- Express/HTTP server mode — stdio only (MCP standard)
- SSE transport — not needed for local stdio
- OAuth 2.1 server for external clients — only built-in OAuth for the user's own Strava auth
- OpenAI-compatible tool definitions — Go version is MCP-native only
- Muscle group heat map renderer — separate project, future milestone integration

## Context

- This MCP is part of the RustyClaw/ZeroClaw ecosystem, which runs multiple local MCP servers (Strava, Slack, video, web-research) as stdio-based tools
- The existing TypeScript version at `src/` has 11 Strava tools and a full AWS Lambda deployment stack
- The RustyClaw version at `mcp-servers/strava-mcp/` is already a simplified local-only TypeScript version — the Go rewrite follows this pattern
- The Go rewrite adds expanded Strava API coverage (segments, routes, gear, laps) beyond the current 11 tools
- Chris wants this as a portfolio piece — clean code, excellent README, architecture documentation
- The muscle group heat map renderer is being built separately and will integrate with this MCP in a future milestone

## Constraints

- **Language**: Go — fits the RustyClaw ecosystem and portfolio goals
- **Transport**: stdio only — MCP standard for local tool servers
- **Auth**: File-based token store + built-in OAuth browser flow for setup
- **Distribution**: Single binary with no runtime dependencies
- **Strava API**: Must work within Strava's rate limits (100 req/15min, 1000/day)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rewrite in Go (not incremental refactor) | Ecosystem fit with RustyClaw, portfolio signal, clean break from AWS dependencies | — Pending |
| Stdio transport only | Local MCP standard, matches RustyClaw pattern, eliminates server complexity | — Pending |
| Research Go MCP library | Multiple options exist (mcp-go, etc.), need to find best fit before committing | — Pending |
| Drop all AWS infrastructure | Simplify to standalone binary, no cloud dependencies | — Pending |
| Add segments/routes/gear/laps | Expand beyond current 11 tools to comprehensive Strava coverage | — Pending |
| Heat map as future milestone | Separate project, don't couple it to the core rewrite | — Pending |

---
*Last updated: 2026-03-26 after initialization*

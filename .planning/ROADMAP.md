# Roadmap: StravaMCP Go Rewrite

## Overview

This roadmap delivers a complete Go rewrite of the Strava MCP server in three phases: first, build all infrastructure (project scaffold, token management, OAuth browser flow, Strava HTTP client, MCP server wiring); second, port all 11 existing tools to Go with full feature parity; third, polish the README and set up single-binary distribution for portfolio presentation. The dependency chain is strict -- no tool can work without the infrastructure layer, and the README cannot be finalized until all tools are implemented.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation and Auth** - Go project scaffold, file-based token store, OAuth browser flow, Strava HTTP client, and MCP server wiring (completed 2026-03-27)
- [ ] **Phase 2: Tool Suite** - Port all 11 existing Strava tools with full feature parity (activities, athlete, streams, clubs, uploads)
- [ ] **Phase 3: Polish and Distribution** - Portfolio-quality README and single-binary cross-platform release pipeline

## Phase Details

### Phase 1: Foundation and Auth
**Goal**: A running MCP server binary that authenticates with Strava and can make API calls, with all infrastructure ready for tool registration
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Running `go build` produces a single binary with no runtime dependencies
  2. Running `strava-mcp auth` opens a browser, completes OAuth, and persists tokens to ~/.strava/tokens.json
  3. The MCP server connects via stdio and responds to MCP protocol handshake (list tools returns empty tool set)
  4. Token auto-refresh works transparently -- an expired access token triggers refresh without user intervention, and concurrent refresh attempts are coalesced into one
  5. All logging goes to stderr only -- stdout carries exclusively MCP JSON-RPC traffic
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Go project scaffold, config loader, token store, and MCP server shell
- [x] 01-02-PLAN.md -- Strava HTTP client with auto-refresh and OAuth browser flow

### Phase 2: Tool Suite
**Goal**: Users can access all core Strava data through 11 MCP tools matching the existing TypeScript feature set
**Depends on**: Phase 1
**Requirements**: ACT-01, ACT-02, ACT-03, ACT-04, ACT-05, ATH-01, ATH-02, STR-01, CLB-01, UPL-01, UPL-02
**Success Criteria** (what must be TRUE):
  1. User can list, view, create, and update activities through MCP tool calls
  2. User can retrieve heart rate/power zones, time-series streams, and athlete statistics
  3. User can upload activity files (GPX/TCX/FIT) via multipart form data and check upload status
  4. User can list club activities with pagination
  5. All 11 tool descriptions match the existing TypeScript versions in detail and quality (descriptions are the product UI for LLMs)
**Plans**: TBD

Plans:
- [ ] 02-01: Activity and athlete tools
- [ ] 02-02: Streams, clubs, and upload tools

### Phase 3: Polish and Distribution
**Goal**: The project is portfolio-ready with a polished README and frictionless installation via single-binary releases
**Depends on**: Phase 2
**Requirements**: DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
  1. README includes badges, architecture diagram, complete tool reference, quick-start guide, and visual polish worthy of a portfolio piece
  2. `goreleaser` produces cross-platform binaries (macOS, Linux, Windows) from a single GitHub Actions workflow
  3. A new user can go from zero to working MCP server by following only the README instructions
**Plans**: TBD

Plans:
- [ ] 03-01: README and release pipeline

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Auth | 2/2 | Complete   | 2026-03-27 |
| 2. Tool Suite | 0/2 | Not started | - |
| 3. Polish and Distribution | 0/1 | Not started | - |

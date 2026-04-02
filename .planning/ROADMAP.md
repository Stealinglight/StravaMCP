# Roadmap: StravaMCP

## Milestones

- v1.0 **Go Rewrite** - Phases 1-3 (shipped 2026-04-01)
- v1.1 **Docs, Pages & OpenClaw Positioning** - Phases 4-5 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 Go Rewrite (Phases 1-3) - SHIPPED 2026-04-01</summary>

- [x] **Phase 1: Foundation and Auth** - Go project scaffold, file-based token store, OAuth browser flow, Strava HTTP client, and MCP server wiring
- [x] **Phase 2: Tool Suite** - Port all 11 existing Strava tools with full feature parity (activities, athlete, streams, clubs, uploads)
- [x] **Phase 3: Polish and Distribution** - Portfolio-quality README and single-binary cross-platform release pipeline

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
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- Shared helpers (formatResponse, handleToolError) and 5 activity tools
- [x] 02-02-PLAN.md -- Athlete, streams, and club tools (4 tools)
- [x] 02-03-PLAN.md -- PostMultipart client method, upload tools, and RegisterAll wiring (2 tools + final wiring)

### Phase 3: Polish and Distribution
**Goal**: The project is portfolio-ready with a polished README and frictionless installation via single-binary releases
**Depends on**: Phase 2
**Requirements**: DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
  1. README includes badges, architecture diagram, complete tool reference, quick-start guide, and visual polish worthy of a portfolio piece
  2. `goreleaser` produces cross-platform binaries (macOS, Linux) from a single GitHub Actions workflow
  3. A new user can go from zero to working MCP server by following only the README instructions
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md -- Module path migration, legacy cleanup, LICENSE, .gitignore
- [x] 03-02-PLAN.md -- goreleaser config, release workflow, CONTRIBUTING.md, repo metadata
- [x] 03-03-PLAN.md -- Portfolio-quality README and docs site rewrite

</details>

### v1.1 Docs, Pages & OpenClaw Positioning (In Progress)

**Milestone Goal:** Fix GitHub Pages deployment, position StravaMCP as a high-performance Go MCP server for OpenClaw/ZeroClaw agent frameworks, and highlight Go speed advantages over Python/JavaScript MCPs.

- [ ] **Phase 4: GitHub Pages Restoration** - Fix broken deployment workflow and verify docs site renders correctly
- [ ] **Phase 5: OpenClaw Positioning & Performance Messaging** - Update README and docs with agent framework positioning and Go performance advantages

## Phase Details

### Phase 4: GitHub Pages Restoration
**Goal**: The docs site is live and rendering correctly at stealinglight.github.io/StravaMCP
**Depends on**: Phase 3 (docs site content created in v1.0)
**Requirements**: PAGES-01, PAGES-02
**Success Criteria** (what must be TRUE):
  1. Pushing to main triggers a GitHub Actions workflow that deploys docs/ to GitHub Pages
  2. stealinglight.github.io/StravaMCP loads and renders the docs site with just-the-docs theme and dark mode
  3. All existing docs site pages (tool reference, quick start, architecture) render without broken links or missing assets
**Plans**: TBD
**UI hint**: yes

### Phase 5: OpenClaw Positioning & Performance Messaging
**Goal**: StravaMCP is positioned as a production-grade, high-performance MCP server for agent frameworks, not just a portfolio piece
**Depends on**: Phase 4 (docs site must be live before updating its content)
**Requirements**: MSG-01, MSG-02, MSG-03, MSG-04
**Success Criteria** (what must be TRUE):
  1. README contains an OpenClaw/ZeroClaw ecosystem section that explains how StravaMCP fits as a stdio MCP server within agent framework architectures
  2. README includes concrete Go performance claims (sub-second startup, low memory footprint, small binary size) contrasted against typical Python/JavaScript MCP servers
  3. Docs site has a dedicated OpenClaw/ZeroClaw compatibility page or section with integration instructions (how to wire StravaMCP into an agent)
  4. The overall project tone across README and docs reads as "production-grade MCP server" rather than "portfolio project" -- language emphasizes reliability, performance, and agent framework integration
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 4 -> 5

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation and Auth | v1.0 | 2/2 | Complete | 2026-03-27 |
| 2. Tool Suite | v1.0 | 3/3 | Complete | 2026-03-27 |
| 3. Polish and Distribution | v1.0 | 3/3 | Complete | 2026-04-01 |
| 4. GitHub Pages Restoration | v1.1 | 0/? | Not started | - |
| 5. OpenClaw Positioning | v1.1 | 0/? | Not started | - |

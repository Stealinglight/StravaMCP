# Requirements: StravaMCP Go Rewrite

**Defined:** 2026-03-26
**Core Value:** A fast, self-contained Go binary that gives any MCP client full access to the Strava API with zero cloud infrastructure required.

## v1 Requirements (Milestone 1 — Core Go Rewrite)

### Infrastructure

- [ ] **INFRA-01**: Go project scaffolded with mcp-go SDK, stderr-only logging, go.mod initialized
- [ ] **INFRA-02**: File-based token store with atomic write-then-rename at configurable path (~/.strava/tokens.json)
- [ ] **INFRA-03**: Built-in OAuth browser flow that opens system browser, runs ephemeral localhost callback, exchanges code, persists tokens
- [ ] **INFRA-04**: Strava HTTP client with automatic token refresh (5-min buffer), concurrent refresh protection (singleflight), and rate limit header tracking
- [ ] **INFRA-05**: MCP server wired with mcp-go ServeStdio, all tools registered declaratively

### Activity Tools (Port)

- [ ] **ACT-01**: User can list recent activities with date filtering (before/after) and pagination
- [ ] **ACT-02**: User can get detailed activity by ID including laps, splits, segment efforts
- [ ] **ACT-03**: User can create manual activities with name, sport type, start time, elapsed time
- [ ] **ACT-04**: User can update existing activities (name, description, sport type, gear, trainer, commute, hide)
- [ ] **ACT-05**: User can get heart rate and power zone distribution for an activity

### Athlete Tools (Port)

- [ ] **ATH-01**: User can get authenticated athlete profile (name, gear, preferences)
- [ ] **ATH-02**: User can get athlete aggregate statistics (recent/YTD/all-time run/ride/swim totals)

### Stream Tools (Port)

- [ ] **STR-01**: User can get activity time-series streams (HR, GPS, power, cadence, altitude, etc.)

### Club Tools (Port)

- [ ] **CLB-01**: User can list recent activities from a club's members with pagination

### Upload Tools (Port)

- [ ] **UPL-01**: User can upload activity files (GPX, TCX, FIT) via proper multipart form data
- [ ] **UPL-02**: User can check upload processing status and get resulting activity ID

### Presentation

- [ ] **DOCS-01**: Portfolio-quality README with badges, architecture diagram, feature list, quick start, visual polish
- [ ] **DOCS-02**: Single-binary distribution via go install and goreleaser (multi-platform builds)

## v2 Requirements (Milestone 2 — Expanded Strava Coverage)

### Segment Tools

- [ ] **SEG-01**: User can list their starred segments with pagination
- [ ] **SEG-02**: User can get detailed segment info (distance, elevation, grade, climb category)
- [ ] **SEG-03**: User can explore segments near a GPS coordinate with filters
- [ ] **SEG-04**: User can star/unstar a segment
- [ ] **SEG-05**: User can list all efforts on a segment (filtered by athlete, date range)
- [ ] **SEG-06**: User can get detailed segment effort (elapsed time, moving time, PR rank)
- [ ] **SEG-07**: User can get segment streams (altitude, distance, latlng)
- [ ] **SEG-08**: User can get segment effort streams (time-series for a specific effort)

### Route Tools

- [ ] **RTE-01**: User can list their routes with pagination
- [ ] **RTE-02**: User can get route details (distance, elevation, estimated time, map)
- [ ] **RTE-03**: User can export a route as GPX
- [ ] **RTE-04**: User can export a route as TCX
- [ ] **RTE-05**: User can get route streams (elevation, distance, latlng)

### Gear Tools

- [ ] **GEAR-01**: User can get gear details by ID (distance tracked, name, brand, model)
- [ ] **GEAR-02**: User can list all their shoes with mileage (extracted from athlete profile)
- [ ] **GEAR-03**: User can list all their bikes (extracted from athlete profile)

### Laps & Zones

- [ ] **LAP-01**: User can get activity laps (pace, HR, cadence per lap)
- [ ] **ZONE-01**: User can get their configured HR/power zone boundaries

### Extended Club Tools

- [ ] **CLB-02**: User can list clubs they belong to
- [ ] **CLB-03**: User can get club details (member count, sport type, location)

### Social Tools

- [ ] **SOC-01**: User can get activity comments with pagination
- [ ] **SOC-02**: User can get activity kudos with pagination
- [ ] **SOC-03**: User can get activity photos (note: uses undocumented endpoint, verify stability)

## Out of Scope

| Feature | Reason |
|---------|--------|
| AWS Lambda deployment | Simplifying to local binary only — drop all cloud infrastructure |
| DynamoDB / any database | File-based token store is sufficient for local MCP |
| SSE / HTTP transport | Stdio only — MCP standard for local tool servers |
| Segment leaderboard | Undocumented endpoint, requires Strava Summit subscription, may break |
| Activity deletion | Destructive operation with no undo — too risky for LLM tool |
| Webhook subscriptions | Requires public HTTP endpoint — contradicts zero-infrastructure design |
| Bulk operations | Rate limit risk and amplifies AI mistake potential |
| Data caching / local DB | Adds staleness complexity; API rate limits are generous for interactive use |
| Multi-athlete support | One MCP instance per athlete; coaching multiple athletes = separate instances |
| Training plan generation | LLM/agent layer concern, not a tool concern |
| Muscle group heat map | Separate project, future milestone integration |
| OpenAI-compatible tool defs | Go version is MCP-native only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | TBD | Pending |
| INFRA-02 | TBD | Pending |
| INFRA-03 | TBD | Pending |
| INFRA-04 | TBD | Pending |
| INFRA-05 | TBD | Pending |
| ACT-01 | TBD | Pending |
| ACT-02 | TBD | Pending |
| ACT-03 | TBD | Pending |
| ACT-04 | TBD | Pending |
| ACT-05 | TBD | Pending |
| ATH-01 | TBD | Pending |
| ATH-02 | TBD | Pending |
| STR-01 | TBD | Pending |
| CLB-01 | TBD | Pending |
| UPL-01 | TBD | Pending |
| UPL-02 | TBD | Pending |
| DOCS-01 | TBD | Pending |
| DOCS-02 | TBD | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 0 (awaiting roadmap)
- Unmapped: 18

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after initial definition*

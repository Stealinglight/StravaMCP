# Feature Research

**Domain:** Strava API v3 MCP Tool Server (Go rewrite)
**Researched:** 2026-03-26
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete. These are the core Strava API operations that any MCP server worth using must support. The existing TypeScript implementation already has 11 tools covering these; the Go rewrite must reach parity before adding anything new.

#### Activity Management (Existing -- Must Port)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| List athlete activities | Core use case -- finding recent workouts to analyze or enrich | LOW | `GET /athlete/activities` with before/after/page/per_page. Already implemented in TS. |
| Get activity by ID | Required for any drill-down analysis of a specific workout | LOW | `GET /activities/{id}` with include_all_efforts flag. Returns laps, splits, segment_efforts, gear, map. |
| Create manual activity | Users log activities that were not auto-tracked (gym, yoga, cross-training) | LOW | `POST /activities` with name, sport_type, start_date_local, elapsed_time, distance, etc. |
| Update activity | **Critical enrichment workflow** -- renaming "Morning Run" to meaningful titles, adding descriptions | LOW | `PUT /activities/{id}` partial updates. This is the most-used tool in the coaching workflow. |
| Get activity zones | Training intensity analysis -- time in HR/power zones | LOW | `GET /activities/{id}/zones`. Requires Strava Summit for some data. |

#### Athlete Data (Existing -- Must Port)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Get authenticated athlete profile | Identity, athlete ID for other calls, personalization | LOW | `GET /athlete`. Returns shoes/bikes arrays which are the gateway to gear data. |
| Get athlete statistics | Training volume tracking -- recent/YTD/all-time totals for run/ride/swim | LOW | `GET /athletes/{id}/stats`. Requires athlete ID (fetch from profile first). |

#### Streams / Telemetry (Existing -- Must Port)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Get activity streams | Deep performance analysis -- HR, pace, power, GPS, cadence, elevation time-series | MEDIUM | `GET /activities/{id}/streams`. 11 stream types. Returns large payloads. Must handle key_by_type formatting. |

#### Club Operations (Existing -- Must Port)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Get club activities | See what club members are doing, team training review | LOW | `GET /clubs/{id}/activities` with pagination. |

#### Uploads (Existing -- Must Port)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Upload activity file | Import GPX/TCX/FIT files from non-integrated devices | MEDIUM | `POST /uploads` requires multipart/form-data. The existing TS implementation is simplified (base64 body); Go version should do proper multipart. |
| Check upload status | Uploads are async -- users need to poll for completion | LOW | `GET /uploads/{id}`. Returns status and activity_id when done. |

#### Infrastructure (Existing -- Must Port)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| OAuth token auto-refresh | Users should never see auth errors during normal use | MEDIUM | Refresh 5 min before expiry. Persist new refresh_token to file. Handle concurrent refresh. |
| File-based token storage | Zero-infrastructure local auth (RustyClaw pattern) | LOW | JSON file at configurable path. Must persist refreshed tokens. |
| Built-in OAuth browser flow | First-time setup without manual token copying | MEDIUM | Open browser -> Strava authorize -> localhost callback -> exchange code -> store tokens. New for Go version. |

### Differentiators (Competitive Advantage)

The leading competitor (r-huijts/strava-mcp, 302 stars, TypeScript) has 25 tools. Our Go rewrite should match or exceed that coverage while being faster, smaller (single binary), and better documented. These new tools go beyond the existing 11 and are what make this project a compelling portfolio piece.

#### Segment Tools (New -- Planned)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| List starred segments | Athletes curate favorite segments -- surface them for analysis and goal-tracking | LOW | `GET /segments/starred` with pagination. |
| Get segment details | Full segment info: distance, elevation, average grade, climb category, effort count | LOW | `GET /segments/{id}`. Returns DetailedSegment. |
| Explore segments by location | Discover segments near a GPS coordinate -- great for route planning and travel | MEDIUM | `GET /segments/explore` with bounds (SW lat/lng, NE lat/lng), activity_type, min/max climb_category. |
| Star/unstar segment | Curate segment list from the MCP -- bookmark interesting segments for later | LOW | `PUT /segments/{id}/starred` with starred=true/false. Requires activity:write or profile:write scope. |
| List segment efforts | See all attempts on a segment (optionally filtered by athlete, date range) | LOW | `GET /segments/{id}/all_efforts` with athlete_id, start_date_local, end_date_local, pagination. |
| Get segment effort detail | Full detail on a specific effort -- elapsed time, moving time, start/end index, PR rank | LOW | `GET /segment_efforts/{id}`. Returns DetailedSegmentEffort. |
| Get segment streams | Altitude, distance, latlng for a segment -- useful for visualization and elevation profile | MEDIUM | `GET /segments/{id}/streams`. Same stream model as activity streams. |
| Get segment effort streams | Time-series data for a specific effort -- compare pacing across attempts | MEDIUM | `GET /segment_efforts/{id}/streams`. |

#### Route Tools (New -- Planned)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| List athlete routes | Browse routes the athlete has created -- useful for planning and sharing | LOW | `GET /athletes/{id}/routes` with pagination. Note: endpoint path is `/routes/athletes/{id}` per some docs -- verify. |
| Get route details | Full route info: distance, elevation, estimated_moving_time, map, segments | LOW | `GET /routes/{id}`. |
| Export route as GPX | Download route in GPX format for use in other devices/apps | MEDIUM | `GET /routes/{id}/export_gpx`. Returns raw GPX XML. Need to handle binary/text response. |
| Export route as TCX | Download route in TCX format | MEDIUM | `GET /routes/{id}/export_tcx`. Returns raw TCX XML. |
| Get route streams | Elevation/distance/latlng for a route -- visualization without export | MEDIUM | `GET /routes/{id}/streams`. |

#### Laps and Efforts (New -- Planned)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Get activity laps | Lap-by-lap breakdown -- essential for interval workouts, track sessions, races | LOW | `GET /activities/{id}/laps`. Returns array of Lap objects with pace, HR, cadence per lap. Note: DetailedActivity already includes laps, but a dedicated tool is cleaner for LLM use. |

#### Gear Tools (New -- Planned)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Get gear details | Look up specific gear by ID -- distance tracked, name, brand, model | LOW | `GET /gear/{id}`. Only endpoint Strava exposes for gear. |
| List athlete shoes | Athletes track shoe mileage for replacement decisions -- surface all shoes from profile | LOW | Not a separate endpoint. Extract `shoes` array from `GET /athlete` response. The competitor has this as a dedicated tool -- smart UX decision. |
| List athlete bikes | Same as shoes but for bikes -- track component wear, choose gear for activities | LOW | Extract `bikes` array from `GET /athlete` response. Same pattern as shoes. |

#### Athlete Zones (New -- Extends Existing)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Get athlete HR/power zones | Athlete's configured zone boundaries (not per-activity). Essential baseline for coaching context | LOW | `GET /athlete/zones`. Requires profile:read_all scope. Returns zone boundaries for HR and power. |

#### Extended Club Tools (New -- Planned)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| List athlete clubs | See which clubs the athlete belongs to | LOW | `GET /athlete/clubs`. |
| Get club details | Full club info: member count, sport type, location, description | LOW | `GET /clubs/{id}`. |

#### Activity Social (New -- Fills Gap vs Competitor)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Get activity comments | Read social interactions on activities -- context for coaching | LOW | `GET /activities/{id}/comments` with pagination. |
| Get activity kudos | See who kudoed an activity -- social engagement metrics | LOW | `GET /activities/{id}/kudos` with pagination. |
| Get activity photos | Retrieve photos attached to activities -- visual context for ride/run reports | LOW | Uses undocumented `/photos` endpoint. Competitor has this. Verify actual endpoint path. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems in this context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Segment leaderboard | Competitive comparison, seeing your rank | **Undocumented/deprecated endpoint.** Not in official Swagger spec. Competitor handles it but catches `SUBSCRIPTION_REQUIRED` errors -- it requires Strava Summit subscription and may break without notice. | Use `list_segment_efforts` filtered by athlete to show personal history. For competitive context, the segment detail includes `athlete_segment_stats` with PR info. |
| Webhook subscription management | Real-time activity notifications | Webhooks require a publicly-accessible callback URL. This MCP is a local stdio binary -- no HTTP server. Webhook setup requires server-side infrastructure that contradicts the project's zero-infrastructure design. | Poll `get_activities` with `after` parameter. For the ZeroClaw ecosystem, webhooks could be a separate service. |
| Activity deletion | Clean up unwanted activities | **Destructive operation** with no undo. Exposing delete via an LLM tool is risky -- an AI could delete activities by mistake. Strava web/app already handles this safely with confirmation dialogs. | Suggest the user delete via Strava web/app. Provide `update_activity` to hide from feed instead (`hide_from_home: true`). |
| Bulk operations (batch update/delete) | Efficiency when managing many activities | Rate limit risk (200 req/15min). A single bulk operation could exhaust the daily limit (2000 req/day). Also amplifies the risk of AI mistakes -- one bad instruction could damage many records. | Process activities one at a time with explicit confirmation. Let the LLM orchestrate sequential calls. |
| SSE/HTTP transport | Use from remote clients or web apps | Out of scope per PROJECT.md. Stdio is the MCP standard for local tool servers. Adding HTTP transport introduces security concerns (auth, CORS, port management) and contradicts the single-binary simplicity. | Stdio only. If remote access is needed later, a separate proxy can wrap the stdio binary. |
| Training plan generation | Users want AI-generated training plans | Not an API feature -- this is an LLM application concern, not a tool concern. The MCP should provide data; the LLM/agent layer should provide coaching intelligence. | Expose comprehensive data tools. The OpenClaw coaching skill or agent layer handles plan generation. |
| Data caching/local database | Reduce API calls, offline access | Adds state management complexity. File-based token store is already the maximum local state. A cache layer introduces staleness bugs, invalidation logic, and storage management. | Rely on Strava's API. Rate limits (200/15min, 2000/day) are generous for interactive MCP use. If needed in the future, add as a separate middleware layer. |
| Activity privacy management | Change activity visibility settings | Strava API does not expose privacy settings as writable fields. The `update_activity` endpoint cannot change visibility. Attempting this would confuse users when it silently fails. | Document that privacy is managed through Strava web/app only. |
| Multi-athlete support | Coaches managing multiple athletes | OAuth tokens are per-athlete. Supporting multiple athletes means multiple token files, auth flows, and context switching. Overcomplicates the single-user MCP design. | One MCP instance per athlete. If coaching multiple athletes, run separate instances with different token files. |

## Feature Dependencies

```
OAuth Token Management
    |
    +---> All API Tools (every tool requires valid auth)
    |
    +---> Built-in OAuth Browser Flow (first-time setup)
    |         |
    |         +---> File-based Token Storage (persist tokens)
    |
    +---> Token Auto-Refresh (ongoing usage)

Get Athlete Profile
    |
    +---> Get Athlete Stats (needs athlete ID from profile)
    |
    +---> List Athlete Shoes (extracts shoes[] from profile response)
    |
    +---> List Athlete Bikes (extracts bikes[] from profile response)
    |
    +---> List Athlete Routes (needs athlete ID)

Get Activity by ID
    |
    +---> Get Activity Streams (needs activity ID)
    |
    +---> Get Activity Zones (needs activity ID)
    |
    +---> Get Activity Laps (needs activity ID)
    |
    +---> Get Activity Comments (needs activity ID)
    |
    +---> Get Activity Kudos (needs activity ID)
    |
    +---> Get Activity Photos (needs activity ID)

Get Segment Details
    |
    +---> List Segment Efforts (needs segment ID)
    |         |
    |         +---> Get Segment Effort Detail (needs effort ID)
    |         |
    |         +---> Get Segment Effort Streams (needs effort ID)
    |
    +---> Get Segment Streams (needs segment ID)
    |
    +---> Star/Unstar Segment (needs segment ID)

Get Route Details
    |
    +---> Export Route GPX (needs route ID)
    |
    +---> Export Route TCX (needs route ID)
    |
    +---> Get Route Streams (needs route ID)

List Athlete Clubs
    |
    +---> Get Club Details (needs club ID)
    |
    +---> Get Club Activities (needs club ID)
```

### Dependency Notes

- **All tools require OAuth**: Token management is the foundational layer. Nothing works without it.
- **Athlete profile unlocks gear and routes**: The athlete ID and shoes/bikes arrays come from the profile endpoint. Build profile first.
- **Activity detail is the hub**: Most per-activity tools (laps, zones, streams, comments, kudos, photos) need an activity ID, typically discovered via list activities first.
- **Segments are self-contained**: Segment tools form their own subgraph. Discover via explore or starred, then drill into efforts and streams.
- **Routes are self-contained**: Discovered via list athlete routes, then drill into details, export, or streams.
- **Clubs are self-contained**: Discovered via list athlete clubs, then drill into details or activities.
- **Upload -> Activity is a handoff**: Upload creates an upload, which eventually becomes an activity. The `get_upload` poll returns the `activity_id`.

## MVP Definition

### Launch With (v1) -- Port Existing + Core Infrastructure

Minimum viable product: functional Go MCP server with feature parity to the TypeScript version plus the new auth flow.

- [x] OAuth token auto-refresh with file-based storage -- foundational, nothing works without it
- [x] Built-in OAuth browser flow -- new for Go, eliminates manual token setup
- [x] List athlete activities -- core discovery tool
- [x] Get activity by ID -- core detail tool
- [x] Create manual activity -- write capability
- [x] Update activity -- **the critical enrichment tool**
- [x] Get activity zones -- training intensity analysis
- [x] Get authenticated athlete profile -- identity and gear list source
- [x] Get athlete statistics -- volume tracking
- [x] Get activity streams -- deep performance analysis
- [x] Get club activities -- social/team feature
- [x] Upload activity file (proper multipart) -- import capability
- [x] Check upload status -- upload workflow completion
- [x] Portfolio-quality README -- this is a portfolio piece, so README quality is launch-blocking

**Tool count: 11 tools (parity with TypeScript version)**

### Add After Validation (v1.x) -- Expanded Strava Coverage

Features to add once the core is working and the MCP architecture is solid.

- [ ] Get activity laps -- add when interval/workout analysis workflows are tested
- [ ] Get athlete HR/power zones -- add when coaching context features are built out
- [ ] List starred segments -- add as first segment tool to validate segment data model
- [ ] Get segment details -- add with starred segments
- [ ] Explore segments by location -- add after basic segment tools work
- [ ] List segment efforts -- add for PR tracking workflows
- [ ] Get segment effort detail -- add with list efforts
- [ ] Star/unstar segment -- add for curation workflows
- [ ] List athlete routes -- add as first route tool
- [ ] Get route details -- add with list routes
- [ ] Export route GPX -- add for route sharing workflows
- [ ] Export route TCX -- add alongside GPX export
- [ ] Get gear details -- add for equipment tracking
- [ ] List athlete shoes -- add for shoe mileage tracking (extract from profile)
- [ ] List athlete bikes -- add for bike tracking (extract from profile)
- [ ] List athlete clubs -- add for club discovery
- [ ] Get club details -- add with list clubs

**Tool count: 28 tools total (11 ported + 17 new)**

### Future Consideration (v2+)

Features to defer until the core tool set is battle-tested.

- [ ] Get activity comments -- lower priority social feature, add when social workflows emerge
- [ ] Get activity kudos -- lower priority social feature
- [ ] Get activity photos -- uses undocumented endpoint, verify stability first
- [ ] Segment streams -- add when advanced segment visualization is needed
- [ ] Segment effort streams -- add when effort comparison workflows emerge
- [ ] Route streams -- add when route visualization beyond GPX export is needed
- [ ] Club members list -- add if team management workflows emerge
- [ ] Club admins list -- very niche, add only if requested
- [ ] Muscle group heat map integration -- separate project per PROJECT.md, future milestone

**Potential tool count: 35+ tools**

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| OAuth + token management | HIGH | MEDIUM | P1 |
| Built-in OAuth browser flow | HIGH | MEDIUM | P1 |
| Activity CRUD (list, get, create, update) | HIGH | LOW | P1 |
| Activity zones | MEDIUM | LOW | P1 |
| Athlete profile + stats | HIGH | LOW | P1 |
| Activity streams | HIGH | MEDIUM | P1 |
| Club activities | MEDIUM | LOW | P1 |
| Upload + status check | MEDIUM | MEDIUM | P1 |
| Portfolio README | HIGH | MEDIUM | P1 |
| Activity laps | HIGH | LOW | P2 |
| Athlete zones (configured) | MEDIUM | LOW | P2 |
| Starred segments | MEDIUM | LOW | P2 |
| Segment details | MEDIUM | LOW | P2 |
| Explore segments | MEDIUM | MEDIUM | P2 |
| Segment efforts (list + detail) | MEDIUM | LOW | P2 |
| Star/unstar segment | LOW | LOW | P2 |
| Athlete routes (list + detail) | MEDIUM | LOW | P2 |
| Route GPX/TCX export | MEDIUM | MEDIUM | P2 |
| Gear details | MEDIUM | LOW | P2 |
| Athlete shoes/bikes | MEDIUM | LOW | P2 |
| Athlete clubs + club details | LOW | LOW | P2 |
| Activity comments | LOW | LOW | P3 |
| Activity kudos | LOW | LOW | P3 |
| Activity photos | LOW | LOW | P3 |
| Segment streams | LOW | MEDIUM | P3 |
| Segment effort streams | LOW | MEDIUM | P3 |
| Route streams | LOW | MEDIUM | P3 |
| Club members/admins | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch (11 tools + auth + README)
- P2: Should have, add in v1.x (17 additional tools)
- P3: Nice to have, future consideration (8+ tools)

## Competitor Feature Analysis

The leading Strava MCP server (r-huijts/strava-mcp, 302 stars, TypeScript/npm) provides the benchmark.

| Feature | r-huijts/strava-mcp (302 stars) | Our Go Rewrite | Our Approach |
|---------|--------------------------------|----------------|--------------|
| Activity CRUD | get/list activities, no create/update | All 4 operations | **Advantage**: We support write operations (create + update) which is critical for the enrichment workflow. |
| Activity laps | Yes (dedicated tool) | P2 | Add in v1.x. |
| Activity photos | Yes (undocumented endpoint) | P3 | Defer -- undocumented endpoint risk. |
| Activity streams | Yes | P1 (existing) | Parity. |
| Athlete profile | Yes | P1 (existing) | Parity. |
| Athlete stats | Yes | P1 (existing) | Parity. |
| Athlete zones | Yes | P2 | Add in v1.x. |
| Athlete shoes | Yes (extract from profile) | P2 | Add in v1.x. |
| Segments (starred, detail, explore) | Yes (3 tools) | P2 | Add in v1.x. |
| Segment efforts | Yes (list + detail) | P2 | Add in v1.x. |
| Segment leaderboard | Yes (undocumented endpoint) | **Anti-feature** | Deliberately skip -- undocumented, requires Summit subscription, may break. |
| Star segment | Yes | P2 | Add in v1.x. |
| Routes (list, detail) | Yes | P2 | Add in v1.x. |
| Route GPX/TCX export | Yes (both formats) | P2 | Add in v1.x. |
| Club tools | List clubs only | P1 (activities) + P2 (list + detail) | We already have club activities; expand in v1.x. |
| Upload | No | P1 (existing) | **Advantage**: Competitor lacks upload capability entirely. |
| OAuth browser flow | Yes (built-in) | P1 (new for Go) | Parity -- essential UX. |
| Connect/disconnect Strava | Yes (3 tools) | Built-in OAuth flow | Our approach: single `setup` command rather than connect/disconnect tools. |
| Server version tool | Yes | No | Skip -- not useful for an MCP tool server. |
| Format workout file | Yes | No | Skip -- formatting is an LLM concern, not a tool concern. |
| **Language** | TypeScript (npm) | **Go (single binary)** | **Advantage**: No runtime dependency, faster startup, smaller distribution. |
| **Distribution** | npx / npm install | go install / download binary | **Advantage**: Zero dependency installation. |

### Competitive Summary

- **Our advantages**: Write operations (create/update activity), upload support, single Go binary, zero dependencies, portfolio-quality presentation.
- **Their advantages**: Larger community (302 stars), npm ecosystem familiarity, more tools at launch (25 vs our initial 11).
- **Our strategy**: Launch with feature parity on core tools, then rapidly expand to 28+ tools. The Go single-binary story and write capability are meaningful differentiators. The portfolio README is a presentation advantage.

## Strava API Coverage Map

Complete mapping of Strava API v3 endpoints to planned MCP tools.

| API Endpoint | Method | Our Tool | Phase |
|---|---|---|---|
| `/athlete` | GET | `get_athlete` | P1 |
| `/athlete/zones` | GET | `get_athlete_zones` | P2 |
| `/athlete/activities` | GET | `list_activities` | P1 |
| `/athlete/clubs` | GET | `list_athlete_clubs` | P2 |
| `/athletes/{id}/stats` | GET | `get_athlete_stats` | P1 |
| `/athletes/{id}/routes` | GET | `list_athlete_routes` | P2 |
| `/activities` | POST | `create_activity` | P1 |
| `/activities/{id}` | GET | `get_activity` | P1 |
| `/activities/{id}` | PUT | `update_activity` | P1 |
| `/activities/{id}/zones` | GET | `get_activity_zones` | P1 |
| `/activities/{id}/laps` | GET | `get_activity_laps` | P2 |
| `/activities/{id}/comments` | GET | `get_activity_comments` | P3 |
| `/activities/{id}/kudos` | GET | `get_activity_kudos` | P3 |
| `/activities/{id}/streams` | GET | `get_activity_streams` | P1 |
| `/clubs/{id}` | GET | `get_club` | P2 |
| `/clubs/{id}/activities` | GET | `get_club_activities` | P1 |
| `/clubs/{id}/members` | GET | `list_club_members` | P3 |
| `/clubs/{id}/admins` | GET | `list_club_admins` | P3 |
| `/gear/{id}` | GET | `get_gear` | P2 |
| `/routes/{id}` | GET | `get_route` | P2 |
| `/routes/{id}/export_gpx` | GET | `export_route_gpx` | P2 |
| `/routes/{id}/export_tcx` | GET | `export_route_tcx` | P2 |
| `/routes/{id}/streams` | GET | `get_route_streams` | P3 |
| `/segments/{id}` | GET | `get_segment` | P2 |
| `/segments/starred` | GET | `list_starred_segments` | P2 |
| `/segments/explore` | GET | `explore_segments` | P2 |
| `/segments/{id}/starred` | PUT | `star_segment` | P2 |
| `/segments/{id}/all_efforts` | GET | `list_segment_efforts` | P2 |
| `/segments/{id}/streams` | GET | `get_segment_streams` | P3 |
| `/segment_efforts/{id}` | GET | `get_segment_effort` | P2 |
| `/segment_efforts/{id}/streams` | GET | `get_segment_effort_streams` | P3 |
| `/uploads` | POST | `upload_activity` | P1 |
| `/uploads/{id}` | GET | `get_upload_status` | P1 |

**Coverage: 33 of ~33 documented endpoints** (excluding the undocumented leaderboard and photos endpoints).

## OAuth Scope Requirements

Tools require specific OAuth scopes. The OAuth browser flow must request all needed scopes upfront.

| Scope | Required For |
|-------|-------------|
| `read` | Club data, public segments, public routes, leaderboards |
| `read_all` | Private segments, private routes, private events |
| `profile:read_all` | Full athlete profile, athlete zones, weight/FTP |
| `profile:write` | Star/unstar segments |
| `activity:read` | Activities visible to Everyone/Followers |
| `activity:read_all` | Private activities, privacy zone data |
| `activity:write` | Create/update activities, uploads |

**Recommended scope request:** `read,read_all,profile:read_all,profile:write,activity:read_all,activity:write`

This covers all planned tools. Requesting all scopes at setup avoids re-auth when adding new tools later.

## Rate Limit Considerations

| Limit | Value | Implication |
|-------|-------|-------------|
| Per 15 minutes | 200 requests | Generous for interactive MCP use. Even a heavy analysis session rarely exceeds 50 calls. |
| Per day | 2,000 requests | Must be careful with bulk operations. Listing all activities page-by-page could consume 10+ calls. Stream fetches are 1 call each. |
| Headers | `X-RateLimit-Limit`, `X-RateLimit-Usage` | **Should expose these in tool responses** so the LLM can pace itself. |

**Recommendation:** Include rate limit info in tool response metadata. Do not build retry/backoff into the MCP itself -- let the LLM handle pacing decisions.

## Sources

- Strava API v3 Reference: https://developers.strava.com/docs/reference/ (HIGH confidence -- official docs)
- Strava API Swagger Spec: https://developers.strava.com/swagger/swagger.json (HIGH confidence -- official spec)
- Strava Authentication Docs: https://developers.strava.com/docs/authentication/ (HIGH confidence -- official docs)
- Strava Getting Started / Rate Limits: https://developers.strava.com/docs/getting-started/ (HIGH confidence -- official docs)
- r-huijts/strava-mcp (302 stars): https://github.com/r-huijts/strava-mcp (HIGH confidence -- direct code review of competitor)
- Existing TypeScript implementation: /Volumes/DataDeuce/Projects/StravaMCP/src/tools/ (HIGH confidence -- our own code)
- OpenClaw plugin: /Volumes/DataDeuce/Projects/StravaMCP/openclaw-plugin/ (HIGH confidence -- our own code)

---
*Feature research for: Strava API v3 MCP Tool Server (Go rewrite)*
*Researched: 2026-03-26*

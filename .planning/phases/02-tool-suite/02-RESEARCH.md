# Phase 2: Tool Suite - Research

**Researched:** 2026-03-27
**Domain:** Go MCP tool implementation -- porting 11 Strava tools from TypeScript to Go
**Confidence:** HIGH

## Summary

Phase 2 implements 11 MCP tools that give LLM clients full access to core Strava API operations. The tools port existing TypeScript implementations with full feature parity: 5 activity tools (list, get, create, update, zones), 2 athlete tools (profile, stats), 1 streams tool, 1 club tool, and 2 upload tools. The Phase 1 infrastructure (Strava HTTP client with auto-refresh, singleflight, rate limit tracking, and MCP server wiring) is complete and all tests pass.

The primary technical challenge is the mcp-go v0.46.0 tool registration API. Tools are defined using `mcp.NewTool()` with functional options (`WithString`, `WithNumber`, `WithBoolean`, `WithArray`) and registered via `server.AddTool(tool, handler)`. Handlers receive `mcp.CallToolRequest` and return `*mcp.CallToolResult`. The Strava client returns raw `[]byte` from API calls, so tool handlers must format this as pretty-printed JSON text via `mcp.NewToolResultText()`. The upload tool requires a separate `PostMultipart` method on the Strava client since the existing `Post()` sends JSON bodies, not multipart form data.

**Primary recommendation:** Use manual schema definition via `mcp.NewTool()` with `WithString`/`WithNumber`/`WithBoolean`/`WithArray` property helpers (not `WithInputSchema[T]()` auto-generation) to maintain exact control over tool descriptions, required fields, and enum values. Port TypeScript descriptions verbatim as the baseline, then improve where weak.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Return raw pretty-printed JSON from Strava API responses (`json.MarshalIndent` with 2-space indent). LLMs handle JSON well; the client/LLM summarizes as needed.
- **D-02:** Rate limit warning appended to tool response text only when usage exceeds 80% of the 15-minute window (carries forward from Phase 1 decision). No usage info in normal responses.
- **D-03:** Upload tool accepts a local file path string as input. The tool reads the file from disk and uploads via multipart form data to Strava.
- **D-04:** Auto-detect `data_type` (gpx/tcx/fit) from file extension. Accept optional explicit `data_type` param as override. Error if extension is unrecognized and no explicit type given.
- **D-05:** Port existing TypeScript descriptions as baseline, then improve any that are vague or missing context. Every parameter description should tell the LLM the expected format and valid range (e.g., "Items per page (1-200, default 30)").
- **D-06:** Tool names match the existing TypeScript names exactly (e.g., `get_activities`, `get_activity_by_id`, `create_activity`). Zero migration friction for existing MCP client configurations.
- **D-07:** One Go file per Strava resource: `activities.go`, `athlete.go`, `streams.go`, `clubs.go`, `uploads.go` in `internal/tools/`. Each file contains tool definitions and handlers for that resource. `register.go` wires them all via `RegisterAll`.
- **D-08:** Co-located test files: `activities_test.go` next to `activities.go`, etc. Standard Go convention.

### Claude's Discretion
- Error handling wrapper pattern (Go equivalent of `withErrorHandling`)
- Internal helper functions for common patterns (param building, response formatting)
- Test mock server structure and shared test utilities
- Whether to split activities.go further if it gets too large (5 tools in one file)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACT-01 | User can list recent activities with date filtering (before/after) and pagination | `GET /athlete/activities` with before/after/page/per_page params. TypeScript reference: `activities.ts` get_activities tool. |
| ACT-02 | User can get detailed activity by ID including laps, splits, segment efforts | `GET /activities/{id}` with include_all_efforts flag. TypeScript reference: `activities.ts` get_activity_by_id tool. |
| ACT-03 | User can create manual activities with name, sport type, start time, elapsed time | `POST /activities` with name, sport_type, start_date_local, elapsed_time, distance, etc. TypeScript reference: `activities.ts` create_activity tool. |
| ACT-04 | User can update existing activities (name, description, sport type, gear, trainer, commute, hide) | `PUT /activities/{id}` with partial update body. TypeScript reference: `activities.ts` update_activity tool. Critical: use pointer fields with omitempty to avoid overwriting. |
| ACT-05 | User can get heart rate and power zone distribution for an activity | `GET /activities/{id}/zones`. TypeScript reference: `activities.ts` get_activity_zones tool. Requires Strava Summit. |
| ATH-01 | User can get authenticated athlete profile (name, gear, preferences) | `GET /athlete`. No params. TypeScript reference: `athlete.ts` get_athlete tool. |
| ATH-02 | User can get athlete aggregate statistics (recent/YTD/all-time run/ride/swim totals) | `GET /athletes/{id}/stats`. If no ID provided, auto-fetch from `/athlete`. TypeScript reference: `athlete.ts` get_athlete_stats tool. |
| STR-01 | User can get activity time-series streams (HR, GPS, power, cadence, altitude, etc.) | `GET /activities/{id}/streams` with `keys` param (comma-separated). 11 stream types. TypeScript reference: `streams.ts` get_activity_streams tool. |
| CLB-01 | User can list recent activities from a club's members with pagination | `GET /clubs/{id}/activities` with page/per_page. TypeScript reference: `clubs.ts` get_club_activities tool. |
| UPL-01 | User can upload activity files (GPX/TCX/FIT) via multipart form data | `POST /uploads` with multipart/form-data. Per D-03/D-04: accept file path, auto-detect data_type from extension. Requires new `PostMultipart` method on Strava client. |
| UPL-02 | User can check upload processing status and get resulting activity ID | `GET /uploads/{id}`. Simple GET returning status and activity_id. TypeScript reference: `uploads.ts` get_upload tool. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mark3labs/mcp-go | v0.46.0 | MCP SDK -- tool registration, handler types, result builders | Already pinned in go.mod from Phase 1. Provides `NewTool`, `AddTool`, `NewToolResultText`, `NewToolResultError` |
| encoding/json | stdlib | JSON marshal/unmarshal for Strava responses | Standard library, already used in client.go |
| mime/multipart | stdlib | Multipart form data encoding for file uploads | Standard library for constructing multipart requests |
| path/filepath | stdlib | File extension extraction for upload data_type detection | Standard library for D-04 |
| strconv | stdlib | String-to-int conversions for param building | Standard library |
| net/http/httptest | stdlib | Test HTTP servers for tool handler tests | Already used in Phase 1 client_test.go |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| golang.org/x/sync | v0.20.0 | singleflight (already in go.mod) | Already used by Strava client for token refresh |

No new dependencies needed. The mcp-go SDK provides all tool infrastructure. The Strava client from Phase 1 provides all HTTP communication. Standard library covers multipart uploads and JSON handling.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual `NewTool` with `WithString`/`WithNumber` | `WithInputSchema[T]()` auto-generation from struct | Auto-gen has known schema issues (#747, #437). Manual gives exact control over descriptions, enums, required fields. Manual is the right choice for this project per D-05. |
| `mcp.ParseInt64`/`ParseString` helpers | `request.BindArguments(&typedStruct)` | BindArguments is cleaner for complex tools but relies on JSON struct tags. ParseInt64/ParseString is explicit and debuggable. **Recommendation: use BindArguments** for tools with 3+ params, ParseX helpers for simple tools. |
| `json.MarshalIndent` in each handler | Raw bytes from client | Per D-01, responses must be pretty-printed. Client returns raw `[]byte`. Handlers re-indent with `json.MarshalIndent`. A shared helper avoids duplication. |

## Architecture Patterns

### Recommended Project Structure
```
internal/tools/
  register.go        # RegisterAll() wires all tools to MCP server
  helpers.go         # Shared formatResponse(), handleToolError() helpers
  helpers_test.go    # Tests for shared helpers
  activities.go      # 5 tools: get_activities, get_activity_by_id, create_activity, update_activity, get_activity_zones
  activities_test.go # Tests for all 5 activity tools
  athlete.go         # 2 tools: get_athlete, get_athlete_stats
  athlete_test.go    # Tests for athlete tools
  streams.go         # 1 tool: get_activity_streams
  streams_test.go    # Tests for streams tool
  clubs.go           # 1 tool: get_club_activities
  clubs_test.go      # Tests for clubs tool
  uploads.go         # 2 tools: upload_activity, get_upload_status
  uploads_test.go    # Tests for upload tools

internal/strava/
  client.go          # Existing: Get, Post, Put (from Phase 1)
  client.go          # NEW: PostMultipart method for file uploads
```

### Pattern 1: Tool Definition and Registration
**What:** Each resource file defines tools as package-level variables and exports a register function.
**When to use:** Every tool file follows this exact pattern.
**Example:**
```go
// activities.go
package tools

import (
    "context"
    "github.com/mark3labs/mcp-go/mcp"
    "github.com/mark3labs/mcp-go/server"
    "strava-mcp/internal/strava"
)

// getActivitiesTool defines the MCP tool schema
var getActivitiesTool = mcp.NewTool("get_activities",
    mcp.WithDescription(`Retrieves the authenticated athlete's activities.
...long description ported from TypeScript...`),
    mcp.WithNumber("before",
        mcp.Description("Epoch timestamp to retrieve activities before (exclusive)"),
    ),
    mcp.WithNumber("after",
        mcp.Description("Epoch timestamp to retrieve activities after (inclusive). Use this to find recent activities."),
    ),
    mcp.WithNumber("page",
        mcp.Description("Page number (default: 1)"),
    ),
    mcp.WithNumber("per_page",
        mcp.Description("Items per page (1-200, default 30)"),
    ),
)

// handleGetActivities is the tool handler
func handleGetActivities(client *strava.Client) server.ToolHandlerFunc {
    return func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
        params := map[string]string{}
        if v := mcp.ParseInt64(request, "before", 0); v != 0 {
            params["before"] = strconv.FormatInt(v, 10)
        }
        if v := mcp.ParseInt64(request, "after", 0); v != 0 {
            params["after"] = strconv.FormatInt(v, 10)
        }
        // ... page, per_page ...

        data, err := client.Get(ctx, "/athlete/activities", params)
        if err != nil {
            return handleToolError("get_activities", err), nil
        }
        return formatResponse(data, client), nil
    }
}

// registerActivities registers all activity tools with the MCP server
func registerActivities(s *server.MCPServer, client *strava.Client) {
    s.AddTool(getActivitiesTool, handleGetActivities(client))
    s.AddTool(getActivityByIdTool, handleGetActivityById(client))
    // ... etc
}
```

### Pattern 2: Response Formatting Helper
**What:** Shared function that pretty-prints raw JSON from Strava API and appends rate limit warning if needed.
**When to use:** Every tool handler's success path.
**Example:**
```go
// helpers.go
package tools

import (
    "bytes"
    "encoding/json"
    "github.com/mark3labs/mcp-go/mcp"
    "strava-mcp/internal/strava"
)

// formatResponse pretty-prints raw Strava JSON and appends rate limit warning.
// Per D-01: json.MarshalIndent with 2-space indent.
// Per D-02: Rate limit warning only when usage > 80%.
func formatResponse(data []byte, client *strava.Client) *mcp.CallToolResult {
    var pretty bytes.Buffer
    if err := json.Indent(&pretty, data, "", "  "); err != nil {
        // If indenting fails, return raw data
        return mcp.NewToolResultText(string(data))
    }

    result := pretty.String()
    if warning := client.RateLimitWarning(); warning != "" {
        result += "\n\n" + warning
    }
    return mcp.NewToolResultText(result)
}

// handleToolError formats a Strava API error into an MCP error result.
func handleToolError(toolName string, err error) *mcp.CallToolResult {
    var stravaErr *strava.StravaError
    if strava.AsStravaError(err, &stravaErr) {
        return mcp.NewToolResultErrorf("%s: Strava API error (%d): %s",
            toolName, stravaErr.StatusCode, stravaErr.Body)
    }
    return mcp.NewToolResultErrorf("%s: %v", toolName, err)
}
```

### Pattern 3: Handler as Closure Over Client
**What:** Tool handlers are closures that capture the `*strava.Client` instance. The closure returns a `server.ToolHandlerFunc`.
**When to use:** All tool handlers. This avoids global state and makes testing straightforward.
**Why:** The mcp-go `ToolHandlerFunc` signature is `func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error)`. There is no built-in way to inject dependencies. The closure pattern gives each handler access to the Strava client without global variables.

### Pattern 4: Multipart Upload (for UPL-01)
**What:** Upload tool reads a file from disk, constructs multipart/form-data, and sends via a new `PostMultipart` method.
**When to use:** Only for the `upload_activity` tool.
**Example:**
```go
// In strava/client.go -- new method
func (c *Client) PostMultipart(ctx context.Context, path string, body io.Reader, contentType string) ([]byte, error) {
    fullURL := c.baseURL + path
    return c.doRequest(ctx, http.MethodPost, fullURL, body, contentType)
}

// In tools/uploads.go -- handler
func handleUploadActivity(client *strava.Client) server.ToolHandlerFunc {
    return func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
        filePath := mcp.ParseString(request, "file", "")
        if filePath == "" {
            return mcp.NewToolResultError("upload_activity: file path is required"), nil
        }

        // D-04: Auto-detect data_type from extension
        dataType := mcp.ParseString(request, "data_type", "")
        if dataType == "" {
            ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(filePath), "."))
            switch ext {
            case "fit", "tcx", "gpx":
                dataType = ext
            case "gz":
                // Check double extension: .fit.gz, .tcx.gz, .gpx.gz
                base := strings.TrimSuffix(filePath, ".gz")
                innerExt := strings.ToLower(strings.TrimPrefix(filepath.Ext(base), "."))
                switch innerExt {
                case "fit", "tcx", "gpx":
                    dataType = innerExt + ".gz"
                default:
                    return mcp.NewToolResultError("upload_activity: cannot detect data_type from extension; provide data_type explicitly"), nil
                }
            default:
                return mcp.NewToolResultError("upload_activity: unrecognized file extension; provide data_type explicitly"), nil
            }
        }

        file, err := os.Open(filePath)
        if err != nil {
            return mcp.NewToolResultErrorf("upload_activity: open file: %v", err), nil
        }
        defer file.Close()

        // Build multipart form
        var buf bytes.Buffer
        writer := multipart.NewWriter(&buf)
        part, err := writer.CreateFormFile("file", filepath.Base(filePath))
        if err != nil { /* handle */ }
        io.Copy(part, file)
        writer.WriteField("data_type", dataType)
        // ... optional fields: name, description, trainer, commute, external_id
        writer.Close()

        data, err := client.PostMultipart(ctx, "/uploads", &buf, writer.FormDataContentType())
        if err != nil {
            return handleToolError("upload_activity", err), nil
        }
        return formatResponse(data, client), nil
    }
}
```

### Pattern 5: get_athlete_stats Auto-Fetching Athlete ID
**What:** The `get_athlete_stats` tool optionally accepts an athlete ID. If omitted, it first calls `GET /athlete` to get the authenticated athlete's ID, then uses that ID for the stats endpoint.
**When to use:** Only for the `get_athlete_stats` tool.
**Example:**
```go
func handleGetAthleteStats(client *strava.Client) server.ToolHandlerFunc {
    return func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
        athleteID := mcp.ParseInt64(request, "id", 0)
        if athleteID == 0 {
            // Auto-fetch athlete ID
            profileData, err := client.Get(ctx, "/athlete", nil)
            if err != nil {
                return handleToolError("get_athlete_stats", err), nil
            }
            var profile struct { ID int64 `json:"id"` }
            if err := json.Unmarshal(profileData, &profile); err != nil {
                return mcp.NewToolResultErrorf("get_athlete_stats: parse profile: %v", err), nil
            }
            athleteID = profile.ID
        }
        data, err := client.Get(ctx, fmt.Sprintf("/athletes/%d/stats", athleteID), nil)
        // ...
    }
}
```

### Pattern 6: Streams Array Key Formatting
**What:** The `get_activity_streams` tool accepts an array of stream type keys, joins them with commas for the API request, and the Strava API returns an array of stream objects that we pass through as-is (raw JSON per D-01).
**When to use:** Only for the `get_activity_streams` tool.
**Key detail:** The `keys` parameter is an array of enum strings. Use `mcp.WithArray("keys", mcp.WithStringEnumItems(streamTypes))` to define the schema.

### Anti-Patterns to Avoid
- **Defining Go structs for Strava responses:** Per D-01, we return raw JSON. Do NOT define Go structs for response types (ActivitySummary, DetailedActivity, etc.). The only exception is the minimal struct for extracting athlete ID in get_athlete_stats.
- **Using `WithInputSchema[T]()` auto-generation:** Known schema issues. Use manual `WithString`/`WithNumber` property builders.
- **Sending zero values in update requests:** The Go `Post()` method marshals the body to JSON. For `update_activity`, build a `map[string]interface{}` with only the fields the user provided, NOT a struct with zero values.
- **Global variables for client state:** Use closures, not package-level `var client *strava.Client`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tool schema definition | Custom JSON schema builder | `mcp.NewTool()` + `WithString`/`WithNumber`/`WithBoolean`/`WithArray` | SDK provides complete property type helpers with descriptions, enums, required, min/max |
| Argument parsing | Manual `map[string]any` type assertions | `mcp.ParseInt64()`, `mcp.ParseString()`, `mcp.ParseBoolean()` | SDK handles type coercion (string "true" to bool, float64 to int64) |
| Error results | Custom error formatting | `mcp.NewToolResultError()`, `mcp.NewToolResultErrorf()` | SDK sets `isError: true` correctly |
| Text results | Manual `CallToolResult` construction | `mcp.NewToolResultText()` | SDK wraps text in correct `Content` array |
| Multipart encoding | Raw HTTP body construction | `mime/multipart.NewWriter` + `CreateFormFile` | Handles boundary generation, content-type headers, MIME encoding |
| Rate limit detection | Custom header parsing | `client.RateLimitWarning()` | Already implemented in Phase 1 client |

**Key insight:** The Strava client from Phase 1 does all the hard work (auth, refresh, rate limits, error types). Tool handlers are thin: parse args, call client, format response. Do not add complexity.

## Common Pitfalls

### Pitfall 1: Sending Zero Values in Update Requests
**What goes wrong:** If `update_activity` uses a Go struct for the request body, unset boolean fields default to `false` and unset string fields default to `""`. These zero values get marshaled to JSON and sent to Strava, overwriting existing data (e.g., clearing the description).
**Why it happens:** Go has no concept of "undefined" like TypeScript. A struct field is always zero or explicitly set.
**How to avoid:** Build a `map[string]interface{}` with only the fields the user actually provided. Check `request.GetArguments()` for key existence before including in the map.
**Warning signs:** Updating one field (e.g., name) silently clears other fields (description, trainer flag).

### Pitfall 2: Stream Keys Parameter Encoding
**What goes wrong:** The Strava streams endpoint expects `keys` as a comma-separated query parameter (e.g., `?keys=time,heartrate,distance`), but the MCP tool receives it as a JSON array `["time","heartrate","distance"]`. If the handler passes the array directly without joining, the API returns an error.
**Why it happens:** Strava's GET endpoints use query string params, not JSON bodies. Arrays must be serialized as comma-separated strings.
**How to avoid:** Extract the `keys` argument as `[]interface{}`, convert to `[]string`, join with commas, pass as single query param.
**Warning signs:** Streams endpoint returns 400 "Bad Request" or empty results.

### Pitfall 3: Tool Description Drift from TypeScript
**What goes wrong:** Go tool descriptions are shorter or miss critical context (enrichment workflow, coaching patterns, OAuth scope requirements). The LLM then uses tools incorrectly or misses the update_activity workflow.
**Why it happens:** Copying long multi-line strings is tedious. Developers write minimal descriptions to "get it working."
**How to avoid:** Copy TypeScript descriptions verbatim as the starting point. Use Go raw string literals (backticks) for multi-line descriptions. D-05 mandates every param description includes format and valid range.
**Warning signs:** Claude no longer follows the enrichment pattern. LLM picks wrong tool or passes wrong types.

### Pitfall 4: Upload Tool File Path Security
**What goes wrong:** The upload tool accepts a file path from the LLM. Without validation, it could read sensitive files (e.g., `/etc/passwd`, `~/.ssh/id_rsa`).
**Why it happens:** D-03 says "accept file path string." No security constraints were explicitly stated, but reading arbitrary files is dangerous.
**How to avoid:** Validate the file extension matches allowed upload types (.fit, .tcx, .gpx, .fit.gz, .tcx.gz, .gpx.gz) BEFORE opening the file. This naturally limits what files can be read.
**Warning signs:** Upload tool used to read non-activity files.

### Pitfall 5: Multipart Content-Type Missing Boundary
**What goes wrong:** The multipart POST to Strava requires the Content-Type header to include the boundary parameter (e.g., `multipart/form-data; boundary=...`). Setting only `multipart/form-data` without the boundary causes Strava to reject the upload.
**Why it happens:** The boundary is generated by `multipart.NewWriter` and must be extracted via `writer.FormDataContentType()`.
**How to avoid:** Always use `writer.FormDataContentType()` for the Content-Type header. Never hardcode "multipart/form-data".
**Warning signs:** Upload returns 400 or 422 from Strava.

### Pitfall 6: Arguments as float64 in JSON
**What goes wrong:** MCP tool arguments arrive as JSON. In Go, `json.Unmarshal` decodes JSON numbers into `float64` by default when the target is `interface{}`. An activity ID like `13029457210` arrives as `float64(1.302945721e+10)`, which loses precision or looks wrong in string formatting.
**Why it happens:** JSON has no integer type; all numbers are IEEE 754 doubles. Go's `map[string]any` reflects this.
**How to avoid:** Use `mcp.ParseInt64(request, "id", 0)` which handles the float64-to-int64 conversion via `spf13/cast`. Never cast `interface{}` to `int64` directly.
**Warning signs:** Activity IDs are mangled or requests fail with wrong ID.

## Code Examples

### Tool Definition with Enum (Stream Types)
```go
// Source: mcp-go v0.46.0 API -- verified from source
var streamTypes = []string{
    "time", "latlng", "distance", "altitude", "velocity_smooth",
    "heartrate", "cadence", "watts", "temp", "moving", "grade_smooth",
}

var getActivityStreamsTool = mcp.NewTool("get_activity_streams",
    mcp.WithDescription(`[TELEMETRY & DEEP ANALYSIS] Retrieves time-series sensor data...`),
    mcp.WithNumber("id",
        mcp.Description("The ID of the activity"),
        mcp.Required(),
    ),
    mcp.WithArray("keys",
        mcp.Description("Array of stream types to retrieve: time, latlng, distance, altitude, velocity_smooth, heartrate, cadence, watts, temp, moving, grade_smooth. Omit to get all available streams."),
        mcp.WithStringEnumItems(streamTypes),
    ),
    mcp.WithBoolean("key_by_type",
        mcp.Description("Return streams as an object keyed by type (default: true)"),
    ),
)
```

### RegisterAll Wiring
```go
// register.go -- updated for Phase 2
package tools

import (
    "github.com/mark3labs/mcp-go/server"
    "strava-mcp/internal/strava"
)

func RegisterAll(s *server.MCPServer, client *strava.Client) {
    registerActivities(s, client)
    registerAthlete(s, client)
    registerStreams(s, client)
    registerClubs(s, client)
    registerUploads(s, client)
}
```

### Test Pattern: Tool Handler with Mock Server
```go
// activities_test.go -- tests tool handlers via httptest mock
package tools_test

import (
    "context"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/mark3labs/mcp-go/mcp"
    "strava-mcp/internal/strava"
    // ... config, auth imports
)

func TestGetActivitiesHandler(t *testing.T) {
    // Mock Strava API
    srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Verify request path and params
        if r.URL.Path != "/api/v3/athlete/activities" {
            t.Errorf("path = %q, want /api/v3/athlete/activities", r.URL.Path)
        }
        if got := r.URL.Query().Get("per_page"); got != "10" {
            t.Errorf("per_page = %q, want 10", got)
        }
        // Return mock response
        w.Header().Set("X-RateLimit-Limit", "100,1000")
        w.Header().Set("X-RateLimit-Usage", "5,50")
        json.NewEncoder(w).Encode([]map[string]interface{}{
            {"id": 123, "name": "Morning Run", "distance": 5000},
        })
    }))
    defer srv.Close()

    client := newTestClient(srv.URL) // helper that creates client with mock token store

    // Build MCP request
    req := mcp.CallToolRequest{}
    req.Params.Arguments = map[string]any{
        "per_page": float64(10),
    }

    // Call handler
    result, err := handleGetActivities(client)(context.Background(), req)
    if err != nil {
        t.Fatalf("handler error: %v", err)
    }
    if result.IsError {
        t.Fatalf("got error result: %v", result.Content)
    }

    // Verify pretty-printed JSON
    text := result.Content[0].(mcp.TextContent).Text
    if !strings.Contains(text, "Morning Run") {
        t.Errorf("response missing activity name")
    }
}
```

### Update Activity: Map-Based Body (Avoiding Zero Values)
```go
func handleUpdateActivity(client *strava.Client) server.ToolHandlerFunc {
    return func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
        id := mcp.ParseInt64(request, "id", 0)
        if id == 0 {
            return mcp.NewToolResultError("update_activity: id is required"), nil
        }

        // Build update body with ONLY provided fields (avoid zero-value overwrite)
        args := request.GetArguments()
        body := make(map[string]interface{})
        for _, field := range []string{"name", "type", "sport_type", "description", "gear_id"} {
            if v, ok := args[field]; ok {
                body[field] = v
            }
        }
        for _, field := range []string{"trainer", "commute", "hide_from_home"} {
            if v, ok := args[field]; ok {
                body[field] = v
            }
        }

        data, err := client.Put(ctx, fmt.Sprintf("/activities/%d", id), body)
        if err != nil {
            return handleToolError("update_activity", err), nil
        }
        return formatResponse(data, client), nil
    }
}
```

## Tool Inventory (Complete List)

| # | Tool Name | HTTP Method | Strava Endpoint | Required Params | Optional Params | File |
|---|-----------|-------------|-----------------|-----------------|-----------------|------|
| 1 | `get_activities` | GET | `/athlete/activities` | none | before, after, page, per_page | activities.go |
| 2 | `get_activity_by_id` | GET | `/activities/{id}` | id | include_all_efforts | activities.go |
| 3 | `create_activity` | POST | `/activities` | name, sport_type, start_date_local, elapsed_time | type, description, distance, trainer, commute | activities.go |
| 4 | `update_activity` | PUT | `/activities/{id}` | id | name, type, sport_type, description, trainer, commute, hide_from_home, gear_id | activities.go |
| 5 | `get_activity_zones` | GET | `/activities/{id}/zones` | id | none | activities.go |
| 6 | `get_athlete` | GET | `/athlete` | none | none | athlete.go |
| 7 | `get_athlete_stats` | GET | `/athletes/{id}/stats` | none | id | athlete.go |
| 8 | `get_activity_streams` | GET | `/activities/{id}/streams` | id | keys, key_by_type | streams.go |
| 9 | `get_club_activities` | GET | `/clubs/{id}/activities` | id | page, per_page | clubs.go |
| 10 | `upload_activity` | POST | `/uploads` | file | name, description, trainer, commute, data_type, external_id | uploads.go |
| 11 | `get_upload_status` | GET | `/uploads/{id}` | id | none | uploads.go |

**Tool name source:** D-06 mandates exact match with TypeScript names. Note: TypeScript uses `create_upload` and `get_upload` but the CONTEXT.md canonical references say `upload_activity` and `get_upload_status`. **Use the TypeScript names** (`create_upload`, `get_upload`) unless the user explicitly prefers the alternative names from the requirements text. The planner should clarify this with the user.

**Correction:** Re-reading D-06 more carefully -- "Tool names match the existing TypeScript names exactly." The TypeScript tool definitions use `create_upload` and `get_upload`. These should be the canonical names. However, REQUIREMENTS.md says "upload activity files" (UPL-01) and "check upload processing status" (UPL-02), which are descriptions, not names. The TypeScript `uploadsTools` array has `name: 'create_upload'` and `name: 'get_upload'`. Use those.

## MCP Tool Annotations

Per mcp-go v0.46.0, tools have annotation hints. Set these for each tool:

| Tool | ReadOnlyHint | DestructiveHint | IdempotentHint | OpenWorldHint |
|------|-------------|-----------------|----------------|---------------|
| get_activities | true | false | true | true |
| get_activity_by_id | true | false | true | true |
| create_activity | false | false | false | true |
| update_activity | false | false | true | true |
| get_activity_zones | true | false | true | true |
| get_athlete | true | false | true | true |
| get_athlete_stats | true | false | true | true |
| get_activity_streams | true | false | true | true |
| get_club_activities | true | false | true | true |
| create_upload | false | false | false | true |
| get_upload | true | false | true | true |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TypeScript + Axios + Zod validation | Go + mcp-go + manual schema | This rewrite | Single binary, no runtime deps |
| Base64 file content in JSON body for uploads | File path + multipart/form-data | D-03 decision | Proper upload, handles large files |
| `WithInputSchema[T]()` auto-generation | Manual `WithString`/`WithNumber` builders | mcp-go v0.46.0 known issues | Full control over schema shape |

## Open Questions

1. **Upload tool naming: `create_upload`/`get_upload` vs `upload_activity`/`get_upload_status`**
   - What we know: TypeScript uses `create_upload` and `get_upload`. CONTEXT.md canonical refs say "upload_activity" and "get_upload_status".
   - What's unclear: D-06 says "match TypeScript names exactly" but the CONTEXT ref uses different names.
   - Recommendation: Use TypeScript names (`create_upload`, `get_upload`) per D-06. The planner should verify with the user if there is a deliberate rename.

2. **Whether `activities.go` should be split**
   - What we know: 5 tools + 5 handlers + tool definitions = likely 300-400 lines. Claude's Discretion says this is optional.
   - Recommendation: Keep as single file. 400 lines is manageable for Go. Split only if it exceeds ~500 lines.

3. **PostMultipart method scope**
   - What we know: Only the upload tool needs multipart. The existing `doRequest` method already accepts `body io.Reader` and `contentType string`.
   - Recommendation: Add a `PostMultipart(ctx, path, body io.Reader, contentType string)` method to the Strava client. This is a thin wrapper around `doRequest` that does not set Content-Type to "application/json".

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Go testing (stdlib) |
| Config file | none -- standard Go test |
| Quick run command | `go test ./internal/tools/... -v -count=1` |
| Full suite command | `go test ./... -v -count=1` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACT-01 | get_activities handler returns activities JSON, accepts pagination params | unit | `go test ./internal/tools/ -run TestGetActivities -v` | Wave 0 |
| ACT-02 | get_activity_by_id handler returns detailed activity, passes include_all_efforts | unit | `go test ./internal/tools/ -run TestGetActivityById -v` | Wave 0 |
| ACT-03 | create_activity handler POSTs with required fields, returns created activity | unit | `go test ./internal/tools/ -run TestCreateActivity -v` | Wave 0 |
| ACT-04 | update_activity handler PUTs only provided fields (no zero-value overwrite) | unit | `go test ./internal/tools/ -run TestUpdateActivity -v` | Wave 0 |
| ACT-05 | get_activity_zones handler returns zone data | unit | `go test ./internal/tools/ -run TestGetActivityZones -v` | Wave 0 |
| ATH-01 | get_athlete handler returns profile JSON | unit | `go test ./internal/tools/ -run TestGetAthlete -v` | Wave 0 |
| ATH-02 | get_athlete_stats handler auto-fetches athlete ID when not provided | unit | `go test ./internal/tools/ -run TestGetAthleteStats -v` | Wave 0 |
| STR-01 | get_activity_streams handler passes keys as comma-separated, returns streams | unit | `go test ./internal/tools/ -run TestGetActivityStreams -v` | Wave 0 |
| CLB-01 | get_club_activities handler returns paginated club activities | unit | `go test ./internal/tools/ -run TestGetClubActivities -v` | Wave 0 |
| UPL-01 | upload_activity handler reads file, sends multipart, auto-detects data_type | unit | `go test ./internal/tools/ -run TestUploadActivity -v` | Wave 0 |
| UPL-02 | get_upload_status handler returns upload status with activity_id | unit | `go test ./internal/tools/ -run TestGetUploadStatus -v` | Wave 0 |

### Additional Test Requirements
| Test | Behavior | Type | Command |
|------|----------|------|---------|
| Error handling | Strava 403/404/429 errors formatted as MCP error results | unit | `go test ./internal/tools/ -run TestErrorHandling -v` |
| Rate limit warning | Warning appended to response when >80% usage | unit | `go test ./internal/tools/ -run TestRateLimitWarning -v` |
| Update no zero values | update_activity only sends fields present in arguments | unit | `go test ./internal/tools/ -run TestUpdateNoZeroValues -v` |
| Upload extension detection | .fit, .tcx, .gpx, .fit.gz auto-detected; unknown rejected | unit | `go test ./internal/tools/ -run TestUploadExtensionDetection -v` |
| Tool registration | RegisterAll registers exactly 11 tools | integration | `go test ./internal/tools/ -run TestRegisterAll -v` |

### Sampling Rate
- **Per task commit:** `go test ./internal/tools/... -v -count=1`
- **Per wave merge:** `go test ./... -v -count=1`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `internal/tools/helpers.go` -- formatResponse, handleToolError shared helpers
- [ ] `internal/tools/helpers_test.go` -- test helpers, mock client factory
- [ ] `internal/tools/activities_test.go` -- tests for 5 activity tools
- [ ] `internal/tools/athlete_test.go` -- tests for 2 athlete tools
- [ ] `internal/tools/streams_test.go` -- tests for streams tool
- [ ] `internal/tools/clubs_test.go` -- tests for clubs tool
- [ ] `internal/tools/uploads_test.go` -- tests for upload tools
- [ ] New `PostMultipart` method on `strava.Client` for file uploads

## Sources

### Primary (HIGH confidence)
- mcp-go v0.46.0 source code -- tool registration API (`mcp/tools.go`), result builders (`mcp/utils.go`), typed handlers (`mcp/typed_tools.go`), server API (`server/server.go`). Read directly from Go module cache.
- Existing TypeScript implementations -- `src/tools/activities.ts`, `src/tools/athlete.ts`, `src/tools/streams.ts`, `src/tools/clubs.ts`, `src/tools/uploads.ts`. Read directly from project source.
- Existing Go infrastructure -- `internal/strava/client.go`, `internal/tools/register.go`, `internal/server/server.go`, `main.go`. Read directly from project source. All Phase 1 tests passing.
- TypeScript type definitions -- `src/config/types.ts`. Reference for Strava API response shapes.
- Project research artifacts -- `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/research/FEATURES.md`, `.planning/research/PITFALLS.md`.

### Secondary (MEDIUM confidence)
- Strava API v3 Reference: https://developers.strava.com/docs/reference/ -- endpoint paths, HTTP methods, required params. Referenced in FEATURES.md.
- Strava upload endpoint documentation -- multipart/form-data requirements for POST /uploads.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in go.mod, API verified from source
- Architecture: HIGH -- patterns derived from Phase 1 code and mcp-go source
- Pitfalls: HIGH -- grounded in specific Go/JSON/Strava behaviors, verified against TypeScript implementation
- Tool inventory: HIGH -- 11 tools enumerated from TypeScript source with exact names, endpoints, and params

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- no external dependency changes expected, mcp-go pinned at v0.46.0)

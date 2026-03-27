# Architecture Patterns

**Domain:** Go-based MCP server for Strava API
**Researched:** 2026-03-26

## Recommended Architecture

A single Go binary with five distinct internal packages, connected via dependency injection through interfaces. The MCP server (mcp-go by mark3labs) owns the stdio transport and tool dispatch. Every tool handler receives a shared `StravaClient` that handles authentication transparently. A `TokenStore` manages file-based persistence. An `OAuth` package handles the one-time browser-based authorization flow.

```
                    +-----------+
                    |   stdin   |
                    +-----+-----+
                          |
                    +-----v-----+
                    |  mcp-go   |
                    | ServeStdio|
                    +-----+-----+
                          |
                    +-----v-----+
                    | MCPServer |
                    | (tool     |
                    |  dispatch)|
                    +-----+-----+
                          |
          +---------------+---------------+
          |               |               |
    +-----v-----+  +-----v-----+  +------v----+
    | Activity   |  | Athlete   |  | Segment   |
    | Tools      |  | Tools     |  | Tools     |  ... (6-8 tool groups)
    +-----+------+  +-----+-----+  +-----+-----+
          |               |               |
          +-------+-------+-------+-------+
                  |
            +-----v-----+
            | StravaClient|
            | (HTTP+Auth) |
            +-----+------+
                  |
          +-------+-------+
          |               |
    +-----v-----+   +----v------+
    | TokenStore |   | Strava    |
    | (file I/O) |   | API v3   |
    +-----+------+   +-----------+
          |
    +-----v-----+
    | ~/.strava/ |
    | tokens.json|
    +-----------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `cmd/strava-mcp/main.go` | Binary entry point, config loading, wiring | All internal packages |
| `internal/server` | MCP server setup, tool registration orchestration | mcp-go library, tool packages |
| `internal/tools/activities` | Activity tool definitions and handlers | StravaClient |
| `internal/tools/athlete` | Athlete profile and stats tools | StravaClient |
| `internal/tools/streams` | Activity stream/telemetry tools | StravaClient |
| `internal/tools/clubs` | Club activity tools | StravaClient |
| `internal/tools/uploads` | File upload and status tools | StravaClient |
| `internal/tools/segments` | Segment exploration and efforts tools (new) | StravaClient |
| `internal/tools/routes` | Route details and GPX export tools (new) | StravaClient |
| `internal/tools/gear` | Gear/equipment tools (new) | StravaClient |
| `internal/strava` | HTTP client with automatic token management | TokenStore, Strava API |
| `internal/auth/tokenstore` | File-based token read/write/expiry check | Filesystem (`~/.strava/tokens.json`) |
| `internal/auth/oauth` | One-time browser OAuth flow with local callback server | Strava OAuth endpoints, browser, TokenStore |
| `internal/config` | Config loading from environment and/or config file | Environment, filesystem |

### Data Flow

**Normal tool call (steady state):**

1. MCP client (Claude, Cursor, etc.) sends JSON-RPC `tools/call` over stdin
2. mcp-go `ServeStdio` reads newline-delimited JSON, parses JSON-RPC
3. mcp-go dispatches to registered tool handler function
4. Tool handler calls `StravaClient.Get("/athlete/activities", params)`
5. `StravaClient` calls `TokenStore.Read()` to get current tokens
6. If token expired (within 5-min buffer): `StravaClient` refreshes via Strava OAuth token endpoint, calls `TokenStore.Write()` to persist new tokens
7. `StravaClient` makes authenticated HTTP request to Strava API v3
8. Response JSON is returned through the tool handler as `mcp.CallToolResult`
9. mcp-go serializes response as JSON-RPC and writes to stdout
10. MCP client receives the result

**Initial OAuth setup (one-time):**

1. User runs `strava-mcp auth` (or server detects missing/invalid tokens on first call)
2. OAuth package generates authorization URL with PKCE verifier: `https://www.strava.com/oauth/authorize?client_id=X&redirect_uri=http://localhost:8089/callback&response_type=code&scope=read_all,activity:read_all,activity:write,profile:read_all&approval_prompt=force`
3. Opens user's browser to the authorization URL
4. Starts ephemeral HTTP server on localhost:8089
5. User authorizes in browser, Strava redirects to `localhost:8089/callback?code=XXX`
6. OAuth package exchanges code for tokens via POST to `https://www.strava.com/oauth/token`
7. Writes tokens to `TokenStore` (file on disk)
8. Shuts down ephemeral HTTP server
9. Prints success message, exits (or if inline, continues to MCP server mode)

## Project Layout

```
strava-mcp/
  go.mod
  go.sum
  main.go                           # Entry point: parse subcommands, wire dependencies
  internal/
    server/
      server.go                     # MCPServer creation, tool registration
    strava/
      client.go                     # StravaClient: HTTP methods, auto-refresh
      client_test.go
      types.go                      # Strava API response types (Activity, Athlete, etc.)
    auth/
      tokenstore.go                 # File-based token persistence
      tokenstore_test.go
      oauth.go                      # Browser OAuth flow with local callback
      oauth_test.go
    tools/
      activities.go                 # get_activities, get_activity, create_activity, update_activity, get_activity_zones
      athlete.go                    # get_athlete, get_athlete_stats
      streams.go                    # get_activity_streams
      clubs.go                      # get_club_activities
      uploads.go                    # create_upload, get_upload
      segments.go                   # get_starred_segments, get_segment, get_segment_efforts, get_segment_leaderboard
      routes.go                     # get_route, get_athlete_routes, export_route_gpx
      gear.go                       # get_gear
      laps.go                       # get_activity_laps
      register.go                   # RegisterAll() - central orchestrator for all tool groups
    config/
      config.go                     # Load env vars, config file, defaults
```

**Why this layout:**
- `main.go` in root (not `cmd/`) because this is a single-binary project. No need for `cmd/` indirection when there is exactly one command.
- `internal/` prevents any external import of project internals -- appropriate since this is not a library.
- Tool files are grouped by Strava API domain (activities, athlete, segments, etc.) matching the existing TypeScript pattern. Each file self-contains its tool definitions and handlers.
- `register.go` provides a single `RegisterAll(server, client)` function that wires every tool group. This is the only file the server package calls, keeping the coupling surface minimal.
- Types live in `internal/strava/types.go` rather than scattered across tool files. Go's type system is simpler than TypeScript's -- one file with all API response structs is manageable and avoids circular imports.

## Patterns to Follow

### Pattern 1: Tool Registration via Factory Functions

Each tool file exports a `Register(s *server.MCPServer, c *strava.Client)` function that adds its tools to the server. This keeps tool definitions co-located with their handlers and makes the registration order explicit.

**What:** Each tool domain file defines its tools inline and registers them in a single function.
**When:** Always. This is the primary organizational pattern.

```go
// internal/tools/activities.go
package tools

import (
    "context"
    "encoding/json"
    "fmt"

    "github.com/mark3labs/mcp-go/mcp"
    "github.com/mark3labs/mcp-go/server"
    "strava-mcp/internal/strava"
)

func RegisterActivityTools(s *server.MCPServer, c *strava.Client) {
    // get_activities
    s.AddTool(
        mcp.NewTool("get_activities",
            mcp.WithDescription("List the authenticated athlete's activities with optional date filtering and pagination"),
            mcp.WithNumber("before", mcp.Description("Epoch timestamp - only activities before this time")),
            mcp.WithNumber("after", mcp.Description("Epoch timestamp - only activities after this time")),
            mcp.WithNumber("page", mcp.Description("Page number (default 1)")),
            mcp.WithNumber("per_page", mcp.Description("Items per page (default 30, max 200)")),
        ),
        makeGetActivities(c),
    )

    // get_activity_by_id
    s.AddTool(
        mcp.NewTool("get_activity_by_id",
            mcp.WithDescription("Get detailed information about a specific activity"),
            mcp.WithNumber("id", mcp.Required(), mcp.Description("The activity ID")),
            mcp.WithBoolean("include_all_efforts", mcp.Description("Include all segment efforts")),
        ),
        makeGetActivityById(c),
    )

    // ... more tools
}

func makeGetActivities(c *strava.Client) server.ToolHandlerFunc {
    return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
        params := map[string]string{}
        if v, err := req.RequireFloat("after"); err == nil {
            params["after"] = fmt.Sprintf("%.0f", v)
        }
        if v, err := req.RequireFloat("before"); err == nil {
            params["before"] = fmt.Sprintf("%.0f", v)
        }
        // ... page, per_page

        result, err := c.Get(ctx, "/athlete/activities", params)
        if err != nil {
            return mcp.NewToolResultError(err.Error()), nil
        }
        return mcp.NewToolResultText(string(result)), nil
    }
}
```

### Pattern 2: StravaClient as Interface

Define the Strava client as an interface so tools are testable without hitting the real API.

**What:** Tools depend on an interface, not the concrete client.
**When:** Always. Essential for unit testing tool handlers.

```go
// internal/strava/client.go
package strava

import "context"

// Client defines the contract for Strava API access.
type Client interface {
    Get(ctx context.Context, path string, params map[string]string) ([]byte, error)
    Post(ctx context.Context, path string, body interface{}) ([]byte, error)
    Put(ctx context.Context, path string, body interface{}) ([]byte, error)
}

// HTTPClient implements Client using real HTTP calls to Strava API.
type HTTPClient struct {
    tokenStore TokenStore
    httpClient *http.Client
    baseURL    string
}
```

### Pattern 3: TokenStore Interface with File Implementation

Separate the token persistence contract from the file-system implementation.

**What:** Interface for token operations, with a JSON file implementation.
**When:** Always. Enables testing without filesystem, potential future backends.

```go
// internal/auth/tokenstore.go
package auth

import (
    "encoding/json"
    "os"
    "sync"
    "time"
)

type Tokens struct {
    ClientID     string `json:"client_id"`
    ClientSecret string `json:"client_secret"`
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    ExpiresAt    int64  `json:"expires_at"`
}

type TokenStore interface {
    Read() (*Tokens, error)
    Write(tokens *Tokens) error
    IsExpired(tokens *Tokens) bool
}

type FileTokenStore struct {
    path string
    mu   sync.RWMutex // Protect concurrent read/write
}

func (s *FileTokenStore) IsExpired(t *Tokens) bool {
    return time.Now().Unix() >= t.ExpiresAt-300 // 5-minute buffer
}
```

### Pattern 4: Closure-Based Handler Construction

Use closures to inject the StravaClient into tool handlers, avoiding global state.

**What:** Each tool handler is created by a factory function that closes over dependencies.
**When:** Always. The mcp-go `AddTool` expects a `func(context.Context, mcp.CallToolRequest) (*mcp.CallToolResult, error)`, so closures are the idiomatic way to inject dependencies.

### Pattern 5: Central Error Handling

Return errors as `mcp.CallToolResult` with `isError: true` rather than Go errors. This ensures the MCP client always gets a structured response, even on failure.

**What:** Tool handlers catch errors and return them as tool results, not as Go errors.
**When:** For all expected errors (API failures, validation, rate limits). Only return Go errors for truly unexpected panics.

```go
func makeGetActivityById(c strava.Client) server.ToolHandlerFunc {
    return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
        id, err := req.RequireFloat("id")
        if err != nil {
            return mcp.NewToolResultError("id is required"), nil
        }

        result, err := c.Get(ctx, fmt.Sprintf("/activities/%.0f", id), nil)
        if err != nil {
            return mcp.NewToolResultError(fmt.Sprintf("Strava API error: %s", err)), nil
        }
        return mcp.NewToolResultText(string(result)), nil
    }
}
```

### Pattern 6: Subcommand Architecture for Auth vs Serve

Use a simple subcommand pattern (`strava-mcp serve` vs `strava-mcp auth`) to separate the one-time OAuth flow from the MCP server mode. No need for a heavy CLI framework -- `os.Args` or a minimal flag parser suffices.

**What:** Two modes of operation in one binary.
**When:** Always. The OAuth flow is interactive (opens browser, runs temp HTTP server) and must not run during normal stdio MCP operation.

```go
// main.go
func main() {
    if len(os.Args) > 1 && os.Args[1] == "auth" {
        runOAuthFlow()
        return
    }
    // Default: run MCP server
    runServer()
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global Strava Client

**What:** Creating the StravaClient as a package-level global variable.
**Why bad:** Untestable, hidden dependency, impossible to mock for unit tests, unsafe for concurrent access without careful synchronization.
**Instead:** Create in `main.go`, pass to `RegisterAll()`, which passes to each tool registration function.

### Anti-Pattern 2: Giant Switch Statement for Tool Dispatch

**What:** A single switch statement mapping tool names to handlers (the pattern used in the current TypeScript `app.ts`).
**Why bad:** mcp-go already handles dispatch internally via `AddTool`. A manual switch duplicates this and creates a maintenance burden as tools grow from 11 to 20+.
**Instead:** Use `AddTool` for each tool. The library handles name-to-handler routing.

### Anti-Pattern 3: Raw JSON Manipulation in Tool Handlers

**What:** Using `map[string]interface{}` and manual JSON field extraction instead of typed structs.
**Why bad:** Fragile, no compile-time safety, error-prone for nested Strava API responses.
**Instead:** Define Go structs for all Strava API types. Unmarshal into typed structs in the client, serialize to JSON string for tool results. The tool results are always JSON text (MCP protocol requirement), but internal handling should be typed.

### Anti-Pattern 4: Token Refresh in Every Tool Handler

**What:** Each tool handler checks token expiry and refreshes independently.
**Why bad:** Race conditions, duplicated code, token refresh should be transparent.
**Instead:** Token refresh lives entirely in `StravaClient`. Tool handlers call `client.Get()` and never think about auth.

### Anti-Pattern 5: Logging to Stdout

**What:** Using `fmt.Println` or `log.Println` (which defaults to stdout) for diagnostic logging.
**Why bad:** Stdout is the MCP JSON-RPC transport. Any non-JSON output on stdout will corrupt the protocol and crash the connection.
**Instead:** Log to stderr exclusively. Use `log.SetOutput(os.Stderr)` in main, or use `slog` with a stderr handler. The mcp-go library's `WithLogging()` option sends logs through the MCP protocol's logging capability, which is also safe.

### Anti-Pattern 6: Embedding OAuth Credentials in the Binary

**What:** Hardcoding client_id and client_secret in the source code.
**Why bad:** Security risk, prevents open-source distribution, forces rebuild to change credentials.
**Instead:** Read from config file or environment variables. The token file stores `client_id` and `client_secret` alongside tokens (matching the existing openclaw-plugin pattern).

## Scalability Considerations

| Concern | At Single User (target) | At Multiple MCP Clients | Notes |
|---------|------------------------|------------------------|-------|
| Token refresh races | sync.Mutex in TokenStore, single-flight in Client | Same -- file lock + mutex | Strava issues new refresh_token on each refresh; losing one = re-auth |
| Strava rate limits | 200/15min, 2000/day -- unlikely to hit with single user | Could hit with aggressive LLM usage | Add rate limit tracking from response headers (X-RateLimit-Limit, X-RateLimit-Usage) |
| Stdio throughput | Negligible concern | N/A (one client per stdio server) | Large stream responses (GPS data) could be 1MB+ but still fast over pipe |
| Memory | Minimal -- Go binary ~10MB, no persistent state in memory | N/A | Strava API responses are small (largest: activity streams ~1MB) |
| File contention | Single process reads/writes token file | Multiple processes could corrupt | Use `flock` if multiple instances possible, or document single-instance constraint |

## Build Order (Dependency Graph)

This dependency graph determines the order components must be built and tested. Lower layers have zero internal dependencies and should be built first.

```
Layer 0 (no deps):    config, auth/tokenstore, strava/types
Layer 1 (Layer 0):    strava/client (depends on tokenstore, types)
Layer 2 (Layer 1):    tools/* (depends on strava/client)
Layer 3 (Layer 2):    server (depends on tools, mcp-go)
Layer 4 (Layer 3):    main.go (depends on server, config, auth/oauth)
Parallel (Layer 0):   auth/oauth (depends on tokenstore, config; independent of tools/server)
```

**Suggested implementation order for roadmap phases:**

1. **Token store + config** -- Zero dependencies, immediately testable, unlocks everything else
2. **Strava HTTP client** -- Depends only on token store, can be tested with a real Strava token
3. **Core tools (activities, athlete)** -- Port the existing 11 tools, validates the full chain from tool handler through client to API
4. **MCP server wiring** -- Connect tools to mcp-go, test with MCP Inspector
5. **OAuth browser flow** -- Independent of tools; can be built in parallel with steps 3-4
6. **Extended tools (segments, routes, gear, laps)** -- New Strava API coverage, built on proven patterns from step 3
7. **Polish** -- Error messages, rate limit handling, README, build/release pipeline

## Sources

- mcp-go library (mark3labs/mcp-go): https://github.com/mark3labs/mcp-go -- HIGH confidence, primary source for MCP server patterns in Go
- MCP Protocol specification: https://modelcontextprotocol.io/docs/learn/architecture -- HIGH confidence, official protocol documentation
- Go oauth2 package: https://pkg.go.dev/golang.org/x/oauth2 -- HIGH confidence, standard library extension
- Go project layout: https://go.dev/doc/modules/layout -- HIGH confidence, official Go documentation
- Strava OAuth documentation: https://developers.strava.com/docs/authentication/ -- HIGH confidence, official Strava docs
- Strava rate limits: https://developers.strava.com/docs/getting-started/ -- MEDIUM confidence (only basic info available)
- Existing TypeScript codebase: `/Volumes/DataDeuce/Projects/StravaMCP/src/` and `openclaw-plugin/` -- HIGH confidence, direct source analysis

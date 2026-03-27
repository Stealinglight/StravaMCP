# Phase 1: Foundation and Auth - Research

**Researched:** 2026-03-26
**Domain:** Go MCP server scaffold, Strava OAuth2 authentication, file-based token persistence, stdio transport
**Confidence:** HIGH

## Summary

Phase 1 builds the entire foundation for a Go-based MCP server that authenticates with Strava. This is a greenfield implementation -- no Go code or `go.mod` exists yet. The phase must deliver: a Go project scaffold with `mcp-go` wired for stdio transport, a file-based token store with atomic writes, a browser-based OAuth flow via a dedicated `auth` subcommand, a Strava HTTP client with automatic token refresh and concurrent-refresh protection via `singleflight`, and structured logging exclusively to stderr.

The critical correctness concerns are: (1) stdout must carry only MCP JSON-RPC traffic -- any stray output corrupts the protocol, (2) Strava rotates refresh tokens on every refresh, so the new token must be atomically persisted before use, (3) concurrent tool calls from an LLM can trigger simultaneous refresh attempts that cause token loss. The architecture research and existing TypeScript codebase provide clear patterns to follow.

**Primary recommendation:** Build bottom-up following the dependency graph: config + token store first, then Strava HTTP client, then OAuth flow, then MCP server shell. Use `mark3labs/mcp-go` for MCP protocol, `golang.org/x/sync/singleflight` for refresh coalescing, and Go stdlib for everything else. Pin all dependency versions in `go.mod`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fixed callback port 19876 -- user registers `http://localhost:19876/callback` once in Strava developer console
- Success page auto-closes the browser tab via JavaScript after a brief "Done!" flash
- 2-minute timeout -- if user doesn't complete OAuth, server shuts down with stderr message: "OAuth timed out. Run `strava-mcp auth` again."
- Failure shows error in both browser (what went wrong + "try again") and terminal stderr (technical details)
- After successful OAuth, validate by calling GET /athlete and print "Authenticated as [Name]!" to confirm end-to-end
- Env vars only for credentials: `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` -- no config file, no .env loading
- Token path defaults to `~/.strava/tokens.json`, overridable via `STRAVA_TOKEN_PATH` env var
- All OAuth scopes requested upfront: `read,read_all,profile:read_all,profile:write,activity:read_all,activity:write` -- no incremental re-auth
- `strava-mcp auth` subcommand runs OAuth flow; bare `strava-mcp` starts MCP server
- `--version` flag prints version, commit hash, and build date (via Go ldflags)
- `--debug` flag enables verbose logging: all HTTP requests, token refreshes, rate limit status
- Normal mode (no --debug): minimal stderr output
- Structured logging via Go `log/slog` with timestamps to stderr
- Normal mode logs: server startup, auth events, errors only
- Debug mode adds: HTTP requests, token refresh events, rate limit tracking
- Strava API errors surface in MCP tool results as: Strava error message + HTTP status code
- Rate limit proximity warning appended to tool results when >80% of 15-min quota is used

### Claude's Discretion
- Exact HTML/CSS for OAuth success and failure browser pages
- slog handler configuration details
- Internal package naming within the five-layer structure
- Token backup file strategy (.backup alongside tokens.json)
- Exact rate limit threshold percentage (80% is the guideline, not hard requirement)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Go project scaffolded with mcp-go SDK, stderr-only logging, go.mod initialized | mcp-go v0.46.0+ API verified, slog stderr pattern documented, project layout defined |
| INFRA-02 | File-based token store with atomic write-then-rename at configurable path (~/.strava/tokens.json) | Atomic write pattern documented, token JSON shape from existing TS codebase, FileTokenStore interface pattern provided |
| INFRA-03 | Built-in OAuth browser flow that opens system browser, runs ephemeral localhost callback, exchanges code, persists tokens | Strava OAuth endpoints verified (authorize + token exchange), pkg/browser stdout pitfall identified, callback server pattern documented |
| INFRA-04 | Strava HTTP client with automatic token refresh (5-min buffer), concurrent refresh protection (singleflight), and rate limit header tracking | singleflight API verified, Strava rate limit headers documented (X-RateLimit-Limit, X-RateLimit-Usage, X-ReadRateLimit-Limit, X-ReadRateLimit-Usage), refresh pattern ported from TS |
| INFRA-05 | MCP server wired with mcp-go ServeStdio, all tools registered declaratively | ServeStdio API verified, AddTool + ToolHandlerFunc signatures documented, empty tool set is valid for Phase 1 |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Go | 1.25.7 (installed) | Language runtime | Verified installed on this system. Supports slog, generics, all modern features. |
| github.com/mark3labs/mcp-go | v0.46.0+ (pin exact) | MCP protocol server | Most mature Go MCP SDK. Provides `ServeStdio`, `NewMCPServer`, `AddTool` with typed parameter builders. 4k+ stars. Active development. |
| golang.org/x/sync | v0.20.0+ | singleflight for concurrent refresh coalescing | Official Go extended stdlib. `singleflight.Group.Do()` coalesces concurrent calls into one execution. |
| log/slog (stdlib) | Go 1.21+ | Structured logging to stderr | Built-in. `slog.NewTextHandler(os.Stderr, opts)` for stderr-only logging. Zero dependencies. |
| net/http (stdlib) | Go 1.25 | HTTP client for Strava API | Production-grade HTTP client. `http.NewRequestWithContext` for context propagation. |
| encoding/json (stdlib) | Go 1.25 | JSON serialization/deserialization | Token file read/write, Strava API response parsing. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| github.com/pkg/browser | v0.0.0-20240102092130-5ac0b6a4141c | Open system browser for OAuth | During `auth` subcommand only. CRITICAL: Set `browser.Stderr = os.Stderr` and `browser.Stdout = os.Stderr` to prevent stdout corruption. |
| os/exec (stdlib) | Go 1.25 | Alternative to pkg/browser | If pkg/browser stdout redirection proves unreliable, use `exec.Command("open", url)` on macOS directly. |
| crypto/rand (stdlib) | Go 1.25 | Generate OAuth state parameter | CSRF protection for OAuth callback. |
| net/http/httptest (stdlib) | Go 1.25 | Test HTTP server mocks | Unit testing Strava client and OAuth callback handler. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| mark3labs/mcp-go | modelcontextprotocol/go-sdk v1.4.1+ | Official SDK has more contributors (92) and explicit backwards compat policy via MCPGODEBUG. However, STACK.md locked in mcp-go and CONTEXT.md references mcp-go specifically. Stick with mcp-go per project research decisions. |
| Manual OAuth | golang.org/x/oauth2 | x/oauth2 does not handle file-based token persistence. Would need custom TokenSource wrapper anyway. Manual implementation gives full control over atomic writes. |
| pkg/browser | exec.Command("open", url) | macOS-only but simpler. pkg/browser is cross-platform. Use pkg/browser but redirect its stdout/stderr. |
| joho/godotenv | Pure env vars | CONTEXT.md explicitly says "no .env loading". Use pure env vars only. |

**Installation:**
```bash
go mod init strava-mcp
go get github.com/mark3labs/mcp-go@v0.46.0
go get golang.org/x/sync@v0.20.0
go get github.com/pkg/browser
```

**Version verification notes:**
- mcp-go v0.46.0 confirmed via pkg.go.dev (published March 26, 2026). There may be newer versions -- pin whichever is latest at implementation time.
- golang.org/x/sync v0.20.0 confirmed via pkg.go.dev (published Feb 23, 2026).
- pkg/browser has no tagged releases; uses pseudo-version. The `Stdout` and `Stderr` package-level variables MUST be redirected.

## Architecture Patterns

### Recommended Project Structure

```
strava-mcp/
  go.mod
  go.sum
  main.go                          # Entry point: subcommand dispatch, dependency wiring
  internal/
    server/
      server.go                    # MCPServer creation, tool registration orchestration
    strava/
      client.go                    # StravaClient: HTTP methods, auto-refresh, rate limit tracking
      client_test.go               # Tests with httptest mock server
    auth/
      tokenstore.go                # TokenStore interface + FileTokenStore implementation
      tokenstore_test.go           # Atomic write tests, expiry checks
      oauth.go                     # Browser OAuth flow: authorize URL, callback server, code exchange
      oauth_test.go                # OAuth flow tests with mock Strava endpoints
    config/
      config.go                    # Load env vars, provide defaults
    tools/
      register.go                  # RegisterAll() -- empty for Phase 1, wiring point for Phase 2
```

**Why this layout:**
- `main.go` at root (not `cmd/`) because this is a single-binary project
- `internal/` prevents external import of project internals
- Token store and OAuth are siblings under `auth/` -- OAuth writes to TokenStore, client reads from it
- `tools/register.go` exists in Phase 1 as a no-op wiring point so the MCP server shell is complete
- Strava client in `internal/strava/` separate from auth because it is the HTTP layer, not the auth layer

### Pattern 1: Subcommand Dispatch Without a CLI Framework

**What:** Simple `os.Args` parsing for `auth` subcommand vs default MCP server mode.
**When to use:** Always. No need for Cobra/Viper -- only two modes of operation.

```go
// main.go
func main() {
    // Parse flags
    debug := false
    showVersion := false

    args := os.Args[1:]
    for i := 0; i < len(args); i++ {
        switch args[i] {
        case "--debug":
            debug = true
        case "--version":
            showVersion = true
        }
    }

    if showVersion {
        fmt.Fprintf(os.Stderr, "strava-mcp %s (%s) built %s\n", Version, Commit, Date)
        os.Exit(0)
    }

    // Set up slog to stderr
    level := slog.LevelInfo
    if debug {
        level = slog.LevelDebug
    }
    logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: level}))
    slog.SetDefault(logger)

    // Redirect standard log to stderr as safety net
    log.SetOutput(os.Stderr)

    // Subcommand dispatch
    if len(args) > 0 && args[0] == "auth" {
        runAuth(logger)
        return
    }

    // Default: MCP server
    runServer(logger, debug)
}
```

### Pattern 2: TokenStore Interface with Atomic File Implementation

**What:** Interface for token CRUD, concrete implementation uses write-then-rename.
**When to use:** Always. The atomic write is the single most important correctness requirement.

```go
// internal/auth/tokenstore.go
type Tokens struct {
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
    mu   sync.RWMutex
}

func (s *FileTokenStore) Write(tokens *Tokens) error {
    s.mu.Lock()
    defer s.mu.Unlock()

    data, err := json.MarshalIndent(tokens, "", "  ")
    if err != nil {
        return fmt.Errorf("marshal tokens: %w", err)
    }

    // Ensure directory exists
    dir := filepath.Dir(s.path)
    if err := os.MkdirAll(dir, 0700); err != nil {
        return fmt.Errorf("create token directory: %w", err)
    }

    // Write to temp file, then atomic rename
    tmpPath := s.path + ".tmp"
    if err := os.WriteFile(tmpPath, data, 0600); err != nil {
        return fmt.Errorf("write temp token file: %w", err)
    }

    // Sync to ensure data reaches disk
    f, err := os.Open(tmpPath)
    if err == nil {
        _ = f.Sync()
        _ = f.Close()
    }

    if err := os.Rename(tmpPath, s.path); err != nil {
        return fmt.Errorf("rename token file: %w", err)
    }

    // Optional: keep backup
    // Already covered by the atomic rename -- old file is replaced atomically

    return nil
}

func (s *FileTokenStore) IsExpired(t *Tokens) bool {
    return time.Now().Unix() >= t.ExpiresAt-300 // 5-minute buffer
}
```

### Pattern 3: StravaClient with Singleflight Refresh

**What:** HTTP client that transparently refreshes tokens, coalescing concurrent refreshes.
**When to use:** Always. Tool handlers call `client.Get()` and never think about auth.

```go
// internal/strava/client.go
type Client struct {
    tokenStore  auth.TokenStore
    httpClient  *http.Client
    baseURL     string
    clientID    string
    clientSecret string
    refreshGroup singleflight.Group
    rateLimits  *RateLimits  // Track from response headers
    logger      *slog.Logger
}

func (c *Client) doRequest(ctx context.Context, method, path string, body io.Reader) ([]byte, error) {
    tokens, err := c.tokenStore.Read()
    if err != nil {
        return nil, fmt.Errorf("read tokens: %w", err)
    }

    if c.tokenStore.IsExpired(tokens) {
        tokens, err = c.refresh(ctx)
        if err != nil {
            return nil, fmt.Errorf("refresh token: %w", err)
        }
    }

    // Build request
    url := c.baseURL + path
    req, err := http.NewRequestWithContext(ctx, method, url, body)
    if err != nil {
        return nil, err
    }
    req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    // Track rate limits from headers
    c.updateRateLimits(resp.Header)

    // Handle 401 with one retry after refresh
    if resp.StatusCode == http.StatusUnauthorized {
        tokens, err = c.refresh(ctx)
        if err != nil {
            return nil, fmt.Errorf("refresh after 401: %w", err)
        }
        // Retry the request with new token
        req, _ = http.NewRequestWithContext(ctx, method, url, body)
        req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)
        resp, err = c.httpClient.Do(req)
        if err != nil {
            return nil, err
        }
        defer resp.Body.Close()
        c.updateRateLimits(resp.Header)
    }

    respBody, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    if resp.StatusCode >= 400 {
        return nil, &StravaError{StatusCode: resp.StatusCode, Body: string(respBody)}
    }

    return respBody, nil
}

func (c *Client) refresh(ctx context.Context) (*auth.Tokens, error) {
    result, err, _ := c.refreshGroup.Do("refresh", func() (interface{}, error) {
        c.logger.Debug("refreshing token")

        // POST to Strava token endpoint
        data := url.Values{
            "client_id":     {c.clientID},
            "client_secret": {c.clientSecret},
            "grant_type":    {"refresh_token"},
            "refresh_token": {/* current refresh token */},
        }

        resp, err := http.PostForm("https://www.strava.com/api/v3/oauth/token", data)
        if err != nil {
            return nil, err
        }
        defer resp.Body.Close()

        var tokens auth.Tokens
        if err := json.NewDecoder(resp.Body).Decode(&tokens); err != nil {
            return nil, err
        }

        // CRITICAL: Persist BEFORE using the new tokens
        if err := c.tokenStore.Write(&tokens); err != nil {
            return nil, fmt.Errorf("persist refreshed tokens: %w", err)
        }

        c.logger.Debug("token refreshed successfully")
        return &tokens, nil
    })

    if err != nil {
        return nil, err
    }
    return result.(*auth.Tokens), nil
}
```

### Pattern 4: OAuth Browser Flow with Ephemeral Callback Server

**What:** `strava-mcp auth` opens browser, runs temp HTTP server on port 19876, exchanges code, persists tokens.
**When to use:** One-time setup via `auth` subcommand only. Never during MCP server operation.

```go
// internal/auth/oauth.go
func RunOAuthFlow(cfg *config.Config, store TokenStore, logger *slog.Logger) error {
    // Generate state for CSRF protection
    state := generateRandomState()

    // Build authorization URL
    authURL := fmt.Sprintf(
        "https://www.strava.com/oauth/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s&approval_prompt=force",
        cfg.ClientID,
        url.QueryEscape("http://localhost:19876/callback"),
        "read,read_all,profile:read_all,profile:write,activity:read_all,activity:write",
        state,
    )

    // Channel to receive the authorization code
    codeCh := make(chan string, 1)
    errCh := make(chan error, 1)

    // Start ephemeral callback server
    mux := http.NewServeMux()
    mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
        if r.URL.Query().Get("state") != state {
            errCh <- fmt.Errorf("OAuth state mismatch")
            // Serve error page
            w.WriteHeader(http.StatusBadRequest)
            fmt.Fprint(w, errorPageHTML)
            return
        }
        if errStr := r.URL.Query().Get("error"); errStr != "" {
            errCh <- fmt.Errorf("OAuth error: %s", errStr)
            w.WriteHeader(http.StatusBadRequest)
            fmt.Fprint(w, errorPageHTML)
            return
        }
        code := r.URL.Query().Get("code")
        // Serve success page with auto-close JavaScript
        fmt.Fprint(w, successPageHTML)
        codeCh <- code
    })

    srv := &http.Server{Addr: ":19876", Handler: mux}
    go func() { _ = srv.ListenAndServe() }()
    defer srv.Close()

    // Open browser
    logger.Info("opening browser for Strava authorization")
    browser.Stderr = os.Stderr // CRITICAL: redirect browser output away from stdout
    browser.Stdout = os.Stderr
    if err := browser.OpenURL(authURL); err != nil {
        fmt.Fprintf(os.Stderr, "Open this URL in your browser:\n%s\n", authURL)
    }

    // Wait for callback or timeout
    select {
    case code := <-codeCh:
        return exchangeAndPersist(cfg, store, code, logger)
    case err := <-errCh:
        return err
    case <-time.After(2 * time.Minute):
        return fmt.Errorf("OAuth timed out. Run `strava-mcp auth` again.")
    }
}
```

### Pattern 5: MCP Server Shell with Empty Tool Set

**What:** Phase 1 delivers a working MCP server that responds to the protocol handshake.
**When to use:** This phase only. Phase 2 fills in tools.

```go
// internal/server/server.go
func New(logger *slog.Logger, stravaClient *strava.Client) *mcpserver.MCPServer {
    s := mcpserver.NewMCPServer(
        "strava-mcp",
        Version, // injected via ldflags
        mcpserver.WithLogging(),
        mcpserver.WithToolCapabilities(false),
    )

    // Phase 2 will call: tools.RegisterAll(s, stravaClient)

    return s
}

// main.go -- runServer function
func runServer(logger *slog.Logger, debug bool) {
    cfg := config.Load()
    store := auth.NewFileTokenStore(cfg.TokenPath)
    client := strava.NewClient(cfg, store, logger)

    s := server.New(logger, client)

    logger.Info("starting MCP server", "name", "strava-mcp")
    if err := mcpserver.ServeStdio(s); err != nil {
        logger.Error("server error", "err", err)
        os.Exit(1)
    }
}
```

### Anti-Patterns to Avoid

- **Logging to stdout:** Never use `fmt.Println()`, `log.Println()` (which defaults to stderr but be explicit), or any library that writes to stdout. Set `log.SetOutput(os.Stderr)` as first line in main(). Redirect `pkg/browser.Stdout` and `pkg/browser.Stderr` to `os.Stderr`.
- **Token refresh in tool handlers:** Refresh logic belongs in `StravaClient`, not in individual tools.
- **Global Strava client:** Create in `main.go`, inject via function parameters.
- **Non-atomic token writes:** Never write directly to `tokens.json`. Always write-then-rename.
- **Storing client credentials in token file:** CONTEXT.md says env vars only for credentials. Token file stores only `access_token`, `refresh_token`, `expires_at`.
- **Using .env loading:** CONTEXT.md explicitly says "no .env loading." Remove `joho/godotenv` from the stack entirely.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MCP protocol handling | JSON-RPC parser, message routing, protocol negotiation | `mcp-go` ServeStdio + AddTool | Protocol has edge cases (cancellation, progress, capabilities negotiation) that are easy to get wrong |
| Concurrent call coalescing | Mutex + flag + channel pattern from TypeScript | `golang.org/x/sync/singleflight` | Proven stdlib-adjacent solution. Handles panics, multiple waiters, and result sharing correctly |
| Browser opening | `exec.Command("open", url)` with platform detection | `github.com/pkg/browser` | Cross-platform (macOS, Linux, Windows). Handles `xdg-open` vs `open` vs `start` |
| Structured logging | `fmt.Fprintf(os.Stderr, ...)` with manual formatting | `log/slog` stdlib | Structured key-value pairs, level filtering, timestamp formatting built in |
| HTTP request/response handling | Raw socket handling or custom transport | `net/http` stdlib | Production-grade, supports context cancellation, connection pooling |

**Key insight:** The only truly custom code in this phase is the OAuth callback server (simple), the atomic file token store (straightforward but must be correct), and the Strava client refresh logic (singleflight makes it simple).

## Common Pitfalls

### Pitfall 1: stdout Corruption Kills MCP Connection

**What goes wrong:** Any non-JSON-RPC output on stdout corrupts the MCP message stream. `fmt.Println()`, `log.Println()` (if log default output is not redirected), and `pkg/browser` (which writes command output to `os.Stdout` by default) will all break the protocol.
**Why it happens:** Go's `fmt.Print*` defaults to stdout. The `pkg/browser` package has `Stdout` and `Stderr` package variables that default to `os.Stdout` and `os.Stderr`.
**How to avoid:** (1) Set `log.SetOutput(os.Stderr)` as first line of `main()`. (2) Set `browser.Stdout = os.Stderr` and `browser.Stderr = os.Stderr` before calling `browser.OpenURL()`. (3) Use `slog` configured to stderr for all logging. (4) Never use `fmt.Print*` for output in production code.
**Warning signs:** MCP client reports "parse error" or "invalid JSON" intermittently. Tools work in tests but fail via stdio.

### Pitfall 2: Strava Refresh Token Rotation Loss

**What goes wrong:** Strava rotates the refresh token on every refresh call. The old refresh token is immediately invalidated. If the new token is not persisted to disk before use (or before a crash), the user must re-authenticate via the browser flow.
**Why it happens:** The refresh HTTP call succeeds, returning new tokens, but the file write fails (disk full, permissions) or the process crashes between receiving the response and writing the file.
**How to avoid:** In the `refresh()` function, persist tokens to disk BEFORE returning them for use. Use atomic write-then-rename. Log refresh events so failures are diagnosable.
**Warning signs:** "Invalid refresh token" errors after working for 6 hours (one token lifetime). Token file contains stale data after crash.

### Pitfall 3: Concurrent Token Refresh Race Condition

**What goes wrong:** Multiple MCP tool calls arrive simultaneously (LLMs issue parallel calls). Each finds the token expired, each fires a separate refresh request to Strava. Strava returns different refresh tokens for each. Only the last write to disk survives -- earlier responses contain now-invalidated tokens.
**Why it happens:** Without coalescing, N concurrent callers = N refresh requests = N different refresh tokens, only one valid.
**How to avoid:** Use `singleflight.Group.Do("refresh", fn)` so only one refresh executes. All concurrent callers receive the same result.
**Warning signs:** Intermittent auth failures under load. Token file changes rapidly. Works in sequential testing, fails with parallel tool calls.

### Pitfall 4: Strava OAuth Token Endpoint URL

**What goes wrong:** Different sources show different token endpoint URLs. The authorization docs reference `https://www.strava.com/api/v3/oauth/token` while the existing TypeScript code uses `https://www.strava.com/oauth/token` (without `/api/v3`).
**Why it happens:** Strava accepts both URLs, but the official docs use the `/api/v3/` prefixed version.
**How to avoid:** Use `https://www.strava.com/api/v3/oauth/token` per the official authentication documentation. Both work, but using the documented one avoids confusion.
**Warning signs:** Not a runtime issue since both work, but consistency matters for maintainability.

### Pitfall 5: Missing STRAVA_CLIENT_ID/SECRET at Runtime

**What goes wrong:** User starts `strava-mcp` or `strava-mcp auth` without setting environment variables. With no .env loading (per CONTEXT.md), the binary fails with a confusing empty-string error from Strava.
**Why it happens:** Environment variables are invisible -- easy to forget. No .env fallback per user decision.
**How to avoid:** Validate required env vars at startup, before any Strava calls. Print a clear error message: `"STRAVA_CLIENT_ID environment variable is required. Get it from https://www.strava.com/settings/api"`.
**Warning signs:** Strava returns 400 or "invalid client_id" errors.

### Pitfall 6: pkg/browser Stdout Leakage

**What goes wrong:** The `pkg/browser` package has package-level `Stdout` and `Stderr` variables that default to `os.Stdout` and `os.Stderr`. When `browser.OpenURL()` is called, it executes the system `open` command, and any output from that command goes to `browser.Stdout` which is `os.Stdout`.
**Why it happens:** The `auth` subcommand runs before the MCP server, so stdout corruption during auth is harmless. BUT if browser is imported in the binary, the package-level variable defaults could be a problem if somehow triggered during server mode.
**How to avoid:** Set `browser.Stdout = os.Stderr` and `browser.Stderr = os.Stderr` in `main()` at startup, regardless of which mode is running. This is a one-line safety net.
**Warning signs:** Unexpected output on stdout when running `strava-mcp auth`.

## Code Examples

Verified patterns from official sources:

### MCP Server Creation and Stdio Serving
```go
// Source: pkg.go.dev/github.com/mark3labs/mcp-go/server
import (
    "github.com/mark3labs/mcp-go/mcp"
    "github.com/mark3labs/mcp-go/server"
)

s := server.NewMCPServer(
    "strava-mcp",
    "1.0.0",
    server.WithLogging(),
)

// Register a tool (Phase 2 adds real tools)
s.AddTool(
    mcp.NewTool("get_activities",
        mcp.WithDescription("List the authenticated athlete's activities"),
        mcp.WithNumber("page", mcp.Description("Page number (default 1)")),
        mcp.WithNumber("per_page", mcp.Description("Items per page (default 30, max 200)")),
    ),
    func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
        page := req.GetInt("page", 1)
        perPage := req.GetInt("per_page", 30)
        // ... call Strava API ...
        return mcp.NewToolResultText(string(result)), nil
    },
)

if err := server.ServeStdio(s); err != nil {
    log.Fatal(err)
}
```

### slog Configured for stderr with Debug Toggle
```go
// Source: pkg.go.dev/log/slog
import "log/slog"

level := slog.LevelInfo
if debug {
    level = slog.LevelDebug
}
logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
    Level: level,
}))
slog.SetDefault(logger)

// Safety net: redirect standard log package to stderr too
log.SetOutput(os.Stderr)
```

### Singleflight Token Refresh
```go
// Source: pkg.go.dev/golang.org/x/sync/singleflight
import "golang.org/x/sync/singleflight"

var refreshGroup singleflight.Group

func refreshToken() (*Tokens, error) {
    result, err, shared := refreshGroup.Do("refresh", func() (interface{}, error) {
        // This function executes at most once concurrently
        // All other callers wait and receive the same result
        newTokens, err := callStravaRefreshEndpoint()
        if err != nil {
            return nil, err
        }
        // Persist FIRST, then return
        if err := tokenStore.Write(newTokens); err != nil {
            return nil, err
        }
        return newTokens, nil
    })
    if err != nil {
        return nil, err
    }
    if shared {
        slog.Debug("token refresh result shared with concurrent caller")
    }
    return result.(*Tokens), nil
}
```

### Strava OAuth Token Exchange
```go
// Source: developers.strava.com/docs/authentication/
func exchangeCode(clientID, clientSecret, code string) (*Tokens, error) {
    data := url.Values{
        "client_id":     {clientID},
        "client_secret": {clientSecret},
        "code":          {code},
        "grant_type":    {"authorization_code"},
    }

    resp, err := http.PostForm("https://www.strava.com/api/v3/oauth/token", data)
    if err != nil {
        return nil, fmt.Errorf("token exchange request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("token exchange failed (%d): %s", resp.StatusCode, body)
    }

    var result struct {
        AccessToken  string `json:"access_token"`
        RefreshToken string `json:"refresh_token"`
        ExpiresAt    int64  `json:"expires_at"`
        Athlete      struct {
            FirstName string `json:"firstname"`
            LastName  string `json:"lastname"`
        } `json:"athlete"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("decode token response: %w", err)
    }

    return &Tokens{
        AccessToken:  result.AccessToken,
        RefreshToken: result.RefreshToken,
        ExpiresAt:    result.ExpiresAt,
    }, nil
    // Also print: fmt.Fprintf(os.Stderr, "Authenticated as %s %s!\n", result.Athlete.FirstName, result.Athlete.LastName)
}
```

### Atomic File Write Pattern
```go
// Write-then-rename for crash-safe token persistence
func atomicWriteJSON(path string, v interface{}) error {
    data, err := json.MarshalIndent(v, "", "  ")
    if err != nil {
        return err
    }

    dir := filepath.Dir(path)
    if err := os.MkdirAll(dir, 0700); err != nil {
        return err
    }

    tmp := path + ".tmp"
    if err := os.WriteFile(tmp, data, 0600); err != nil {
        return err
    }

    // Ensure data is flushed to disk
    f, err := os.Open(tmp)
    if err == nil {
        _ = f.Sync()
        _ = f.Close()
    }

    return os.Rename(tmp, path)
}
```

### Build with ldflags for Version Info
```bash
# Source: Go documentation on build-time variables
go build -ldflags "-X main.Version=1.0.0 -X main.Commit=$(git rev-parse --short HEAD) -X main.Date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o strava-mcp .
```

```go
// main.go
var (
    Version = "dev"
    Commit  = "none"
    Date    = "unknown"
)
```

### Rate Limit Header Parsing
```go
// Source: developers.strava.com/docs/rate-limits/
type RateLimits struct {
    Limit15Min   int
    LimitDaily   int
    Usage15Min   int
    UsageDaily   int
    ReadLimit15  int
    ReadLimitDay int
    ReadUsage15  int
    ReadUsageDay int
}

func parseRateLimits(header http.Header) *RateLimits {
    rl := &RateLimits{}

    if limit := header.Get("X-RateLimit-Limit"); limit != "" {
        parts := strings.SplitN(limit, ",", 2)
        if len(parts) == 2 {
            rl.Limit15Min, _ = strconv.Atoi(strings.TrimSpace(parts[0]))
            rl.LimitDaily, _ = strconv.Atoi(strings.TrimSpace(parts[1]))
        }
    }

    if usage := header.Get("X-RateLimit-Usage"); usage != "" {
        parts := strings.SplitN(usage, ",", 2)
        if len(parts) == 2 {
            rl.Usage15Min, _ = strconv.Atoi(strings.TrimSpace(parts[0]))
            rl.UsageDaily, _ = strconv.Atoi(strings.TrimSpace(parts[1]))
        }
    }

    // Similarly for X-ReadRateLimit-Limit and X-ReadRateLimit-Usage

    return rl
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `log.Println()` to stderr | `log/slog` structured logging | Go 1.21 (Aug 2023) | Key-value structured logs, level filtering, pluggable handlers |
| `sync.Mutex` + flag for dedup | `singleflight.Group.Do()` | Available since Go 1.0 via x/sync | Cleaner API, handles panics, returns shared flag |
| `golang.org/x/oauth2` for all OAuth | Manual OAuth for simple flows | Always valid | Less boilerplate when token persistence is custom |
| `cobra` + `viper` for CLI | `os.Args` + `flag` for simple binaries | Always valid for < 3 subcommands | Zero dependency, appropriate for single-purpose tools |
| `mcp-go` pre-v0.40 API | mcp-go v0.46+ with typed parameter builders | Early 2026 | `mcp.WithString()`, `mcp.WithNumber()`, `RequireFloat()`, `GetInt()` convenience methods |

**Deprecated/outdated:**
- `metoro-io/mcp-golang`: Less mature alternative to `mark3labs/mcp-go`. Smaller community, different API patterns.
- `joho/godotenv`: Not deprecated, but explicitly excluded per user decision (no .env loading).
- `mcp-go` versions before v0.40: API changed significantly. Pin to v0.46.0+.

## Open Questions

1. **Exact latest mcp-go version**
   - What we know: v0.46.0 confirmed on pkg.go.dev as of research date. The page warns "not the latest version" suggesting newer exists.
   - What's unclear: Whether any version after v0.46.0 introduced breaking changes.
   - Recommendation: At implementation time, check `go list -m -versions github.com/mark3labs/mcp-go` and pin the latest stable version. Review changelog for any breaking changes.

2. **Token endpoint URL consistency**
   - What we know: Strava docs say `https://www.strava.com/api/v3/oauth/token`. Existing TS code uses `https://www.strava.com/oauth/token`. Both appear to work.
   - What's unclear: Whether one will be deprecated.
   - Recommendation: Use the documented `/api/v3/oauth/token` path.

3. **Token file format: include client credentials or not?**
   - What we know: CONTEXT.md says env vars for credentials. The existing TypeScript token store only has `access_token`, `refresh_token`, `expires_at`. The architecture research mentioned storing client_id/secret in the token file alongside tokens.
   - What's unclear: Whether the token file should also store client ID/secret for convenience.
   - Recommendation: Token file stores ONLY `access_token`, `refresh_token`, `expires_at` per the TS pattern and CONTEXT.md decision. Client credentials come from env vars only.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Go testing (stdlib) + net/http/httptest |
| Config file | None needed -- `go test ./...` works out of the box |
| Quick run command | `go test ./internal/... -count=1 -short` |
| Full suite command | `go test ./... -count=1 -race` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | `go build` produces binary, slog writes to stderr only | build + unit | `go build -o /dev/null . && go test ./internal/config/... -count=1` | No -- Wave 0 |
| INFRA-02 | Token store reads/writes atomically, handles missing dir, 0600 permissions | unit | `go test ./internal/auth/... -run TestTokenStore -count=1` | No -- Wave 0 |
| INFRA-03 | OAuth flow: callback server starts, exchanges code, persists tokens, times out | unit + integration | `go test ./internal/auth/... -run TestOAuth -count=1` | No -- Wave 0 |
| INFRA-04 | Client auto-refreshes expired tokens, singleflight coalesces, rate limits tracked | unit | `go test ./internal/strava/... -count=1 -race` | No -- Wave 0 |
| INFRA-05 | MCP server starts, responds to list tools (empty set), connects via stdio | integration | `go test ./internal/server/... -count=1` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `go test ./internal/... -count=1 -short`
- **Per wave merge:** `go test ./... -count=1 -race`
- **Phase gate:** Full suite green + `go build` produces binary + `go vet ./...` clean

### Wave 0 Gaps
- [ ] `go.mod` / `go.sum` -- module initialization (`go mod init strava-mcp`)
- [ ] `internal/auth/tokenstore_test.go` -- covers INFRA-02 (atomic write, read, expiry check, missing directory creation)
- [ ] `internal/auth/oauth_test.go` -- covers INFRA-03 (callback handler, code exchange with mock Strava, timeout)
- [ ] `internal/strava/client_test.go` -- covers INFRA-04 (auto-refresh via httptest, singleflight concurrency test with -race, rate limit header parsing)
- [ ] `internal/server/server_test.go` -- covers INFRA-05 (MCP server creation, tool listing returns empty set)
- [ ] `internal/config/config_test.go` -- covers INFRA-01 (env var loading, defaults, missing required vars)

## Sources

### Primary (HIGH confidence)
- pkg.go.dev/github.com/mark3labs/mcp-go/server -- Full API surface for MCPServer, ServeStdio, AddTool, ToolHandlerFunc, all ServerOption types
- pkg.go.dev/github.com/mark3labs/mcp-go/mcp -- NewTool, WithDescription, WithNumber, WithString, CallToolRequest methods, CallToolResult constructors
- pkg.go.dev/golang.org/x/sync/singleflight -- Do() method signature, v0.20.0 confirmed
- pkg.go.dev/log/slog -- NewTextHandler(os.Stderr, opts), SetDefault(), HandlerOptions with Level
- developers.strava.com/docs/authentication/ -- OAuth2 flow: authorize endpoint params, token exchange params/response, refresh params/response. No PKCE support.
- developers.strava.com/docs/rate-limits/ -- 200/15min overall, 100/15min read, 2000/day overall, 1000/day read. Headers: X-RateLimit-Limit, X-RateLimit-Usage, X-ReadRateLimit-Limit, X-ReadRateLimit-Usage. 429 status on exceed. Resets at :00/:15/:30/:45.
- pkg.go.dev/github.com/pkg/browser -- OpenURL(), Stdout/Stderr package variables that MUST be redirected

### Secondary (MEDIUM confidence)
- github.com/mark3labs/mcp-go/releases -- v0.46.0 latest confirmed release (March 26, 2025 date shown, likely 2026 per pkg.go.dev)
- Existing TypeScript codebase: `src/lib/strava-client.ts` -- Token refresh pattern with 5-min buffer and promise deduplication
- Existing TypeScript types: `src/config/types.ts` -- Token JSON shape: `{ access_token, refresh_token, expires_at }`

### Tertiary (LOW confidence)
- None -- all findings verified against official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries verified via pkg.go.dev with API signatures confirmed
- Architecture: HIGH -- Patterns derived from official mcp-go examples + verified TypeScript patterns to port
- Pitfalls: HIGH -- stdout corruption confirmed via SDK issues, token rotation confirmed via Strava docs, singleflight pattern well-established
- OAuth flow: HIGH -- Strava endpoint params/responses verified via official docs

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (30 days -- stable domain, but check mcp-go for version updates)

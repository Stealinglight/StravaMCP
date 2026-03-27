# Domain Pitfalls

**Domain:** Go MCP server wrapping Strava API (rewrite from TypeScript)
**Researched:** 2026-03-26
**Confidence:** HIGH (based on official SDK docs, GitHub issues, Strava API docs, and existing TypeScript codebase analysis)

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or broken functionality.

### Pitfall 1: stdout Corruption in Stdio MCP Transport

**What goes wrong:** Any `fmt.Println()`, `log.Println()`, or third-party library writing to `os.Stdout` corrupts the MCP JSON-RPC message stream. The MCP spec states servers "MUST NOT write anything to stdout that is not a valid MCP message." Unlike TypeScript where `console.log` goes to stdout and `console.error` goes to stderr (and the existing TS code already uses `console.error` throughout), Go's `log` package defaults to `os.Stderr` but `fmt.Print*` defaults to `os.Stdout`. One accidental `fmt.Println` in a debugging session or a dependency that prints to stdout will silently break the protocol.

**Why it happens:** Go's stdlib split between `fmt` (stdout) and `log` (stderr) is not intuitive. The official Go MCP SDK issue #572 confirms this is a known gap -- the SDK does not enforce the "MUST NOT" rule. Any imported library that writes to stdout (even transitively) will corrupt the stream.

**Consequences:** MCP client receives garbled JSON-RPC, tool calls fail silently or with cryptic parse errors. Extremely hard to debug because the corruption is intermittent (only when the offending print path executes).

**Warning signs:**
- MCP client reports "parse error" or "invalid JSON" intermittently
- Tools work in unit tests but fail when run via stdio
- Adding debug logging makes things worse

**Prevention:**
- Use `log.SetOutput(os.Stderr)` at program startup before anything else
- Replace `os.Stdout` with a guarded writer early in `main()` (redirect to stderr)
- Establish a project-wide rule: never import `fmt` for output in production code; use a structured logger (slog) configured to write to stderr
- Audit all dependencies for stdout writes
- Test with MCP Inspector tool against the stdio transport

**Phase:** Phase 1 (project scaffolding). Set up the stderr-only logging pattern before writing any tools.

**Confidence:** HIGH -- confirmed via official SDK issue #572 and MCP spec.

---

### Pitfall 2: Strava Refresh Token Rotation Loss

**What goes wrong:** Strava rotates refresh tokens on every token refresh call. The response contains a new `refresh_token` that invalidates the old one. If the new refresh token is not persisted to disk before the process exits (crash, SIGTERM, power loss), the old refresh token is already invalidated server-side. The user must re-authenticate from scratch via the browser OAuth flow.

**Why it happens:** The existing TypeScript code stores tokens in memory only (`this.refreshToken = response.data.refresh_token` in `strava-client.ts` line 122). The Go rewrite moves to file-based persistence, but the write-to-disk step introduces a new failure window. If the HTTP response succeeds but the file write fails (disk full, permissions, concurrent access), the token is lost.

**Consequences:** Complete authentication failure. User must repeat the OAuth browser flow, which for a CLI tool running via stdio is a significant UX disruption. In an automated pipeline, this means a hard stop.

**Warning signs:**
- "Invalid refresh token" errors after a period of working correctly
- Token file contains stale data after a crash
- Works fine for 6 hours (token lifetime), then breaks on first refresh

**Prevention:**
- Write-then-rename pattern: write new token data to a `.tmp` file, then atomically rename to the real path. This prevents partial writes.
- Persist the new tokens BEFORE using the new access token for the API call. The refresh endpoint returns both the new access token and new refresh token; save first, use second.
- Add a sync/fsync call after writing to ensure data reaches disk, not just OS buffer.
- Keep the previous token file as a `.backup` for manual recovery.
- Log token refresh events to stderr with timestamps for debugging.

**Phase:** Phase 2 (OAuth/token management). This is the single most important correctness requirement in the token store.

**Confidence:** HIGH -- Strava docs explicitly state "once a new refresh token code has been returned, the older code will no longer work."

---

### Pitfall 3: Concurrent Token Refresh Race Condition

**What goes wrong:** Multiple MCP tool calls arrive simultaneously (common when an LLM issues parallel tool calls). Each checks `isTokenExpired()`, all find it expired, all fire concurrent refresh requests to Strava. Strava returns different refresh tokens for each request, but only the last one is valid. The earlier responses contain now-invalidated refresh tokens that may overwrite the valid one in the file store.

**Why it happens:** The TypeScript version handles this with a `isRefreshing` flag and `refreshPromise` (lines 87-93 and 101-135 in `strava-client.ts`). In Go, the naive translation would use a mutex, but the pattern is subtly different because Go uses goroutines, not promises. A `sync.Mutex` prevents concurrent refresh calls but a `sync.Once` or `singleflight` pattern is needed to coalesce concurrent callers into a single refresh operation where all waiters get the same result.

**Consequences:** Token state corruption. The "winning" write to disk may contain an already-invalidated refresh token, leading to Pitfall #2 (permanent auth loss).

**Warning signs:**
- Intermittent auth failures under load or when multiple tools are called simultaneously
- Token file changes rapidly (multiple writes in quick succession)
- Works perfectly in sequential testing, fails in real MCP usage

**Prevention:**
- Use `golang.org/x/sync/singleflight` for the token refresh operation. This coalesces concurrent callers so only one refresh actually happens, and all others receive the same result.
- Protect the token state (access token, refresh token, expiry) with `sync.RWMutex` -- readers (API calls) take read lock, the refresh operation takes write lock.
- Alternatively, use a dedicated token manager goroutine that serializes all token operations through a channel.
- Never fire more than one refresh request concurrently to Strava.

**Phase:** Phase 2 (OAuth/token management). Implement alongside the token store.

**Confidence:** HIGH -- the TypeScript code already handles this (evidence it is a real problem), and Go's concurrency model makes it even more likely to surface.

---

### Pitfall 4: Go MCP SDK Breaking Changes and API Instability

**What goes wrong:** The official Go MCP SDK (`github.com/modelcontextprotocol/go-sdk`) is at v1.4.1 as of March 2026 but is actively evolving. The `rough_edges.md` document lists multiple API problems slated for v2 (naming inconsistencies, wrong receiver types, confusing default capabilities). The `MCPGODEBUG` mechanism introduces behavioral changes between minor versions (JSON escaping changed in v1.4.0, security protections added in v1.4.1). The alternative `mark3labs/mcp-go` is also pre-stable with its own history of race conditions and breaking changes.

**Why it happens:** MCP itself is a moving target (spec versions: 2024-11-05, 2025-03-26, 2025-06-18, 2025-11-25). The Go SDKs are tracking a moving spec while also discovering their own API design mistakes.

**Consequences:** A go.sum lock today may require code changes in 3-6 months when updating dependencies. API patterns used in examples may be deprecated. Middleware or hook APIs may change shape.

**Warning signs:**
- Compile errors after `go get -u`
- Deprecation warnings in new SDK versions
- Behavior changes without code changes (MCPGODEBUG defaults shifting)

**Prevention:**
- Pin to a specific SDK version in `go.mod` (e.g., `v1.4.1`) and do not auto-update.
- Use the official SDK (`modelcontextprotocol/go-sdk`), not `mark3labs/mcp-go`. The official SDK has more contributors (92), is maintained collaboratively with Google, and has explicit backwards compatibility policy via MCPGODEBUG.
- Wrap SDK types in your own interfaces where practical (especially `Tool`, `CallToolResult`, and transport setup) so SDK changes are localized.
- Write integration tests that verify MCP protocol behavior (tool listing, tool calling, error responses) so SDK updates can be validated quickly.
- Read the MCPGODEBUG docs before any version bump.

**Phase:** Phase 1 (project scaffolding). Lock the dependency version on day one. Create thin wrapper types.

**Confidence:** HIGH -- documented in the SDK's own `rough_edges.md` and `mcpgodebug.md`.

---

### Pitfall 5: JSON Type Mismatch Between Strava API and Go Structs

**What goes wrong:** Strava's API returns dynamic JSON structures. Activity IDs are large integers (e.g., `12345678901`) that exceed JavaScript's safe integer range but fit in Go's `int64`. Some fields are polymorphic: `latlng` stream data contains arrays of `[float, float]` pairs, not objects. Fields like `gear` can be `null` or an object. The `splits_metric` field is typed as `any[]` in the TypeScript code (line 52 of types.ts). Go's `encoding/json` is strict about types: a `null` JSON value into a non-pointer struct field silently zeroes it, and an unexpected type causes a hard unmarshal error.

**Why it happens:** TypeScript's `any` type absorbs all these variations silently. Go requires explicit type decisions. The Strava API documentation is not always precise about which fields can be null vs absent vs zero-valued.

**Consequences:** Panics or silent data loss when unmarshaling Strava responses. A field that is occasionally null in production (but never null in test data) causes a runtime crash months later.

**Warning signs:**
- `json: cannot unmarshal null into Go struct field`
- Missing data in tool responses that was present in the TypeScript version
- Panics on specific activities but not others

**Prevention:**
- Make ALL optional Strava response fields pointers in Go structs (`*string`, `*float64`, `*int64`). This correctly represents null vs absent vs zero.
- Use `json.RawMessage` for truly polymorphic fields (like stream data arrays) and unmarshal in a second pass.
- For the `latlng` stream type specifically, define a custom type: `type LatLng [2]float64` with a custom `UnmarshalJSON`.
- Write a comprehensive test suite using real Strava API response samples (captured from the working TypeScript version) to validate Go struct unmarshaling.
- Use `json:",omitempty"` on request structs to avoid sending zero values as updates.

**Phase:** Phase 3 (Strava client implementation). Build the struct definitions with real API response data, not just documentation.

**Confidence:** HIGH -- directly observed from the TypeScript types.ts file which uses `any[]`, `any`, and optional fields extensively.

---

## Moderate Pitfalls

### Pitfall 6: File Upload Multipart Form Encoding

**What goes wrong:** The existing TypeScript upload tool (`uploads.ts` line 48) has a comment admitting it is "a simplified version - full implementation would need proper file handling." The Strava upload endpoint requires `multipart/form-data` with the file as a binary part, not a JSON body. In Go, constructing multipart requests requires `mime/multipart` writer, proper boundary handling, and streaming the file content without loading it entirely into memory.

**Why it happens:** MCP tool arguments arrive as JSON (base64-encoded file content in this case). The Go code must decode the base64, create a multipart form body, attach the file with the correct MIME type and filename, and POST it. This is verbose in Go compared to TypeScript's `FormData`.

**Warning signs:**
- Upload endpoint returns 400 or 422 errors
- "File is not a valid FIT/TCX/GPX" errors despite valid files
- Upload works for small files but fails for large ones (memory)

**Prevention:**
- Use `mime/multipart.NewWriter` with an `io.Pipe` to stream the multipart body without buffering the entire file in memory.
- Set the `Content-Type` header to `multipart/form-data; boundary=...` using the writer's `FormDataContentType()` method.
- Decode base64 input incrementally using `base64.NewDecoder` piped into the multipart writer.
- Test with actual FIT/TCX/GPX files captured from real Garmin/Apple Watch exports.

**Phase:** Phase 4 (tool implementation, uploads specifically). Can be deferred since uploads are a less common operation.

**Confidence:** MEDIUM -- the TypeScript version admits this is incomplete, so the Go version must do it properly.

---

### Pitfall 7: MCP Tool Schema Generation Gaps

**What goes wrong:** The Go MCP SDK generates JSON schemas from Go struct tags (`jsonschema:"description"`). However, there are known issues: empty properties get stripped (#747), nested structs don't always flatten correctly (#437), and `time.Time` fields have type mapping problems. The TypeScript version defines schemas manually as literal objects (see `activities.ts` lines 171-424), giving full control over descriptions, required fields, and enum values. The Go SDK's automatic schema inference may produce schemas that MCP clients interpret differently.

**Why it happens:** JSON Schema generation from Go types is inherently lossy. Go has no native equivalent to TypeScript's literal types, union types, or inline documentation. The `jsonschema` struct tag is limited compared to hand-crafted schemas.

**Warning signs:**
- MCP client shows tools with missing parameter descriptions
- Enum values not appearing in tool parameter documentation
- Required fields not marked as required in the generated schema
- Claude/LLM passes wrong types because schema lacks constraints

**Prevention:**
- Use the manual schema definition approach (demonstrated in the SDK's `toolschemas` example) for tools with complex parameters, especially those with enums (like `data_type` in uploads or `sport_type` in activities).
- For simpler tools, use the automatic `AddTool` generic approach but verify the generated schema matches the TypeScript version's schema.
- Write a test that calls `tools/list` on the server and validates each tool's schema against the expected shape.
- Pay special attention to the stream types enum (`keys` parameter in `get_activity_streams`) -- this is an array of enum values, which is particularly tricky for schema generators.

**Phase:** Phase 3-4 (tool implementation). Verify schemas as each tool is implemented.

**Confidence:** HIGH -- multiple open issues in the Go SDK confirm schema generation problems.

---

### Pitfall 8: Rate Limit Handling Across Tool Calls

**What goes wrong:** Strava enforces 200 requests per 15 minutes and 2,000 per day (read endpoints: 100/15min, 1,000/day). An LLM can rapidly exhaust these limits by chaining tool calls: "get my activities" -> "get details for each" -> "get streams for each" -> "get zones for each." A single conversational turn could generate 100+ API calls. The MCP server must track and enforce rate limits proactively rather than just handling 429 responses reactively.

**Why it happens:** The TypeScript version has no rate limiting (it relies on catching 429 errors). This works for single-user interactive use but fails when LLMs batch operations. The Go rewrite should do better since it is being built from scratch.

**Consequences:** 429 errors cascade, the 15-minute window forces a hard wait, and the daily limit can be permanently exhausted by a single aggressive LLM session. Strava may also throttle or ban the application if abuse is detected.

**Warning signs:**
- `X-RateLimit-Usage` header values approaching limits
- 429 responses, especially early in a session
- Daily limit hit before end of day

**Prevention:**
- Parse `X-RateLimit-Limit` and `X-RateLimit-Usage` headers from every Strava API response.
- Implement a token bucket or sliding window rate limiter in the Strava HTTP client.
- When approaching limits (e.g., 80% of 15-minute quota), return informative MCP error responses telling the LLM to slow down or batch differently, rather than silently blocking.
- Consider adding a tool like `get_rate_limit_status` so the LLM can check before issuing bulk requests.
- The 15-minute window resets at :00, :15, :30, :45 -- calculate exact reset time and include it in rate limit error messages.
- For 429 responses, parse the `Retry-After` header and respect it.

**Phase:** Phase 3 (Strava client implementation). Build into the HTTP client layer, not as an afterthought.

**Confidence:** HIGH -- Strava's rate limit documentation is explicit, and the project requirements acknowledge this risk.

---

### Pitfall 9: OAuth Browser Flow for a Stdio Binary

**What goes wrong:** The initial OAuth authorization requires opening a browser, having the user log in to Strava, approve the app, and redirect back to a local callback URL. But this is a stdio binary -- it has no HTTP server running. The Go binary needs to temporarily start an HTTP server on localhost to receive the OAuth callback, which introduces port conflicts, firewall issues, and a complex lifecycle (start server -> open browser -> wait for callback -> exchange code -> stop server).

**Why it happens:** The TypeScript version delegates this to a full Express server (`oauth/server.ts`) with DynamoDB-backed token storage. The Go rewrite drops all that infrastructure but still needs the initial token acquisition somehow.

**Warning signs:**
- "Connection refused" when Strava redirects to localhost
- Port already in use (another dev tool on the same port)
- OAuth flow works in development but fails in production (different redirect URI registered)
- Token exchange times out because user was slow to approve

**Prevention:**
- Use a high, uncommon port (e.g., `localhost:19876`) and make it configurable via env var.
- Register the exact redirect URI in the Strava API application settings.
- Implement the OAuth flow as a separate `setup` or `auth` subcommand (`strava-mcp auth`), not as part of the stdio server startup. This cleanly separates the one-time setup from ongoing operation.
- Set a generous timeout (5 minutes) for the callback, with a clear terminal message: "Open this URL in your browser: https://www.strava.com/oauth/authorize?..."
- Use `xdg-open` / `open` (macOS) to automatically open the browser.
- After receiving the callback, immediately persist tokens and shut down the temporary server.

**Phase:** Phase 2 (OAuth/token management). Build the auth subcommand before the main MCP server.

**Confidence:** HIGH -- this is a well-known pattern for CLI OAuth tools, and the project requirements explicitly call for it.

---

### Pitfall 10: Losing Feature Parity During Rewrite

**What goes wrong:** The TypeScript codebase has 11 working tools with carefully crafted MCP descriptions (some are 50+ lines with coaching workflows, usage examples, and parameter documentation). These descriptions are critical for LLM tool selection and usage. A Go rewrite that focuses on "making it work" may ship tools with minimal descriptions, breaking the user experience that depends on the LLM understanding when and how to use each tool.

**Why it happens:** Rewrite energy goes to making the Go code compile and the API calls work. Copy-pasting long string literals from TypeScript to Go is tedious and feels unproductive. But these descriptions ARE the product for an MCP server -- they are the UI.

**Consequences:** LLM uses tools incorrectly, misses the enrichment workflow, does not understand parameter constraints, or picks the wrong tool for the job.

**Warning signs:**
- Tool descriptions in Go are shorter than TypeScript originals
- LLM no longer follows the enrichment workflow pattern
- Users report the Go version "doesn't work as well" despite identical API coverage

**Prevention:**
- Create a `descriptions/` directory or a `descriptions.go` file with all tool descriptions as named constants, copied verbatim from the TypeScript version.
- Write a comparison test that loads both the TypeScript and Go tool lists and verifies description parity (at minimum, verify character count is within 10%).
- Treat tool descriptions as a first-class artifact in code review.
- Consider using Go `embed` to load descriptions from markdown files, making them easier to edit and review.

**Phase:** Phase 4 (tool implementation). Every tool must be implemented with its full description.

**Confidence:** HIGH -- directly observable from the existing TypeScript codebase where descriptions are the primary user-facing feature.

---

## Minor Pitfalls

### Pitfall 11: Go Error Handling Verbosity

**What goes wrong:** The TypeScript version uses `withErrorHandling` wrapper and Axios interceptors for clean error handling. Go's `if err != nil` pattern means every Strava API call, every JSON unmarshal, every file operation needs explicit error handling. Without discipline, error messages become generic ("request failed") or are silently discarded.

**Prevention:**
- Create a `stravaError` type that wraps HTTP status, Strava error body, and context (which tool, which endpoint).
- Map Strava HTTP errors to user-friendly MCP error messages in a single function (equivalent to `formatError` in the TypeScript version).
- Return `isError: true` in MCP `CallToolResult` for Strava API errors; never panic.
- Use `fmt.Errorf("tool %s: %w", toolName, err)` to add context while preserving the error chain.

**Phase:** Phase 3 (Strava client). Establish error patterns early.

---

### Pitfall 12: Missing `omitempty` on Update Request Bodies

**What goes wrong:** When updating an activity, the Go struct for the request body includes all fields. Without `json:",omitempty"`, zero-valued fields (empty string for `description`, `false` for `trainer`, `0` for numeric fields) will be sent to Strava, potentially overwriting existing data with empty/zero values. The TypeScript version avoids this because `undefined` properties are automatically excluded from JSON serialization.

**Prevention:**
- Use pointer fields (`*string`, `*bool`) for all optional update parameters.
- Tag ALL optional request fields with `json:",omitempty"`.
- Test by updating a single field and verifying other fields are not cleared.

**Phase:** Phase 4 (tool implementation).

---

### Pitfall 13: Strava Activity ID Precision

**What goes wrong:** Strava activity IDs are large integers (e.g., `13029457210`). In the TypeScript version, these are `number` type which loses precision above 2^53. Go's `int64` handles them correctly, but JSON unmarshaling into `int` (not `int64`) on 32-bit systems would truncate them. Additionally, when the MCP client sends tool arguments, the JSON number may arrive as a float64 in Go's `json.Unmarshal` default behavior.

**Prevention:**
- Always use `int64` for Strava IDs, never `int`.
- In tool input structs, use `int64` with the `json:"id"` tag.
- The Go MCP SDK's `AddTool` generic function handles this via struct tags, but verify with IDs above 2^32.

**Phase:** Phase 3 (struct definitions).

---

### Pitfall 14: Context Cancellation Propagation

**What goes wrong:** MCP clients can cancel tool calls (user navigates away, timeout). The Go MCP SDK passes a `context.Context` to tool handlers. If the Strava HTTP call does not respect this context (i.e., uses `http.DefaultClient` instead of passing the context), cancelled requests will continue consuming rate limit quota and potentially completing unwanted mutations (like creating or updating activities).

**Prevention:**
- Always pass the tool handler's `context.Context` to the `http.Request` via `http.NewRequestWithContext`.
- Use `oauth2.NewClient(ctx, tokenSource)` which automatically propagates context.
- Test cancellation by adding a short context timeout and verifying the Strava HTTP call is aborted.

**Phase:** Phase 3 (Strava HTTP client setup).

---

### Pitfall 15: Testing Without Strava API Access

**What goes wrong:** Integration tests against the real Strava API are rate-limited, require valid tokens, and depend on specific test data existing. Unit tests with mocked HTTP responses are fragile if the mock responses don't match real Strava behavior (missing fields, different field types, null values).

**Prevention:**
- Capture real Strava API responses from the working TypeScript version (use a proxy or add response logging temporarily).
- Store these as golden files in `testdata/`.
- Build the Strava HTTP client behind an interface so it can be replaced with a test double.
- Use `httptest.NewServer` for integration-style tests with recorded responses.
- Run real API tests sparingly via a build tag (`go test -tags=integration`).

**Phase:** Phase 3 (Strava client). Set up the test infrastructure before implementing tools.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Project scaffolding | stdout corruption (#1), SDK pinning (#4) | Set up stderr logging and lock go.mod immediately |
| Phase 2: OAuth & token store | Token rotation loss (#2), race condition (#3), browser flow (#9) | Atomic file writes, singleflight pattern, separate auth subcommand |
| Phase 3: Strava HTTP client | JSON type mismatches (#5), rate limits (#8), error handling (#11), context propagation (#14) | Pointer fields, rate limiter in client, structured errors, context everywhere |
| Phase 4: MCP tool implementation | Schema generation gaps (#7), feature parity loss (#10), omitempty (#12), uploads (#6) | Manual schemas for complex tools, description parity tests, pointer fields for updates |
| Phase 5: Polish & README | Losing differentiating descriptions in README | Treat README as a first-class deliverable, not an afterthought |

## Sources

- Go MCP SDK rough_edges.md: https://github.com/modelcontextprotocol/go-sdk/blob/main/docs/rough_edges.md
- Go MCP SDK mcpgodebug.md: https://github.com/modelcontextprotocol/go-sdk/blob/main/docs/mcpgodebug.md
- Go MCP SDK troubleshooting.md: https://github.com/modelcontextprotocol/go-sdk/blob/main/docs/troubleshooting.md
- Go MCP SDK issue #572 (stdout enforcement): https://github.com/modelcontextprotocol/go-sdk/issues/572
- Go MCP SDK issue #747 (empty schema properties): https://github.com/modelcontextprotocol/go-sdk/issues/747
- Go MCP SDK issue #437 (nested struct schemas): https://github.com/modelcontextprotocol/go-sdk/issues/437
- Go MCP SDK issue #855 (race condition in Close): https://github.com/modelcontextprotocol/go-sdk/issues/855
- mcp-go stdio issues: #722, #721 (race conditions), #711 (goroutine leak), #588 (buffer overflow), #462 (long output panic)
- Strava OAuth docs: https://developers.strava.com/docs/authentication/
- Strava rate limits: https://developers.strava.com/docs/rate-limits
- golang.org/x/oauth2 v0.36.0: https://pkg.go.dev/golang.org/x/oauth2
- Existing TypeScript codebase analysis: `src/lib/strava-client.ts`, `src/tools/*.ts`, `src/config/types.ts`

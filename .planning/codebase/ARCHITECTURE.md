# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Layered MCP Server with pluggable tools and OAuth middleware

**Key Characteristics:**
- Tool-based request handler pattern with centralized tool registry
- Pluggable transport layer supporting both SSE and JSON-RPC
- OAuth 2.1 with PKCE support for both server credentials and client authentication
- Generic Strava API client with automatic token refresh and retry logic
- Zod schema validation for all tool parameters
- Error handling wrapper pattern for consistent error formatting
- DynamoDB-backed OAuth state storage (clients, codes, tokens)
- Dual deployment model: local Express server and AWS Lambda web adapter

## Layers

**Transport Layer:**
- Purpose: Handle client connections and protocol translation
- Location: `src/app.ts`, `src/lambda-web.ts`, `src/index.ts`
- Contains: Express app setup, SSE transport handling, JSON-RPC endpoints, session management
- Depends on: MCP SDK (Server, SSEServerTransport)
- Used by: Tool execution layer (passes requests down)

**Tool Execution Layer:**
- Purpose: Route tool calls to appropriate handlers and return results
- Location: `src/app.ts` (lines 110-179, runTool/runToolSafe functions)
- Contains: Tool registry, tool routing switch statement, parameter validation, response formatting
- Depends on: Tool implementations, StravaClient
- Used by: Transport layer, triggers execution layer

**Tool Implementation Layer:**
- Purpose: Implement specific Strava API operations with business logic
- Location: `src/tools/*.ts` (activities.ts, athlete.ts, streams.ts, clubs.ts, uploads.ts, openai.ts)
- Contains: Tool definitions (MCP schema), handler functions, parameter schemas
- Depends on: StravaClient, config types, error handling wrapper
- Used by: Tool execution layer

**API Client Layer:**
- Purpose: Manage Strava API communication with automatic OAuth token refresh
- Location: `src/lib/strava-client.ts`
- Contains: StravaClient class, Axios interceptors for auth and retry, token refresh logic
- Depends on: Axios HTTP client, OAuth token types
- Used by: All tool implementations

**Configuration & State Management:**
- Purpose: Load/validate environment, manage OAuth credentials
- Location: `src/config/env.ts`, `src/config/types.ts`, `src/config/secrets.ts`, `src/oauth/store.ts`, `src/oauth/server.ts`
- Contains: Zod schemas for env validation, type definitions, AWS Secrets Manager integration, DynamoDB client store
- Depends on: dotenv, zod, AWS SDK, DynamoDB Document Client
- Used by: App initialization, OAuth flows, StravaClient

**OAuth Layer:**
- Purpose: Handle OAuth 2.1 authorization code flow with PKCE for dynamic client registration
- Location: `src/oauth/server.ts`, `src/oauth/store.ts`, `src/oauth/utils.ts`
- Contains: Authorization/token endpoints, client registration, PKCE validation, state persistence
- Depends on: Express, DynamoDB store, crypto utilities
- Used by: Express app (registered routes)

**Error Handling & Utilities:**
- Purpose: Consistent error formatting and utility functions
- Location: `src/utils/errors.ts`, `src/utils/formatters.ts`
- Contains: formatError (Axios error to readable message), withErrorHandling wrapper
- Depends on: Axios error types
- Used by: All tool implementations via withErrorHandling wrapper

## Data Flow

**SSE Connection Flow:**

1. Client initiates GET `/sse` → Express handler
2. SSEServerTransport created with sessionId → stored in transports map
3. MCPServer connects with transport → awaits incoming messages
4. Client sends MCP messages POST `/message?sessionId=X`
5. Handler looks up transport, delegates to `transport.handlePostMessage()`
6. Response flows back through SSE connection

**JSON-RPC POST Flow:**

1. Client sends POST `/mcp` with JSON-RPC payload
2. Express parses `method`, `params`, `id` from body
3. Routes to handler: tools/list, tools/call, or initialize
4. For tools/call: extracts tool name and arguments
5. runToolSafe validates params with Zod schema
6. Tool function executes with StravaClient
7. Response serialized as JSON-RPC result with original id

**Tool Execution Flow:**

1. Client calls tool with parameters (e.g., get_activities)
2. Parameters validated against schema (e.g., GetActivitiesSchema.parse)
3. withErrorHandling wrapper executes tool function
4. Tool calls StravaClient.get/post/put/delete with endpoint + params
5. Request interceptor ensures token is fresh (ensureValidToken)
6. If 401, response interceptor triggers refreshAccessToken
7. StravaClient.refreshAccessToken: POST to Strava OAuth endpoint with refresh_token
8. New access_token stored, request retried
9. Response returned to client

**OAuth 2.1 Authorization Flow (Client Registration):**

1. Client POST `/register` with `client_name`, `redirect_uris`, optional `registration_token`
2. Validates registration token if enabled
3. Generates random client_id, stores OAuthClient in DynamoDB
4. Returns client_id and client secret
5. Client uses client_id in subsequent authorization requests

**OAuth Token Exchange Flow:**

1. Client redirects user to GET `/authorize?client_id=X&response_type=code&...`
2. Server validates client_id, generates code_challenge, shows consent form
3. User approves → POST `/authorize` with code_challenge
4. OAuthAuthCode stored in DynamoDB with TTL
5. Client exchanges code at POST `/token` with code_verifier (PKCE)
6. Server validates code, code_challenge, issues access/refresh tokens
7. OAuthTokenRecord stored with TTL in tokens table

**State Management:**

- Access Token: In-memory in StravaClient instance (refreshed automatically)
- Refresh Token: Configured via env, passed to StravaClient at initialization
- OAuth Client State: DynamoDB strava-mcp-oauth-clients table (created_at, last_used_at)
- Auth Codes: DynamoDB strava-mcp-oauth-codes table (TTL-enabled, auto-deleted after 10 minutes)
- OAuth Tokens: DynamoDB strava-mcp-oauth-tokens table (TTL-enabled, auto-deleted after 30 days)
- Session State: In-memory transports map (SSE session IDs → SSEServerTransport instances)

## Key Abstractions

**StravaClient:**
- Purpose: Unified HTTP interface to Strava API v3 with automatic token lifecycle management
- Examples: `src/lib/strava-client.ts`
- Pattern: Class with public methods get/post/put/delete, private token refresh with debouncing via isRefreshing/refreshPromise flags

**MCP Tool Definition:**
- Purpose: Declarative tool schema and handler function
- Examples: activitiesTools, athleteTools arrays in tool files
- Pattern: Object with name, description, inputSchema; paired with handler function accepting client + params

**Tool Schema Wrapper:**
- Purpose: Validate parameters and standardize error handling
- Examples: GetActivitiesSchema (z.object), withErrorHandling wrapper
- Pattern: Zod schema defines parameters, withErrorHandling HOF catches exceptions and formats

**OAuth DynamoDB Store:**
- Purpose: Persist OAuth clients, codes, tokens with automatic expiration
- Examples: `src/oauth/store.ts` functions (putClient, consumeAuthCode, getTokenByAccess)
- Pattern: DynamoDB Document Client functions for CRUD operations, TTL for codes/tokens

## Entry Points

**Local CLI:**
- Location: `src/index.ts`
- Triggers: `bun dist/index.js` or `npm start`
- Responsibilities: Load config, create Express app, listen on PORT (default 3000), log endpoints

**Lambda Web Adapter:**
- Location: `src/lambda-web.ts`
- Triggers: AWS Lambda invocation with AWS Lambda Web Adapter layer
- Responsibilities: Load config, create Express app, listen on AWS_LWA_PORT (8080), enables streaming responses

**Application Factory:**
- Location: `src/app.ts` (createApp function)
- Triggers: Called from index.ts or lambda-web.ts with runtime: 'local' | 'lambda'
- Responsibilities: Initialize config, StravaClient, Express app, register all routes, return {app, config}

## Error Handling

**Strategy:** Centralized formatting with specific HTTP status codes

**Patterns:**
- Axios AxiosError → formatError() → readable message (maps 401→auth failed, 403→forbidden, 404→not found, 429→rate limited)
- All tool functions wrapped with withErrorHandling() → catches error → throws new Error with formatted message
- MCP endpoints catch errors → return isError: true response with error text
- JSON-RPC endpoints catch errors → return 500 with error code -32603, message "Internal server error"
- Unauthenticated requests → 401 with "Missing or invalid access token"
- OAuth requests → specific error_description in OAuth error response

## Cross-Cutting Concerns

**Logging:** console.error() to stderr for server lifecycle events (startup, connections, tool calls, errors)
- Example: `[StravaServer] MCP request received: tools/list`
- Example: `[StravaClient] Token refreshed successfully`

**Validation:** Zod schemas for all external inputs
- Environment variables validated at startup via `src/config/env.ts` getConfig()
- Tool parameters validated per-tool via schema.parse() before execution
- OAuth requests validated for required fields and allowed redirect URIs

**Authentication:** Multiple strategies supported
- Bearer token (Bearer: AUTH_TOKEN env var) - static, application-level
- OAuth access tokens (via Authorization header or query param) - dynamic, per-client
- Public paths bypass auth (health, debug, oauth endpoints, healthcheck)
- Session-based SSE connections identified by sessionId query param

**Token Lifecycle:** Automatic refresh with debouncing
- ensureValidToken() checks expiration, refreshes 5 minutes early (bufferTime)
- Concurrent refresh requests wait for same promise (isRefreshing flag)
- 401 response triggers manual refresh + retry of original request
- Tokens stored in-memory only, no persistence in local mode

## Architecture Decisions

**Why layered with pluggable tools:**
- Each tool is self-contained with its own schema and handler
- New tools added without modifying routing logic (add to tool array in createApp)
- Easy to test individual tool behaviors

**Why DynamoDB for OAuth state:**
- TTL support for automatic code/token cleanup (no manual garbage collection)
- AWS Lambda context means no local filesystem persistence
- CloudFormation-defined infrastructure as code (template.yaml)

**Why Zod for validation:**
- TypeScript integration with type inference (z.infer<typeof schema>)
- Declarative .describe() for tool parameter documentation
- Automatic error messages for validation failures

**Why token refresh with 5-minute buffer:**
- Prevents edge cases where token expires mid-request
- Strava tokens typically valid 6+ hours, so refresh overhead minimal
- Debouncing prevents thundering herd of concurrent refresh requests

**Why SSE + JSON-RPC dual transport:**
- SSE: Native streaming for Claude MCP connections, used by web client
- JSON-RPC: Standard for programmatic/curl access, used by integrations

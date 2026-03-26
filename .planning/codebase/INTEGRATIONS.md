# External Integrations

**Analysis Date:** 2026-03-26

## APIs & External Services

**Strava API v3:**
- REST API at `https://www.strava.com/api/v3`
- OAuth 2.0 token endpoint at `https://www.strava.com/oauth/token`
- What it's used for: Fitness activity data, athlete profiles, streams, clubs, segments
  - SDK/Client: Custom `StravaClient` class in `src/lib/strava-client.ts`
  - Auth: OAuth 2.0 Bearer token (refreshed automatically)
  - Credentials:
    - `STRAVA_CLIENT_ID` env var
    - `STRAVA_CLIENT_SECRET` env var
    - `STRAVA_REFRESH_TOKEN` env var

**Claude API (MCP Consumer):**
- Connects via SSE endpoint: `GET /sse`
- MCP message endpoint: `POST /message?sessionId={sessionId}`
- JSON-RPC MCP protocol endpoints:
  - `POST /mcp` - Direct JSON-RPC calls to tools/list and tools/call
  - Fallback endpoints for compatibility
- Default allowed redirect URIs:
  - `https://claude.ai/api/mcp/auth_callback`
  - `https://claude.com/api/mcp/auth_callback`

**ChatGPT/OpenAI (Optional):**
- OAuth redirect URI: `https://chatgpt.com/connector_platform_oauth_redirect`
- Configurable via `OAUTH_ALLOWED_REDIRECT_URIS` environment variable

## Data Storage

**Databases:**
- AWS DynamoDB (when OAuth is enabled)
  - Connection: AWS SDK credentials (implicit from Lambda execution role)
  - Client: `@aws-sdk/lib-dynamodb` with Document client
  - Tables:
    - `strava-mcp-oauth-clients` - Stores registered OAuth clients
      - Primary key: `client_id` (String)
      - Attributes: `client_name`, `redirect_uris`, `created_at`, `last_used_at`
    - `strava-mcp-oauth-codes` - Authorization codes (short-lived, auto-expiring)
      - Primary key: `code` (String)
      - TTL: `expires_at` attribute
      - Attributes: `client_id`, `redirect_uri`, `code_challenge`, `code_challenge_method`, `scopes`
    - `strava-mcp-oauth-tokens` - Access and refresh tokens
      - Primary key: `access_token` (String)
      - Global Secondary Index: `refresh_token_index` on `refresh_token`
      - TTL: `expires_at` attribute
      - Attributes: `refresh_token`, `client_id`, `scopes`, `access_expires_at`, `refresh_expires_at`
  - Billing: PAY_PER_REQUEST (no provisioned capacity)

**File Storage:**
- Not used - stateless HTTP server

**Caching:**
- None (DynamoDB provides persistence for OAuth state)
- Secrets caching: Single-instance in-memory caching of AWS Secrets Manager retrieval in `src/config/secrets.ts`

## Authentication & Identity

**Auth Provider:**
- Strava OAuth 2.0 (for Strava API access)
  - Implementation: Token refresh pattern with Axios interceptors
  - File: `src/lib/strava-client.ts`
  - Automatic token refresh 5 minutes before expiry
  - Thread-safe refresh with Promise queue to prevent concurrent refresh attempts

**MCP Authentication:**
- Bearer token authentication (simple shared secret)
  - Config variable: `AUTH_TOKEN`
  - Minimum 32 characters
  - Passed via `Authorization: Bearer {token}` header or `?token={token}` query param
- OAuth 2.1 (when enabled for Claude/ChatGPT)
  - PKCE support (S256 code challenge)
  - Dynamic client registration endpoint: `POST /register`
  - Authorization endpoint: `GET /authorize`
  - Token endpoint: `POST /token`
  - Files: `src/oauth/server.ts`, `src/oauth/store.ts`, `src/oauth/utils.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected - errors logged to stderr

**Logs:**
- Console logging to stderr
- Request logging: Tool calls, SSE connections, token operations
- Error logging: Detailed error messages with context
- Files: Errors wrapped by `src/utils/errors.js`, logging in `src/lib/strava-client.ts`

## CI/CD & Deployment

**Hosting:**
- AWS Lambda
- Function name: `strava-mcp-server`
- Public Function URL (HTTP endpoint)
- RESPONSE_STREAM invocation mode for SSE support

**CI Pipeline:**
- GitHub Actions workflow (present in `.github/` directory)
- Release workflow for automated deployments

**Deployment:**
- AWS SAM (Serverless Application Model)
- Configuration: `template.yaml` and `samconfig.toml`
- Deploy commands:
  - `bun run deploy` - Full deployment with TypeScript build
  - `bun run deploy:fast` - Faster deployment (SAM build only)
  - `bun run build:lambda` - Build Lambda artifacts

## Environment Configuration

**Required env vars:**
- `STRAVA_CLIENT_ID` - Strava API client ID
- `STRAVA_CLIENT_SECRET` - Strava API client secret (sensitive)
- `STRAVA_REFRESH_TOKEN` - OAuth refresh token for Strava (sensitive)
- `AUTH_TOKEN` - Bearer token for MCP requests (optional, but recommended for security)

**Optional env vars:**
- `SECRETS_MANAGER_ARN` - AWS Secrets Manager ARN containing Strava credentials as JSON
- `OAUTH_ENABLED` - Enable OAuth endpoints (default: `false`)
- `PORT` - HTTP server port (default: `3000`)
- `OAUTH_*` - OAuth configuration variables (when enabled)

**Secrets location:**
- Primary: Environment variables (`.env` file locally, Lambda environment via SAM template)
- Secondary: AWS Secrets Manager (optional, loaded on startup via `src/config/secrets.ts`)
- JSON payload format for Secrets Manager:
  ```json
  {
    "STRAVA_CLIENT_ID": "...",
    "STRAVA_CLIENT_SECRET": "...",
    "STRAVA_REFRESH_TOKEN": "...",
    "AUTH_TOKEN": "..."
  }
  ```

## Webhooks & Callbacks

**Incoming:**
- OAuth authorization callback: `POST /authorize` (user-facing form submission)
- OAuth token exchange: `POST /token` (from OAuth clients)
- OAuth client registration: `POST /register` (dynamic registration)
- Health check: `GET /health`
- Debug info: `GET /debug`
- OAuth metadata: `GET /.well-known/oauth-authorization-server` (OAuth discovery)

**Outgoing:**
- OAuth redirects: Redirect URI specified by client during authorization flow
- Strava API calls: HTTP requests to `https://www.strava.com/api/v3/*`

## Rate Limiting

**Strava API:**
- Rate limits enforced by Strava API (600 requests per 15 minutes for authenticated user)
- No client-side rate limiting implemented
- Token refresh happens automatically on 401 responses

**OAuth:**
- No rate limiting on registration or token endpoints

## Key Integration Points

**Tool Execution:**
- Each tool in `src/tools/` imports and uses `StravaClient` instance
- Tools available:
  - `get_activities` - Retrieve athlete activities
  - `get_activity_by_id` - Get detailed activity info
  - `create_activity` - Log manual activity
  - `update_activity` - Update activity metadata
  - `get_activity_zones` - Get training zones for activity
  - `get_athlete` - Get current athlete profile
  - `get_athlete_stats` - Get athlete statistics and totals
  - `get_activity_streams` - Get telemetry data (time, location, HR, power, etc.)
  - `get_club_activities` - List club member activities
  - `create_upload` - Upload GPX/TCX/FIT files
  - `get_upload` - Check upload processing status
  - `search` - OpenAI-compatible activity search
  - `fetch` - OpenAI-compatible activity fetch

**Request Flow:**
1. MCP client connects via SSE or JSON-RPC to Express server
2. Tool request arrives with parameters
3. Parameters validated with Zod schema
4. StravaClient makes HTTP request to Strava API
5. Automatic token refresh if needed (via Axios interceptor)
6. Response formatted and returned to client

---

*Integration audit: 2026-03-26*

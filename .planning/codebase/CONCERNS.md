# Concerns

> Technical debt, known issues, security, performance, and fragile areas

## Technical Debt

### Weak Type Safety in Tool Dispatch
- `src/app.ts` tool dispatch uses string-based matching with loosely typed parameters
- Tool handler functions accept broad parameter types rather than strict per-tool schemas
- **Impact:** Runtime type errors possible when tool inputs don't match expectations

### Duplicated Tool Implementations
- `src/tools/` and `openclaw-plugin/src/tools/` contain parallel implementations of the same Strava tools
- Changes to one require manual synchronization to the other
- **Impact:** Feature drift between the two codebases, maintenance burden

### No Test Coverage
- Zero test files exist (see TESTING.md)
- No CI test gate in any GitHub Actions workflow
- **Impact:** Regressions go undetected; refactoring is risky

### Hard-coded Configuration
- OAuth redirect URIs and some API URLs are hard-coded
- Version number appears in multiple places (`package.json`, potentially plugin manifest)
- **Impact:** Environment-specific deployments require code changes

## Security Concerns

### Token Storage
- OAuth tokens stored in DynamoDB without encryption at the application level (relies on DynamoDB encryption at rest)
- `openclaw-plugin/src/token-store.ts` stores tokens as plain files on disk
- **Risk:** Token exposure if file system or DynamoDB access is compromised

### Credentials in Environment
- Strava client secret loaded into process environment via `src/config/env.ts` and `src/config/secrets.ts`
- AWS Secrets Manager used for production, but `.env` fallback means secrets could exist in plaintext files
- **Risk:** Credential leakage through process dumps or `.env` files committed accidentally

### OAuth Flow Gaps
- OAuth authorization codes are single-use but the exchange flow doesn't guard against replay
- PKCE implementation should be verified for completeness (code_verifier/code_challenge)
- Session IDs not validated for format/origin
- **Risk:** OAuth token theft or replay attacks

## Performance Concerns

### Lambda Cold Starts
- Synchronous Secrets Manager loading in `src/config/secrets.ts` blocks startup
- Full MCP server initialization on every cold start
- **Impact:** First-request latency for Lambda-deployed instances

### No API Response Caching
- Every Strava API call hits the API directly — no caching layer
- Strava enforces rate limits (100 requests per 15 minutes, 1000 per day)
- **Impact:** Rate limit exhaustion under moderate usage; redundant API calls

### Unbounded SSE Transport
- In-memory SSE transport registry in Lambda has no connection limit
- No cleanup mechanism for stale/abandoned SSE connections
- **Impact:** Memory growth under sustained load

## Fragile Areas

### Tool Registration in `src/app.ts`
- Single large file (~300 lines) handles all tool registration, OAuth setup, and server config
- Tool dispatch is a sequential if/else chain on tool name strings
- **Fragility:** Adding tools requires modifying this central file; typos in tool names fail silently

### OAuth Token Refresh
- `src/lib/strava-client.ts` has retry logic for expired tokens
- Refresh flow involves DynamoDB read → Strava API call → DynamoDB write
- **Fragility:** Race conditions possible if multiple requests trigger refresh simultaneously

### Environment Configuration Cascade
- Config loads from: environment variables → `.env` file → AWS Secrets Manager → defaults
- Priority and override behavior spread across `env.ts`, `secrets.ts`, and `types.ts`
- **Fragility:** Difficult to reason about which config source wins

## Dependency Risks

| Dependency | Version | Concern |
|---|---|---|
| `express` | 5.x | Express 5 was in beta for years; API may have subtle breaking changes from Express 4 guides |
| `@modelcontextprotocol/sdk` | 1.x | MCP SDK is relatively new; API surface may change |
| `axios` | 1.x | Stable, but large dependency for HTTP client when Bun has native `fetch` |

## Scaling Limits

- **Lambda concurrency:** Each SSE connection holds a Lambda invocation open
- **DynamoDB throughput:** Default provisioned capacity may throttle under load
- **Strava rate limits:** Hard ceiling of 1000 API calls/day per application
- **Single-region deployment:** `template.yaml` deploys to one AWS region only

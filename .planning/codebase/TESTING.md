# Testing

> Test framework, structure, coverage, and gaps

## Current State

**No tests exist.** The codebase has zero test files, no test framework configured, and no test scripts in `package.json`.

## Test Infrastructure

| Aspect | Status |
|---|---|
| Test framework | None configured |
| Test runner | None |
| Test script in package.json | Missing |
| Test files (*.test.ts, *.spec.ts) | None found |
| CI test gate | None — GitHub Actions workflows deploy without testing |
| Coverage tool | None |
| Mocking library | None |

## What Needs Testing

### Critical Paths (High Priority)
1. **OAuth flow** (`src/oauth/server.ts`) — Token exchange, refresh, error handling
2. **Strava API client** (`src/lib/strava-client.ts`) — Request building, auth headers, retry logic, error mapping
3. **Tool implementations** (`src/tools/*.ts`) — Input validation, API call construction, response formatting
4. **Token store** (`src/oauth/store.ts`) — DynamoDB operations, token serialization

### Important Paths (Medium Priority)
5. **Config loading** (`src/config/env.ts`, `src/config/secrets.ts`) — Environment cascade, validation, defaults
6. **Error handling** (`src/utils/errors.ts`) — Error formatting, MCP error type mapping
7. **Data formatters** (`src/utils/formatters.ts`) — Output formatting correctness

### Plugin (Separate Test Surface)
8. **OpenClaw plugin tools** (`openclaw-plugin/src/tools/*.ts`) — Same tool coverage for plugin variant
9. **File-based token store** (`openclaw-plugin/src/token-store.ts`) — File read/write, token parsing

## Recommended Setup

Given the project uses **Bun** as runtime and **TypeScript**:

- **Framework:** `bun:test` (built-in, zero config) or Vitest (if broader ecosystem needed)
- **Mocking:** Bun's built-in mock support or `msw` for HTTP mocking (Strava API calls)
- **Structure:** Co-located `__tests__/` directories or `*.test.ts` files alongside source
- **CI integration:** Add test step to GitHub Actions before deploy workflows

## Testing Challenges

- **External API dependency:** Strava API calls need mocking/recording for reliable tests
- **AWS service dependencies:** DynamoDB, Secrets Manager need local emulation (e.g., `localstack`) or mocking
- **OAuth flow:** Multi-step browser-involved flow is hard to unit test; needs integration test approach
- **Two codebases:** Both `src/` and `openclaw-plugin/` need independent test suites

# Coding Conventions

**Analysis Date:** 2026-03-26

## Naming Patterns

**Files:**
- PascalCase for classes and service files: `StravaClient`, `activities.ts`, `athlete.ts`
- camelCase for utilities: `formatters.ts`, `errors.ts`
- Filenames use hyphens or lowercase: `strava-client.ts`, `token-store.ts`
- Index/entry files: `index.ts` for module exports

**Functions:**
- camelCase for all functions: `getActivities`, `createActivity`, `updateActivity`, `formatError`, `getConfig`
- Prefix async operations with action verbs: `get`, `create`, `update`, `delete`, `fetch`
- Helper functions wrapped with `with` prefix: `withErrorHandling`
- Constants use UPPER_CASE: `STREAM_TYPES`, `DEFAULT_ALLOWED_REDIRECT_URIS`, `DEFAULT_SCOPES`

**Variables:**
- camelCase: `accessToken`, `refreshToken`, `clientId`, `allowedRedirectUris`
- Snake_case preserved for API parameters/responses from Strava API: `sport_type`, `start_date_local`, `moving_time`, `average_heartrate`
- Boolean prefixes use `is`, `has`, or descriptive names: `isRefreshing`, `hasHeartrate`, `manual`, `private`

**Types:**
- PascalCase for interfaces and types: `StravaClientConfig`, `StravaTokens`, `ActivitySummary`, `DetailedActivity`
- Interfaces describe API responses or configuration: `StravaTokens`, `Athlete`, `ActivityTotals`
- Schema types often suffix with `Schema`: `GetActivitiesSchema`, `CreateActivitySchema`
- Generic types use `T`: `T = any`

## Code Style

**Formatting:**
- TypeScript strict mode enabled (`"strict": true`)
- Target: ES2022 with NodeNext module resolution
- No ESLint or Prettier config detected - relies on TypeScript compiler checks
- Manual formatting consistency (no auto-formatter)

**Linting:**
- TypeScript compiler enforces strict type checking
- Configuration: `tsconfig.json` with strict flag enabled
- No ESLint config in use

**Imports:**
- ES modules with `.js` extensions: `import { foo } from './path.js'`
- Grouped by category: external → internal → types
- External libraries first: `import axios from 'axios'`, `import { z } from 'zod'`
- Internal imports use relative paths: `import { StravaClient } from '../lib/strava-client.js'`
- Type imports mixed with regular imports (no `import type` separation)

**Path Aliases:**
- No path aliases configured
- Use relative imports: `../`, `./`

## Error Handling

**Patterns:**
- Dedicated error handling utility: `formatError()` in `src/utils/errors.ts`
- Distinguishes between AxiosError, Error, and unknown error types
- HTTP status codes mapped to user-friendly messages:
  - 401 → Authentication failed
  - 403 → Access forbidden
  - 404 → Resource not found
  - 429 → Rate limit exceeded
- Wraps async functions with `withErrorHandling` HOF to catch and format errors
- Tool layer (in `app.ts`) wraps all tool calls with `runToolSafe()` to catch exceptions
- Returns structured error responses: `{ content: [{ type: 'text', text: 'Error: ...' }], isError: true }`

**Example:**
```typescript
// Error utility
export function formatError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      return 'Authentication failed. Please check your Strava credentials.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Function wrapping
export const getActivities = withErrorHandling(
  async (client: StravaClient, params) => {
    return await client.get<ActivitySummary[]>('/athlete/activities', { params });
  }
);

// Tool layer
async function runToolSafe(name: string, args: any) {
  try {
    return await runTool(name, args);
  } catch (error) {
    const errorMessage = formatError(error);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
}
```

## Logging

**Framework:** `console.error()` used throughout

**Patterns:**
- Errors logged to stderr (not stdout): `console.error('[StravaServer] ...')`
- Status messages and debug info logged to stderr: `console.error('[StravaClient] Token refreshed successfully')`
- Prefix format: `[ComponentName] Message`
- Common prefixes: `[StravaServer]`, `[StravaClient]`, `[StravaLambda]`
- No structured logging framework (Pino, Winston, etc.)

**Usage:**
```typescript
console.error('[StravaServer] MCP server running on http://localhost:${port}');
console.error('[StravaClient] Token refreshed successfully');
console.error('[StravaClient] Failed to refresh access token:', error);
```

## Comments

**When to Comment:**
- Comprehensive JSDoc for public functions and classes
- JSDoc includes: description, params with types, returns, examples
- Explain "why" rather than "what" for complex logic
- Mark critical sections with bold text in descriptions
- Use **bold** in JSDoc for emphasis on important points

**JSDoc/TSDoc:**
- Standard JSDoc format with `@param`, `@returns`, `@example`
- Describe complex parameters and edge cases
- Include real-world usage examples
- Document API scopes and permissions required

**Example:**
```typescript
/**
 * Retrieves the authenticated athlete's activities.
 * Supports filtering by date range using before/after timestamps.
 *
 * @param client - StravaClient instance
 * @param params - Query parameters for filtering activities
 * @returns Array of activity summaries
 *
 * @example
 * ```typescript
 * // Get today's activities
 * const today = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
 * const activities = await getActivities(client, { after: today });
 * ```
 */
export const getActivities = withErrorHandling(...);
```

## Function Design

**Size:**
- Tool functions are single-responsibility
- Each tool file handles one API resource (activities, athlete, streams)
- Schema definitions paired with function implementations
- Avoid large switch statements in tool dispatchers (acceptable here: `src/app.ts` line 111-178)

**Parameters:**
- Use Zod schemas for validation and type inference: `z.infer<typeof CreateActivitySchema>`
- Schema applied before function execution: `params = Schema.parse(args)`
- API client passed as first parameter: `client: StravaClient`
- Query params encapsulated in params object

**Return Values:**
- Functions return typed data: `Promise<ActivitySummary[]>`, `Promise<DetailedActivity>`
- Tool responses wrap results in MCP format: `{ content: [{ type: 'text', text: JSON.stringify(...) }] }`
- Consistent formatting: `JSON.stringify(result, null, 2)` for pretty-printing
- Error responses include `isError: true` flag

## Module Design

**Exports:**
- Each tool file exports: schema definitions, functions, and MCP tool array
- Barrel pattern: `export const activitiesTools = [...]`
- Schemas exported for validation: `export const GetActivitiesSchema = z.object(...)`
- Functions exported individually: `export const getActivities = withErrorHandling(...)`

**Barrel Files:**
- No barrel `index.ts` files in tool directories
- Each tool file is self-contained
- Tools imported by name in main app: `import { activitiesTools } from './tools/activities.js'`

**Directory Organization:**
- `src/tools/` - One file per resource (activities, athlete, streams, clubs, uploads)
- `src/lib/` - Core client implementations (StravaClient)
- `src/config/` - Configuration and types (env, types, secrets)
- `src/utils/` - Shared utilities (errors, formatters)
- `src/oauth/` - OAuth implementation (server, store, utils)

## Type System

**Strict Mode:**
- All types inferred or explicitly declared
- No `any` without justification (used in generic contexts: `config?: AxiosRequestConfig`)
- Zod schemas define runtime validation and type inference
- Response types explicitly typed: `client.get<ActivitySummary[]>(...)`

**Patterns:**
- API types derived from Zod schemas: `z.infer<typeof CreateActivitySchema>`
- Config validation with Zod: `envSchema.safeParse(process.env)`
- Generic request method: `request<T = any>(method, endpoint, data?, config?)`

---

*Convention analysis: 2026-03-26*

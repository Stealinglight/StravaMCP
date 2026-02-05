# StravaMCP - AI Coding Assistant Context

## Project Overview

**Name**: StravaMCP  
**Type**: Remote MCP Server (Model Context Protocol)  
**Primary Language**: TypeScript  
**Runtime**: Bun  
**Deployment**: AWS Lambda (serverless)  
**Transport**: Streamable HTTP via Lambda Function URLs  
**Purpose**: Provide AI assistants (Claude, etc.) with programmatic access to Strava API

## Architecture

### High-Level System Design

```
┌─────────────────┐
│  MCP Clients    │  (Claude Desktop, Web, Mobile)
│  (Any Device)   │
└────────┬────────┘
         │ HTTPS POST /mcp
         │ Authorization: Bearer <AUTH_TOKEN>
         │ JSON-RPC 2.0
         ▼
┌─────────────────┐
│  AWS Lambda     │
│  Function URL   │  (Public endpoint with auth middleware)
└────────┬────────┘
         │ JSON-RPC Handler
         ▼
┌─────────────────┐
│  Tool Router    │  (11 Strava Tools)
│  Express App    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  StravaClient   │  (OAuth 2.0 with auto-refresh)
└────────┬────────┘
         │ OAuth 2.0
         ▼
┌─────────────────┐
│  Strava API v3  │  (developers.strava.com)
└─────────────────┘
```

### Directory Structure

```
StravaMCP/
├── src/
│   ├── lambda-web.ts              # Lambda entry point (JSON-RPC over HTTP)
│   ├── index.ts               # Local dev server (JSON-RPC over HTTP)
│   ├── lib/
│   │   └── strava-client.ts   # OAuth client with auto-refresh
│   ├── tools/                 # MCP tool implementations
│   │   ├── activities.ts      # 5 activity tools
│   │   ├── athlete.ts         # 2 athlete tools
│   │   ├── streams.ts         # 1 telemetry tool
│   │   ├── clubs.ts           # 1 club tool
│   │   └── uploads.ts         # 2 upload tools
│   ├── config/
│   │   ├── env.ts             # Environment variable loading
│   │   └── types.ts           # TypeScript type definitions
│   └── utils/
│       ├── errors.ts          # Error handling wrapper
│       └── formatters.ts      # Response formatting
├── scripts/
│   ├── deploy.ts              # Automated deployment
│   └── show-config.ts         # Display MCP config
├── docs/                      # GitHub Pages site (Jekyll)
├── template.yaml              # AWS SAM CloudFormation
├── tsconfig.json              # TypeScript strict mode
├── package.json               # Bun project
└── get-token.js               # OAuth token retrieval
```

## Key Components

### 1. Lambda Handler (src/lambda-web.ts)

**Purpose**: Serverless entry point with remote MCP support

**Key Features**:
- Implements JSON-RPC over HTTP transport for Claude connectors
- Bearer token authentication middleware
- Direct JSON-RPC request/response handling
- All 11 Strava tools exposed via single `/mcp` endpoint
- CORS enabled for cross-origin requests

**Authentication Flow**:
1. Client sends request with `Authorization: Bearer <token>` header
2. Middleware validates token against `AUTH_TOKEN` env var
3. If valid, request proceeds to MCP server
4. If invalid, returns 401 Unauthorized

**Important**: Health endpoint (`/health`) bypasses authentication.

### 2. Strava Client (src/lib/strava-client.ts)

**Purpose**: OAuth 2.0 client with automatic token management

**Critical Features**:
- **Automatic Token Refresh**: Refreshes tokens 5 minutes before expiry
- **Thread-Safe**: Prevents concurrent refresh attempts with mutex
- **Generic Request Method**: Supports ALL Strava API endpoints dynamically
- **Axios Interceptors**: Handles 401 errors and retries with fresh token

**Methods**:
- `request<T>(method, endpoint, data?, config?)` - Generic API request
- `get<T>(endpoint, config?)` - GET convenience method
- `post<T>(endpoint, data?, config?)` - POST convenience method
- `put<T>(endpoint, data?, config?)` - PUT convenience method
- `delete<T>(endpoint, config?)` - DELETE convenience method

**Token Refresh Logic**:
```typescript
// Refreshes if:
// 1. No access token exists
// 2. Token expires in less than 5 minutes (300 seconds buffer)
const now = Math.floor(Date.now() / 1000);
const bufferTime = 300;
if (!this.accessToken || this.tokenExpiresAt - now < bufferTime) {
  await this.refreshAccessToken();
}
```

**⚠️ CRITICAL**: Never implement custom token refresh logic. StravaClient handles this automatically and safely.

### 3. MCP Tools (src/tools/*.ts)

**Structure**: All tools follow this pattern:

```typescript
// 1. Import dependencies
import { z } from 'zod';
import { StravaClient } from '../lib/strava-client.js';
import { withErrorHandling } from '../utils/errors.js';

// 2. Define Zod schema for input validation
export const MyToolSchema = z.object({
  param1: z.string().describe('Parameter description'),
  param2: z.number().optional().describe('Optional parameter'),
});

// 3. Implement tool function with error handling wrapper
export const myTool = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof MyToolSchema>) => {
    return await client.get<ResponseType>('/endpoint', { params });
  }
);

// 4. Export MCP tool definition
export const myToolDefinitions = [
  {
    name: 'my_tool',
    description: 'Detailed description for AI agents to understand when/how to use...',
    inputSchema: {
      type: 'object' as const,
      properties: {
        param1: { type: 'string' as const, description: 'Description' },
        param2: { type: 'number' as const, description: 'Description' },
      },
      required: ['param1'],
    },
  },
];
```

**11 Tools Implemented**:
- **Activities** (5): get_activities, get_activity_by_id, create_activity, update_activity, get_activity_zones
- **Athlete** (2): get_athlete, get_athlete_stats
- **Streams** (1): get_activity_streams (telemetry data)
- **Clubs** (1): get_club_activities
- **Uploads** (2): create_upload, get_upload

### 4. Deployment System

**scripts/deploy.ts**:
- Auto-generates AUTH_TOKEN if not present in samconfig.toml
- Runs `sam build && sam deploy --guided`
- Displays formatted MCP configuration for easy copy-paste
- Saves configuration to `samconfig.toml` (gitignored)

**scripts/show-config.ts**:
- Reads AUTH_TOKEN from `samconfig.toml`
- Fetches Function URL from CloudFormation outputs
- Displays complete MCP client configuration (JSON ready to copy)

## MCP Protocol

### Transport Mechanism

The server uses HTTP POST with JSON-RPC 2.0 for MCP communication:

**Request Format:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_activities",
    "arguments": {
      "per_page": 10
    }
  },
  "id": 1
}
```

**Response Format:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[...activity data...]"
      }
    ]
  },
  "id": 1
}
```

### Supported Methods

1. **initialize** - Establishes MCP session
   - Returns protocol version and capabilities
   
2. **tools/list** - Lists all available tools
   - Returns array of 11 Strava tool definitions
   
3. **tools/call** - Executes a specific tool
   - Requires tool name and arguments
   - Returns tool execution result

## Development Patterns

### Adding a New Tool

**Step 1**: Create tool file in `src/tools/my-new-tool.ts`:
```typescript
import { z } from 'zod';
import { StravaClient } from '../lib/strava-client.js';
import { withErrorHandling } from '../utils/errors.js';

export const GetMyDataSchema = z.object({
  id: z.number().describe('Resource ID'),
});

export const getMyData = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof GetMyDataSchema>) => {
    return await client.get(`/my-endpoint/${params.id}`);
  }
);

export const myNewTools = [
  {
    name: 'get_my_data',
    description: 'Retrieves data from Strava endpoint...',
    inputSchema: { /* ... */ },
  },
];
```

**Step 2**: Register in `src/lambda-web.ts` and `src/index.ts`:
```typescript
import { myNewTools } from './tools/my-new-tool.js';

// In setupServer() function
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    ...activitiesTools,
    ...athleteTools,
    ...myNewTools, // Add here
  ],
}));
```

**Step 3**: Add types to `src/config/types.ts` if needed

**Step 4**: Document in `docs/api.md`

**Step 5**: Test locally with `bun run dev`

### Authentication Flow

**Three Types of Auth**:

1. **Bearer Token** (AUTH_TOKEN):
   - Static token for Lambda authentication
   - Generated during deployment
   - Validates client requests to Lambda function
   - Stored in environment variable
   - Required for `/mcp` JSON-RPC endpoint

2. **Authless Mode** (ALLOW_AUTHLESS):
   - When `ALLOW_AUTHLESS=true` (default), SSE endpoints bypass auth
   - Enables Claude.ai custom connectors (which don't support custom headers)
   - Applies to: `/sse`, `/sse/`, `/message` endpoints
   - Does NOT apply to: `/mcp` endpoint (still requires Bearer token)
   - Security: Keep Lambda URL private when enabled

3. **OAuth Tokens** (Strava):
   - Access token (short-lived, ~6 hours)
   - Refresh token (long-lived)
   - Automatically managed by StravaClient
   - Stored in environment variables (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)

**Authentication Middleware Logic**:
```typescript
// Simplified auth flow
if (path === '/health') → bypass auth
if (ALLOW_AUTHLESS && (path === '/sse' || path === '/message')) → bypass auth
if (path === '/message' && valid session) → bypass auth
else → require Bearer token
```

### Local Development Workflow

```bash
# 1. Install dependencies
bun install

# 2. Get Strava refresh token
node get-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET

# 3. Configure .env
cp .env.example .env
# Edit .env with Strava credentials

# 4. Start dev server
bun run dev
# Server runs at http://localhost:3000
# MCP endpoint: http://localhost:3000/mcp

# 5. Configure Claude
# Add as connector in Claude Settings
{
  "name": "strava-local",
  "url": "http://localhost:3000/mcp"
}

# 6. Test with Claude
# Ask Claude: "Get my recent Strava activities"
```

### Deployment Workflow

```bash
# Build Lambda package
bun run build:lambda

# First deployment (guided prompts)
bun run deploy

# Subsequent deployments (uses saved config)
bun run deploy:fast

# View configuration anytime
bun run deploy:show-config
```

## Important Gotchas

### 1. Logging Convention

**⚠️ CRITICAL**: Always use `console.error()` for logging, **NEVER** `console.log()`

```typescript
// ✅ Correct
console.error('[StravaClient] Token refreshed successfully');
console.error('[MyTool] Processing request:', params);

// ❌ Wrong - breaks MCP protocol
console.log('Processing request');
```

**Reason**: MCP protocol uses stdout for protocol messages. Logging to stdout corrupts communication.

### 2. OAuth Token Refresh

**DO NOT** implement custom token refresh logic. StravaClient handles this automatically with:
- 5-minute buffer before expiry
- Thread-safe mutex to prevent concurrent refreshes
- Automatic retry on 401 errors

### 3. Bearer Token vs OAuth Token

These are **two different tokens**:
- `AUTH_TOKEN` → Lambda authentication (static, manually managed)
- Strava `access_token` / `refresh_token` → OAuth (dynamic, auto-managed)

### 4. File References in Code

When updating code that references files (e.g., activity descriptions), always use forward slashes (`/`) regardless of OS.

### 5. Environment Variables

Defined in three places:
1. `template.yaml` → CloudFormation parameters
2. `src/config/env.ts` → TypeScript loading/validation
3. `.env` → Local development (gitignored)

### 6. Deployment Always Builds

Before deployment, **always** run `bun run build:lambda` to compile TypeScript and prepare the Lambda package.

### 7. Cold Starts

Lambda functions "sleep" after inactivity:
- First request after sleep: ~2-3 seconds (cold start)
- Subsequent requests: ~100-300ms (warm)
- Optimized with ARM64 architecture and minimal dependencies

## Common Development Tasks

### Update a Tool Description

1. Edit `src/tools/[tool-file].ts`
2. Update the `description` field in tool definition
3. Rebuild: `bun run build:lambda`
4. Deploy: `bun run deploy:fast`

### Add Environment Variable

1. Add to `template.yaml` Parameters section:
   ```yaml
   Parameters:
     MyNewVar:
       Type: String
       Description: Description of variable
   ```

2. Add to Lambda Environment in `template.yaml`:
   ```yaml
   Environment:
     Variables:
       MY_NEW_VAR: !Ref MyNewVar
   ```

3. Add to `src/config/env.ts`:
   ```typescript
   export const MY_NEW_VAR = process.env.MY_NEW_VAR!;
   ```

4. Document in `docs/` if user-facing

### Fix Authentication Issue

1. Check `samconfig.toml` has AUTH_TOKEN
2. Verify middleware in `lambda-web.ts` validates correctly
3. Test: `curl -H "Authorization: Bearer <token>" <url>/health`
4. Check CloudWatch logs: `sam logs -n StravaMCPFunction --stack-name strava-mcp-stack --tail`

### Debug OAuth Token Issues

1. Check environment variables are set correctly
2. Verify refresh token is valid (not expired)
3. Re-run `get-token.js` to get new refresh token
4. Update deployment with new token
5. Check StravaClient logs for refresh attempts

## Testing Approach

### Local Testing

1. Start dev server: `bun run dev`
2. Configure Claude Desktop with local URL
3. Test tool execution through Claude
4. Check logs in terminal

### Lambda Testing

1. Deploy to AWS: `bun run deploy`
2. Get configuration: `bun run deploy:show-config`
3. Test health endpoint: `curl -H "Authorization: Bearer <token>" <url>/health`
4. Configure Claude with Lambda URL
5. Test tool execution
6. Check CloudWatch logs: `sam logs -n StravaMCPFunction --tail`

### Manual Test Checklist

- [ ] Local dev server starts without errors
- [ ] TypeScript compiles without errors (`bun run typecheck`)
- [ ] Lambda deployment succeeds
- [ ] Health endpoint returns 200 OK
- [ ] Claude Desktop can connect
- [ ] All 11 tools listed in Claude
- [ ] Sample tool execution (e.g., get_activities) works
- [ ] OAuth token refresh triggered correctly
- [ ] Error handling returns proper MCP error format

## Code Quality Standards

### TypeScript

- Strict mode enabled (`tsconfig.json`)
- No `any` types without justification
- Explicit return types on functions
- Interface over type alias for objects
- Use `const` over `let` when possible

### File Organization

- One component per file
- Related utilities grouped together
- Clear, descriptive file names
- Logical directory structure

### Documentation

- JSDoc comments on all exported functions
- Inline comments for complex logic
- Parameter descriptions in Zod schemas
- Tool descriptions optimized for AI understanding

## Related Documentation

- **User Docs**: `docs/` (GitHub Pages site)
- **API Reference**: `docs/api.md`
- **Development Guide**: `docs/development.md`
- **Deployment Guide**: `docs/deployment.md`
- **Contributing**: `CONTRIBUTING.md`

## Quick Reference

### Useful Commands

```bash
# Development
bun run dev                # Start local server
bun run dev:lambda         # Test Lambda handler locally
bun run typecheck          # TypeScript validation
bun run build              # Compile TypeScript
bun run build:lambda       # Build for Lambda

# Deployment
bun run deploy             # Full deployment (guided)
bun run deploy:fast        # Quick deployment (saved config)
bun run deploy:show-config # Display MCP configuration

# AWS SAM
sam build                  # Build Lambda package
sam deploy                 # Deploy to AWS
sam logs -n StravaMCPFunction --tail  # View logs
sam delete --stack-name strava-mcp-stack  # Delete deployment
```

### Environment Variables (Lambda)

- `STRAVA_CLIENT_ID` - Strava API client ID
- `STRAVA_CLIENT_SECRET` - Strava API client secret
- `STRAVA_REFRESH_TOKEN` - Strava OAuth refresh token
- `AUTH_TOKEN` - Bearer token for Lambda authentication
- `ALLOW_AUTHLESS` - When "true", SSE endpoints bypass auth (default: "true")
- `NODE_ENV` - Environment (production/development)

### File Locations

- Lambda handler: `src/lambda-web.ts`
- Local dev server: `src/index.ts`
- Tools: `src/tools/*.ts`
- StravaClient: `src/lib/strava-client.ts`
- Types: `src/config/types.ts`
- Error handling: `src/utils/errors.ts`

---

**Remember**: This project enables AI assistants to help athletes get more value from their Strava data through natural language interactions. Every tool and feature should serve this core purpose.

For detailed development instructions, see [docs/development.md](docs/development.md).

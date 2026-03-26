# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code and types
- JavaScript - Runtime and package manifests

**Secondary:**
- Shell - AWS Lambda bootstrap script (`run.sh`)

## Runtime

**Environment:**
- Node.js 20.x (specified in SAM template)
- AWS Lambda (serverless execution environment)
- Bun (package manager and local development runtime)

**Package Manager:**
- Bun (primary)
- npm lockfile: `bun.lock` (v1)
- Lockfile: Present

## Frameworks

**Core:**
- Express 5.2.1 - HTTP server and routing
- @modelcontextprotocol/sdk 1.25.2 - Model Context Protocol implementation

**Testing:**
- Not detected

**Build/Dev:**
- TypeScript 5.9.3 - Compilation and type checking
- Bun - Task runner and development server
- AWS SAM - Serverless infrastructure as code

## Key Dependencies

**Critical:**
- @aws-sdk/client-dynamodb 3.872.0 - DynamoDB table operations for OAuth state
- @aws-sdk/lib-dynamodb 3.872.0 - Document client for DynamoDB CRUD
- @aws-sdk/client-secrets-manager 3.872.0 - AWS Secrets Manager integration
- axios 1.13.2 - HTTP client for Strava API requests
- zod 4.3.5 - Runtime schema validation for configuration and tool parameters

**Infrastructure:**
- @aws-sdk/core - Core AWS SDK functionality
- @smithy packages - Underlying AWS SDK v3 implementation

## Configuration

**Environment:**
- Configuration via environment variables with Zod schema validation in `src/config/env.ts`
- Secrets can be loaded from AWS Secrets Manager via JSON payload
- Key required variables:
  - `STRAVA_CLIENT_ID` - Strava API client ID
  - `STRAVA_CLIENT_SECRET` - Strava API client secret
  - `STRAVA_REFRESH_TOKEN` - OAuth refresh token for Strava API
  - `AUTH_TOKEN` - Bearer token for MCP client authentication (minimum 32 characters)
  - `PORT` - HTTP server port (default: 3000)
  - OAuth variables (when enabled):
    - `OAUTH_ENABLED` - Enable OAuth 2.1 endpoints
    - `OAUTH_CLIENTS_TABLE` - DynamoDB table for OAuth clients
    - `OAUTH_CODES_TABLE` - DynamoDB table for authorization codes
    - `OAUTH_TOKENS_TABLE` - DynamoDB table for OAuth tokens
    - `OAUTH_ALLOWED_REDIRECT_URIS` - Comma-separated URIs for Claude/ChatGPT
    - `OAUTH_REGISTRATION_TOKEN` - Optional bearer token for dynamic client registration
    - `OAUTH_ACCESS_TOKEN_TTL_SECONDS` - Access token lifetime (default: 3600)
    - `OAUTH_REFRESH_TOKEN_TTL_SECONDS` - Refresh token lifetime (default: 2592000)

**Build:**
- `tsconfig.json` - TypeScript compilation configuration
- Target: ES2022
- Module system: NodeNext
- Source root: `./src`
- Output: `./dist`
- Strict mode enabled

## Platform Requirements

**Development:**
- Bun (runtime and package manager)
- TypeScript compiler
- Node.js 20+ (for running built code locally)

**Production:**
- AWS Lambda (serverless runtime)
- AWS DynamoDB (for OAuth state storage)
- AWS Secrets Manager (optional, for credential rotation)
- AWS Lambda Web Adapter Layer (`LambdaAdapterLayerArm64` v25)
- ARM64 architecture (Graviton2 processor for cost optimization)
- Node.js 20.x runtime on Lambda
- 512 MB memory allocation
- 15-minute timeout (max for Lambda Function URLs with streaming)

**Deployment Target:**
- AWS Lambda with Function URL (public HTTP endpoint)
- RESPONSE_STREAM invocation mode enabled for Server-Sent Events support
- CORS configured for `*` origin with specific headers

---

*Stack analysis: 2026-03-26*

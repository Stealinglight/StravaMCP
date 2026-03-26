# Structure

> Directory layout, key locations, naming conventions

## Directory Layout

```
StravaMCP/
├── src/                          # Main MCP server source (TypeScript)
│   ├── index.ts                  # CLI entry point (stdio transport)
│   ├── app.ts                    # MCP server setup, tool registration, OAuth config
│   ├── lambda-web.ts             # AWS Lambda entry point (SSE transport)
│   ├── config/
│   │   ├── env.ts                # Environment variable loading + validation
│   │   ├── secrets.ts            # AWS Secrets Manager integration
│   │   └── types.ts              # Shared TypeScript types/interfaces
│   ├── lib/
│   │   └── strava-client.ts      # HTTP client for Strava API (axios-based)
│   ├── oauth/
│   │   ├── server.ts             # OAuth 2.0 flow implementation
│   │   ├── store.ts              # DynamoDB token storage
│   │   └── utils.ts              # OAuth utility helpers
│   ├── tools/
│   │   ├── activities.ts         # Activity listing, details, laps, comments, kudos
│   │   ├── athlete.ts            # Athlete profile + stats
│   │   ├── clubs.ts              # Club listing + details
│   │   ├── openai.ts             # OpenAI-compatible tool definitions
│   │   ├── streams.ts            # Activity stream data (GPS, HR, power)
│   │   └── uploads.ts            # Activity upload management
│   └── utils/
│       ├── errors.ts             # Error formatting + MCP error types
│       └── formatters.ts         # Data formatting helpers
├── openclaw-plugin/              # Standalone OpenClaw/Claude Code plugin
│   ├── index.ts                  # Plugin entry point
│   ├── openclaw.plugin.json      # Plugin manifest
│   ├── package.json              # Plugin dependencies
│   ├── tsconfig.json             # Plugin TypeScript config
│   ├── src/
│   │   ├── strava-client.ts      # Simplified Strava API client
│   │   ├── token-store.ts        # File-based token storage
│   │   └── tools/                # Plugin tool implementations
│   │       ├── activities.ts
│   │       ├── athlete.ts
│   │       ├── clubs.ts
│   │       ├── streams.ts
│   │       ├── uploads.ts
│   │       └── zones.ts
│   └── skills/                   # AI coaching skill definitions
├── scripts/
│   ├── deploy.ts                 # SAM deployment automation
│   └── show-config.ts            # Configuration display utility
├── dist/                         # Compiled JavaScript output
├── .aws-sam/                     # SAM build artifacts
├── docs/                         # GitHub Pages documentation site
├── .github/workflows/            # CI/CD workflows
│   ├── claude.yml                # Claude Code automation
│   ├── claude-code-review.yml    # AI code review
│   ├── deploy-docs.yml           # Docs deployment
│   ├── deploy-lambda.yml         # Lambda deployment
│   └── release-openclaw-plugin.yml  # Plugin release
├── template.yaml                 # AWS SAM template
├── package.json                  # Root project config
├── tsconfig.json                 # TypeScript compiler config
└── get-token.js                  # Standalone token acquisition script
```

## Key Locations

| What | Where |
|---|---|
| Main entry (CLI/stdio) | `src/index.ts` |
| Main entry (Lambda/SSE) | `src/lambda-web.ts` |
| MCP server setup | `src/app.ts` |
| Strava API client | `src/lib/strava-client.ts` |
| OAuth flow | `src/oauth/server.ts` |
| Token persistence | `src/oauth/store.ts` |
| Tool implementations | `src/tools/*.ts` |
| AWS infrastructure | `template.yaml` |
| Plugin entry | `openclaw-plugin/index.ts` |
| Plugin manifest | `openclaw-plugin/openclaw.plugin.json` |

## Naming Conventions

### Files
- **kebab-case** for all source files: `strava-client.ts`, `lambda-web.ts`, `token-store.ts`
- Tool files named by Strava API domain: `activities.ts`, `athlete.ts`, `clubs.ts`, `streams.ts`
- Config files use descriptive names: `env.ts`, `secrets.ts`, `types.ts`

### Code
- **camelCase** for functions and variables: `getActivities`, `stravaClient`, `accessToken`
- **PascalCase** for types/interfaces: `StravaConfig`, `OAuthStore`, `ActivityResponse`
- **SCREAMING_SNAKE** for constants: `STRAVA_API_BASE`, `DEFAULT_PER_PAGE`

### Directories
- Grouped by concern: `config/`, `oauth/`, `tools/`, `utils/`, `lib/`
- Flat structure within groups (no deep nesting)

## Two Codebases

The project contains two related but separate implementations:

1. **`src/`** — Full MCP server with AWS Lambda deployment, DynamoDB storage, Secrets Manager, OAuth server
2. **`openclaw-plugin/`** — Lightweight Claude Code plugin with file-based token storage, no AWS dependencies

Both share the same Strava API tool surface but differ in transport, auth storage, and deployment model.

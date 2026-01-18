# Strava MCP Server

A remote [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the Strava API that runs serverless on AWS Lambda. Use your Strava data with Claude web, Claude mobile, or any MCP client - completely free with AWS Free Tier.

## Why This Project?

Most MCP servers run locally and only work with Claude Desktop. This project solves that by:

✅ Running on **AWS Lambda** (serverless, scales to zero)
✅ Working with **Claude web and mobile** (remote MCP)
✅ Staying **100% free** with AWS Free Tier
✅ Using **Bun** for fast builds and deploys
✅ Supporting **Streamable HTTP** (modern MCP transport)

Perfect for portfolios - demonstrates cloud architecture, serverless deployment, and AI integration!

## Features

- 🔐 **Automatic OAuth Token Refresh** - Set it and forget it
- ☁️ **AWS Lambda Deployment** - $0/month on free tier
- 📱 **Claude Web & Mobile Support** - Use anywhere
- 🏃 **11 Strava API Tools** - Complete API coverage
- 🎯 **Activity Enrichment** - Transform generic titles into detailed training logs
- ⚡ **Built with Bun** - Lightning-fast builds
- 📊 **Telemetry Data Access** - Deep performance analysis

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed
- [AWS Account](https://aws.amazon.com/free) (free tier)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Strava API](https://www.strava.com/settings/api) credentials

### 1. Clone & Install

```bash
git clone https://github.com/Stealinglight/StravaMCP.git
cd StravaMCP
bun install
```

### 2. Get Strava Tokens

```bash
# Get your Client ID and Secret from https://www.strava.com/settings/api
node get-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET
```

### 3. Deploy to AWS

```bash
bun run build:lambda
bun run deploy
```

Follow the prompts to enter your Strava credentials. The deployment takes ~2 minutes.

### 4. Connect to Claude

Copy the `ClaudeConnectionUrl` from the deployment output.

**Claude Web**:
1. Go to [claude.ai](https://claude.ai) → Settings → MCP
2. Add Remote Server with your URL

**Claude Mobile**:
1. Open Claude app → Settings → MCP Servers
2. Add Server with your URL

## Documentation

📚 **[Full Documentation](https://stealinglight.github.io/StravaMCP)**

- [Deployment Guide](https://stealinglight.github.io/StravaMCP/deployment) - Step-by-step AWS setup
- [Free Tier Guide](https://stealinglight.github.io/StravaMCP/freetier) - Stay at $0/month
- [API Reference](https://stealinglight.github.io/StravaMCP/api) - All 11 tools documented
- [Examples](https://stealinglight.github.io/StravaMCP/examples) - Common use cases

## Available Tools

| Category       | Tools                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| **Activities** | get_activities, get_activity_by_id, create_activity, update_activity, get_activity_zones |
| **Athlete**    | get_athlete, get_athlete_stats                                                           |
| **Streams**    | get_activity_streams (telemetry data)                                                    |
| **Clubs**      | get_club_activities                                                                      |
| **Uploads**    | create_upload, get_upload                                                                |

## Architecture

```
┌─────────────────┐
│ Claude (Web/App)│
└────────┬────────┘
         │ HTTPS (Streamable HTTP)
         ▼
┌─────────────────┐
│  Lambda + URL   │
│  (ARM64, 512MB) │
└────────┬────────┘
         │ OAuth 2.0
         ▼
┌─────────────────┐
│   Strava API    │
└─────────────────┘
```

**Key Technologies**:
- **Runtime**: Bun + TypeScript
- **Deployment**: AWS SAM (CloudFormation)
- **Compute**: Lambda with Function URLs
- **Transport**: MCP Streamable HTTP
- **Auth**: OAuth 2.0 with auto-refresh

## Cost

**$0/month** on AWS Free Tier:
- 1M Lambda requests/month (free forever)
- 400,000 GB-seconds compute/month (free for 12 months)

Typical usage (10K requests/month): **$0**

Even after free tier expires: ~**$0.07/month** for personal use.

## Local Development

Run locally with Express server:

```bash
bun install
bun run dev
```

Server runs at `http://localhost:3000` with SSE transport.

## Updating

```bash
# Make code changes in src/
bun run build:lambda
bun run deploy:fast
```

Updates deploy in 30-60 seconds.

## Example Usage

**You**: "Update my run from this morning"

**Claude**:
1. Finds your activity using `get_activities`
2. Asks how it felt
3. Updates with `update_activity`:

```
Title: Progressive Long Run - 10K
Description: Perfect weather at 55°F. Started easy in Zone 2,
building to threshold in final 3K. Felt strong throughout...
```

See [Examples](https://stealinglight.github.io/StravaMCP/examples) for more workflows.

## Why Lambda?

Traditional MCP servers can't be used with Claude web/mobile because they run locally. Lambda deployment enables:

✅ **Remote Access** - Use from any device
✅ **Zero Infrastructure** - No servers to manage
✅ **Free Tier** - $0/month for personal use
✅ **Auto-scaling** - Handle any load
✅ **Always Available** - No local server required

## Project Structure

```
/StravaMCP
├── src/
│   ├── lambda.ts         # Lambda handler (Streamable HTTP)
│   ├── index.ts          # Express server (local dev)
│   ├── lib/              # Strava client with OAuth
│   ├── tools/            # MCP tool definitions
│   ├── config/           # Environment & types
│   └── utils/            # Formatters & errors
├── docs/                 # GitHub Pages documentation
├── template.yaml         # AWS SAM template
├── get-token.js          # OAuth token helper
└── package.json          # Bun project config
```

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## Security

- OAuth tokens stored in Lambda environment variables
- Function URLs support IAM authentication (enable for production)
- No data persistence - stateless architecture
- CORS configurable in SAM template

## Troubleshooting

### "Function URL returned 500"

Check logs:
```bash
sam logs -n StravaMCPFunction --stack-name strava-mcp-stack --tail
```

### Refresh Token Expired

Re-run token script:
```bash
node get-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET
sam deploy --parameter-overrides StravaRefreshToken=NEW_TOKEN
```

### More Help

See [Deployment Guide](https://stealinglight.github.io/StravaMCP/deployment#troubleshooting) for full troubleshooting guide.

## License

ISC

## Resources

- **[Documentation](https://stealinglight.github.io/StravaMCP)** - Full guides and API reference
- **[Strava API](https://developers.strava.com)** - Official Strava API docs
- **[Model Context Protocol](https://modelcontextprotocol.io)** - MCP specification
- **[AWS Lambda](https://aws.amazon.com/lambda/)** - Serverless compute
- **[Bun](https://bun.sh)** - Fast JavaScript runtime

## Acknowledgments

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) - MCP SDK
- [axios](https://axios-http.com/) - HTTP client
- [zod](https://zod.dev/) - Schema validation
- [AWS SAM](https://aws.amazon.com/serverless/sam/) - Serverless deployment

---

**Made with ❤️ for athletes and AI**

Deploy your own Strava MCP server in 10 minutes! ⚡

## Development Notes

### Logging Convention

This MCP server uses `console.error()` for **all** logging output. This is correct for MCP servers:
- **stdout** (console.log) is reserved for MCP protocol communication
- **stderr** (console.error) is used for all logging and diagnostics

Do not change `console.error()` to `console.log()` - this will break MCP protocol communication.

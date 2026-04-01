---
layout: default
title: Home
nav_order: 1
---

# StravaMCP
{: .fs-9 }

A fast Go binary that gives any MCP client full access to the Strava API -- zero cloud infrastructure required.
{: .fs-6 .fw-300 }

[Get Started](#quick-start){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/Stealinglight/StravaMCP){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## What is this?

**StravaMCP** is a [Model Context Protocol](https://modelcontextprotocol.io) server that connects AI assistants like Claude to the Strava API. It runs as a single Go binary on your machine, communicates over stdio, and requires no cloud services, no Docker, and no database. Just download, authenticate, and go.

### Key Features

- **Single binary, no runtime dependencies** -- no Docker, no cloud, no database
- **11 MCP tools** covering activities, athlete stats, streams, clubs, and uploads
- **Automatic OAuth browser flow** -- one command to authenticate
- **Transparent token refresh** with concurrent request coalescing via singleflight
- **Cross-platform** -- macOS (Intel + Apple Silicon) and Linux (amd64 + arm64)
- **Install via go install, Homebrew, or direct binary download**

## Quick Start

### Install

Choose your preferred installation method:

**Option A: Go install**

```bash
go install github.com/Stealinglight/StravaMCP@latest
```

**Option B: Homebrew**

```bash
brew install Stealinglight/tap/strava-mcp
```

**Option C: Download binary**

Download the latest binary for your platform from [GitHub Releases](https://github.com/Stealinglight/StravaMCP/releases/latest).

{: .note }
> **macOS Gatekeeper:** If you download the binary directly, remove the quarantine attribute:
> `xattr -d com.apple.quarantine strava-mcp`

### Configure

1. Create a Strava API application at [https://www.strava.com/settings/api](https://www.strava.com/settings/api)
2. Set the **Authorization Callback Domain** to `localhost`
3. Export your credentials:

```bash
export STRAVA_CLIENT_ID=your_client_id
export STRAVA_CLIENT_SECRET=your_client_secret
```

### Authenticate

Run the built-in OAuth flow. This opens your browser, completes authorization, and saves tokens locally:

```bash
strava-mcp auth
```

You should see: `Authenticated as [Your Name]!`

### Connect to Claude Desktop

Add StravaMCP to your Claude Desktop configuration at `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "strava": {
      "command": "strava-mcp",
      "env": {
        "STRAVA_CLIENT_ID": "your_client_id",
        "STRAVA_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

Restart Claude Desktop and the Strava tools will be available.

## Available Tools

| Category | Tools | Description |
|----------|-------|-------------|
| **Activities** | 5 tools | List, view, create, update activities and get zone data |
| **Athlete** | 2 tools | Profile info and aggregate statistics (recent/YTD/all-time) |
| **Streams** | 1 tool | Time-series telemetry (HR, GPS, power, cadence, altitude) |
| **Clubs** | 1 tool | Recent activities from club members |
| **Uploads** | 2 tools | Upload activity files (GPX, TCX, FIT) and check status |

See the [README](https://github.com/Stealinglight/StravaMCP#tool-reference) for the complete tool reference with all 11 tools.

## Links

- [GitHub Repository](https://github.com/Stealinglight/StravaMCP)
- [Strava API Documentation](https://developers.strava.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [GitHub Releases](https://github.com/Stealinglight/StravaMCP/releases)

---

Built with Go by [Stealinglight](https://github.com/Stealinglight)

---
layout: default
title: Home
nav_order: 1
---

# Strava MCP Server
{: .fs-9 }

A remote Model Context Protocol server for the Strava API that runs serverless on AWS Lambda.
{: .fs-6 .fw-300 }

[Get Started](#quick-start){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/Stealinglight/StravaMCP){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## What is this?

The **Strava MCP Server** is a production-ready Model Context Protocol server that enables AI assistants like Claude to interact with your Strava account. It runs completely serverless on AWS Lambda, staying within the **FREE tier** for personal use.

### Key Features

- 🔐 **Automatic OAuth Token Refresh** - Set it and forget it
- ☁️ **Serverless AWS Lambda** - Runs in the free tier
- 📱 **Works with Claude Web & Mobile** - Use MCP anywhere
- 🏃 **11 Strava API Tools** - Activities, athlete stats, streams, clubs, uploads
- 🎯 **Activity Enrichment** - Transform generic workout titles into detailed training logs
- ⚡ **Built with Bun** - Fast builds and deployments

## Quick Start

### 1. Prerequisites

- [Bun](https://bun.sh) installed
- [AWS Account](https://aws.amazon.com/free) (free tier)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) installed
- [Strava API](https://www.strava.com/settings/api) credentials

### 2. Clone and Install

```bash
git clone https://github.com/Stealinglight/StravaMCP.git
cd StravaMCP
bun install
```

### 3. Get Strava Credentials

```bash
node get-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET
```

### 4. Build and Deploy

```bash
bun run build:lambda
bun run deploy
```

Follow the prompts to enter your Strava credentials and AWS region.

### 5. Connect to Claude

After deployment, copy the `ClaudeConnectionUrl` and add it to Claude:

**Claude Web**: Settings → MCP → Add Remote Server
**Claude Mobile**: Settings → MCP Servers → Add Server

## Architecture

```
┌─────────────────┐
│ Claude (Web/App)│
└────────┬────────┘
         │ Streamable HTTP
         ▼
┌─────────────────┐
│ AWS Lambda      │
│ Function URL    │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│ Strava API      │
└─────────────────┘
```

## Available Tools

### Activities
- `get_activities` - List recent activities
- `get_activity_by_id` - Get detailed activity info
- `create_activity` - Create manual activities
- `update_activity` - Enrich activities with details
- `get_activity_zones` - Get heart rate/power zones

### Athlete
- `get_athlete` - Get profile information
- `get_athlete_stats` - Training statistics

### Streams
- `get_activity_streams` - Time-series telemetry data

### Clubs
- `get_club_activities` - Club member activities

### Uploads
- `create_upload` - Upload FIT/TCX/GPX files
- `get_upload` - Check upload status

## Why Serverless?

Traditional MCP servers run locally and can't be used with Claude web or mobile. By deploying to AWS Lambda:

- ✅ Access your Strava data from **any device**
- ✅ Works with **Claude web and mobile**
- ✅ **Zero infrastructure** to manage
- ✅ **Free tier** means $0/month for personal use
- ✅ **Auto-scales** from zero to thousands of requests

## Cost

**$0/month** under AWS Free Tier for typical use:
- 1M Lambda requests/month (FREE forever)
- 400,000 GB-seconds compute/month (FREE for 12 months)
- Typical usage: < 10,000 requests/month

## Documentation

- [Deployment Guide](deployment) - Step-by-step AWS deployment
- [Free Tier Guide](freetier) - Stay within AWS free tier limits
- [API Reference](api) - All 11 MCP tools documented
- [Examples](examples) - Common use cases

## Links

- [GitHub Repository](https://github.com/Stealinglight/StravaMCP)
- [Strava API Documentation](https://developers.strava.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [AWS Lambda Free Tier](https://aws.amazon.com/lambda/pricing/)

---

Made with ❤️ by [Stealinglight](https://github.com/Stealinglight)

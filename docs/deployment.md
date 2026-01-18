---
layout: default
title: Deployment Guide
nav_order: 2
---

# Deployment Guide
{: .no_toc }

Deploy the Strava MCP Server to AWS Lambda in under 10 minutes.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Prerequisites

Before deploying, ensure you have:

### 1. Bun Runtime
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. AWS SAM CLI

**macOS (Homebrew)**:
```bash
brew install aws-sam-cli
```

**Linux**:
```bash
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install
```

**Windows**:
Download from [AWS SAM CLI releases](https://github.com/aws/aws-sam-cli/releases/latest)

### 3. AWS Account & Credentials

Create a [free AWS account](https://aws.amazon.com/free) if you don't have one.

Configure AWS credentials:
```bash
aws configure
```

Enter:
- **Access Key ID**: From AWS IAM
- **Secret Access Key**: From AWS IAM
- **Region**: `us-east-1` (or your preferred region)
- **Output format**: `json`

{: .note }
> Don't have AWS credentials? Go to [AWS IAM Console](https://console.aws.amazon.com/iam/) → Users → Create User → Attach `AdministratorAccess` policy → Security Credentials → Create Access Key

### 4. Strava API Credentials

Follow these steps to get your Strava API credentials:

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Click "Create an App" (or use existing)
3. Fill in details:
   - **Application Name**: Any name (e.g., "My MCP Server")
   - **Category**: Choose appropriate category
   - **Authorization Callback Domain**: `localhost`
4. Save and note your **Client ID** and **Client Secret**

## Installation

### Clone the Repository

```bash
git clone https://github.com/Stealinglight/StravaMCP.git
cd StravaMCP
```

### Install Dependencies

```bash
bun install
```

### Get Strava OAuth Tokens

Run the token helper script:

```bash
node get-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET
```

This will:
1. Start a local server on port 8888
2. Open your browser for Strava authorization
3. Display your **Refresh Token**

{: .warning }
> Save your refresh token! You'll need it for deployment.

## Deployment

### Step 1: Build the Lambda Package

```bash
bun run build:lambda
```

This compiles TypeScript to JavaScript and prepares the deployment package in `dist/`.

### Step 2: Deploy to AWS

**First-time deployment** (guided):
```bash
bun run deploy
```

You'll be prompted for:

| Prompt | What to Enter |
|--------|---------------|
| Stack name | Press Enter (uses `strava-mcp-stack`) |
| AWS Region | Your region (e.g., `us-east-1`) |
| StravaClientId | Your Strava Client ID |
| StravaClientSecret | Your Strava Client Secret |
| StravaRefreshToken | Your Strava Refresh Token |
| Confirm changes before deploy | `y` |
| Allow SAM CLI IAM role creation | `y` |
| Disable rollback | `n` |
| Save arguments to samconfig.toml | `y` |

**Subsequent deployments**:
```bash
bun run deploy:fast
```

{: .tip }
> Subsequent deploys use saved configuration and are much faster!

### Step 3: Get Your Function URL

After successful deployment, you'll see:

```
CloudFormation outputs from deployed stack
---------------------------------------------------------
Outputs
---------------------------------------------------------
Key                 ClaudeConnectionUrl
Description         URL to use in Claude web/mobile for MCP connection
Value               https://abc123xyz.lambda-url.us-east-1.on.aws/mcp

Key                 HealthCheckUrl
Description         Health check endpoint
Value               https://abc123xyz.lambda-url.us-east-1.on.aws/health
---------------------------------------------------------
```

{: .note }
> **Save the `ClaudeConnectionUrl`** - you'll need it to connect from Claude!

### Step 4: Test the Deployment

```bash
curl https://YOUR-FUNCTION-URL/health
```

Expected response:
```json
{"status":"healthy","version":"2.0.0"}
```

## Connecting to Claude

### Claude Web

1. Go to [claude.ai](https://claude.ai)
2. Click your profile → **Settings**
3. Navigate to **Model Context Protocol**
4. Click **Add Remote Server**
5. Enter:
   - **Name**: `Strava`
   - **URL**: Your `ClaudeConnectionUrl`
6. Click **Save**

### Claude Mobile (iOS/Android)

1. Open Claude app
2. Go to **Settings** → **MCP Servers**
3. Tap **Add Server**
4. Enter:
   - **Name**: `Strava`
   - **URL**: Your `ClaudeConnectionUrl`
5. Save

{: .tip }
> You can now use Strava MCP tools in any Claude conversation!

## Updating

When you make code changes:

```bash
# Edit files in src/
bun run build:lambda
bun run deploy:fast
```

Updates deploy in 30-60 seconds with zero downtime.

## Monitoring

### View Logs

```bash
sam logs -n StravaMCPFunction --stack-name strava-mcp-stack --tail
```

### View Metrics

Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/) and select your function to see:
- Invocations
- Duration
- Errors
- Throttles

### Monitor Free Tier Usage

1. Go to [AWS Billing Dashboard](https://console.aws.amazon.com/billing/)
2. Click **Free Tier** in left menu
3. Monitor Lambda usage

## Troubleshooting

### "Function URL returned 500"

**Check logs**:
```bash
sam logs -n StravaMCPFunction --stack-name strava-mcp-stack --tail
```

Common causes:
- Missing environment variables
- Expired Strava refresh token
- Cold start timeout (wait 30s and retry)

### "AccessDenied" Error

Ensure your IAM user has these permissions:
- `AWSCloudFormationFullAccess`
- `IAMFullAccess`
- `AWSLambda_FullAccess`
- `AmazonS3FullAccess`

### Refresh Token Expired

Re-run the token script:
```bash
node get-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET
```

Then update deployment:
```bash
sam deploy --parameter-overrides StravaRefreshToken=NEW_TOKEN
```

### "Port 8888 in use" (during token retrieval)

Kill the process using port 8888:
```bash
lsof -ti:8888 | xargs kill -9
```

Or edit `get-token.js` to use a different port.

## Cleanup

To delete the deployment and stop all costs:

```bash
sam delete --stack-name strava-mcp-stack
```

This removes:
- Lambda function
- Function URL
- All AWS resources
- **Stops all charges**

---

Next: [Free Tier Guide](freetier) - Learn how to stay within free tier limits

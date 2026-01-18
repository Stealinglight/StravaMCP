# Quick Deployment Guide

This guide covers deploying your Strava MCP server to AWS Lambda with automated authentication.

## One-Command Deployment

```bash
bun run deploy
```

That's it! The script automatically:
1. ✅ Generates secure AUTH_TOKEN (if needed)
2. ✅ Builds your Lambda function
3. ✅ Deploys to AWS
4. ✅ Shows complete MCP configuration

## What You'll See

### During Deployment

```
🚀 Strava MCP Deployment Starting...

🔑 No AUTH_TOKEN found. Generating secure token...
✅ Generated and saved AUTH_TOKEN to samconfig.toml

📦 Building and deploying Lambda function...

[SAM deployment progress...]
```

### After Deployment

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 DEPLOYMENT SUCCESSFUL!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Claude Desktop Configuration
Copy this to: ~/Library/Application Support/Claude/claude_desktop_config.json

{
  "mcpServers": {
    "strava": {
      "url": "https://abc123.lambda-url.us-east-1.on.aws/sse",
      "headers": {
        "Authorization": "Bearer a1b2c3d4e5f6..."
      }
    }
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 Claude Web/Mobile Configuration

In Settings → MCP Servers, add:
  Name: strava
  URL: https://abc123.lambda-url.us-east-1.on.aws/sse
  Headers:
    Authorization: Bearer a1b2c3d4e5f6...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 Security Information

  AUTH_TOKEN: a1b2c3d4e5f6...
  This token is stored in samconfig.toml (gitignored)
  Treat it like a password

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Test Your Deployment

  curl -H "Authorization: Bearer a1b2c3d4..." https://abc123.../health

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Commands

| Command                      | Purpose                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| `bun run deploy`             | Full deployment with guided prompts + auto-token generation |
| `bun run deploy:fast`        | Quick re-deployment (skips prompts)                         |
| `bun run deploy:show-config` | Display current MCP configuration                           |

## Setup Steps

### 1. Prerequisites

- [Bun](https://bun.sh) installed
- [AWS CLI](https://aws.amazon.com/cli/) configured (`aws configure`)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) installed
- [Strava API credentials](https://www.strava.com/settings/api)

### 2. Get Strava Tokens

```bash
node get-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET
```

Save the refresh token output.

### 3. Deploy

```bash
bun run deploy
```

When prompted:
- **Stack name**: `strava-mcp-stack`
- **AWS Region**: `us-east-1` (or your preference)
- **Strava Client ID**: From Strava API settings
- **Strava Client Secret**: From Strava API settings
- **Strava Refresh Token**: From step 2
- **Confirm changes**: `y`

**Note**: You will NOT be prompted for AUTH_TOKEN - it's automatically generated!

### 4. Copy Configuration

After deployment completes, copy the displayed JSON configuration into Claude.

**Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Claude Web/Mobile**: Settings → MCP Servers

### 5. Test

Use the test command shown at the end of deployment:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-url.../health
```

Expected response: `{"status":"healthy"}`

## Re-Deploying

### Quick Updates

For code changes only:

```bash
bun run deploy:fast
```

### Full Re-Deployment

To change parameters or re-generate token:

```bash
bun run deploy
```

## Viewing Configuration

Forgot your configuration? Display it anytime:

```bash
bun run deploy:show-config
```

## Token Management

### Where is my token stored?

In `samconfig.toml` (which should be gitignored):

```toml
parameter_overrides = [
  "AuthToken=your-64-character-token"
]
```

### Rotating Your Token

1. Delete or comment out AuthToken in `samconfig.toml`
2. Run `bun run deploy`
3. New token generated automatically
4. Update Claude configuration with new token

### Manual Token Generation

If you need to generate a token manually:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### "sam: command not found"

Install AWS SAM CLI:
```bash
brew install aws-sam-cli
```

### "Unable to locate credentials"

Configure AWS CLI:
```bash
aws configure
```

### Can't see configuration after deployment

Run:
```bash
bun run deploy:show-config
```

### Authentication fails in Claude

1. Verify token matches between `samconfig.toml` and Claude config
2. Ensure no extra spaces in token
3. Confirm `Authorization: Bearer ` prefix (with space after "Bearer")
4. Restart Claude after config changes

## Cost

**$0/month** on AWS Free Tier:
- 1M Lambda requests/month (free forever)
- 400,000 GB-seconds compute/month (free for 12 months)

After free tier: ~$0.07/month for personal use

## Security Notes

- AUTH_TOKEN is 64 characters (32 bytes) of cryptographic randomness
- Token stored in `samconfig.toml` (should be gitignored)
- Treat token like a password
- Anyone with token can access your Strava data
- Rotate periodically for security

## Next Steps

After successful deployment:

1. Open Claude (Desktop/Web/

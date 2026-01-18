# Authentication Implementation Summary

## What Was Implemented

Your Strava MCP server now has **Bearer Token Authentication** with fully automated deployment!

### ✅ Core Changes

1. **Authentication Middleware** (`src/lambda.ts`)
   - Validates `Authorization: Bearer <token>` header on all requests
   - Returns 401 Unauthorized for invalid/missing tokens
   - Health check endpoint (`/health`) bypasses authentication

2. **Environment Configuration** (`src/config/env.ts`)
   - Added `AUTH_TOKEN` as required environment variable
   - Updated validation to check for token presence

3. **SAM Template** (`template.yaml`)
   - Added `AuthToken` parameter (minimum 32 characters, NoEcho for security)
   - Passes token to Lambda as environment variable
   - Updated comments to reflect authentication in application code

4. **Automated Deployment** (`scripts/deploy.ts`)
   - Auto-generates secure 64-character token if not present
   - Saves token to `samconfig.toml` automatically
   - Displays complete MCP configuration after deployment
   - Color-coded output for easy reading

5. **Configuration Helper** (`scripts/show-config.ts`)
   - Shows current MCP configuration anytime
   - Reads token from `samconfig.toml`
   - Retrieves Function URL from deployed stack
   - Formatted for easy copy-paste

### ✅ Workflow Changes

**Old Way:**
```bash
# Manual token generation
node generate-mcp-config.js
# Copy token somewhere
sam deploy --parameter-overrides AuthToken=PASTE_TOKEN_HERE
# Manually format MCP config
```

**New Way:**
```bash
bun run deploy
# Token auto-generated ✅
# Deployment automated ✅
# MCP config displayed ✅
```

## How It Works

### First Deployment

1. Run `bun run deploy`
2. Script checks `samconfig.toml` for existing `AuthToken`
3. If not found, generates secure 64-character random token
4. Saves token to `samconfig.toml`
5. Runs `sam build && sam deploy --guided`
6. After deployment, retrieves Function URL from CloudFormation
7. Displays formatted MCP configuration with token

### Subsequent Deployments

1. Run `bun run deploy` or `bun run deploy:fast`
2. Uses existing token from `samconfig.toml`
3. No need to re-enter token manually

### Viewing Configuration

```bash
bun run deploy:show-config
```

Displays current configuration without re-deploying.

## Security Model

### Token Generation
- Uses Node.js `crypto.randomBytes(32)` for cryptographic randomness
- 64 hexadecimal characters = 256 bits of entropy
- Equivalent to AES-256 key strength

### Token Storage
- Stored in `samconfig.toml` (gitignored)
- Passed to Lambda as environment variable
- Lambda environment variables encrypted at rest by AWS
- Never logged or displayed in CloudFormation outputs (NoEcho: true)

### Request Flow
```
┌─────────────┐
│   Client    │
│   (Claude)  │
└──────┬──────┘
       │ Authorization: Bearer <token>
       ▼
┌──────────────┐
│   Lambda     │
│  Middleware  │──┐
└──────────────┘  │
       │          │ 1. Extract token from header
       │          │ 2. Compare to AUTH_TOKEN env var
       │          │ 3. Reject if invalid (401)
       │          └─ 4. Continue if valid
       ▼
┌──────────────┐
│  MCP Server  │
└──────────────┘
```

## Files Modified

| File                | Change                          |
| ------------------- | ------------------------------- |
| `src/lambda.ts`     | Added authentication middleware |
| `src/config/env.ts` | Added AUTH_TOKEN requirement    |
| `template.yaml`     | Added AuthToken parameter       |
| `package.json`      | Updated deployment scripts      |
| `.env.example`      | Added AUTH_TOKEN documentation  |
| `.gitignore`        | Added samconfig.toml            |
| `README.md`         | Updated deployment instructions |

## Files Created

| File                      | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `scripts/deploy.ts`       | Automated deployment with token generation |
| `scripts/show-config.ts`  | Configuration display helper               |
| `docs/authentication.md`  | Comprehensive authentication guide         |
| `DEPLOYMENT.md`           | Quick deployment reference                 |
| `AUTHENTICATION_SETUP.md` | This file                                  |

## Files Removed

| File                     | Reason                                  |
| ------------------------ | --------------------------------------- |
| `generate-mcp-config.js` | Replaced by automated deployment script |

## Usage Examples

### Deploy for First Time
```bash
bun run deploy
```

Output:
```
🚀 Strava MCP Deployment Starting...

🔑 No AUTH_TOKEN found. Generating secure token...
✅ Generated and saved AUTH_TOKEN to samconfig.toml

📦 Building and deploying Lambda function...
[...]

🎉 DEPLOYMENT SUCCESSFUL!

📋 Claude Desktop Configuration
{
  "mcpServers": {
    "strava": {
      "url": "https://abc.lambda-url.us-east-1.on.aws/sse",
      "headers": {
        "Authorization": "Bearer a1b2c3d4..."
      }
    }
  }
}
```

### Quick Re-deployment
```bash
bun run deploy:fast
```

Uses existing token, skips guided prompts.

### Show Configuration
```bash
bun run deploy:show-config
```

Displays current MCP config without deploying.

### Rotate Token
```bash
# Edit samconfig.toml and remove/comment AuthToken line
bun run deploy
# New token generated automatically
```

## Testing Authentication

### Test Without Token (Should Fail)
```bash
curl https://your-url.lambda-url.us-east-1.on.aws/health
```

Expected: `401 Unauthorized`

### Test With Valid Token (Should Succeed)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-url.lambda-url.us-east-1.on.aws/health
```

Expected: `{"status":"healthy"}`

### Test Invalid Token (Should Fail)
```bash
curl -H "Authorization: Bearer invalid-token" \
  https://your-url.lambda-url.us-east-1.on.aws/health
```

Expected: `401 Unauthorized`

## Cost Impact

**$0.00** - Bearer token authentication:
- No additional AWS services required
- No API Gateway charges
- No Cognito charges
- Authentication runs in your Lambda function (already on free tier)
- 100% free with AWS Free Tier

## Migration Path

If you have an existing deployment without authentication:

1. Pull latest code
2. Run `bun run deploy`
3. Token generated automatically
4. Update Claude configuration with new headers
5. Test with curl
6. Done!

The Lambda function will immediately start requiring authentication after deployment.

## Benefits

### Security
✅ Prevents unauthorized access to your Strava data
✅ Stops random internet users from using your Lambda
✅ Protects against API abuse and unexpected costs

### Simplicity
✅ One command deployment
✅ No manual token generation
✅ No manual configuration file editing
✅ Auto-formatted output ready to paste

### Free
✅ Zero additional AWS costs
✅ No API Gateway required
✅ No Cognito required
✅ Stays within free tier

## Next Steps

1. **Deploy**: Run `bun run deploy` (requires Bun to be installed)
2. **Configure Claude**: Copy-paste the displayed JSON
3. **Test**: Use the curl command shown in output
4. **Use**: Start asking Claude about your Strava activities!

## Support

- **Documentation**: See `docs/authentication.md` for comprehensive guide
- **Quick Reference**: See `DEPLOYMENT.md` for deployment steps
- **Troubleshooting**: Check README.md troubleshooting section

---

**Implementation Complete!** 🎉

Your Strava MCP server now has production-grade authentication while staying 100% free.

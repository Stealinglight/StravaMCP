# Authentication Guide

This guide explains how to secure your Strava MCP server with Bearer token authentication.

## Overview

The Lambda function uses **Bearer token authentication** to secure access to your Strava data. This provides:

- ✅ Simple, effective security without complex AWS services
- ✅ 100% free (no additional costs)
- ✅ Works with Claude web, mobile, and desktop
- ✅ Easy to rotate tokens when needed

## How It Works

```
┌──────────────┐
│ Claude Client│
└──────┬───────┘
       │ Authorization: Bearer <token>
       ▼
┌──────────────┐
│   Lambda     │─── Validates token
│  (Middleware)│
└──────┬───────┘
       │ If valid, proceed
       ▼
┌──────────────┐
│  MCP Server  │
│ (Strava API) │
└──────────────┘
```

## Setup Steps

### 1. Generate Your AUTH_TOKEN

Run the configuration generator:

```bash
node generate-mcp-config.js
```

This creates:
- A secure 64-character random token
- The complete MCP client configuration
- Deployment commands

**Save this token securely!** You'll need it for:
1. Deploying the Lambda function
2. Configuring your MCP client (Claude)

### 2. Deploy with Authentication

**Option A: Interactive Deployment** (guided prompts)

```bash
bun run deploy
```

When prompted for `AuthToken`, paste the token generated in step 1.

**Option B: Command Line** (specify token directly)

```bash
# Generate token first
TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Deploy with token
sam deploy --parameter-overrides \
  StravaClientId=YOUR_CLIENT_ID \
  StravaClientSecret=YOUR_SECRET \
  StravaRefreshToken=YOUR_REFRESH_TOKEN \
  AuthToken=$TOKEN
```

**Option C: Update Existing Deployment**

Add to your `samconfig.toml`:

```toml
[default.deploy.parameters]
parameter_overrides = [
  "StravaClientId=xxx",
  "StravaClientSecret=xxx", 
  "StravaRefreshToken=xxx",
  "AuthToken=your-token-here"
]
```

### 3. Configure Your MCP Client

After deployment, get your Function URL from the deployment output.

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "strava": {
      "url": "https://your-function-url.lambda-url.us-east-1.on.aws/sse",
      "headers": {
        "Authorization": "Bearer your-auth-token-here"
      },
      "description": "Strava MCP Server (authenticated)"
    }
  }
}
```

#### Claude Web/Mobile

1. Go to Settings → MCP Servers
2. Add New Server:
   - **Name**: `strava`
   - **URL**: `https://your-function-url.lambda-url.us-east-1.on.aws/sse`
   - **Headers**:
     - Key: `Authorization`
     - Value: `Bearer your-auth-token-here`

### 4. Test Authentication

Test that authentication is working:

```bash
FUNCTION_URL="https://your-function-url.lambda-url.us-east-1.on.aws/"
AUTH_TOKEN="your-token-here"

# Without token - should return 401
curl $FUNCTION_URL

# With valid token - should return {"status":"healthy"}
curl -H "Authorization: Bearer $AUTH_TOKEN" ${FUNCTION_URL}health
```

## Token Management

### Rotating Your Token

To rotate your authentication token:

1. **Generate new token**:
   ```bash
   node generate-mcp-config.js https://your-function-url.lambda-url.us-east-1.on.aws/
   ```

2. **Update Lambda deployment**:
   ```bash
   sam deploy --parameter-overrides AuthToken=NEW_TOKEN
   ```

3. **Update MCP client config** with new token

4. **Restart Claude** (Desktop) or refresh (Web/Mobile)

### Token Best Practices

✅ **DO:**
- Use the generated 64-character tokens (high entropy)
- Store tokens in password managers
- Rotate tokens periodically (every 3-6 months)
- Use different tokens for different environments

❌ **DON'T:**
- Commit tokens to version control
- Share tokens publicly
- Use short or predictable tokens
- Reuse tokens across multiple services

## Security Considerations

### What This Protects

✅ Prevents unauthorized access to your Strava data
✅ Stops random internet users from using your Lambda function
✅ Protects against API abuse and unexpected costs
✅ Simple to implement and maintain

### What This Doesn't Protect

⚠️ **Not protection against:**
- MITM attacks (use HTTPS, which Lambda provides)
- Token leakage from client-side code
- Compromised client devices
- AWS account breaches

### Production Hardening

For production deployments, consider:

1. **API Gateway + WAF**
   - Add AWS WAF for DDoS protection
   - Implement rate limiting per token
   - Add geographic restrictions

2. **Token Rotation**
   - Implement automatic token rotation
   - Use AWS Secrets Manager
   - Expire tokens after fixed period

3. **Monitoring**
   - Enable CloudWatch logging
   - Alert on authentication failures
   - Track token usage patterns

4. **Additional Security Layers**
   - Add request signing (AWS SigV4)
   - Implement IP allowlisting
   - Use AWS API Gateway with API keys

## Troubleshooting

### "401 Unauthorized" Error

**Symptoms**: MCP client shows "Unauthorized" or "Invalid token"

**Solutions**:
1. Verify token in MCP config matches deployed token
2. Check for extra spaces or quotes in token
3. Ensure `Authorization: Bearer ` prefix is correct (note the space)
4. Restart Claude after config changes

### Health Check Returns 401

**Symptoms**: `/health` endpoint requires authentication

**Solution**: Health check should NOT require auth. Check if middleware is correctly bypassing `/health` path.

### Token Not Working After Deployment

**Symptoms**: Token worked during deployment but fails in use

**Solutions**:
1. Verify Lambda environment variable is set:
   ```bash
   aws lambda get-function-configuration \
     --function-name strava-mcp-server \
     --query 'Environment.Variables.AUTH_TOKEN'
   ```
2. Check CloudWatch logs for auth errors
3. Redeploy with explicit token parameter

### Multiple Clients Need Access

**Solution**: 
- Use same token for all your devices/clients
- OR deploy separate Lambda functions with different tokens
- OR implement token-per-client logic (custom development)

## Migration from No Auth

If you're upgrading from an unauthenticated deployment:

1. **Generate token**: `node generate-mcp-config.js`
2. **Update deployment**: `sam deploy --parameter-overrides AuthToken=NEW_TOKEN`
3. **Update all MCP clients** with new headers
4. **Test** before removing old deployment

The Lambda function will immediately start requiring authentication after deployment.

## Cost Impact

**None!** Bearer token authentication:
- Runs in your application code (no extra AWS services)
- No additional API Gateway costs
- No Cognito costs
- Still 100% free with AWS Free Tier

## Further Reading

- [AWS Lambda Security Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/lambda-security.html)
- [MCP Specification - Authentication](https://modelcontextprotocol.io/docs/concepts/authentication)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

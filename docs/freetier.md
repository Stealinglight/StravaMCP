---
layout: default
title: Free Tier Guide
nav_order: 3
---

# AWS Free Tier Guide
{: .no_toc }

Stay within AWS Free Tier limits and run your Strava MCP Server for **$0/month**.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## AWS Free Tier Limits

The Strava MCP Server is designed to stay **completely free** under AWS Free Tier:

| Resource | Free Tier Limit | Duration |
|----------|-----------------|----------|
| **Lambda Requests** | 1,000,000/month | Forever |
| **Lambda Compute** | 400,000 GB-seconds/month | 12 months |
| **Data Transfer Out** | 1GB/month | 12 months |
| **Function URLs** | Unlimited | Forever |

{: .note }
> The Lambda compute and data transfer limits are free for the first 12 months. After that, they're pay-as-you-go, but still very cheap for personal use.

## Expected Usage

### Typical MCP Conversation

A single conversation with Claude using Strava MCP:

| Metric | Value |
|--------|-------|
| Requests | 10-50 |
| Compute Time | 5-25 seconds |
| Data Transfer | 10-50 KB |
| **Cost** | **$0** (within free tier) |

### Monthly Estimates

For **personal/portfolio use** (10,000 requests/month):

| Resource | Used | Free Tier | Percentage | Cost |
|----------|------|-----------|------------|------|
| Requests | 10,000 | 1,000,000 | 1% | **$0** |
| Compute (512MB) | 50,000 GB-s | 400,000 GB-s | 12.5% | **$0** |
| Data Transfer | 100 MB | 1,000 MB | 10% | **$0** |

**Total Monthly Cost**: **$0** ✅

### Heavy Usage (100,000 requests/month)

Even with heavy usage:

| Resource | Used | Free Tier | Percentage | Cost |
|----------|------|-----------|------------|------|
| Requests | 100,000 | 1,000,000 | 10% | **$0** |
| Compute (512MB) | 500,000 GB-s | 400,000 GB-s | 125% | ~$1.20/month |
| Data Transfer | 1 GB | 1 GB | 100% | **$0** |

**Total Monthly Cost**: ~**$1.20/month** (only compute overage)

{: .tip }
> Even if you exceed free tier, costs are minimal! Lambda is extremely cost-effective.

## Staying Within Free Tier

### 1. Use ARM64 Architecture

The SAM template uses `arm64` (Graviton2) processors:

```yaml
Architectures:
  - arm64  # 20% better price-performance than x86
```

This gives you **20% more compute** for the same price.

### 2. Optimize Memory Size

The function uses **512MB memory**:

```yaml
MemorySize: 512  # Balanced performance and cost
```

**Why 512MB?**
- Fast enough for Strava API calls
- Efficient for JSON processing
- Maximizes free tier GB-seconds

**Free Tier Math**:
- 400,000 GB-seconds / 0.5 GB = **800,000 seconds/month**
- ~222 hours/month of runtime
- ~9.2 days of continuous operation

### 3. Cold Start Optimization

Lambda functions "sleep" after inactivity:
- **Cold start**: First request after sleep (~2-3 seconds)
- **Warm start**: Subsequent requests (~100-300ms)

The server is optimized to minimize cold start impact:
- Lightweight dependencies
- Fast initialization
- Efficient code execution

### 4. Request Batching

Claude naturally batches requests:
- Multiple tools in one conversation = single Lambda invocation
- Reduces total request count
- Better free tier utilization

## Monitoring Usage

### AWS Billing Dashboard

1. Go to [AWS Billing Dashboard](https://console.aws.amazon.com/billing/)
2. Click **Free Tier** in the left menu
3. Monitor your usage:

```
AWS Lambda
- Requests: 12,450 / 1,000,000 (1.2%)
- Compute: 45,120 / 400,000 GB-seconds (11.3%)
```

### Set Up Billing Alerts

**Create a $1 alert** to get notified if you exceed free tier:

1. Go to [CloudWatch Billing Alarms](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:)
2. Click **Create alarm**
3. Select **Billing** metric
4. Set threshold: **$1**
5. Configure email notification
6. Create alarm

{: .tip }
> You'll get an email if charges exceed $1, giving you time to investigate before significant costs.

### Check Lambda Metrics

View real-time metrics:

```bash
sam logs -n StravaMCPFunction --stack-name strava-mcp-stack
```

Or in AWS Console:
1. Go to [Lambda Console](https://console.aws.amazon.com/lambda/)
2. Select `strava-mcp-server`
3. Click **Monitor** tab
4. View:
   - Invocations
   - Duration
   - Error rate

## Cost Projections

### After Free Tier (12 months)

When free tier expires for compute:

| Usage Level | Requests/Month | Estimated Cost |
|-------------|----------------|----------------|
| Light (1K) | 1,000 | **$0** |
| Personal (10K) | 10,000 | **$0.06** |
| Active (50K) | 50,000 | **$0.30** |
| Heavy (100K) | 100,000 | **$1.20** |

{: .note }
> Lambda requests stay free **forever** (1M/month), so you only pay for compute time after 12 months.

### Cost Breakdown

**Lambda Pricing** (us-east-1, ARM64):
- **Requests**: $0.20 per 1M requests (first 1M free)
- **Compute**: $0.0000133334 per GB-second

**Example**: 10,000 requests/month after free tier
- Requests: 10,000 / 1,000,000 × $0.20 = **$0.002**
- Compute: 50,000 GB-s × $0.0000133334 = **$0.067**
- **Total**: ~**$0.07/month**

{: .tip }
> Less than the cost of a coffee per year!

## Optimization Tips

### 1. Delete When Not in Use

If you're not using the MCP server for a while:

```bash
sam delete --stack-name strava-mcp-stack
```

Redeploy when needed:
```bash
bun run deploy:fast
```

**Benefit**: Zero costs when not deployed.

### 2. Use Logging Wisely

Reduce CloudWatch Logs costs:
- Logs are free for first 5GB/month
- After that: $0.50/GB ingested

Current logging is minimal and shouldn't exceed free tier.

### 3. Monitor Strava API Rate Limits

Strava limits:
- **100 requests per 15 minutes**
- **1,000 requests per day**

Hitting these limits won't cost you AWS charges, but will cause errors. The MCP server respects these limits.

## Security & Cost Control

### Enable Budget Limits

Set a hard budget limit:

1. Go to [AWS Budgets](https://console.aws.amazon.com/billing/home#/budgets)
2. Click **Create budget**
3. Select **Cost budget**
4. Set amount: **$5/month**
5. Configure actions:
   - Email alert at 80% ($4)
   - Stop resources at 100% (optional)

### Restrict Function URL Access

For production, enable IAM auth in `template.yaml`:

```yaml
FunctionUrlConfig:
  AuthType: AWS_IAM  # Require authentication
```

This prevents unauthorized usage and potential cost overruns.

## FAQ

### Will I be charged after 12 months?

**Lambda Requests**: No, 1M requests/month is free **forever**.

**Lambda Compute**: Yes, but only after 400,000 GB-seconds/month. At typical usage (10K requests/month), you'll pay ~$0.06/month.

### What if I exceed free tier limits?

You'll be charged pay-as-you-go rates:
- **Requests**: $0.20 per 1M
- **Compute**: $0.0000133334 per GB-second

For personal use, this is typically < $1/month.

### Can I reduce costs further?

Yes:
1. **Delete when unused**: Zero cost when not deployed
2. **Use IAM auth**: Prevent unauthorized access
3. **Set billing alerts**: Get notified early
4. **Monitor usage**: Check AWS Free Tier dashboard weekly

### What about data storage?

The Strava MCP Server doesn't store any data:
- No databases (DynamoDB)
- No file storage (S3)
- No caching layers

Everything is stateless, minimizing costs.

## Cost Comparison

| Deployment Type | Monthly Cost | Pros | Cons |
|-----------------|--------------|------|------|
| **AWS Lambda** | **$0-0.07** | Serverless, scalable, minimal management | Cold starts |
| Local Server (Raspberry Pi) | $2-5 | Always warm | Requires hardware, maintenance |
| VPS (DigitalOcean) | $4-6 | Simple | Overkill for MCP, constant cost |
| AWS EC2 t2.micro | $0 (free tier) | Always running | Free tier expires after 12 months |

{: .tip }
> Lambda is the most cost-effective option for intermittent MCP usage!

---

Next: [API Reference](api) - Explore all 11 Strava MCP tools

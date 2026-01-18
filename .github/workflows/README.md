# GitHub Actions Workflows

This directory contains automated workflows for the Strava MCP Server project.

## Available Workflows

### 📚 `deploy-docs.yml` - Documentation Deployment

**Triggers:**
- Push to `main` branch (when docs/ changes)
- Manual trigger via workflow_dispatch

**Purpose:**
Automatically builds and deploys documentation from `/docs` to GitHub Pages using Jekyll.

**Setup Required:**
1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Workflow will deploy on next push to docs/

**Manual Trigger:**
```bash
# Via GitHub UI: Actions → Deploy Documentation → Run workflow
# Or via CLI:
gh workflow run deploy-docs.yml
```

### 🚀 `deploy-lambda.yml` - Lambda Deployment (Optional)

**Triggers:**
- Manual trigger only (by default)
- Can be enabled for automatic deployment on push

**Purpose:**
Automated CI/CD pipeline for deploying Lambda function to AWS.

**Setup Required:**
Add these secrets to Settings → Secrets and variables → Actions:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REFRESH_TOKEN`

**To Enable Auto-Deploy:**
Uncomment the `push` trigger in the workflow file.

**Manual Trigger:**
```bash
gh workflow run deploy-lambda.yml \
  -f stack_name=strava-mcp-stack \
  -f region=us-east-1
```

### 🔍 `claude-code-review.yml` - Code Review

**Triggers:**
- Pull requests opened/updated

**Purpose:**
Automated code review using Claude AI on pull requests.

**Setup Required:**
Add `CLAUDE_CODE_OAUTH_TOKEN` secret to repository.

### 💬 `claude.yml` - Claude Integration

**Triggers:**
- Issue comments, PR comments, PR reviews containing `@claude`

**Purpose:**
Interactive Claude AI assistance on issues and pull requests.

**Setup Required:**
Add `CLAUDE_CODE_OAUTH_TOKEN` secret to repository.

## Common Commands

```bash
# List all workflows
gh workflow list

# View workflow runs
gh run list --workflow=deploy-docs.yml

# View workflow logs
gh run view <run-id> --log

# Manually trigger workflow
gh workflow run <workflow-name>
```

## Workflow Status

View workflow status badges in the main README.md or on the Actions tab.

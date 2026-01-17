# StravaMCP
MCP to connect Strava via remote mcp server

## Claude Code Review Integration

This repository is integrated with [Claude Code Action](https://github.com/anthropics/claude-code-action) for AI-powered code reviews and assistance.

### Features

- **Interactive Assistant**: Mention `@claude` in PR comments, issues, or reviews to get help with code questions
- **Automatic PR Reviews**: Every pull request is automatically reviewed for code quality, security, and best practices
- **Inline Comments**: Claude provides specific feedback on code lines that need attention
- **Progress Tracking**: Visual progress indicators show review status in real-time

### Setup

To enable Claude Code reviews, you need to add your Anthropic API key to repository secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `ANTHROPIC_API_KEY`
4. Value: Your API key from [console.anthropic.com](https://console.anthropic.com/)
5. Click **"Add secret"**

### Usage

**Interactive Mode**: Mention `@claude` in any PR comment, review, or issue to ask questions or request help:
```
@claude Can you explain how this authentication flow works?
@claude Please suggest improvements to this function
@claude Review this for security issues
```

**Automatic Reviews**: Pull requests are automatically reviewed when:
- Opened
- Updated with new commits
- Marked as ready for review
- Reopened

### Workflows

This repository includes two Claude Code workflows:

- **`.github/workflows/claude.yml`**: Interactive assistant that responds to `@claude` mentions
- **`.github/workflows/claude-auto-review.yml`**: Automatic code review on all PRs

### Learn More

- [Claude Code Action Documentation](https://code.claude.com/docs/en/github-actions)
- [Solutions Guide](https://github.com/anthropics/claude-code-action/blob/main/docs/solutions.md)
- [Usage Guide](https://github.com/anthropics/claude-code-action/blob/main/docs/usage.md) 

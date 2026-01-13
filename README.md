# StravaMCP
MCP to connect Strava via remote mcp server

## Automated Code Review

This repository includes automated code review powered by Claude AI. Every pull request is automatically reviewed for:

- Code quality and best practices
- Potential bugs and security issues
- Performance considerations
- Code maintainability and readability
- Testing coverage

### Setup

To enable automated code reviews, add your Anthropic API key to the repository secrets:

1. Go to your repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `ANTHROPIC_API_KEY`
4. Value: Your Anthropic API key (get one at https://console.anthropic.com/)
5. Click "Add secret"

### Configuration

Customize the review behavior by editing `.github/claude-review-config.yml`. You can adjust:

- Focus areas (security, performance, testing, etc.)
- File patterns to exclude or prioritize
- Review strictness level
- Code suggestion preferences

### How It Works

When you open or update a pull request:

1. The GitHub Action automatically fetches the code changes
2. Claude reviews the diff and provides detailed feedback
3. A review comment is posted directly on your PR
4. Address the feedback and push updates as needed

The review is informational and won't block merging - use your judgment on which suggestions to implement. 

# Claude Code Review Documentation

## Overview

This repository uses Claude AI to provide automated code reviews on all pull requests. The system analyzes code changes and provides constructive feedback to help maintain code quality, security, and best practices.

## Features

### Automated Review Areas

The Claude code reviewer examines:

1. **Code Quality**
   - Adherence to coding standards
   - Code organization and structure
   - Naming conventions
   - Code duplication

2. **Security**
   - Common vulnerabilities (SQL injection, XSS, etc.)
   - Authentication and authorization issues
   - Data validation
   - Sensitive data exposure

3. **Performance**
   - Algorithmic efficiency
   - Resource usage
   - Database query optimization
   - Memory management

4. **Testing**
   - Test coverage for new code
   - Edge case handling
   - Test quality and structure

5. **Documentation**
   - Code comments
   - Function/method documentation
   - README updates

6. **Best Practices**
   - Language-specific idioms
   - Design patterns
   - Error handling
   - Code maintainability

## Configuration

### Review Settings

Edit `.github/claude-review-config.yml` to customize:

```yaml
# Model to use (sonnet is balanced, opus is most thorough)
model: claude-sonnet-4-5-20250929

# Enable/disable specific review areas
focus_areas:
  code_quality: true
  security: true
  performance: true
  testing: true
  documentation: true
  best_practices: true

# Review strictness (1-5)
# 1 = Only critical issues
# 3 = Balanced (default)
# 5 = Pedantic, catches everything
strictness: 3
```

### File Exclusions

Exclude files from review by adding patterns:

```yaml
exclude_patterns:
  - "*.min.js"
  - "dist/**"
  - "build/**"
  - "node_modules/**"
```

### Priority Files

Give certain files higher priority in reviews:

```yaml
priority_patterns:
  - "src/**/*.ts"
  - "lib/**/*.py"
```

## Workflow

### When Reviews Trigger

Code reviews automatically run when:
- A new pull request is opened
- New commits are pushed to an existing PR
- A closed PR is reopened

### Review Process

1. **Diff Generation**: The workflow fetches all changes between the base branch and PR branch
2. **Claude Analysis**: The diff is sent to Claude for analysis
3. **Comment Posting**: Review feedback is posted as a PR comment
4. **Iteration**: Updates to the PR trigger new reviews

### Understanding Review Comments

Reviews include:

- **Summary**: High-level overview of changes
- **Issues Found**: Specific problems that should be addressed
- **Suggestions**: Improvements and recommendations
- **Positive Notes**: What was done well

## Best Practices

### For Reviewees

1. **Read the Review**: Take time to understand Claude's feedback
2. **Ask Questions**: Comment on the PR if something is unclear
3. **Iterate**: Address critical issues, consider suggestions
4. **Learn**: Use reviews as a learning opportunity

### For Maintainers

1. **Combine with Human Review**: AI reviews supplement, not replace, human judgment
2. **Customize Settings**: Adjust strictness based on team preferences
3. **Update Exclusions**: Add patterns for generated code or vendor files
4. **Monitor Quality**: Periodically review the AI feedback quality

## Limitations

### What Claude Reviews Well

- Logic errors and bugs
- Security vulnerabilities
- Code organization
- Best practice violations

### What Requires Human Review

- Business logic correctness
- Product requirements alignment
- UX/design decisions
- Complex architectural choices
- Context-specific trade-offs

## Troubleshooting

### Review Doesn't Run

1. Check that `ANTHROPIC_API_KEY` is set in repository secrets
2. Verify the workflow file has correct permissions
3. Check GitHub Actions tab for error messages

### Review Quality Issues

1. Adjust `strictness` in config (lower for fewer comments)
2. Update `focus_areas` to disable specific checks
3. Add irrelevant files to `exclude_patterns`

### API Rate Limits

If you hit Anthropic API rate limits:
1. Reduce frequency by only triggering on `opened` (not `synchronize`)
2. Use a higher tier API key
3. Add a delay between reviews

## Cost Considerations

Each review costs based on:
- Size of the diff
- Model used (Sonnet is cheaper, Opus is more expensive)
- Number of PRs

Estimate: ~$0.01-0.10 per review depending on diff size.

To reduce costs:
- Use `claude-sonnet` instead of `claude-opus`
- Exclude large generated files
- Only review priority file types

## Advanced Usage

### Custom Review Prompts

Edit `.github/workflows/claude-code-review.yml` to customize the review prompt:

```json
{
  "content": "Your custom review instructions here..."
}
```

### Multi-Language Support

The system automatically detects and reviews:
- JavaScript/TypeScript
- Python
- Go
- Rust
- Java
- And more...

### Integration with Other Tools

Combine with:
- Traditional linters (ESLint, Pylint, etc.)
- Security scanners (Snyk, Dependabot)
- CI/CD pipelines
- Code coverage tools

## Support

For issues or questions:
1. Check this documentation
2. Review GitHub Actions logs
3. Consult Anthropic API documentation
4. Open an issue in this repository

## Privacy and Security

- Code diffs are sent to Anthropic's API for review
- Anthropic's API has data privacy protections
- Reviews are posted as PR comments (visible to repo collaborators)
- No code is stored beyond the PR review

For sensitive repositories:
- Review Anthropic's privacy policy
- Consider self-hosted alternatives
- Limit review to non-sensitive files

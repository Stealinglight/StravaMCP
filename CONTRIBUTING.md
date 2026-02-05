# Contributing to Strava MCP Server

Thank you for your interest in contributing to the Strava MCP Server! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Code Style Guidelines](#code-style-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

Before contributing, please:

1. **Read the [Development Guide](docs/development.md)** - Comprehensive technical documentation
2. **Check existing issues** - See if someone is already working on your idea
3. **Open a discussion** - For major changes, discuss first in an issue

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) - Fast JavaScript runtime
- [AWS CLI](https://aws.amazon.com/cli/) - Configured with credentials
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) - For deployment
- [Git](https://git-scm.com/) - Version control
- [Strava API Credentials](https://www.strava.com/settings/api) - For testing

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/StravaMCP.git
cd StravaMCP

# Add upstream remote
git remote add upstream https://github.com/Stealinglight/StravaMCP.git
```

### Install Dependencies

```bash
bun install
```

### Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Get Strava refresh token
node get-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET

# Edit .env with your credentials
```

### Run Locally

```bash
# Start development server
bun run dev

# Server runs at http://localhost:3000
```

See [Development Guide](docs/development.md) for detailed setup instructions.

---

## How to Contribute

### Types of Contributions

We welcome:

- **Bug fixes** - Fix issues in existing code
- **New features** - Add new Strava API tools
- **Documentation** - Improve docs, guides, examples
- **Performance** - Optimize code, reduce cold starts
- **Testing** - Add test coverage
- **Examples** - Add usage examples

### Contribution Workflow

1. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our [code style guidelines](#code-style-guidelines)

3. **Test your changes**:
   ```bash
   # Type check
   bun run typecheck
   
   # Build
   bun run build:lambda
   
   # Test locally
   bun run dev
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - No `any` types without justification
- **Explicit types** for function parameters and returns
- **Use interfaces** for object shapes
- **Prefer const** over let

### File Organization

```typescript
// 1. Imports
import { z } from 'zod';
import { StravaClient } from '../lib/strava-client.js';

// 2. Types and interfaces
export interface MyType {
  id: number;
  name: string;
}

// 3. Schemas
export const MySchema = z.object({
  id: z.number(),
});

// 4. Implementation
export const myFunction = async (...) => {
  // Implementation
};

// 5. MCP tool definitions
export const myTools = [
  {
    name: 'my_tool',
    description: '...',
    inputSchema: { ... }
  }
];
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Functions**: `camelCase()`
- **Classes/Types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`

### Documentation

**Every public function must have JSDoc comments:**

```typescript
/**
 * Retrieves activities from Strava API.
 * 
 * @param client - StravaClient instance
 * @param params - Query parameters for filtering
 * @returns Array of activity summaries
 * 
 * @example
 * ```typescript
 * const activities = await getActivities(client, {
 *   after: todayTimestamp,
 *   per_page: 30
 * });
 * ```
 */
export const getActivities = async (...) => {
  // Implementation
};
```

### Logging

**Always use `console.error()` for logging:**

```typescript
// ✅ Correct
console.error('[MyTool] Processing request');

// ❌ Wrong - breaks MCP protocol
console.log('Processing request');
```

**Why?** MCP uses stdout for protocol communication. Logging to stdout corrupts messages.

---

## Pull Request Process

### Before Submitting

1. **Ensure code compiles**:
   ```bash
   bun run typecheck
   bun run build:lambda
   ```

2. **Test locally** with dev server:
   ```bash
   bun run dev
   ```

3. **Update documentation** if you:
   - Add new features
   - Change API behavior
   - Add new tools
   - Modify deployment process

4. **Add examples** in `docs/examples.md` if adding new tools

### PR Requirements

Your pull request should:

- ✅ Have a clear, descriptive title
- ✅ Include a detailed description of changes
- ✅ Reference related issues (e.g., "Fixes #123")
- ✅ Include documentation updates
- ✅ Pass type checking (`bun run typecheck`)
- ✅ Follow code style guidelines

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
How was this tested?

## Related Issues
Fixes #(issue number)

## Checklist
- [ ] Code compiles without errors
- [ ] Follows code style guidelines
- [ ] Documentation updated
- [ ] Examples added (if applicable)
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged

---

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Clear title** describing the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Environment details**:
  - OS (macOS, Linux, Windows)
  - Bun version
  - AWS SAM CLI version
  - Node version (if applicable)
- **Error messages** or logs
- **Screenshots** if relevant

### Feature Requests

For feature requests, describe:

- **Problem** you're trying to solve
- **Proposed solution** (if you have one)
- **Alternatives** you've considered
- **Use cases** and examples

### Strava API Coverage

Want to add a new Strava API endpoint?

1. Check [Strava API docs](https://developers.strava.com)
2. Verify the endpoint isn't already covered
3. Open an issue with:
   - Endpoint URL and method
   - Use case and value
   - Example request/response

---

## Adding a New Tool

Complete guide for adding Strava API tools:

### 1. Create Tool File

Create `src/tools/my-tool.ts`:

```typescript
import { z } from 'zod';
import { StravaClient } from '../lib/strava-client.js';
import { withErrorHandling } from '../utils/errors.js';

// Schema
export const MyToolSchema = z.object({
  id: z.number().describe('Resource ID'),
});

// Implementation
export const myTool = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof MyToolSchema>) => {
    return await client.get(`/endpoint/${params.id}`);
  }
);

// MCP definition
export const myTools = [
  {
    name: 'my_tool',
    description: 'Detailed description for AI agents...',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'number' as const, description: 'Resource ID' },
      },
      required: ['id'],
    },
  },
];
```

### 2. Register Tool

Update `src/lambda-web.ts` and `src/index.ts`:

```typescript
import { myTools } from './tools/my-tool.js';

// In setupServer()
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    ...activitiesTools,
    ...myTools, // Add here
  ],
}));
```

### 3. Add Types

Update `src/config/types.ts` if needed.

### 4. Document

Add to `docs/api.md` with full documentation.

### 5. Test

```bash
bun run dev
# Test with Claude Desktop
```

See [Development Guide](docs/development.md#adding-a-new-tool) for complete details.

---

## Development Resources

- **[Development Guide](docs/development.md)** - Complete technical documentation
- **[API Reference](docs/api.md)** - All 11 tools documented
- **[Examples](docs/examples.md)** - Usage patterns
- **[Strava API Docs](https://developers.strava.com)** - Official API reference
- **[MCP Specification](https://modelcontextprotocol.io)** - Protocol documentation

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or inflammatory comments
- Personal attacks
- Publishing private information
- Any unprofessional conduct

---

## Questions?

- **Documentation questions**: Open an issue
- **Feature discussions**: Open an issue
- **Bug reports**: Open an issue
- **General questions**: Open a discussion

---

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

---

Thank you for contributing to Strava MCP Server! 🏃‍♂️🚴‍♀️💪

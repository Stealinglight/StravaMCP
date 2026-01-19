---
layout: default
title: Changelog
nav_order: 8
---

# Changelog

All notable changes to the Strava MCP Server.

---

## [3.0.0] - 2026-01-18

### Added
- **OpenAI ChatGPT Connector Support**: Two new tools (`search` and `fetch`) for ChatGPT compatibility
- **Natural Language Activity Search**: Query activities using phrases like "today's runs" or "this week's activities"
- **Smart Date Parsing**: Automatically interprets temporal queries (today, this week, recent, last week)
- **Formatted Activity Documents**: Complete activity details in readable markdown format for fetch tool
- **OpenAI MCP Compliance**: Tools return JSON-encoded text content per OpenAI specification

### Changed
- **Total Tool Count**: Now 13 tools (11 Strava-specific + 2 OpenAI-required)
- **Enhanced README**: Updated with ChatGPT compatibility information
- **Project Description**: Now includes "Works with Claude & ChatGPT"

### Technical
- New `src/tools/openai.ts` module with search and fetch implementations
- OpenAI-specific types added to `src/config/types.ts` (OpenAISearchResult, OpenAISearchResponse, OpenAIFetchResult)
- Tools registered in both Lambda and local server handlers
- Maintains 100% backward compatibility with existing Claude integrations
- No new dependencies - leverages existing StravaClient and utility functions

### Compatibility
- **Backward Compatible**: All 11 original Strava tools unchanged
- **Claude Desktop/Web/Mobile**: Continues to work exactly as before
- **ChatGPT**: Now fully supported with required search/fetch tools
- **Dual Platform Support**: Single deployment works with both Claude and ChatGPT

---

## [2.0.0] - 2026-01-17

### Added
- **Automated AUTH_TOKEN Generation**: Deployment script now auto-generates secure 64-character tokens
- **Bearer Token Authentication**: Secure Lambda function with bearer token middleware for all requests
- **Configuration Display Command**: New `bun run deploy:show-config` to view MCP setup anytime
- **Streamable HTTP Transport**: Support for remote MCP via Lambda Function URLs
- **Comprehensive Documentation Site**: Full GitHub Pages documentation with guides
- **Performance Coaching Context**: Detailed tool descriptions for activity enrichment workflows

### Changed
- **Simplified Deployment**: Single `bun run deploy` command handles token generation and deployment
- **Enhanced Security**: All API requests now require Bearer token authentication
- **Improved Developer Experience**: Automated configuration display, better error messages
- **Documentation Structure**: Reorganized docs for better navigation and clarity

### Technical
- Bun-based build system for faster deployments and better performance
- TypeScript with strict type checking and comprehensive type definitions
- AWS SAM for infrastructure as code and reproducible deployments
- Zero-cost deployment on AWS Free Tier (100% free for personal use)
- Automatic OAuth token refresh in StravaClient (thread-safe implementation)

### Fixed
- OAuth token refresh race conditions with thread-safe refresh mechanism
- Environment variable handling in Lambda deployment
- CORS configuration for cross-origin MCP requests

---

## [1.0.0] - Initial Release

### Features
- **11 Strava API Tools**: Complete coverage of activities, athlete stats, streams, clubs, and uploads
- **AWS Lambda Deployment**: Serverless deployment with Function URLs
- **OAuth 2.0 Integration**: Automatic token refresh for Strava API
- **MCP SDK Integration**: Full Model Context Protocol support
- **Local Development Server**: Express-based development environment
- **Type-Safe API**: TypeScript types for all Strava API responses

### Tools Included
- `get_activities` - List and filter activities
- `get_activity_by_id` - Get detailed activity information
- `create_activity` - Create manual activities
- `update_activity` - Enrich activities with descriptions
- `get_activity_zones` - Analyze heart rate and power zones
- `get_athlete` - Get athlete profile
- `get_athlete_stats` - Training volume and statistics
- `get_activity_streams` - Telemetry data (HR, pace, power, GPS)
- `get_club_activities` - Club member activities
- `create_upload` - Upload activity files (FIT, TCX, GPX)
- `get_upload` - Check upload status

---

## Future Roadmap

Planned features for future releases:

- **Enhanced Analytics**: Advanced performance metrics and trends
- **Route Analysis**: Detailed route comparison and optimization
- **Training Plans**: Integration with structured training plans
- **Social Features**: Enhanced club and athlete interactions
- **Webhooks**: Real-time activity notifications
- **Caching Layer**: Improved performance with intelligent caching

---

For detailed technical changes, see the [GitHub commit history](https://github.com/Stealinglight/StravaMCP/commits/main).

For deployment and usage guides, see the [Documentation](https://stealinglight.github.io/StravaMCP).

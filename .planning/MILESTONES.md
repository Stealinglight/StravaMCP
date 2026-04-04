# Milestones

## v1.1 Docs, Pages & OpenClaw Positioning (Shipped: 2026-04-04)

**Phases completed:** 2 phases, 3 plans, 5 tasks

**Key accomplishments:**

- Restored deploy-docs.yml workflow from deleted commit, deploying Jekyll docs site with just-the-docs dark theme to stealinglight.github.io/StravaMCP
- README rewritten with production-grade agent framework positioning, Why Go? comparison table, and OpenClaw/ZeroClaw ecosystem Mermaid diagram
- Docs site updated with production-grade positioning, Why Go? table, and new OpenClaw/ZeroClaw integration guide page with ecosystem diagram and wiring config

---

## v1.0 StravaMCP Go Rewrite (Shipped: 2026-04-01)

**Phases completed:** 3 phases, 8 plans, 18 tasks

**Key accomplishments:**

- Go binary with mcp-go stdio server shell, file-based token store with atomic writes, and env-var config loader with validation
- Strava HTTP client with singleflight token refresh and browser OAuth flow with GET /athlete end-to-end validation
- FormatResponse/HandleToolError shared helpers plus 5 activity MCP tools (get, get_by_id, create, update, zones) with map-based partial update and 18 tests
- 4 MCP tools (athlete profile/stats, activity streams, club activities) with auto-fetch athlete ID and array-to-CSV key joining, all following Plan 01 closure-over-client pattern
- PostMultipart client method, create_upload/get_upload MCP tools with extension auto-detection, and RegisterAll wiring all 11 tools from 5 resource files
- Go module migrated to github.com/Stealinglight/StravaMCP, all TypeScript/Lambda artifacts deleted, ISC license created, .gitignore rewritten for Go
- goreleaser v2 cross-platform release config with Homebrew cask distribution, tag-triggered GitHub Actions workflow, and Go-focused CONTRIBUTING.md
- Portfolio-quality README with 8 badges, dual Mermaid architecture diagrams, 11-tool reference table, and simplified Go-focused docs site

---

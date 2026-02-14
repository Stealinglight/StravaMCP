# OpenClaw Strava Plugin + Dom Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone, distributable OpenClaw Strava plugin (11 tools + coaching skill) packaged as a GitHub Release, plus a Dom fitness coach agent for RockLobsta.

**Architecture:** Four parallel workstreams: (A) Plugin code in StravaMCP repo, (B) Skill SKILL.md, (C) Packaging + GitHub Release, (D) RockLobsta integration (Dom agent + config + infra). The plugin is a standalone package installable on any OpenClaw instance. Dom is RockLobsta-specific.

**Tech Stack:** TypeScript, Node 22 native fetch, @sinclair/typebox for schemas, OpenClaw plugin SDK, GitHub Actions, AWS CDK v2

**Design doc:** `docs/plans/2026-02-13-openclaw-strava-plugin-design.md`

**Plugin source:** `/Volumes/DataDeuce/Projects/StravaMCP/openclaw-plugin/`
**RockLobsta repo:** `/Users/Stealinglight/Developer/Projects/RockLobsta`

---

## Important Conventions (Read First)

### OpenClaw Plugin Conventions (from existing RockLobsta plugins)
- Plugin entry: export default object with `{ id, name, description, configSchema, register(api) }`
- Use `@sinclair/typebox` Type.Object() for schemas (NOT Zod)
- Use `api.registerTool()` with signature: `(toolDef, { name: string })`
- Tool execute returns: `{ content: [{ type: "text", text: "..." }], details?: {} }`
- Use native `fetch` for HTTP (NOT axios - not in the OpenClaw runtime)
- Plugin manifest: `openclaw.plugin.json` with `id`, `configSchema`, `uiHints`
- Plugin package.json needs `"openclaw": { "extensions": ["./index.ts"] }`
- Skills bundled at `<plugin-root>/skills/<skill-name>/SKILL.md`

### Standalone Plugin Packaging
- Plugin is NOT part of the OpenClaw monorepo (no `"openclaw": "workspace:*"`)
- Must declare `@sinclair/typebox` as a real dependency
- OpenClaw plugin SDK types: use `openclaw/plugin-sdk` import (resolved at install time by OpenClaw)
- Installation methods:
  - `openclaw plugins install ./path` (from extracted release)
  - `openclaw plugins install -l ./path` (symlink for dev)
  - Place in `~/.openclaw/extensions/` or `<workspace>/.openclaw/extensions/`
  - For Docker: COPY into image and reference via `plugins.load.paths` in config

### RockLobsta Conventions
- Workspace dirs: `docker/workspace-<agentId>/`
- Required workspace files: SOUL.md, IDENTITY.md, AGENTS.md
- Container workspace path: `/home/node/.app/workspace-<agentId>`
- Token files: `/home/node/.app/tokens/<name>` (EFS-persisted)
- Config: `docker/config.json`
- Secrets: AWS Secrets Manager, injected by ECS task execution role

---

## Parallel Workstreams

```
Workstream A: Plugin code (StravaMCP repo)      --- Tasks 1-6
Workstream B: Skill (bundled with plugin)        --- Task 7
Workstream C: Packaging + Release                --- Tasks 8-9
Workstream D: RockLobsta integration             --- Tasks 10-15

A and B can run fully in parallel.
C depends on A + B completing.
D (Tasks 10-13) can run in parallel with A + B.
D (Tasks 14-15) depend on C completing.
```

---

## Workstream A: Plugin Code

All files created under `/Volumes/DataDeuce/Projects/StravaMCP/openclaw-plugin/`

### Task 1: Scaffold Plugin Package

**Files:**
- Create: `openclaw-plugin/openclaw.plugin.json`
- Create: `openclaw-plugin/package.json`
- Create: `openclaw-plugin/tsconfig.json`
- Create: `openclaw-plugin/index.ts`

**Step 1: Create plugin manifest**

Create `openclaw-plugin/openclaw.plugin.json`:
```json
{
  "id": "strava",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "tokenFile": {
        "type": "string"
      }
    },
    "required": ["tokenFile"]
  },
  "uiHints": {
    "tokenFile": {
      "label": "Strava Token File Path",
      "placeholder": "~/.openclaw/tokens/strava",
      "help": "Path to a JSON file containing Strava OAuth credentials (client_id, client_secret, access_token, refresh_token, expires_at). The plugin auto-refreshes and writes back updated tokens."
    }
  }
}
```

**Step 2: Create package.json**

Create `openclaw-plugin/package.json`:
```json
{
  "name": "@stealinglight/openclaw-strava",
  "version": "1.0.0",
  "description": "OpenClaw plugin providing 11 native Strava API tools for fitness data management, activity enrichment, and training analysis",
  "type": "module",
  "license": "MIT",
  "author": "Chris McMillon <@stealinglight>",
  "repository": {
    "type": "git",
    "url": "https://github.com/Stealinglight/StravaMCP"
  },
  "keywords": ["openclaw", "strava", "fitness", "plugin"],
  "dependencies": {
    "@sinclair/typebox": "^0.34.0"
  },
  "openclaw": {
    "extensions": [
      "./index.ts"
    ]
  }
}
```

**Step 3: Create tsconfig.json**

Create `openclaw-plugin/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": ".",
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["./**/*.ts"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
```

**Step 4: Create minimal plugin entry (skeleton)**

Create `openclaw-plugin/index.ts`:
```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";

const stravaPlugin = {
  id: "strava",
  name: "Strava",
  description: "Native Strava fitness data integration with 11 tools for activity management, athlete stats, telemetry, clubs, and uploads",
  configSchema: Type.Object({
    tokenFile: Type.String({ description: "Path to JSON file containing Strava OAuth credentials" }),
  }),

  register(api: OpenClawPluginApi) {
    api.logger.info("strava: plugin registered (tools loading...)");
  },
};

export default stravaPlugin;
```

**Step 5: Commit**

```bash
git add openclaw-plugin/
git commit -m "feat(openclaw-plugin): scaffold standalone plugin package"
```

---

### Task 2: Strava OAuth Client

**Files:**
- Create: `openclaw-plugin/src/token-store.ts`
- Create: `openclaw-plugin/src/strava-client.ts`

**Step 1: Create token store (file-backed, works on any filesystem)**

Create `openclaw-plugin/src/token-store.ts`:
```typescript
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export interface StravaTokens {
  client_id: string;
  client_secret: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export class TokenStore {
  constructor(private readonly filePath: string) {}

  read(): StravaTokens {
    if (!existsSync(this.filePath)) {
      throw new Error(
        `Strava token file not found: ${this.filePath}\n` +
        `Create a JSON file at this path with: client_id, client_secret, access_token, refresh_token, expires_at`
      );
    }
    const raw = readFileSync(this.filePath, "utf-8");
    return JSON.parse(raw) as StravaTokens;
  }

  write(tokens: StravaTokens): void {
    writeFileSync(this.filePath, JSON.stringify(tokens, null, 2), "utf-8");
  }

  isExpired(tokens: StravaTokens, bufferSeconds = 300): boolean {
    return Date.now() / 1000 >= tokens.expires_at - bufferSeconds;
  }
}
```

**Step 2: Create Strava API client with auto-refresh**

Create `openclaw-plugin/src/strava-client.ts`:
```typescript
import type { TokenStore, StravaTokens } from "./token-store.js";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export class StravaClient {
  private refreshPromise: Promise<StravaTokens> | null = null;

  constructor(private readonly tokenStore: TokenStore) {}

  private async ensureValidToken(): Promise<string> {
    let tokens = this.tokenStore.read();

    if (this.tokenStore.isExpired(tokens)) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshToken(tokens);
      }
      tokens = await this.refreshPromise;
      this.refreshPromise = null;
    }

    return tokens.access_token;
  }

  private async refreshToken(tokens: StravaTokens): Promise<StravaTokens> {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: tokens.client_id,
        client_secret: tokens.client_secret,
        refresh_token: tokens.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Strava token refresh failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };

    const updated: StravaTokens = {
      ...tokens,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };

    this.tokenStore.write(updated);
    return updated;
  }

  async get(path: string, params?: Record<string, string | number | boolean>): Promise<unknown> {
    const token = await this.ensureValidToken();
    const url = new URL(`${STRAVA_API_BASE}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Strava API error (${response.status} ${path}): ${body}`);
    }

    return response.json();
  }

  async post(path: string, body: unknown): Promise<unknown> {
    const token = await this.ensureValidToken();
    const response = await fetch(`${STRAVA_API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Strava API error (${response.status} ${path}): ${text}`);
    }

    return response.json();
  }

  async put(path: string, body: unknown): Promise<unknown> {
    const token = await this.ensureValidToken();
    const response = await fetch(`${STRAVA_API_BASE}${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Strava API error (${response.status} ${path}): ${text}`);
    }

    return response.json();
  }
}
```

**Step 3: Commit**

```bash
git add openclaw-plugin/src/
git commit -m "feat(openclaw-plugin): add OAuth client with auto-refresh and file-backed token persistence"
```

---

### Task 3: Activity Tools (4 tools)

**Files:**
- Create: `openclaw-plugin/src/tools/activities.ts`

**Step 1: Create activity tools** (same code as previous plan, paths adjusted)

Create `openclaw-plugin/src/tools/activities.ts` with all 4 activity tools: `strava_get_activities`, `strava_get_activity_by_id`, `strava_create_activity`, `strava_update_activity`.

See previous plan Task 3 for full source code. All imports change from `"openclaw/plugin-sdk"` (unchanged) and `"../strava-client.js"` (unchanged).

**Step 2: Commit**

```bash
git add openclaw-plugin/src/tools/activities.ts
git commit -m "feat(openclaw-plugin): add activity tools (list, get, create, update)"
```

---

### Task 4: Athlete, Streams, and Zones Tools (4 tools)

**Files:**
- Create: `openclaw-plugin/src/tools/athlete.ts`
- Create: `openclaw-plugin/src/tools/streams.ts`
- Create: `openclaw-plugin/src/tools/zones.ts`

Same source code as previous plan Task 4, just at `openclaw-plugin/` path.

**Step: Commit**

```bash
git add openclaw-plugin/src/tools/athlete.ts openclaw-plugin/src/tools/streams.ts openclaw-plugin/src/tools/zones.ts
git commit -m "feat(openclaw-plugin): add athlete, streams, and zones tools"
```

---

### Task 5: Club and Upload Tools (3 tools)

**Files:**
- Create: `openclaw-plugin/src/tools/clubs.ts`
- Create: `openclaw-plugin/src/tools/uploads.ts`

Same source code as previous plan Task 5, just at `openclaw-plugin/` path.

**Step: Commit**

```bash
git add openclaw-plugin/src/tools/clubs.ts openclaw-plugin/src/tools/uploads.ts
git commit -m "feat(openclaw-plugin): add club and upload tools"
```

---

### Task 6: Wire Up Plugin Entry Point

**Files:**
- Modify: `openclaw-plugin/index.ts`

Replace with full entry point that imports and registers all 11 tools. Same code as previous plan Task 6.

**Step: Commit**

```bash
git add openclaw-plugin/index.ts
git commit -m "feat(openclaw-plugin): wire up all 11 tools in plugin entry point"
```

---

## Workstream B: Strava Coaching Skill

### Task 7: Create SKILL.md

**Files:**
- Create: `openclaw-plugin/skills/strava-coaching/SKILL.md`

Same content as previous plan Task 7. Bundled with plugin so it auto-discovers when the plugin is installed.

**Step: Commit**

```bash
git add openclaw-plugin/skills/
git commit -m "feat(openclaw-plugin): add strava-coaching skill with activity update workflow"
```

---

## Workstream C: Packaging + Distribution

### Task 8: Create Plugin README

**Files:**
- Create: `openclaw-plugin/README.md`

Create `openclaw-plugin/README.md`:
```markdown
# OpenClaw Strava Plugin

Native Strava API integration for [OpenClaw](https://openclaw.ai). Provides 11 tools for managing activities, viewing athlete stats, analyzing telemetry, and more. Includes a bundled `strava-coaching` skill that guides agents through the activity enrichment workflow.

## Tools

| Tool | Description |
|------|-------------|
| `strava_get_activities` | List recent activities with date filtering |
| `strava_get_activity_by_id` | Get detailed activity info |
| `strava_create_activity` | Manually create activities |
| `strava_update_activity` | Update name/description/sport_type |
| `strava_get_activity_zones` | HR and power zone distribution |
| `strava_get_athlete` | Athlete profile |
| `strava_get_athlete_stats` | Training statistics (recent/YTD/all-time) |
| `strava_get_activity_streams` | Time-series telemetry data |
| `strava_get_club_activities` | Club member activities |
| `strava_create_upload` | Upload FIT/TCX/GPX files |
| `strava_get_upload` | Check upload processing status |

## Installation

### 1. Download the latest release

```bash
# From GitHub Releases
curl -L https://github.com/Stealinglight/StravaMCP/releases/latest/download/openclaw-strava-plugin.tar.gz -o openclaw-strava-plugin.tar.gz
tar xzf openclaw-strava-plugin.tar.gz
```

### 2. Install the plugin

```bash
# Install (copies to OpenClaw extensions)
openclaw plugins install ./openclaw-strava-plugin

# Or link for development
openclaw plugins install -l ./openclaw-strava-plugin
```

### 3. Create a Strava token file

You need a JSON file with your Strava OAuth credentials:

```json
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "access_token": "YOUR_ACCESS_TOKEN",
  "refresh_token": "YOUR_REFRESH_TOKEN",
  "expires_at": 0
}
```

To get these credentials:
1. Create a Strava API Application at https://www.strava.com/settings/api
2. Use the existing StravaMCP `get-token.js` script or any OAuth 2.0 flow to get a refresh token
3. Save the JSON file (e.g. `~/.openclaw/tokens/strava`)

The plugin auto-refreshes tokens and writes updated credentials back to this file.

### 4. Enable in openclaw.json

```json
{
  "plugins": {
    "allow": ["strava"],
    "entries": {
      "strava": {
        "enabled": true,
        "config": {
          "tokenFile": "~/.openclaw/tokens/strava"
        }
      }
    }
  }
}
```

### 5. Use the coaching skill

The bundled `strava-coaching` skill is automatically available. Use `/strava-coaching` in chat or let your agent pick it up from the skill description.

## Docker / Fargate Deployment

For containerized OpenClaw instances:

1. COPY the plugin into the image:
   ```dockerfile
   COPY openclaw-strava-plugin/ /app/extensions/strava/
   ```

2. Add to config:
   ```json
   {
     "plugins": {
       "load": { "paths": ["/app/extensions/strava"] },
       "entries": { "strava": { "enabled": true, "config": { "tokenFile": "/home/node/.app/tokens/strava" } } }
     }
   }
   ```

3. Seed the token file on the persistent volume (EFS, EBS, etc.)

## Requirements

- OpenClaw with Node 22+ runtime
- Strava API application credentials
- Network access to `https://www.strava.com/api/v3`
```

**Step: Commit**

```bash
git add openclaw-plugin/README.md
git commit -m "docs(openclaw-plugin): add installation and usage README"
```

---

### Task 9: GitHub Actions Release Workflow

**Files:**
- Create: `.github/workflows/release-openclaw-plugin.yml`

Create `.github/workflows/release-openclaw-plugin.yml`:
```yaml
name: Release OpenClaw Plugin

on:
  push:
    tags:
      - 'openclaw-plugin-v*'

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Package plugin
        run: |
          cd openclaw-plugin
          # Install dependencies
          npm install --production
          cd ..
          # Create tarball of the plugin directory
          tar czf openclaw-strava-plugin.tar.gz \
            --transform 's,^openclaw-plugin,openclaw-strava-plugin,' \
            openclaw-plugin/

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: openclaw-strava-plugin.tar.gz
          generate_release_notes: true
          body: |
            ## OpenClaw Strava Plugin

            Download and install:
            ```bash
            curl -L ${{ github.server_url }}/${{ github.repository }}/releases/download/${{ github.ref_name }}/openclaw-strava-plugin.tar.gz | tar xz
            openclaw plugins install ./openclaw-strava-plugin
            ```

            See [openclaw-plugin/README.md](openclaw-plugin/README.md) for full setup instructions.
```

**Step: Commit**

```bash
git add .github/workflows/release-openclaw-plugin.yml
git commit -m "ci: add GitHub Actions workflow for OpenClaw plugin releases"
```

---

## Workstream D: RockLobsta Integration

All tasks in this workstream operate on `/Users/Stealinglight/Developer/Projects/RockLobsta`

### Task 10: Create Dom's Workspace Files

**Files:**
- Create: `docker/workspace-dom/IDENTITY.md`
- Create: `docker/workspace-dom/SOUL.md`
- Create: `docker/workspace-dom/USER.md`
- Create: `docker/workspace-dom/AGENTS.md`
- Create: `docker/workspace-dom/TOOLS.md`

Same workspace file content as the previous plan Task 8. These are RockLobsta-specific and define Dom's personality, Chris's user profile, and agent operating instructions.

**Step: Commit in RockLobsta repo**

```bash
cd /Users/Stealinglight/Developer/Projects/RockLobsta
git add docker/workspace-dom/
git commit -m "feat(dom): create fitness coach agent workspace files"
```

---

### Task 11: Update docker/config.json

**Files:**
- Modify: `docker/config.json`

Changes (same as previous plan Task 9):

1. Add Dom to `agents.list[]`
2. Add `"dom"` to `tools.agentToAgent.allow[]`
3. Add `"dom"` to main agent's `subagents.allowAgents[]`
4. Add Telegram binding for Dom (before main catch-all)
5. Add Telegram account `"dom"` with tokenFile
6. Add strava plugin to `plugins.allow[]` and `plugins.entries`
7. Add `plugins.load.paths` pointing to where the plugin will be installed:
   ```json
   "plugins": {
     "allow": ["telegram", "strava"],
     "load": {
       "paths": ["/app/extensions/strava"]
     },
     "entries": {
       "telegram": { "enabled": true },
       "strava": {
         "enabled": true,
         "config": {
           "tokenFile": "/home/node/.app/tokens/strava"
         }
       }
     }
   }
   ```

**Step: Commit**

```bash
git add docker/config.json
git commit -m "feat(config): add Dom agent, Strava plugin, and Telegram binding"
```

---

### Task 12: Update Dockerfile

**Files:**
- Modify: `docker/Dockerfile`

**Step 1: Add workspace-dom and plugin COPY lines**

In the runtime stage, add:
```dockerfile
# Dom fitness coach workspace
COPY docker/workspace-dom/     /app/workspace-dom/

# Strava plugin (downloaded from GitHub Release or copied from StravaMCP repo)
# During development, mount or copy from local. In CI, download from release.
COPY extensions/strava/        /app/extensions/strava/
```

Note: The `extensions/strava/` directory in RockLobsta will contain the plugin files. For development, this can be a symlink or a copy from StravaMCP. For CI/CD, the build workflow can download the latest release.

**Step 2: Commit**

```bash
git add docker/Dockerfile
git commit -m "feat(docker): add Dom workspace and Strava plugin to container image"
```

---

### Task 13: Update entrypoint.sh

**Files:**
- Modify: `docker/entrypoint.sh`

Add Dom workspace bootstrap call alongside existing agent workspaces:
```bash
bootstrap_workspace "/app/workspace-dom" "/home/node/.app/workspace-dom"
```

**Step: Commit**

```bash
git add docker/entrypoint.sh
git commit -m "feat(entrypoint): bootstrap Dom workspace to EFS"
```

---

### Task 14: CDK Infrastructure Updates

**Files:**
- Modify: `lib/foundation-stack.ts`
- Modify: `lib/constructs/bot-iam-roles.ts`

Same changes as previous plan Task 12:

1. Add `openclaw-dom-telegram-token` and `openclaw-strava-credentials` secrets in FoundationStack
2. Add `domTelegramSecretArn` and `stravaSecretArn` props to BotIamRoles
3. Add IAM policy statements granting execution role access to new secrets
4. Wire up and expose as public properties

**Step: Verify and commit**

```bash
npm run build && npx cdk diff
git add lib/foundation-stack.ts lib/constructs/bot-iam-roles.ts
git commit -m "feat(cdk): add Strava and Dom Telegram secrets with IAM permissions"
```

---

### Task 15: Copy Plugin Into RockLobsta for First Build

**Files:**
- Create: `extensions/strava/` (copy from StravaMCP/openclaw-plugin/)

For the initial deployment before GitHub Releases exist:

```bash
# From RockLobsta root
mkdir -p extensions/strava
cp -r /Volumes/DataDeuce/Projects/StravaMCP/openclaw-plugin/* extensions/strava/
cd extensions/strava && npm install --production && cd ../..
git add extensions/strava/
git commit -m "feat: add Strava OpenClaw plugin (initial copy from StravaMCP)"
```

Future deployments: update `build-push.yml` to download the latest release tarball instead of maintaining a copy.

---

## Post-Implementation

### Task 16: Seed Strava Token (Manual)

Chris must:

1. Create a Telegram bot for Dom via @BotFather, store token in Secrets Manager as `openclaw-dom-telegram-token`
2. Create a Strava token file with OAuth credentials and store in Secrets Manager as `openclaw-strava-credentials`
3. Update `docker/entrypoint.sh` to fetch the Strava secret and write to `/home/node/.app/tokens/strava` on startup (same pattern as Telegram token fetching)

### Task 17: Tag and Release

After all code is merged:

```bash
cd /Volumes/DataDeuce/Projects/StravaMCP
git tag openclaw-plugin-v1.0.0
git push origin openclaw-plugin-v1.0.0
```

This triggers the GitHub Actions workflow to create a release with the downloadable tarball.

---

## File Summary

### StravaMCP Repo - New Files (Plugin Package)
```
openclaw-plugin/
  openclaw.plugin.json
  package.json
  tsconfig.json
  README.md
  index.ts
  src/
    token-store.ts
    strava-client.ts
    tools/
      activities.ts
      athlete.ts
      streams.ts
      zones.ts
      clubs.ts
      uploads.ts
  skills/
    strava-coaching/
      SKILL.md
.github/workflows/
  release-openclaw-plugin.yml
```

### RockLobsta Repo - New Files (Dom Agent)
```
docker/workspace-dom/
  IDENTITY.md
  SOUL.md
  USER.md
  AGENTS.md
  TOOLS.md
extensions/strava/          (copy of plugin for initial build)
```

### RockLobsta Repo - Modified Files
```
docker/config.json          (add Dom + Strava plugin config)
docker/Dockerfile           (add workspace-dom + plugin COPY)
docker/entrypoint.sh        (add Dom workspace bootstrap)
lib/foundation-stack.ts     (add secrets)
lib/constructs/bot-iam-roles.ts  (add IAM permissions)
```

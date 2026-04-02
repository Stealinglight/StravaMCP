# Phase 4: GitHub Pages Restoration - Research

**Researched:** 2026-04-01
**Domain:** GitHub Actions / Jekyll / GitHub Pages deployment
**Confidence:** HIGH

## Summary

Phase 4 restores a GitHub Pages deployment workflow that was deleted during the v1.0 Go rewrite cleanup (commit `e2026848`). The original workflow `deploy-docs.yml` used the standard GitHub Actions Pages pipeline (checkout, configure-pages, jekyll-build-pages, upload-artifact, deploy-pages) and was functionally correct. The docs site itself (`docs/`) has already been rewritten for the Go project and contains `_config.yml` and `index.md` -- a single-page Jekyll site using `remote_theme: just-the-docs/just-the-docs` with dark mode.

The repo already has GitHub Pages enabled via the API (`build_type: "workflow"`, public, HTTPS enforced) at `stealinglight.github.io/StravaMCP`. No repository settings changes are needed -- only a workflow file needs to be created.

**Primary recommendation:** Create a new `.github/workflows/deploy-docs.yml` based on the deleted original with action versions bumped to current releases. The docs content is already complete and correct; this is purely a CI/CD restoration task.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAGES-01 | GitHub Pages deployment workflow exists and docs/ site is live at stealinglight.github.io/StravaMCP | Deleted workflow recovered from git history; action versions verified current; repo Pages config confirmed active with `build_type: "workflow"` |
| PAGES-02 | Docs site renders correctly with just-the-docs theme, dark mode, Go-focused content | `_config.yml` already configured with `remote_theme: just-the-docs/just-the-docs`, `color_scheme: dark`; `jekyll-build-pages@v1` uses `github-pages` gem v232 which includes `jekyll-remote-theme`; content in `index.md` is Go-focused |
</phase_requirements>

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| `actions/checkout` | v4 | Check out repository | Standard; v6 exists but v4 matches existing workflows in this repo |
| `actions/configure-pages` | v5 | Configure GitHub Pages settings | Matches official starter workflow template |
| `actions/jekyll-build-pages` | v1 | Build Jekyll site (includes github-pages gem v232) | Official Jekyll build action; bundles jekyll-remote-theme |
| `actions/upload-pages-artifact` | v3 | Upload built site as artifact | Matches official starter workflow; v4 available but v3 is proven |
| `actions/deploy-pages` | v4 | Deploy artifact to GitHub Pages | v5 exists (March 2026, node 24 upgrade) but v4 is stable and proven |
| just-the-docs | v0.12.0 (remote) | Jekyll theme | Already configured via `remote_theme` in `_config.yml` |

**Note on action versions:** The deleted workflow used `configure-pages@v5`, `jekyll-build-pages@v1`, `upload-pages-artifact@v3`, `deploy-pages@v4`. The official GitHub starter template (as of April 2026) uses `configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v5`. The newer versions (configure-pages v6, upload-pages-artifact v4, deploy-pages v5) are node 24 upgrades with no breaking API changes. Either set works. Recommend matching the original deleted workflow versions (v5/v1/v3/v4) since they are proven for this exact site, and bumping only causes unnecessary risk for zero benefit.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `remote_theme` (no Gemfile) | `theme` directive + Gemfile | Gemfile approach is more explicit but adds a file; remote_theme works perfectly with `jekyll-build-pages` action |
| Jekyll via `jekyll-build-pages` action | Manual Ruby + Jekyll setup | Action handles everything including gem installation; manual setup is unnecessary complexity |

## Architecture Patterns

### Existing Project Structure (docs/)

```
docs/
  _config.yml       # Jekyll config: remote_theme, dark mode, search, aux links
  index.md           # Single-page site: home, quick start, tools, links
```

### Workflow Structure

The workflow follows the standard GitHub Pages Actions pattern -- two jobs (build and deploy) with artifact passing between them. This is the canonical pattern from GitHub's own starter templates.

```yaml
# .github/workflows/deploy-docs.yml
name: Deploy Documentation to GitHub Pages

on:
  push:
    branches: [main]
    paths: ['docs/**', '.github/workflows/deploy-docs.yml']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/jekyll-build-pages@v1
        with:
          source: ./docs
          destination: ./_site
      - uses: actions/upload-pages-artifact@v3

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Key Configuration Details

1. **`source: ./docs`** -- Critical. The Jekyll source is in `docs/`, not the repo root. The deleted workflow had this correct.
2. **`paths: ['docs/**', '.github/workflows/deploy-docs.yml']`** -- Only triggers on docs changes, not on every push. This was in the original workflow and is good practice.
3. **`workflow_dispatch`** -- Allows manual trigger for testing. Was in the original.
4. **`concurrency` group** -- Prevents multiple Pages deploys racing. Standard pattern.
5. **`cancel-in-progress: false`** -- Allows current deploy to complete rather than cancelling it. Standard for production deployments.

### Anti-Patterns to Avoid

- **Using `actions/deploy-pages` without the `environment` block:** The environment configuration with `name: github-pages` is required for the deployment to work correctly with GitHub's Pages infrastructure.
- **Setting `cancel-in-progress: true`:** For Pages deployments, you want in-progress deploys to finish, not get cancelled by a new push.
- **Omitting `id-token: write` permission:** Required for the OIDC token used by the deploy action. Without it, deployment fails silently or with a confusing auth error.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Jekyll site building | Custom Ruby/gem install steps | `actions/jekyll-build-pages@v1` | Handles gem resolution, theme installation, and build in one step |
| Pages deployment auth | Manual GITHUB_TOKEN passing | `actions/deploy-pages` with `id-token: write` | Uses OIDC token exchange, not PAT; more secure |
| Theme installation | Gemfile + bundle install | `remote_theme` directive | `jekyll-build-pages` bundles `github-pages` gem which includes `jekyll-remote-theme`; no Gemfile needed |

## Common Pitfalls

### Pitfall 1: Repository Pages Source Misconfigured

**What goes wrong:** Workflow runs but nothing deploys because Pages is set to "Deploy from a branch" instead of "GitHub Actions".
**Why it happens:** Default Pages setting is branch-based, not Actions-based.
**How to avoid:** Already verified via API: `build_type: "workflow"` is set. No action needed.
**Warning signs:** Workflow completes successfully but site shows 404.

### Pitfall 2: Missing `source: ./docs` in jekyll-build-pages

**What goes wrong:** Build succeeds but produces wrong output -- either builds from root (including README.md, go.mod, etc.) or builds an empty site.
**Why it happens:** Default `source` for `jekyll-build-pages` is `./` (repository root). This project's Jekyll content is in `docs/`.
**How to avoid:** Always specify `source: ./docs` in the action configuration.
**Warning signs:** Site shows README content instead of docs site, or shows a different layout.

### Pitfall 3: Forgetting `id-token: write` Permission

**What goes wrong:** Deploy job fails with authentication error.
**Why it happens:** The `deploy-pages` action uses OIDC token exchange which requires the `id-token: write` permission.
**How to avoid:** Include all three permissions: `contents: read`, `pages: write`, `id-token: write`.
**Warning signs:** Deploy step fails with "Error: Ensure GITHUB_TOKEN has permission" or similar auth message.

### Pitfall 4: Anchor Links Not Resolving

**What goes wrong:** The `[Get Started](#quick-start)` button on the landing page doesn't scroll to the Quick Start section.
**Why it happens:** Jekyll's kramdown renderer generates heading IDs by downcasing and hyphenating. `## Quick Start` becomes `#quick-start`. This should work, but custom heading attributes (`{: .fs-9 }`) could theoretically interfere.
**How to avoid:** Verify after deployment that the anchor link works. The current markup looks correct.
**Warning signs:** Click "Get Started" button and nothing happens.

## Code Examples

### Complete Workflow File (restore from deleted original with verified versions)

```yaml
# Source: recovered from git commit e2026848^ with versions verified against
# GitHub API releases endpoint (April 2026)
name: Deploy Documentation to GitHub Pages

on:
  push:
    branches:
      - main
    paths:
      - 'docs/**'
      - '.github/workflows/deploy-docs.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Build with Jekyll
        uses: actions/jekyll-build-pages@v1
        with:
          source: ./docs
          destination: ./_site

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

This is identical to the deleted workflow. All action versions remain current and match the official GitHub starter template.

### Current _config.yml (no changes needed)

```yaml
# Source: docs/_config.yml (already in repo)
title: StravaMCP
description: MCP server for Strava API - a fast Go binary with zero cloud infrastructure
url: https://stealinglight.github.io
baseurl: /StravaMCP
remote_theme: just-the-docs/just-the-docs
color_scheme: dark
search_enabled: true
enable_copy_code_button: true
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Branch-based Pages deploy | GitHub Actions workflow deploy | 2022 | Must use `build_type: "workflow"` in repo settings (already set) |
| `gem "just-the-docs"` in Gemfile | `remote_theme: just-the-docs/just-the-docs` | Still both supported | `remote_theme` is simpler; no Gemfile needed when using `jekyll-build-pages` action |

**Deprecated/outdated:**
- `actions/configure-pages@v4` and below: superseded but still functional
- Branch-based Pages deployment: still works but Actions-based is now the standard

## Open Questions

None. This phase is straightforward:

1. The deleted workflow is fully recoverable from git history
2. All action versions have been verified as current
3. GitHub Pages is already configured correctly in repo settings
4. The docs content is already written and correct
5. No Gemfile or additional dependencies are needed

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | GitHub Actions (workflow execution) |
| Config file | `.github/workflows/deploy-docs.yml` |
| Quick run command | `gh workflow run deploy-docs.yml` (manual trigger) |
| Full suite command | Push to main with docs/ change, verify deployment |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGES-01 | Workflow deploys docs/ to GitHub Pages | smoke | `gh run list --workflow=deploy-docs.yml --limit=1` (check status after push) | N/A (workflow file) |
| PAGES-02 | Site renders with just-the-docs theme and dark mode | manual | `curl -s -o /dev/null -w '%{http_code}' https://stealinglight.github.io/StravaMCP/` | N/A |

### Sampling Rate

- **Per task commit:** Push to main triggers workflow; verify run succeeds via `gh run list`
- **Per wave merge:** Verify site loads at `https://stealinglight.github.io/StravaMCP/`
- **Phase gate:** Site returns HTTP 200 and contains expected content

### Wave 0 Gaps

None -- this phase creates a workflow file and verifies deployment. No test framework setup needed; validation is the deployment itself succeeding.

## Sources

### Primary (HIGH confidence)
- Git history commit `e2026848` -- recovered deleted `deploy-docs.yml` workflow verbatim
- GitHub API `repos/Stealinglight/StravaMCP/pages` -- confirmed Pages enabled, `build_type: "workflow"`, HTTPS enforced
- GitHub API releases endpoints -- verified action versions: checkout@v4 (latest v6.0.2), configure-pages@v5 (latest v6.0.0), jekyll-build-pages@v1 (latest v1.0.13), upload-pages-artifact@v3 (latest v4.0.0), deploy-pages@v4 (latest v5.0.0)
- GitHub official starter workflow `pages/jekyll-gh-pages.yml` -- confirmed canonical pattern matches our approach

### Secondary (MEDIUM confidence)
- `actions/jekyll-build-pages` Gemfile -- confirmed `github-pages` gem v232 (includes `jekyll-remote-theme`)
- just-the-docs v0.12.0 release -- latest theme version (Jan 2026)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all action versions verified via GitHub API; deleted workflow recovered from git
- Architecture: HIGH -- workflow is identical to official GitHub starter template
- Pitfalls: HIGH -- common issues well-documented; repo settings already verified correct

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable; GitHub Actions Pages pipeline changes infrequently)

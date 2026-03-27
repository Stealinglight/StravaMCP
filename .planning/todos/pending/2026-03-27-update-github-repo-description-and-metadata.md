---
created: "2026-03-27T16:37:19.707Z"
title: Update GitHub repo description and metadata
area: docs
files: []
---

## Problem

The repo is undergoing a full rewrite from TypeScript to Go. The GitHub repo description, topics, and other metadata (About section, website link, etc.) still reflect the old TypeScript/AWS Lambda version. Needs to be updated to reflect the new Go binary MCP server identity.

## Solution

Update via GitHub API or web UI:
- Repo description: reflect Go MCP server for Strava API
- Topics: add `go`, `mcp`, `strava`, `mcp-server`; remove TS/Lambda-related tags
- About section / homepage link if applicable
- Consider updating the repo's social preview image for portfolio visibility

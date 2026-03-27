---
created: "2026-03-27T16:37:19.707Z"
title: Set up GitHub Actions release workflow for binary releases
area: tooling
files: []
---

## Problem

This is a Go binary MCP server. When commits land on main, there should be an automated release pipeline that builds cross-platform binaries and creates GitHub Releases. Users need to download pre-built binaries without compiling from source.

## Solution

Set up goreleaser with GitHub Actions:
- Trigger on push to main (or on tag push, TBD)
- Build cross-platform binaries (macOS arm64/amd64, Linux arm64/amd64, Windows amd64)
- Create GitHub Release with changelog and binary assets
- Inject version/commit/date via Go ldflags
- This aligns with Phase 3 requirement DOCS-02 (single-binary distribution via goreleaser)

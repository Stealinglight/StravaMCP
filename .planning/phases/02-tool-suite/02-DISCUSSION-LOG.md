# Phase 2: Tool Suite - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 02-tool-suite
**Areas discussed:** Tool response format, Upload file handling, Tool description depth, Tool grouping strategy

---

## Tool Response Format

| Option | Description | Selected |
|--------|-------------|----------|
| Raw JSON | Return pretty-printed JSON from Strava API responses. Simple, complete, LLMs handle JSON well. | ✓ |
| Formatted text | Return human-readable summaries. More token-efficient but loses detail. | |
| JSON with summary header | Brief text summary on line 1, then full JSON below. Best of both worlds. | |

**User's choice:** Raw JSON
**Notes:** Matches existing TypeScript behavior.

### Follow-up: Rate limit in responses

| Option | Description | Selected |
|--------|-------------|----------|
| Only at >80% | Append warning only when usage exceeds 80% of 15-min window. | ✓ |
| Always include usage | Always append current rate limit usage. | |
| You decide | Claude picks. | |

**User's choice:** Only at >80%
**Notes:** Carries forward Phase 1 decision.

---

## Upload File Handling

| Option | Description | Selected |
|--------|-------------|----------|
| File path | Tool accepts a local file path string. Reads from disk, uploads via multipart. | ✓ |
| Base64 content | Tool accepts base64-encoded file content inline. | |
| Both options | Accept either file path or base64. | |

**User's choice:** File path
**Notes:** Simple, works for LLM agents that can write files.

### Follow-up: data_type detection

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-detect from extension | Infer gpx/tcx/fit from file extension. Fall back to explicit param. | ✓ |
| Always require data_type | data_type is a required parameter. | |
| You decide | Claude picks. | |

**User's choice:** Auto-detect from extension

---

## Tool Description Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Match TS quality, improve where weak | Port existing descriptions as baseline, enhance vague ones. | ✓ |
| Port verbatim from TS | Copy existing descriptions exactly. | |
| Enhanced with examples | Rich descriptions with inline usage examples. | |

**User's choice:** Match TS quality, improve where weak

### Follow-up: Tool naming convention

| Option | Description | Selected |
|--------|-------------|----------|
| Match TS names exactly | Same tool names as TypeScript version. Zero migration friction. | ✓ |
| Prefix with strava_ | e.g., strava_get_activities. Namespaced. | |
| You decide | Claude picks. | |

**User's choice:** Match TS names exactly

---

## Tool Grouping Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| One file per resource | activities.go, athlete.go, etc. Mirrors TS structure. | ✓ |
| One file per tool | get_activities.go, create_activity.go, etc. More granular. | |
| You decide | Claude picks. | |

**User's choice:** One file per resource

### Follow-up: Test organization

| Option | Description | Selected |
|--------|-------------|----------|
| Co-located tests | activities_test.go next to activities.go. Standard Go convention. | ✓ |
| You decide | Claude picks. | |

**User's choice:** Co-located tests

---

## Claude's Discretion

- Error handling wrapper pattern
- Internal helper functions
- Test mock server structure
- Whether to split large tool files

## Deferred Ideas

None -- discussion stayed within phase scope.

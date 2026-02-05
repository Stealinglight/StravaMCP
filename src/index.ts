#!/usr/bin/env node

import { createApp } from './app.js';

async function main() {
  const { app, config } = await createApp('local');
  const port = config.PORT;

  app.listen(port, () => {
    console.error(`[StravaServer] MCP server running on http://localhost:${port}`);
    console.error(`[StravaServer] MCP endpoint: http://localhost:${port}/mcp`);
    console.error(`[StravaServer] SSE endpoint: http://localhost:${port}/sse`);
    console.error(`[StravaServer] Health check: http://localhost:${port}/health`);
    console.error(
      `[StravaServer] OAuth metadata: http://localhost:${port}/.well-known/oauth-authorization-server`
    );
  });
}

main().catch((error) => {
  console.error('[StravaServer] Failed to start:', error);
  process.exit(1);
});

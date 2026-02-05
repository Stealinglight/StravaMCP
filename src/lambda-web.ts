#!/usr/bin/env node

import { createApp } from './app.js';

const DEFAULT_PORT = 8080;

async function main() {
  const { app } = await createApp('lambda');
  const port =
    Number(process.env.AWS_LWA_PORT) ||
    Number(process.env.PORT) ||
    DEFAULT_PORT;

  app.listen(port, () => {
    console.error(`[StravaLambda] Web adapter server listening on ${port}`);
  });
}

main().catch((error) => {
  console.error('[StravaLambda] Failed to start:', error);
  process.exit(1);
});

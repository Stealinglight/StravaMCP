#!/usr/bin/env bun

/**
 * Show MCP Configuration
 * 
 * Displays the current MCP configuration based on deployed stack
 * Usage: bun run deploy:show-config
 */

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function getAuthToken(): string | null {
  const samConfigPath = 'samconfig.toml';
  
  if (!existsSync(samConfigPath)) {
    return null;
  }

  const content = readFileSync(samConfigPath, 'utf-8');
  const authTokenMatch = content.match(/AuthToken\s*=\s*"([^"]+)"/);
  
  return authTokenMatch ? authTokenMatch[1] : null;
}

function getFunctionUrl(): string | null {
  try {
    const output = execSync('sam list stack-outputs --stack-name strava-mcp-stack', {
      encoding: 'utf-8'
    });
    
    const match = output.match(/ClaudeConnectionUrl\s+(.+?)(?:\s|$)/);
    if (match) {
      return match[1].replace(/mcp$/, '');
    }
    
    const urlMatch = output.match(/(https:\/\/[a-z0-9-]+\.lambda-url\.[a-z0-9-]+\.on\.aws\/)/);
    return urlMatch ? urlMatch[1] : null;
  } catch (error) {
    return null;
  }
}

function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('📋 Strava MCP Configuration', colors.bright + colors.green);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);
  
  const authToken = getAuthToken();
  const functionUrl = getFunctionUrl();
  
  if (!authToken) {
    log('❌ No AUTH_TOKEN found in samconfig.toml', colors.red);
    log('   Run: bun run deploy\n', colors.yellow);
    process.exit(1);
  }
  
  if (!functionUrl) {
    log('❌ Stack not deployed or unable to retrieve Function URL', colors.red);
    log('   Run: bun run deploy\n', colors.yellow);
    process.exit(1);
  }
  
  const sseUrl = functionUrl.endsWith('/') ? `${functionUrl}sse?token=${authToken}` : `${functionUrl}/sse?token=${authToken}`;
  
  log('Claude Connector Configuration:', colors.bright);
  log('Copy and paste this URL into Claude Settings → Connectors:\n', colors.yellow);
  
  log(sseUrl, colors.green + colors.bright);
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('\nConnection Details:', colors.bright);
  log(`  SSE URL: ${sseUrl}`, colors.blue);
  log(`  Token embedded in URL for Claude compatibility`, colors.blue);
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('\nTest:', colors.bright);
  log(`  curl -H "Authorization: Bearer ${authToken}" ${functionUrl}health\n`, colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);
}

main();

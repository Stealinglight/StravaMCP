#!/usr/bin/env bun

/**
 * Automated Strava MCP Deployment Script
 * 
 * This script:
 * 1. Auto-generates AUTH_TOKEN if not present in samconfig.toml
 * 2. Runs sam deploy with guided prompts
 * 3. Displays formatted MCP configuration for easy copy-paste
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function generateAuthToken(): string {
  return randomBytes(32).toString('hex');
}

function checkSamConfig(): { hasAuthToken: boolean; authToken?: string } {
  const samConfigPath = 'samconfig.toml';
  
  if (!existsSync(samConfigPath)) {
    return { hasAuthToken: false };
  }

  const content = readFileSync(samConfigPath, 'utf-8');
  
  // Look for AuthToken in parameter_overrides
  const authTokenMatch = content.match(/AuthToken\s*=\s*"([^"]+)"/);
  
  if (authTokenMatch) {
    return { hasAuthToken: true, authToken: authTokenMatch[1] };
  }

  return { hasAuthToken: false };
}

function updateSamConfig(authToken: string) {
  const samConfigPath = 'samconfig.toml';
  let content = '';

  if (existsSync(samConfigPath)) {
    content = readFileSync(samConfigPath, 'utf-8');
    
    // Check if parameter_overrides section exists
    if (content.includes('parameter_overrides')) {
      // Check if AuthToken already exists
      if (content.includes('AuthToken')) {
        // Update existing AuthToken
        content = content.replace(
          /AuthToken\s*=\s*"[^"]*"/,
          `AuthToken="${authToken}"`
        );
      } else {
        // Add AuthToken to existing parameter_overrides
        content = content.replace(
          /parameter_overrides\s*=\s*\[/,
          `parameter_overrides = [\n  "AuthToken=${authToken}",`
        );
      }
    } else {
      // Add entire parameter_overrides section
      content += `\n[default.deploy.parameters]\nparameter_overrides = [\n  "AuthToken=${authToken}"\n]\n`;
    }
  } else {
    // Create new samconfig.toml
    content = `version = 0.1
[default.deploy.parameters]
stack_name = "strava-mcp-stack"
resolve_s3 = true
s3_prefix = "strava-mcp"
region = "us-east-1"
capabilities = "CAPABILITY_IAM"
parameter_overrides = [
  "AuthToken=${authToken}"
]
`;
  }

  writeFileSync(samConfigPath, content, 'utf-8');
}

function displayMCPConfig(functionUrl: string, authToken: string) {
  const sseUrl = functionUrl.endsWith('/') ? `${functionUrl}sse?token=${authToken}` : `${functionUrl}/sse?token=${authToken}`;
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('🎉 DEPLOYMENT SUCCESSFUL!', colors.green + colors.bright);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);
  
  log('📋 Claude Connector Configuration', colors.bright);
  log('Copy and paste this URL into Claude Settings → Connectors:\n', colors.yellow);
  
  log(sseUrl, colors.green + colors.bright);
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('\n🔐 Security Information\n', colors.bright);
  log(`  AUTH_TOKEN: ${authToken}`, colors.magenta);
  log('  This token is stored in samconfig.toml (gitignored)', colors.yellow);
  log('  Treat it like a password - anyone with this token can access your Strava data', colors.yellow);
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('\n✅ Test Your Deployment\n', colors.bright);
  log(`  curl -H "Authorization: Bearer ${authToken}" ${functionUrl}health\n`, colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);
}

function extractFunctionUrl(output: string): string | null {
  // Look for ClaudeConnectionUrl in CloudFormation outputs
  const match = output.match(/ClaudeConnectionUrl\s+(.+?)(?:\s|$)/);
  if (match) {
    return match[1].replace(/mcp$/, ''); // Remove 'mcp' suffix to get base URL
  }
  
  // Fallback: look for any lambda-url
  const urlMatch = output.match(/(https:\/\/[a-z0-9-]+\.lambda-url\.[a-z0-9-]+\.on\.aws\/)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  return null;
}

async function main() {
  log('\n🚀 Strava MCP Deployment Starting...\n', colors.bright + colors.cyan);
  
  // Check for AUTH_TOKEN in samconfig.toml
  const { hasAuthToken, authToken: existingToken } = checkSamConfig();
  
  let authToken = existingToken;
  
  if (!hasAuthToken) {
    log('🔑 No AUTH_TOKEN found. Generating secure token...', colors.yellow);
    authToken = generateAuthToken();
    updateSamConfig(authToken);
    log(`✅ Generated and saved AUTH_TOKEN to samconfig.toml\n`, colors.green);
  } else {
    log(`✅ Using existing AUTH_TOKEN from samconfig.toml\n`, colors.green);
  }
  
  // Run sam deploy
  log('📦 Building and deploying Lambda function...\n', colors.blue);
  
  try {
    const output = execSync('sam build && sam deploy --guided', {
      stdio: 'inherit',
      encoding: 'utf-8'
    });
    
    // Try to extract function URL from deployment output
    // Note: With --guided, we need to get the URL from CloudFormation outputs after deployment
    log('\n📡 Retrieving deployment information...\n', colors.blue);
    
    const stackInfo = execSync('sam list stack-outputs --stack-name strava-mcp-stack', {
      encoding: 'utf-8'
    });
    
    const functionUrl = extractFunctionUrl(stackInfo);
    
    if (functionUrl && authToken) {
      displayMCPConfig(functionUrl, authToken);
    } else {
      log('⚠️  Could not automatically extract Function URL', colors.yellow);
      log('Run this command to see outputs:', colors.yellow);
      log('  sam list stack-outputs --stack-name strava-mcp-stack\n', colors.blue);
      
      if (authToken) {
        log(`Your AUTH_TOKEN: ${authToken}\n`, colors.magenta);
      }
    }
    
  } catch (error) {
    log('\n❌ Deployment failed', colors.bright);
    log('See error output above for details\n', colors.yellow);
    process.exit(1);
  }
}

main();

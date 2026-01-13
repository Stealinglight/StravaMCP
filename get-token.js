#!/usr/bin/env node

/**
 * Strava OAuth Token Retrieval Script
 * 
 * This script helps you obtain the initial OAuth tokens from Strava.
 * 
 * Setup:
 * 1. Go to https://www.strava.com/settings/api
 * 2. Create an application (or use existing one)
 * 3. Note your Client ID and Client Secret
 * 4. Set Authorization Callback Domain to "localhost"
 * 
 * Usage:
 * node get-token.js <client_id> <client_secret>
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node get-token.js <client_id> <client_secret>');
  console.error('');
  console.error('Get your credentials from: https://www.strava.com/settings/api');
  process.exit(1);
}

const CLIENT_ID = args[0];
const CLIENT_SECRET = args[1];
const REDIRECT_URI = 'http://localhost:8888/callback';
const PORT = 8888;

// Scopes needed for the MCP server
const SCOPES = [
  'read',
  'activity:read_all',
  'activity:write',
  'profile:read_all',
];

let authCode = null;
let server = null;

// Create HTTP server to receive OAuth callback
server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body>
            <h1>Authorization Failed</h1>
            <p>Error: ${error}</p>
            <p>You can close this window.</p>
          </body>
        </html>
      `);
      console.error(`\n❌ Authorization failed: ${error}`);
      server.close();
      process.exit(1);
      return;
    }

    if (code) {
      authCode = code;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body>
            <h1>Authorization Successful!</h1>
            <p>You can close this window and return to the terminal.</p>
          </body>
        </html>
      `);

      // Exchange code for tokens
      try {
        const tokens = await exchangeToken(code);
        displayTokens(tokens);
        server.close();
        process.exit(0);
      } catch (error) {
        console.error(`\n❌ Failed to exchange token: ${error.message}`);
        server.close();
        process.exit(1);
      }
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Exchange authorization code for tokens
function exchangeToken(code) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
    });

    const options = {
      hostname: 'www.strava.com',
      port: 443,
      path: '/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Display tokens in a user-friendly format
function displayTokens(tokens) {
  const expiresAt = new Date(tokens.expires_at * 1000);

  console.log('\n' + '='.repeat(70));
  console.log('✅ SUCCESS! Your Strava OAuth tokens have been obtained.');
  console.log('='.repeat(70));
  console.log('\nAdd these to your .env file:\n');
  console.log('STRAVA_CLIENT_ID=' + CLIENT_ID);
  console.log('STRAVA_CLIENT_SECRET=' + CLIENT_SECRET);
  console.log('STRAVA_REFRESH_TOKEN=' + tokens.refresh_token);
  console.log('\n' + '='.repeat(70));
  console.log('\nToken Details:');
  console.log('  Access Token:  ' + tokens.access_token);
  console.log('  Refresh Token: ' + tokens.refresh_token);
  console.log('  Expires At:    ' + expiresAt.toISOString());
  console.log('  Athlete ID:    ' + tokens.athlete.id);
  console.log('  Athlete Name:  ' + tokens.athlete.firstname + ' ' + tokens.athlete.lastname);
  console.log('\n' + '='.repeat(70));
  console.log('\nNext Steps:');
  console.log('1. Create a .env file in your project root');
  console.log('2. Copy the three environment variables above into the .env file');
  console.log('3. Run: npm run dev');
  console.log('='.repeat(70) + '\n');
}

// Start the server and open authorization URL
server.listen(PORT, () => {
  const authUrl =
    `https://www.strava.com/oauth/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${SCOPES.join(',')}&` +
    `approval_prompt=auto`;

  console.log('\n' + '='.repeat(70));
  console.log('🚀 Strava OAuth Token Retrieval');
  console.log('='.repeat(70));
  console.log('\nListening for OAuth callback on port', PORT);
  console.log('\n📋 Please open this URL in your browser:\n');
  console.log('  ' + authUrl);
  console.log('\n' + '='.repeat(70));
  console.log('\nWaiting for authorization...\n');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Please close the other application or choose a different port.`);
  } else {
    console.error(`\n❌ Server error: ${error.message}`);
  }
  process.exit(1);
});

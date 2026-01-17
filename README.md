# Strava MCP Server

A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the Strava API. This server enables AI assistants like Claude to manage your Strava account, with a focus on enriching workout data - especially activities imported from devices like Apple Watch.

## Features

- 🔐 **Automatic OAuth Token Refresh**: Never worry about expired tokens
- 🏃 **Comprehensive Activity Management**: Get, create, and update activities
- 📊 **Telemetry Data Access**: Deep analysis with activity streams (heart rate, pace, power, elevation)
- 👤 **Athlete Profile & Stats**: Access profile information and training statistics
- 👥 **Club Integration**: Monitor club activities
- 📁 **File Uploads**: Import activities from FIT, TCX, and GPX files
- 🎯 **Enrichment Focused**: Transform generic activity titles into detailed training logs

## Primary Use Case: Activity Enrichment

Many fitness devices (especially Apple Watch) auto-sync activities to Strava with generic names like "Morning Run" and no description. This MCP server excels at helping AI assistants enrich these activities with:

- Meaningful, descriptive titles
- Detailed descriptions (weather, effort, training notes)
- Proper sport type classification
- Training insights and analysis

See [agents.md](./agents.md) for comprehensive guidance on using this server as a Performance Coach.

## Installation

### Prerequisites

- Node.js 18+ and npm
- A Strava account
- Strava API credentials (Client ID and Client Secret)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Stealinglight/StravaMCP.git
   cd StravaMCP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a Strava API Application**
   
   Go to https://www.strava.com/settings/api and create a new application:
   - **Application Name**: Choose any name (e.g., "My MCP Server")
   - **Category**: Choose the most appropriate category
   - **Club**: Leave blank unless you have a specific club
   - **Website**: Can be http://localhost
   - **Authorization Callback Domain**: Set to `localhost`
   
   After creating, note your **Client ID** and **Client Secret**.

4. **Get OAuth Tokens**
   
   Run the token retrieval script:
   ```bash
   node get-token.js <your_client_id> <your_client_secret>
   ```
   
   This will:
   - Start a local server on port 8888
   - Open your browser for Strava authorization
   - Exchange the authorization code for tokens
   - Display your credentials

5. **Configure Environment Variables**
   
   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   STRAVA_CLIENT_ID=your_client_id
   STRAVA_CLIENT_SECRET=your_client_secret
   STRAVA_REFRESH_TOKEN=your_refresh_token
   PORT=3000  # Optional, defaults to 3000
   ```

6. **Build the Project**
   ```bash
   npm run build
   ```

## Usage

### Running the MCP Server

This server runs as a **remote MCP server** using SSE (Server-Sent Events) transport, accessible over HTTP.

#### Development Mode (with auto-reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file) with the following endpoints:
- **SSE endpoint**: `http://localhost:3000/sse` - For establishing server-to-client event streams
- **Message endpoint**: `http://localhost:3000/message` - For client-to-server messages
- **Health check**: `http://localhost:3000/health` - Server status

### Integrating with Claude Desktop

First, start the server:
```bash
npm start
```

Then add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "strava": {
      "url": "http://localhost:3000/sse"
    }
  }
}
```

Restart Claude Desktop to load the new configuration.

### Using with Other MCP Clients

This server uses **SSE (Server-Sent Events) transport**, making it compatible with any MCP client that supports remote SSE connections.

**Connection Details:**
- **SSE URL**: `http://localhost:3000/sse`
- **Message endpoint**: `http://localhost:3000/message`
- **Transport type**: SSE

Refer to your MCP client's documentation for specific remote server integration instructions.

### Testing with MCP Inspector

You can test the server using the official MCP Inspector:

```bash
# Start the server first
npm start

# In another terminal, run the inspector
npx @modelcontextprotocol/inspector http://localhost:3000/sse
```

The inspector will open at `http://localhost:6274` with an interactive UI to test all available tools.

## Available Tools

### Activities
- **get_activities**: List recent activities with date filtering
- **get_activity_by_id**: Get detailed information about a specific activity
- **create_activity**: Create a new manual activity
- **update_activity**: Update existing activity (name, description, type, etc.) ⭐
- **get_activity_zones**: Get heart rate and power zone data

### Athlete
- **get_athlete**: Get authenticated athlete's profile
- **get_athlete_stats**: Get activity statistics (recent, YTD, all-time)

### Streams (Telemetry)
- **get_activity_streams**: Get time-series data (heart rate, pace, power, GPS, elevation, etc.)

### Clubs
- **get_club_activities**: Get recent activities from club members

### Uploads
- **create_upload**: Upload activity files (FIT, TCX, GPX)
- **get_upload**: Check upload processing status

## Architecture

```
/src
  /config         - Environment configuration and TypeScript types
  /lib            - Core StravaClient with OAuth auto-refresh
  /tools          - MCP tool definitions organized by domain
    activities.ts - Activity CRUD operations
    athlete.ts    - Athlete profile and statistics
    streams.ts    - Telemetry data access
    clubs.ts      - Club activities
    uploads.ts    - File uploads
  /utils          - Utility functions (error handling, formatting)
  index.ts        - Main MCP server entry point
```

### Key Design Decisions

1. **Remote SSE Transport**: Uses Server-Sent Events (SSE) transport over HTTP, enabling the server to be accessed remotely by any MCP client. Supports multiple concurrent sessions with automatic cleanup on disconnect.

2. **Generic Request Method**: The `StravaClient` has a generic `request()` method that can call ANY Strava API endpoint, making the server future-proof as new endpoints are added.

3. **Automatic Token Refresh**: OAuth tokens are automatically refreshed before expiry (with a 5-minute buffer), ensuring uninterrupted access.

4. **Modular Tool Structure**: Tools are organized by domain (activities, athlete, streams, etc.) for maintainability.

5. **Rich Tool Descriptions**: Every tool has detailed descriptions to help AI assistants understand when and how to use them.

6. **TypeScript with Zod**: Strong typing with runtime validation for reliability.

## Development

### Type Checking
```bash
npm run typecheck
```

### Building
```bash
npm run build
```

### Project Structure
- **src/**: TypeScript source code
- **dist/**: Compiled JavaScript (generated by `npm run build`)
- **get-token.js**: OAuth token retrieval helper script
- **agents.md**: AI agent guidance documentation

## Troubleshooting

### "Missing or invalid environment variables"
- Ensure your `.env` file exists and contains all required variables
- Check that variable names are spelled correctly
- Verify there are no extra spaces around the `=` signs

### "Failed to refresh access token"
- Your refresh token may have expired or been revoked
- Re-run `get-token.js` to get a new refresh token
- Check that your Client ID and Client Secret are correct

### "Rate limit exceeded"
- Strava limits API requests to 100 per 15 minutes and 1000 per day
- Wait a few minutes before trying again
- Consider caching results to reduce API calls

### "Authentication failed"
- Verify your credentials in `.env`
- Ensure you authorized all required scopes when running `get-token.js`
- Try regenerating tokens with `get-token.js`

## Security Notes

- **Never commit your `.env` file**: It contains sensitive credentials
- **Keep your refresh token secure**: It provides ongoing access to your Strava account
- **Use environment variables**: Don't hardcode credentials in the source code
- **Revoke access**: You can revoke this application's access at https://www.strava.com/settings/apps

## API Rate Limits

Strava enforces the following rate limits:
- **100 requests per 15 minutes**
- **1,000 requests per day**

The server doesn't implement rate limit handling - the calling application should monitor usage and handle rate limit errors appropriately.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Resources

- [Strava API Documentation](https://developers.strava.com/docs/reference/)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop](https://claude.ai/download)

## Acknowledgments

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) - MCP SDK
- [axios](https://axios-http.com/) - HTTP client
- [zod](https://zod.dev/) - Schema validation
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

---

**Ready to transform your Strava workouts into meaningful training logs!** 🏃‍♂️🚴‍♀️💪

## Development Notes

### Logging Convention

This MCP server uses `console.error()` for **all** logging output (including success messages). This is intentional and correct for MCP servers:

- **stdout** (console.log) is reserved for MCP protocol communication
- **stderr** (console.error) is used for all logging, diagnostics, and debug output

Do not change `console.error()` to `console.log()` as this will break the MCP protocol communication.


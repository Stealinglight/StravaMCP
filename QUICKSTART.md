# Quick Start Guide

Get up and running with the Strava MCP Server in 5 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Strava API Application

1. Go to https://www.strava.com/settings/api
2. Click "Create An App" or use an existing app
3. Fill in the application details:
   - **Authorization Callback Domain**: `localhost`
4. Save and note your:
   - **Client ID**
   - **Client Secret**

## Step 3: Get OAuth Tokens

Run the token retrieval helper:

```bash
node get-token.js <YOUR_CLIENT_ID> <YOUR_CLIENT_SECRET>
```

This will:
1. Start a local server on port 8888
2. Print a URL for you to visit
3. Prompt you to authorize the application
4. Display your tokens

## Step 4: Configure Environment

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials (displayed by get-token.js):

```env
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abc123def456...
STRAVA_REFRESH_TOKEN=xyz789...
```

## Step 5: Build the Project

```bash
npm run build
```

## Step 6: Use with Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "strava": {
      "command": "node",
      "args": ["/absolute/path/to/StravaMCP/dist/index.js"],
      "env": {
        "STRAVA_CLIENT_ID": "12345",
        "STRAVA_CLIENT_SECRET": "abc123def456...",
        "STRAVA_REFRESH_TOKEN": "xyz789..."
      }
    }
  }
}
```

Replace `/absolute/path/to/StravaMCP` with the actual path.

## Step 7: Restart Claude Desktop

Restart Claude Desktop to load the new MCP server.

## Step 8: Test It!

In Claude Desktop, try:

> "What activities did I do this week?"

> "Update my latest run with a better title and description"

> "Show me my training stats for this month"

## Troubleshooting

### Port 8888 already in use
Close any application using port 8888 or edit get-token.js to use a different port.

### Missing environment variables
Double-check your .env file has all three variables with no extra spaces.

### Authentication failed
Re-run get-token.js to get fresh tokens.

## What's Next?

- Read [agents.md](./agents.md) for guidance on using the server as a Performance Coach
- Check [README.md](./README.md) for complete documentation
- Explore the available tools in `src/tools/`

## Example Workflows

### Enrich Today's Activities
```
Claude: "Let me check your activities from today"
You: [Claude calls get_activities with after=today's timestamp]
Claude: "I found your morning run. How did it feel?"
You: "It was tough, legs were tired but I pushed through"
Claude: [Calls update_activity with enriched title and description]
```

### Analyze a Race
```
You: "Analyze my half marathon from yesterday"
Claude: [Calls get_activities, get_activity_by_id, get_activity_streams]
Claude: "I've analyzed your pacing and heart rate. Here's what I found..."
[Provides detailed analysis and updates activity with insights]
```

### Review Progress
```
You: "How's my training going this month?"
Claude: [Calls get_athlete_stats]
Claude: "You've run 180km this month, up 24% from last month..."
```

---

**You're all set!** Start enriching your Strava activities with AI-powered insights. 🏃‍♂️🚴‍♀️💪

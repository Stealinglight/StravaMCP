# OpenClaw Strava Plugin

Native Strava API integration for [OpenClaw](https://openclaw.ai). Provides 11 tools for managing activities, viewing athlete stats, analyzing telemetry, and more. Includes a bundled `strava-coaching` skill that guides agents through the activity enrichment workflow.

## Tools

| Tool | Description |
|------|-------------|
| `strava_get_activities` | List recent activities with date filtering |
| `strava_get_activity_by_id` | Get detailed activity info |
| `strava_create_activity` | Manually create activities |
| `strava_update_activity` | Update name/description/sport_type |
| `strava_get_activity_zones` | HR and power zone distribution |
| `strava_get_athlete` | Athlete profile |
| `strava_get_athlete_stats` | Training statistics (recent/YTD/all-time) |
| `strava_get_activity_streams` | Time-series telemetry data |
| `strava_get_club_activities` | Club member activities |
| `strava_create_upload` | Upload FIT/TCX/GPX files |
| `strava_get_upload` | Check upload processing status |

## Installation

### 1. Download the latest release

```bash
curl -L https://github.com/Stealinglight/StravaMCP/releases/latest/download/openclaw-strava-plugin.tar.gz -o openclaw-strava-plugin.tar.gz
tar xzf openclaw-strava-plugin.tar.gz
```

### 2. Install the plugin

```bash
# Install (copies to OpenClaw extensions)
openclaw plugins install ./openclaw-strava-plugin

# Or link for development
openclaw plugins install -l ./openclaw-strava-plugin
```

### 3. Create a Strava token file

You need a JSON file with your Strava OAuth credentials:

```json
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "access_token": "YOUR_ACCESS_TOKEN",
  "refresh_token": "YOUR_REFRESH_TOKEN",
  "expires_at": 0
}
```

To get these credentials:
1. Create a Strava API Application at https://www.strava.com/settings/api
2. Use the existing StravaMCP `get-token.js` script or any OAuth 2.0 flow to get a refresh token
3. Save the JSON file (e.g. `~/.openclaw/tokens/strava`)

The plugin auto-refreshes tokens and writes updated credentials back to this file.

### 4. Enable in openclaw.json

```json
{
  "plugins": {
    "allow": ["strava"],
    "entries": {
      "strava": {
        "enabled": true,
        "config": {
          "tokenFile": "~/.openclaw/tokens/strava"
        }
      }
    }
  }
}
```

### 5. Use the coaching skill

The bundled `strava-coaching` skill is automatically available. Use `/strava-coaching` in chat or let your agent pick it up from the skill description.

## Docker / Fargate Deployment

For containerized OpenClaw instances:

1. COPY the plugin into the image:
   ```dockerfile
   COPY openclaw-strava-plugin/ /app/extensions/strava/
   ```

2. Add to config:
   ```json
   {
     "plugins": {
       "load": { "paths": ["/app/extensions/strava"] },
       "entries": { "strava": { "enabled": true, "config": { "tokenFile": "/home/node/.app/tokens/strava" } } }
     }
   }
   ```

3. Seed the token file on the persistent volume (EFS, EBS, etc.)

## Requirements

- OpenClaw with Node 22+ runtime
- Strava API application credentials
- Network access to `https://www.strava.com/api/v3`

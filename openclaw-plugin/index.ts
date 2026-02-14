import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import { TokenStore } from "./src/token-store.js";
import { StravaClient } from "./src/strava-client.js";
import { registerActivityTools } from "./src/tools/activities.js";
import { registerAthleteTools } from "./src/tools/athlete.js";
import { registerStreamTools } from "./src/tools/streams.js";
import { registerZoneTools } from "./src/tools/zones.js";
import { registerClubTools } from "./src/tools/clubs.js";
import { registerUploadTools } from "./src/tools/uploads.js";

const stravaPlugin = {
  id: "strava",
  name: "Strava",
  description: "Native Strava fitness data integration with 11 tools for activity management, athlete stats, telemetry, clubs, and uploads",
  configSchema: Type.Object({
    tokenFile: Type.String({ description: "Path to JSON file containing Strava OAuth credentials" }),
  }),

  register(api: OpenClawPluginApi) {
    const cfg = api.pluginConfig as { tokenFile: string };
    const tokenStore = new TokenStore(cfg.tokenFile);
    const client = new StravaClient(tokenStore);

    registerActivityTools(api, client);
    registerAthleteTools(api, client);
    registerStreamTools(api, client);
    registerZoneTools(api, client);
    registerClubTools(api, client);
    registerUploadTools(api, client);

    api.logger.info(`strava: registered 11 tools (token file: ${cfg.tokenFile})`);
  },
};

export default stravaPlugin;

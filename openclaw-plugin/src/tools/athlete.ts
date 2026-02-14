import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import type { StravaClient } from "../strava-client.js";

export function registerAthleteTools(api: OpenClawPluginApi, client: StravaClient): void {
  api.registerTool(
    {
      name: "strava_get_athlete",
      label: "Strava: Get Athlete",
      description: "Get the authenticated athlete's profile including name, location, clubs, and account details.",
      parameters: Type.Object({}),
      async execute() {
        const data = await client.get("/athlete");
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          details: { athlete: data },
        };
      },
    },
    { name: "strava_get_athlete" },
  );

  api.registerTool(
    {
      name: "strava_get_athlete_stats",
      label: "Strava: Get Athlete Stats",
      description:
        "Get the athlete's training statistics: recent, year-to-date, and all-time totals broken down by activity type (run, ride, swim). Includes distance, time, elevation, and count.",
      parameters: Type.Object({
        athlete_id: Type.Number({ description: "The athlete's numeric ID" }),
      }),
      async execute(_toolCallId, params) {
        const { athlete_id } = params as { athlete_id: number };
        const data = await client.get(`/athletes/${athlete_id}/stats`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          details: { stats: data },
        };
      },
    },
    { name: "strava_get_athlete_stats" },
  );
}

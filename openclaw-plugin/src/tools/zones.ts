import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import type { StravaClient } from "../strava-client.js";

export function registerZoneTools(api: OpenClawPluginApi, client: StravaClient): void {
  api.registerTool(
    {
      name: "strava_get_activity_zones",
      label: "Strava: Get Activity Zones",
      description:
        "Get heart rate and power zone distribution for an activity. Shows time spent in each zone. Requires Strava Summit for some features.",
      parameters: Type.Object({
        id: Type.Number({ description: "The activity ID" }),
      }),
      async execute(_toolCallId, params) {
        const { id } = params as { id: number };
        const data = await client.get(`/activities/${id}/zones`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          details: { zones: data },
        };
      },
    },
    { name: "strava_get_activity_zones" },
  );
}

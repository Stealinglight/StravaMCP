import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import type { StravaClient } from "../strava-client.js";

export function registerStreamTools(api: OpenClawPluginApi, client: StravaClient): void {
  api.registerTool(
    {
      name: "strava_get_activity_streams",
      label: "Strava: Get Activity Streams",
      description:
        "Get time-series telemetry data for an activity: heart rate, pace, elevation, power, cadence, temperature, etc. Specify which stream types you want via the keys parameter.",
      parameters: Type.Object({
        id: Type.Number({ description: "The activity ID" }),
        keys: Type.String({
          description:
            "Comma-separated stream types: time, distance, latlng, altitude, velocity_smooth, heartrate, cadence, watts, temp, moving, grade_smooth",
        }),
        key_by_type: Type.Optional(
          Type.Boolean({ description: "Index streams by type (default: true)" }),
        ),
      }),
      async execute(_toolCallId, params) {
        const { id, keys, key_by_type = true } = params as {
          id: number;
          keys: string;
          key_by_type?: boolean;
        };
        const data = await client.get(`/activities/${id}/streams`, {
          keys,
          key_by_type,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          details: { streams: data },
        };
      },
    },
    { name: "strava_get_activity_streams" },
  );
}

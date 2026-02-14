import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import type { StravaClient } from "../strava-client.js";

export function registerActivityTools(api: OpenClawPluginApi, client: StravaClient): void {
  api.registerTool(
    {
      name: "strava_get_activities",
      label: "Strava: List Activities",
      description:
        "List the authenticated athlete's recent activities. Returns summary data including name, type, distance, time, and start date. Use per_page and page for pagination. Use before/after (epoch seconds) for date filtering.",
      parameters: Type.Object({
        page: Type.Optional(Type.Number({ description: "Page number (default: 1)", minimum: 1 })),
        per_page: Type.Optional(
          Type.Number({ description: "Results per page (default: 30, max: 200)", minimum: 1, maximum: 200 }),
        ),
        before: Type.Optional(Type.Number({ description: "Only activities before this epoch timestamp" })),
        after: Type.Optional(Type.Number({ description: "Only activities after this epoch timestamp" })),
      }),
      async execute(_toolCallId, params) {
        const { page, per_page, before, after } = params as {
          page?: number;
          per_page?: number;
          before?: number;
          after?: number;
        };
        const queryParams: Record<string, number> = {};
        if (page) queryParams.page = page;
        if (per_page) queryParams.per_page = per_page;
        if (before) queryParams.before = before;
        if (after) queryParams.after = after;

        const data = await client.get("/athlete/activities", queryParams);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          details: { activities: data },
        };
      },
    },
    { name: "strava_get_activities" },
  );

  api.registerTool(
    {
      name: "strava_get_activity_by_id",
      label: "Strava: Get Activity",
      description:
        "Get detailed information about a specific activity by ID. Includes full description, segments, splits, and gear. Use include_all_efforts=true for segment effort details.",
      parameters: Type.Object({
        id: Type.Number({ description: "The activity ID" }),
        include_all_efforts: Type.Optional(
          Type.Boolean({ description: "Include all segment efforts (default: false)" }),
        ),
      }),
      async execute(_toolCallId, params) {
        const { id, include_all_efforts } = params as { id: number; include_all_efforts?: boolean };
        const queryParams: Record<string, string | boolean> = {};
        if (include_all_efforts) queryParams.include_all_efforts = true;
        const data = await client.get(`/activities/${id}`, queryParams);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          details: { activity: data },
        };
      },
    },
    { name: "strava_get_activity_by_id" },
  );

  api.registerTool(
    {
      name: "strava_create_activity",
      label: "Strava: Create Activity",
      description: "Manually create a new activity on Strava. Requires name, sport_type, and start_date_local.",
      parameters: Type.Object({
        name: Type.String({ description: "Activity name" }),
        sport_type: Type.String({ description: "Sport type (e.g. Run, Ride, Workout, WeightTraining)" }),
        start_date_local: Type.String({ description: "ISO 8601 local start time (e.g. 2026-02-13T07:00:00)" }),
        elapsed_time: Type.Number({ description: "Elapsed time in seconds" }),
        description: Type.Optional(Type.String({ description: "Activity description" })),
        distance: Type.Optional(Type.Number({ description: "Distance in meters" })),
        trainer: Type.Optional(Type.Boolean({ description: "Whether recorded on a trainer" })),
        commute: Type.Optional(Type.Boolean({ description: "Whether this is a commute" })),
      }),
      async execute(_toolCallId, params) {
        const data = await client.post("/activities", params);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          details: { activity: data },
        };
      },
    },
    { name: "strava_create_activity" },
  );

  api.registerTool(
    {
      name: "strava_update_activity",
      label: "Strava: Update Activity",
      description:
        "Update an existing activity's name, description, sport_type, gear, or flags. This is the PRIMARY tool for enriching Apple Watch auto-created activities with structured workout details. Always confirm with the user before calling this.",
      parameters: Type.Object({
        id: Type.Number({ description: "The activity ID to update" }),
        name: Type.Optional(Type.String({ description: "New activity name" })),
        description: Type.Optional(Type.String({ description: "New activity description" })),
        sport_type: Type.Optional(Type.String({ description: "New sport type" })),
        gear_id: Type.Optional(Type.String({ description: "Gear ID, or 'none' to clear" })),
        trainer: Type.Optional(Type.Boolean({ description: "Whether recorded on a trainer" })),
        commute: Type.Optional(Type.Boolean({ description: "Whether this is a commute" })),
        hide_from_home: Type.Optional(Type.Boolean({ description: "Whether to mute this activity" })),
      }),
      async execute(_toolCallId, params) {
        const { id, ...body } = params as { id: number; [key: string]: unknown };
        const data = await client.put(`/activities/${id}`, body);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          details: { activity: data },
        };
      },
    },
    { name: "strava_update_activity" },
  );
}

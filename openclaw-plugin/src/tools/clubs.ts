import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import type { StravaClient } from "../strava-client.js";

export function registerClubTools(api: OpenClawPluginApi, client: StravaClient): void {
  api.registerTool(
    {
      name: "strava_get_club_activities",
      label: "Strava: Get Club Activities",
      description: "Get recent activities from members of a specific club.",
      parameters: Type.Object({
        club_id: Type.Number({ description: "The club ID" }),
        page: Type.Optional(Type.Number({ description: "Page number (default: 1)" })),
        per_page: Type.Optional(Type.Number({ description: "Results per page (default: 30)" })),
      }),
      async execute(_toolCallId, params) {
        const { club_id, page, per_page } = params as {
          club_id: number;
          page?: number;
          per_page?: number;
        };
        const queryParams: Record<string, number> = {};
        if (page) queryParams.page = page;
        if (per_page) queryParams.per_page = per_page;
        const data = await client.get(`/clubs/${club_id}/activities`, queryParams);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          details: { activities: data },
        };
      },
    },
    { name: "strava_get_club_activities" },
  );
}

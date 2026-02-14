import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import type { StravaClient } from "../strava-client.js";

export function registerUploadTools(api: OpenClawPluginApi, client: StravaClient): void {
  api.registerTool(
    {
      name: "strava_create_upload",
      label: "Strava: Upload Activity File",
      description:
        "Upload a FIT, TCX, or GPX file to create a new activity. Returns an upload ID for status checking.",
      parameters: Type.Object({
        file: Type.String({ description: "Base64-encoded file content" }),
        name: Type.Optional(Type.String({ description: "Activity name" })),
        description: Type.Optional(Type.String({ description: "Activity description" })),
        data_type: Type.String({ description: "File format: fit, tcx, or gpx" }),
        external_id: Type.Optional(Type.String({ description: "External identifier for deduplication" })),
      }),
      async execute(_toolCallId, params) {
        const data = await client.post("/uploads", params);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          details: { upload: data },
        };
      },
    },
    { name: "strava_create_upload" },
  );

  api.registerTool(
    {
      name: "strava_get_upload",
      label: "Strava: Check Upload Status",
      description: "Check the processing status of a previously uploaded file.",
      parameters: Type.Object({
        upload_id: Type.Number({ description: "The upload ID returned from create_upload" }),
      }),
      async execute(_toolCallId, params) {
        const { upload_id } = params as { upload_id: number };
        const data = await client.get(`/uploads/${upload_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          details: { upload: data },
        };
      },
    },
    { name: "strava_get_upload" },
  );
}

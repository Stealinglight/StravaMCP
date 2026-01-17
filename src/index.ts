#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { getConfig } from './config/env.js';
import { StravaClient } from './lib/strava-client.js';
import { formatError } from './utils/errors.js';

// Import all tools
import {
  activitiesTools,
  getActivities,
  GetActivitiesSchema,
  getActivityById,
  GetActivityByIdSchema,
  createActivity,
  CreateActivitySchema,
  updateActivity,
  UpdateActivitySchema,
  getActivityZones,
  GetActivityZonesSchema,
} from './tools/activities.js';

import {
  athleteTools,
  getAthlete,
  getAthleteStats,
  GetAthleteStatsSchema,
} from './tools/athlete.js';

import {
  streamsTools,
  getActivityStreams,
  GetActivityStreamsSchema,
} from './tools/streams.js';

import {
  clubsTools,
  getClubActivities,
  GetClubActivitiesSchema,
} from './tools/clubs.js';

import {
  uploadsTools,
  createUpload,
  CreateUploadSchema,
  getUpload,
  GetUploadSchema,
} from './tools/uploads.js';

/**
 * Strava MCP Server
 * 
 * A Model Context Protocol server that provides comprehensive access to the Strava API.
 * Enables LLMs to manage Strava accounts with a focus on enriching workout data.
 */

// Initialize configuration
let config: ReturnType<typeof getConfig>;
let stravaClient: StravaClient;

try {
  config = getConfig();
  stravaClient = new StravaClient({
    clientId: config.STRAVA_CLIENT_ID,
    clientSecret: config.STRAVA_CLIENT_SECRET,
    refreshToken: config.STRAVA_REFRESH_TOKEN,
  });
  console.error('[StravaServer] Initialized successfully');
} catch (error) {
  console.error('[StravaServer] Failed to initialize:', formatError(error));
  process.exit(1);
}

// Create MCP server
const server = new Server(
  {
    name: 'strava-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Combine all tools
const allTools = [
  ...activitiesTools,
  ...athleteTools,
  ...streamsTools,
  ...clubsTools,
  ...uploadsTools,
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Activity tools
      case 'get_activities': {
        const params = GetActivitiesSchema.parse(args);
        const result = await getActivities(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_activity_by_id': {
        const params = GetActivityByIdSchema.parse(args);
        const result = await getActivityById(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'create_activity': {
        const params = CreateActivitySchema.parse(args);
        const result = await createActivity(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'update_activity': {
        const params = UpdateActivitySchema.parse(args);
        const result = await updateActivity(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_activity_zones': {
        const params = GetActivityZonesSchema.parse(args);
        const result = await getActivityZones(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Athlete tools
      case 'get_athlete': {
        const result = await getAthlete(stravaClient);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_athlete_stats': {
        const params = GetAthleteStatsSchema.parse(args || {});
        const result = await getAthleteStats(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Streams tools
      case 'get_activity_streams': {
        const params = GetActivityStreamsSchema.parse(args);
        const result = await getActivityStreams(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Clubs tools
      case 'get_club_activities': {
        const params = GetClubActivitiesSchema.parse(args);
        const result = await getClubActivities(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Uploads tools
      case 'create_upload': {
        const params = CreateUploadSchema.parse(args);
        const result = await createUpload(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_upload': {
        const params = GetUploadSchema.parse(args);
        const result = await getUpload(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = formatError(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[StravaServer] Server running on stdio');
}

main().catch((error) => {
  console.error('[StravaServer] Fatal error:', formatError(error));
  process.exit(1);
});

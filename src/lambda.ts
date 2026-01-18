#!/usr/bin/env node

import { configure as serverlessExpress } from '@codegenie/serverless-express';
import type {
  APIGatewayProxyEventV2,
  Context as LambdaContext,
} from 'aws-lambda';
import express, { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'node:crypto';

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
 * Strava MCP Lambda Handler
 *
 * Wraps the Express-based MCP server for AWS Lambda using serverless-express.
 * Supports both SSE transport (for local development compatibility) and
 * Lambda Function URLs with response streaming.
 */

// Initialize configuration
let config: ReturnType<typeof getConfig>;
let stravaClient: StravaClient;
let mcpServer: Server;

function initializeServer(): express.Application {
  // Create Express app
  const app = express();
  app.use(express.json());

  try {
    config = getConfig();
    stravaClient = new StravaClient({
      clientId: config.STRAVA_CLIENT_ID,
      clientSecret: config.STRAVA_CLIENT_SECRET,
      refreshToken: config.STRAVA_REFRESH_TOKEN,
    });
    console.error('[StravaLambda] Initialized successfully');
  } catch (error) {
    console.error('[StravaLambda] Failed to initialize:', formatError(error));
    throw error;
  }

  // Create MCP server
  mcpServer = new Server(
    {
      name: 'strava-mcp-server',
      version: '2.0.0',
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
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allTools,
    };
  });

  // Handle tool execution
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
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

  // Store transports by session ID
  const transports: Record<string, SSEServerTransport> = {};

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', version: '2.0.0', environment: 'lambda' });
  });

  // SSE endpoint - establishes the server-to-client event stream
  app.get('/sse', async (_req: Request, res: Response) => {
    console.error('[StravaLambda] New SSE connection established');
    const transport = new SSEServerTransport('/message', res);
    const sessionId = randomUUID();
    transports[sessionId] = transport;

    // Clean up transport on connection close
    res.on('close', () => {
      console.error(`[StravaLambda] SSE connection closed for session ${sessionId}`);
      delete transports[sessionId];
    });

    await mcpServer.connect(transport);
    console.error(`[StravaLambda] Session ${sessionId} initialized`);
  });

  // Message endpoint - handles client-to-server messages
  app.post('/message', async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];

    if (!transport) {
      res.status(400).json({ error: 'Invalid or expired session ID' });
      return;
    }

    await transport.handlePostMessage(req, res, req.body);
  });

  // MCP endpoint (for Streamable HTTP - future implementation)
  app.post('/mcp', async (req: Request, res: Response) => {
    // TODO: Implement Streamable HTTP transport
    // For now, redirect to SSE instructions
    res.json({
      message: 'MCP Streamable HTTP coming soon!',
      currentTransport: 'SSE',
      sseEndpoint: '/sse',
      messageEndpoint: '/message',
      documentation: 'https://stealinglight.github.io/StravaMCP',
    });
  });

  app.get('/mcp', async (req: Request, res: Response) => {
    // TODO: Implement Streamable HTTP GET for server-initiated messages
    res.json({
      message: 'MCP Streamable HTTP coming soon!',
      currentTransport: 'SSE',
      documentation: 'https://stealinglight.github.io/StravaMCP',
    });
  });

  console.error('[StravaLambda] Express app initialized');
  return app;
}

// Initialize the server once (outside handler for Lambda container reuse)
// This improves performance by reusing initialized resources across invocations
const expressApp = initializeServer();

// Lambda handler using serverless-express (codegenie)
// This creates the handler function that Lambda will call
export const handler = serverlessExpress({ app: expressApp });

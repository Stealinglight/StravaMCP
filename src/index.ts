#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response } from 'express';
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

// Start the HTTP server
async function main() {
  const app = express();
  app.use(express.json());

  // Store transports by session ID
  const transports: Record<string, SSEServerTransport> = {};

  // Authentication middleware for local dev (optional - can be disabled)
  // Supports both Authorization header and query parameter
  app.use((req: Request, res: Response, next) => {
    if (req.path === '/health') {
      return next();
    }

    // For SSE message endpoint, trust valid session IDs
    const sessionId = req.query.sessionId as string;
    if (req.path === '/message' && sessionId && transports[sessionId]) {
      return next();
    }

    // For local development, authentication is optional
    // If AUTH_TOKEN is set in .env, validate it
    if (config.AUTH_TOKEN && config.AUTH_TOKEN.length > 0) {
      let token: string | undefined;
      
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.query.token) {
        token = req.query.token as string;
      }
      
      if (!token || token !== config.AUTH_TOKEN) {
        console.error('[StravaServer] Invalid or missing token');
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid or missing token'
        });
      }
    }
    
    next();
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', version: '2.0.0' });
  });

  // SSE endpoint - establishes the server-to-client event stream
  app.get('/sse', async (_req: Request, res: Response) => {
    console.error('[StravaServer] New SSE connection established');
    const transport = new SSEServerTransport('/message', res);
    const sessionId = randomUUID();
    transports[sessionId] = transport;

    // Clean up transport on connection close
    res.on('close', () => {
      console.error(`[StravaServer] SSE connection closed for session ${sessionId}`);
      delete transports[sessionId];
    });

    await server.connect(transport);
    console.error(`[StravaServer] Session ${sessionId} initialized`);
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

  // MCP endpoint - handles JSON-RPC requests (for testing and direct API access)
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      console.error('[StravaServer] MCP request received:', req.body.method);
      
      const { jsonrpc, id, method, params } = req.body;
      
      // Validate JSON-RPC request
      if (jsonrpc !== '2.0' || !method) {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request',
          },
          id: id || null,
        });
      }
      
      // Route to appropriate handler
      let result;
      switch (method) {
        case 'tools/list':
          result = { tools: allTools };
          break;
          
        case 'tools/call':
          if (!params || !params.name) {
            return res.status(400).json({
              jsonrpc: '2.0',
              error: {
                code: -32602,
                message: 'Invalid params: missing tool name',
              },
              id,
            });
          }
          result = await handleToolCall(params.name, params.arguments || {});
          break;
          
        case 'initialize':
          result = {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'strava-mcp-server',
              version: '2.0.0',
            },
          };
          break;
          
        default:
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
            id,
          });
      }
      
      res.json({
        jsonrpc: '2.0',
        result,
        id,
      });
    } catch (error) {
      console.error('[StravaServer] MCP request error:', error);
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error instanceof Error ? error.message : String(error),
        },
        id: req.body.id || null,
      });
    }
  });
  
  // Helper function to handle tool calls
  async function handleToolCall(name: string, args: any) {
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
  }

  const port = config.PORT;
  app.listen(port, () => {
    console.error(`[StravaServer] Remote MCP server running on http://localhost:${port}`);
    console.error(`[StravaServer] MCP endpoint: http://localhost:${port}/mcp`);
    console.error(`[StravaServer] Health check: http://localhost:${port}/health`);
  });
}

main().catch((error) => {
  console.error('[StravaServer] Fatal error:', formatError(error));
  process.exit(1);
});

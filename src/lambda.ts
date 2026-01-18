#!/usr/bin/env node

import { configure as serverlessExpress } from '@codegenie/serverless-express';
import type {
  APIGatewayProxyEventV2,
  Context as LambdaContext,
} from 'aws-lambda';
import express, { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
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
 * Strava MCP Lambda Handler
 *
 * Wraps the Express-based MCP server for AWS Lambda using serverless-express.
 * Implements JSON-RPC over HTTP transport for Claude connector compatibility.
 */

// Initialize configuration
let config: ReturnType<typeof getConfig>;
let stravaClient: StravaClient;
let mcpServer: Server;

function initializeServer(): express.Application {
  // Create Express app
  const app = express();
  app.use(express.json());

  // Authentication middleware - verify Bearer token
  // Skip auth for health check endpoint
  app.use((req: Request, res: Response, next) => {
    if (req.path === '/health') {
      return next();
    }

    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[StravaLambda] Missing or invalid authorization header');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header. Use: Authorization: Bearer <token>'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!config) {
      // Initialize config if not already done (shouldn't happen, but safety check)
      config = getConfig();
    }

    if (token !== config.AUTH_TOKEN) {
      console.error('[StravaLambda] Invalid bearer token');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid bearer token'
      });
    }

    // Token is valid, proceed
    next();
  });

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

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', version: '2.0.0', environment: 'lambda' });
  });

  // MCP endpoint - handles JSON-RPC requests
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      console.error('[StravaLambda] MCP request received:', req.body.method);
      
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
      console.error('[StravaLambda] MCP request error:', error);
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

  console.error('[StravaLambda] Express app initialized');
  return app;
}

// Initialize the server once (outside handler for Lambda container reuse)
// This improves performance by reusing initialized resources across invocations
const expressApp = initializeServer();

// Lambda handler using serverless-express (codegenie)
// This creates the handler function that Lambda will call
export const handler = serverlessExpress({ app: expressApp });

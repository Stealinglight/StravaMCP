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

import {
  openaiTools,
  searchActivities,
  SearchSchema,
  fetchActivity,
  FetchSchema,
} from './tools/openai.js';

/**
 * Strava MCP Lambda Handler
 *
 * Wraps the Express-based MCP server for AWS Lambda using serverless-express.
 * Implements JSON-RPC over HTTP transport for Claude connector compatibility.
 *
 * SSE STREAMING NOTE:
 * The @codegenie/serverless-express library does NOT support Lambda response streaming
 * (see https://github.com/CodeGenieApp/serverless-express/issues/655).
 * While the Lambda Function URL is configured with InvokeMode: RESPONSE_STREAM,
 * the serverless-express wrapper buffers responses before sending.
 *
 * CURRENT WORKAROUND: The /mcp JSON-RPC endpoint works reliably for all clients.
 * Claude.ai should connect to the base URL and use SSE, but if SSE doesn't work,
 * alternative approaches include:
 * 1. AWS Lambda Web Adapter (https://github.com/awslabs/aws-lambda-web-adapter)
 * 2. Direct Lambda streaming without Express wrapper for SSE endpoints
 * 3. Using awslambda.streamifyResponse() for native streaming support
 */

// Initialize configuration
let config: ReturnType<typeof getConfig>;
let stravaClient: StravaClient;
let mcpServer: Server;

function initializeServer(): express.Application {
  // Create Express app
  const app = express();
  app.use(express.json());

  // Store transports by session ID
  const transports: Record<string, SSEServerTransport> = {};

  // Authentication middleware - verify Bearer token
  // Skip auth for health check and debug endpoints
  // Supports both Authorization header and query parameter for Claude connector compatibility
  // When ALLOW_AUTHLESS=true, SSE endpoints bypass auth for Claude.ai custom connectors
  app.use((req: Request, res: Response, next) => {
    if (req.path === '/health' || req.path === '/debug') {
      return next();
    }

    if (!config) {
      // Initialize config if not already done (shouldn't happen, but safety check)
      config = getConfig();
    }

    // Check if authless mode is enabled for SSE endpoints
    // This allows Claude.ai custom connectors to connect without Bearer tokens
    const isSSEEndpoint = req.path === '/sse' || req.path === '/sse/';
    const isMessageEndpoint = req.path === '/message';

    if (config.ALLOW_AUTHLESS && (isSSEEndpoint || isMessageEndpoint)) {
      if (isSSEEndpoint) {
        console.error('[StravaLambda] Authless SSE connection allowed (ALLOW_AUTHLESS=true)');
      }
      return next();
    }

    // For SSE message endpoint with valid session, trust the session
    const sessionId = req.query.sessionId as string;
    if (isMessageEndpoint && sessionId && transports[sessionId]) {
      return next();
    }

    let token: string | undefined;

    // Try Authorization header first (preferred for API clients)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    // Fallback to query parameter (required for Claude connectors)
    else if (req.query.token) {
      token = req.query.token as string;
    }

    if (!token || token !== config.AUTH_TOKEN) {
      console.error('[StravaLambda] Invalid or missing token');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing token. Use: Authorization: Bearer <token> OR ?token=<token>'
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
      version: '3.0.0',
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
    ...openaiTools,
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

        // OpenAI tools
        case 'search': {
          const params = SearchSchema.parse(args);
          const result = await searchActivities(stravaClient, params);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        }

        case 'fetch': {
          const params = FetchSchema.parse(args);
          const result = await fetchActivity(stravaClient, params);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
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

  // Health check endpoint - enhanced with diagnostic info
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      version: '3.0.0',
      runtime: 'lambda',
      authless: config?.ALLOW_AUTHLESS ?? false,
      timestamp: new Date().toISOString(),
    });
  });

  // Debug endpoint - helps troubleshoot Claude.ai connection issues
  app.get('/debug', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: '3.0.0',
      authless_enabled: config?.ALLOW_AUTHLESS ?? false,
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        health: '/health',
        debug: '/debug',
        sse: '/sse (GET, establishes SSE connection)',
        message: '/message (POST, requires sessionId query param)',
        mcp: '/mcp (POST, requires Bearer token)',
      },
      claude_ai_setup: {
        connector_url: 'Use base URL only, no path (e.g., https://xyz.lambda-url.us-east-1.on.aws)',
        auth_mode: config?.ALLOW_AUTHLESS ? 'Authless (SSE endpoints bypass auth)' : 'Bearer token required',
        transport: 'SSE',
        note: 'Claude.ai will auto-discover /sse endpoint from base URL',
      },
      sse_headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
      known_limitations: {
        sse_streaming: 'serverless-express does not support Lambda response streaming (see GitHub issue #655)',
        workaround: 'If SSE fails, consider AWS Lambda Web Adapter or direct Lambda streaming',
        mcp_endpoint: '/mcp JSON-RPC endpoint works reliably for all clients',
      },
    });
  });

  // SSE endpoint - establishes the server-to-client event stream
  // Support both /sse and /sse/ for compatibility
  const sseHandler = async (_req: Request, res: Response) => {
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
  };
  
  app.get('/sse', sseHandler);
  app.get('/sse/', sseHandler);

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
              version: '3.0.0',
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

      // OpenAI tools
      case 'search': {
        const params = SearchSchema.parse(args);
        const result = await searchActivities(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      }

      case 'fetch': {
        const params = FetchSchema.parse(args);
        const result = await fetchActivity(stravaClient, params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
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

import express, { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getConfig } from './config/env.js';
import { loadSecretsFromManager } from './config/secrets.js';
import { StravaClient } from './lib/strava-client.js';
import { formatError } from './utils/errors.js';
import { registerOAuthRoutes, validateAccessToken } from './oauth/server.js';

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

const ALLOWED_REDIRECT_URIS = [
  'https://claude.ai/api/mcp/auth_callback',
  'https://claude.com/api/mcp/auth_callback',
];

export async function createApp(runtime: 'local' | 'lambda') {
  await loadSecretsFromManager(process.env.SECRETS_MANAGER_ARN);

  const config = getConfig();
  const stravaClient = new StravaClient({
    clientId: config.STRAVA_CLIENT_ID,
    clientSecret: config.STRAVA_CLIENT_SECRET,
    refreshToken: config.STRAVA_REFRESH_TOKEN,
  });

  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const mcpServer = new Server(
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

  const allTools = [
    ...activitiesTools,
    ...athleteTools,
    ...streamsTools,
    ...clubsTools,
    ...uploadsTools,
    ...openaiTools,
  ];

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  async function runTool(name: string, args: any) {
    switch (name) {
      case 'get_activities': {
        const params = GetActivitiesSchema.parse(args);
        const result = await getActivities(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'get_activity_by_id': {
        const params = GetActivityByIdSchema.parse(args);
        const result = await getActivityById(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'create_activity': {
        const params = CreateActivitySchema.parse(args);
        const result = await createActivity(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'update_activity': {
        const params = UpdateActivitySchema.parse(args);
        const result = await updateActivity(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'get_activity_zones': {
        const params = GetActivityZonesSchema.parse(args);
        const result = await getActivityZones(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'get_athlete': {
        const result = await getAthlete(stravaClient);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'get_athlete_stats': {
        const params = GetAthleteStatsSchema.parse(args || {});
        const result = await getAthleteStats(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'get_activity_streams': {
        const params = GetActivityStreamsSchema.parse(args);
        const result = await getActivityStreams(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'get_club_activities': {
        const params = GetClubActivitiesSchema.parse(args);
        const result = await getClubActivities(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'create_upload': {
        const params = CreateUploadSchema.parse(args);
        const result = await createUpload(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'get_upload': {
        const params = GetUploadSchema.parse(args);
        const result = await getUpload(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      case 'search': {
        const params = SearchSchema.parse(args);
        const result = await searchActivities(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
      case 'fetch': {
        const params = FetchSchema.parse(args);
        const result = await fetchActivity(stravaClient, params);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await runToolSafe(name, args);
  });

  async function runToolSafe(name: string, args: any) {
    try {
      return await runTool(name, args);
    } catch (error) {
      const errorMessage = formatError(error);
      return {
        content: [{ type: 'text', text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }

  const transports: Record<string, SSEServerTransport> = {};

  const oauthConfig = {
    enabled: config.OAUTH_ENABLED,
    clientsTable: config.OAUTH_CLIENTS_TABLE || '',
    codesTable: config.OAUTH_CODES_TABLE || '',
    tokensTable: config.OAUTH_TOKENS_TABLE || '',
    accessTokenTtlSeconds: config.OAUTH_ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtlSeconds: config.OAUTH_REFRESH_TOKEN_TTL_SECONDS,
    allowedRedirectUris: ALLOWED_REDIRECT_URIS,
  };

  registerOAuthRoutes(app, oauthConfig);

  app.use(async (req: Request, res: Response, next) => {
    const publicPaths = new Set([
      '/health',
      '/debug',
      '/.well-known/oauth-authorization-server',
      '/authorize',
      '/token',
      '/register',
    ]);

    if (publicPaths.has(req.path)) {
      return next();
    }

    const sessionId = req.query.sessionId as string;
    if (req.path === '/message' && sessionId && transports[sessionId]) {
      return next();
    }

    let token: string | undefined;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.access_token) {
      token = req.query.access_token as string;
    }

    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (token && config.AUTH_TOKEN && token === config.AUTH_TOKEN) {
      return next();
    }

    if (token && config.OAUTH_ENABLED) {
      const valid = await validateAccessToken(oauthConfig, token);
      if (valid) {
        return next();
      }
    }

    if (!config.OAUTH_ENABLED && !config.AUTH_TOKEN) {
      return next();
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid access token',
    });
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      version: '3.0.0',
      runtime,
      oauth_enabled: config.OAUTH_ENABLED,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/debug', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: '3.0.0',
      runtime,
      oauth_enabled: config.OAUTH_ENABLED,
      endpoints: {
        health: '/health',
        debug: '/debug',
        oauth_metadata: '/.well-known/oauth-authorization-server',
        authorize: '/authorize',
        token: '/token',
        register: '/register',
        sse: '/sse (GET, establishes SSE connection)',
        message: '/message (POST, requires sessionId query param)',
        mcp: '/mcp (POST, requires Bearer token)',
      },
    });
  });

  const sseHandler = async (_req: Request, res: Response) => {
    console.error('[StravaServer] New SSE connection established');
    const transport = new SSEServerTransport('/message', res);
    const sessionId = randomUUID();
    transports[sessionId] = transport;

    res.on('close', () => {
      console.error(`[StravaServer] SSE connection closed for session ${sessionId}`);
      delete transports[sessionId];
    });

    await mcpServer.connect(transport);
    console.error(`[StravaServer] Session ${sessionId} initialized`);
  };

  app.get('/sse', sseHandler);
  app.get('/sse/', sseHandler);

  app.post('/message', async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];

    if (!transport) {
      res.status(400).json({ error: 'Invalid or expired session ID' });
      return;
    }

    await transport.handlePostMessage(req, res, req.body);
  });

  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      console.error('[StravaServer] MCP request received:', req.body.method);
      const { jsonrpc, id, method, params } = req.body;

      if (jsonrpc !== '2.0' || !method) {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Invalid Request' },
          id: id || null,
        });
      }

      let result;
      switch (method) {
        case 'tools/list':
          result = { tools: allTools };
          break;
        case 'tools/call':
          if (!params || !params.name) {
            return res.status(400).json({
              jsonrpc: '2.0',
              error: { code: -32602, message: 'Invalid params: missing tool name' },
              id,
            });
          }
          result = await runToolSafe(params.name, params.arguments || {});
          break;
        case 'initialize':
          result = {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'strava-mcp-server', version: '3.0.0' },
          };
          break;
        default:
          return res.status(400).json({
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: ${method}` },
            id,
          });
      }

      res.json({ jsonrpc: '2.0', result, id });
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

  return { app, config };
}

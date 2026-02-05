import type { Express, Request, Response } from 'express';
import { URL } from 'node:url';
import { generateToken, isValidPkceS256 } from './utils.js';
import {
  consumeAuthCode,
  getClient,
  getTokenByAccess,
  getTokenByRefresh,
  putAuthCode,
  putClient,
  putToken,
  touchClient,
} from './store.js';

export interface OAuthConfig {
  enabled: boolean;
  clientsTable: string;
  codesTable: string;
  tokensTable: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  allowedRedirectUris: string[];
  registrationToken?: string;
}

const DEFAULT_SCOPES = ['strava'];

function getBaseUrl(req: Request): string {
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host =
    (req.headers['x-forwarded-host'] as string) ||
    (req.headers['host'] as string);
  return `${proto}://${host}`.replace(/\/+$/, '');
}

function normalizeScopes(scope?: string): string[] {
  if (!scope) {
    return DEFAULT_SCOPES;
  }
  return scope
    .split(' ')
    .map((value) => value.trim())
    .filter(Boolean);
}

function ensureRedirectAllowed(redirectUri: string, allowed: string[]): boolean {
  return allowed.includes(redirectUri);
}

function writeOAuthError(res: Response, status: number, error: string, description?: string) {
  res.status(status).json({
    error,
    error_description: description,
  });
}

function getBearerToken(value?: string): string | null {
  if (!value) {
    return null;
  }
  if (value.startsWith('Bearer ')) {
    return value.substring(7);
  }
  return null;
}

function renderConsentPage(params: Record<string, string>, clientName?: string): string {
  const safe = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const fields = Object.entries(params)
    .map(([key, value]) => `<input type="hidden" name="${safe(key)}" value="${safe(value)}" />`)
    .join('\n');

  const title = clientName ? `Authorize ${safe(clientName)}` : 'Authorize Strava MCP';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: sans-serif; margin: 32px; color: #1f2933; }
      .card { max-width: 520px; border: 1px solid #d9e2ec; padding: 24px; border-radius: 12px; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      p { margin: 0 0 20px; }
      button { background: #2563eb; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>Approve this request to allow Claude to access your Strava data.</p>
      <form method="post" action="/authorize">
        ${fields}
        <button type="submit">Approve</button>
      </form>
    </div>
  </body>
</html>`;
}

function parseAuthorizeInput(source: Record<string, string | undefined>) {
  const response_type = source.response_type;
  const client_id = source.client_id;
  const redirect_uri = source.redirect_uri;
  const state = source.state;
  const code_challenge = source.code_challenge;
  const code_challenge_method = source.code_challenge_method;
  const scope = source.scope;

  return {
    response_type,
    client_id,
    redirect_uri,
    state,
    code_challenge,
    code_challenge_method,
    scope,
  };
}

export function registerOAuthRoutes(app: Express, config: OAuthConfig): void {
  if (!config.enabled) {
    return;
  }

  app.get('/.well-known/oauth-authorization-server', (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    res.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
      token_endpoint: `${baseUrl}/token`,
      registration_endpoint: `${baseUrl}/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: DEFAULT_SCOPES,
    });
  });

  app.post('/register', async (req: Request, res: Response) => {
    try {
      if (config.registrationToken) {
        const authHeader = req.headers['authorization'] as string | undefined;
        const headerToken = getBearerToken(authHeader) || (req.headers['x-registration-token'] as string | undefined);
        if (headerToken !== config.registrationToken) {
          return writeOAuthError(res, 401, 'invalid_client', 'Registration token required');
        }
      }

      const { redirect_uris, client_name } = req.body || {};

      if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
        return writeOAuthError(res, 400, 'invalid_client_metadata', 'redirect_uris is required');
      }

      const invalid = redirect_uris.some(
        (uri: string) => !ensureRedirectAllowed(uri, config.allowedRedirectUris)
      );

      if (invalid) {
        return writeOAuthError(res, 400, 'invalid_redirect_uri', 'redirect_uri not allowed');
      }

      const clientId = generateToken(24);
      const now = Math.floor(Date.now() / 1000);

      await putClient(config.clientsTable, {
        client_id: clientId,
        redirect_uris,
        client_name,
        created_at: now,
      });

      res.status(201).json({
        client_id: clientId,
        client_id_issued_at: now,
        token_endpoint_auth_method: 'none',
        redirect_uris,
        response_types: ['code'],
        grant_types: ['authorization_code', 'refresh_token'],
      });
    } catch (error) {
      console.error('[OAuth] Registration error:', error);
      writeOAuthError(res, 500, 'server_error', 'Failed to register client');
    }
  });

  app.get('/authorize', async (req: Request, res: Response) => {
    try {
      const {
        response_type,
        client_id,
        redirect_uri,
        state,
        code_challenge,
        code_challenge_method,
        scope,
      } = parseAuthorizeInput(req.query as Record<string, string | undefined>);

      if (response_type !== 'code') {
        return writeOAuthError(res, 400, 'unsupported_response_type');
      }

      if (!client_id || !redirect_uri || !code_challenge || !code_challenge_method) {
        return writeOAuthError(res, 400, 'invalid_request', 'Missing required parameters');
      }

      if (code_challenge_method !== 'S256') {
        return writeOAuthError(res, 400, 'invalid_request', 'Only S256 is supported');
      }

      const client = await getClient(config.clientsTable, client_id);
      if (!client) {
        return writeOAuthError(res, 400, 'invalid_client', 'Unknown client');
      }

      if (!client.redirect_uris.includes(redirect_uri)) {
        return writeOAuthError(res, 400, 'invalid_redirect_uri', 'Redirect URI mismatch');
      }

      if (!ensureRedirectAllowed(redirect_uri, config.allowedRedirectUris)) {
        return writeOAuthError(res, 400, 'invalid_redirect_uri', 'Redirect URI not allowed');
      }

      const consentParams: Record<string, string> = {
        response_type,
        client_id,
        redirect_uri,
        code_challenge,
        code_challenge_method,
      };

      if (state) {
        consentParams.state = state;
      }

      if (scope) {
        consentParams.scope = scope;
      }

      res.status(200).send(renderConsentPage(consentParams, client.client_name));
    } catch (error) {
      console.error('[OAuth] Authorize error:', error);
      writeOAuthError(res, 500, 'server_error', 'Authorization failed');
    }
  });

  app.post('/authorize', async (req: Request, res: Response) => {
    try {
      const {
        response_type,
        client_id,
        redirect_uri,
        state,
        code_challenge,
        code_challenge_method,
        scope,
      } = parseAuthorizeInput(req.body as Record<string, string | undefined>);

      if (response_type !== 'code') {
        return writeOAuthError(res, 400, 'unsupported_response_type');
      }

      if (!client_id || !redirect_uri || !code_challenge || !code_challenge_method) {
        return writeOAuthError(res, 400, 'invalid_request', 'Missing required parameters');
      }

      if (code_challenge_method !== 'S256') {
        return writeOAuthError(res, 400, 'invalid_request', 'Only S256 is supported');
      }

      const client = await getClient(config.clientsTable, client_id);
      if (!client) {
        return writeOAuthError(res, 400, 'invalid_client', 'Unknown client');
      }

      if (!client.redirect_uris.includes(redirect_uri)) {
        return writeOAuthError(res, 400, 'invalid_redirect_uri', 'Redirect URI mismatch');
      }

      if (!ensureRedirectAllowed(redirect_uri, config.allowedRedirectUris)) {
        return writeOAuthError(res, 400, 'invalid_redirect_uri', 'Redirect URI not allowed');
      }

      const now = Math.floor(Date.now() / 1000);
      const code = generateToken(24);
      const scopes = normalizeScopes(scope);

      await putAuthCode(config.codesTable, {
        code,
        client_id,
        redirect_uri,
        code_challenge,
        code_challenge_method: 'S256',
        scopes,
        expires_at: now + 300,
      });

      await touchClient(config.clientsTable, client_id);

      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set('code', code);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      res.redirect(302, redirectUrl.toString());
    } catch (error) {
      console.error('[OAuth] Authorize error:', error);
      writeOAuthError(res, 500, 'server_error', 'Authorization failed');
    }
  });

  app.post('/token', async (req: Request, res: Response) => {
    try {
      const grantType = req.body?.grant_type as string | undefined;
      if (!grantType) {
        return writeOAuthError(res, 400, 'invalid_request', 'grant_type is required');
      }

      if (grantType === 'authorization_code') {
        const code = req.body?.code as string | undefined;
        const redirectUri = req.body?.redirect_uri as string | undefined;
        const clientId = req.body?.client_id as string | undefined;
        const verifier = req.body?.code_verifier as string | undefined;

        if (!code || !redirectUri || !clientId || !verifier) {
          return writeOAuthError(res, 400, 'invalid_request', 'Missing required parameters');
        }

        const authCode = await consumeAuthCode(config.codesTable, code);
        if (!authCode) {
          return writeOAuthError(res, 400, 'invalid_grant', 'Invalid or expired code');
        }

        if (authCode.client_id !== clientId || authCode.redirect_uri !== redirectUri) {
          return writeOAuthError(res, 400, 'invalid_grant', 'Client or redirect mismatch');
        }

        const now = Math.floor(Date.now() / 1000);
        if (authCode.expires_at < now) {
          return writeOAuthError(res, 400, 'invalid_grant', 'Authorization code expired');
        }

        if (!isValidPkceS256(verifier, authCode.code_challenge)) {
          return writeOAuthError(res, 400, 'invalid_grant', 'PKCE verification failed');
        }

        const accessToken = generateToken(32);
        const refreshToken = generateToken(32);
        const accessExpiresAt = now + config.accessTokenTtlSeconds;
        const refreshExpiresAt = now + config.refreshTokenTtlSeconds;

        await putToken(config.tokensTable, {
          access_token: accessToken,
          refresh_token: refreshToken,
          client_id: clientId,
          scopes: authCode.scopes,
          refresh_expires_at: refreshExpiresAt,
          access_expires_at: accessExpiresAt,
          expires_at: refreshExpiresAt,
        });

        await touchClient(config.clientsTable, clientId);

        return res.json({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: config.accessTokenTtlSeconds,
          refresh_token: refreshToken,
          scope: authCode.scopes.join(' '),
        });
      }

      if (grantType === 'refresh_token') {
        const refreshToken = req.body?.refresh_token as string | undefined;
        const clientId = req.body?.client_id as string | undefined;

        if (!refreshToken || !clientId) {
          return writeOAuthError(res, 400, 'invalid_request', 'Missing refresh_token or client_id');
        }

        const storedToken = await getTokenByRefresh(config.tokensTable, refreshToken);
        if (!storedToken) {
          return writeOAuthError(res, 400, 'invalid_grant', 'Unknown refresh token');
        }

        if (storedToken.client_id !== clientId) {
          return writeOAuthError(res, 400, 'invalid_grant', 'Client mismatch');
        }

        const now = Math.floor(Date.now() / 1000);
        if (storedToken.refresh_expires_at < now) {
          return writeOAuthError(res, 400, 'invalid_grant', 'Refresh token expired');
        }

        const accessToken = generateToken(32);
        const accessExpiresAt = now + config.accessTokenTtlSeconds;

        await putToken(config.tokensTable, {
          ...storedToken,
          access_token: accessToken,
          access_expires_at: accessExpiresAt,
          expires_at: storedToken.refresh_expires_at,
        });

        await touchClient(config.clientsTable, clientId);

        return res.json({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: config.accessTokenTtlSeconds,
          refresh_token: storedToken.refresh_token,
          scope: storedToken.scopes.join(' '),
        });
      }

      return writeOAuthError(res, 400, 'unsupported_grant_type');
    } catch (error) {
      console.error('[OAuth] Token error:', error);
      writeOAuthError(res, 500, 'server_error', 'Token exchange failed');
    }
  });
}

export async function validateAccessToken(
  config: OAuthConfig,
  accessToken: string
): Promise<boolean> {
  if (!config.enabled) {
    return false;
  }

  const record = await getTokenByAccess(config.tokensTable, accessToken);
  if (!record) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return record.access_expires_at > now;
}

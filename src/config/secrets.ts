import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export interface SecretPayload {
  STRAVA_CLIENT_ID?: string;
  STRAVA_CLIENT_SECRET?: string;
  STRAVA_REFRESH_TOKEN?: string;
  AUTH_TOKEN?: string;
}

let cachedSecrets: SecretPayload | null = null;

export async function loadSecretsFromManager(secretArn?: string): Promise<void> {
  if (!secretArn || secretArn.trim().length === 0) {
    return;
  }

  if (cachedSecrets) {
    applySecrets(cachedSecrets);
    return;
  }

  const client = new SecretsManagerClient({});
  const result = await client.send(
    new GetSecretValueCommand({
      SecretId: secretArn,
    })
  );

  if (!result.SecretString) {
    throw new Error('Secrets Manager returned empty secret string');
  }

  const payload = JSON.parse(result.SecretString) as SecretPayload;
  cachedSecrets = payload;
  applySecrets(payload);
}

function applySecrets(payload: SecretPayload): void {
  if (payload.STRAVA_CLIENT_ID && !process.env.STRAVA_CLIENT_ID) {
    process.env.STRAVA_CLIENT_ID = payload.STRAVA_CLIENT_ID;
  }
  if (payload.STRAVA_CLIENT_SECRET && !process.env.STRAVA_CLIENT_SECRET) {
    process.env.STRAVA_CLIENT_SECRET = payload.STRAVA_CLIENT_SECRET;
  }
  if (payload.STRAVA_REFRESH_TOKEN && !process.env.STRAVA_REFRESH_TOKEN) {
    process.env.STRAVA_REFRESH_TOKEN = payload.STRAVA_REFRESH_TOKEN;
  }
  if (payload.AUTH_TOKEN && !process.env.AUTH_TOKEN) {
    process.env.AUTH_TOKEN = payload.AUTH_TOKEN;
  }
}

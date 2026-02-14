import type { TokenStore, StravaTokens } from "./token-store.js";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export class StravaClient {
  private refreshPromise: Promise<StravaTokens> | null = null;

  constructor(private readonly tokenStore: TokenStore) {}

  private async ensureValidToken(): Promise<string> {
    let tokens = this.tokenStore.read();

    if (this.tokenStore.isExpired(tokens)) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshToken(tokens);
      }
      tokens = await this.refreshPromise;
      this.refreshPromise = null;
    }

    return tokens.access_token;
  }

  private async refreshToken(tokens: StravaTokens): Promise<StravaTokens> {
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: tokens.client_id,
        client_secret: tokens.client_secret,
        refresh_token: tokens.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Strava token refresh failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };

    const updated: StravaTokens = {
      ...tokens,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };

    this.tokenStore.write(updated);
    return updated;
  }

  async get(path: string, params?: Record<string, string | number | boolean>): Promise<unknown> {
    const token = await this.ensureValidToken();
    const url = new URL(`${STRAVA_API_BASE}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Strava API error (${response.status} ${path}): ${body}`);
    }

    return response.json();
  }

  async post(path: string, body: unknown): Promise<unknown> {
    const token = await this.ensureValidToken();
    const response = await fetch(`${STRAVA_API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Strava API error (${response.status} ${path}): ${text}`);
    }

    return response.json();
  }

  async put(path: string, body: unknown): Promise<unknown> {
    const token = await this.ensureValidToken();
    const response = await fetch(`${STRAVA_API_BASE}${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Strava API error (${response.status} ${path}): ${text}`);
    }

    return response.json();
  }
}

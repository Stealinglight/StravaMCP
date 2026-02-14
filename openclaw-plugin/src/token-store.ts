import { readFileSync, writeFileSync, existsSync } from "node:fs";

export interface StravaTokens {
  client_id: string;
  client_secret: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export class TokenStore {
  constructor(private readonly filePath: string) {}

  read(): StravaTokens {
    if (!existsSync(this.filePath)) {
      throw new Error(
        `Strava token file not found: ${this.filePath}\n` +
        `Create a JSON file at this path with: client_id, client_secret, access_token, refresh_token, expires_at`
      );
    }
    const raw = readFileSync(this.filePath, "utf-8");
    return JSON.parse(raw) as StravaTokens;
  }

  write(tokens: StravaTokens): void {
    writeFileSync(this.filePath, JSON.stringify(tokens, null, 2), "utf-8");
  }

  isExpired(tokens: StravaTokens, bufferSeconds = 300): boolean {
    return Date.now() / 1000 >= tokens.expires_at - bufferSeconds;
  }
}

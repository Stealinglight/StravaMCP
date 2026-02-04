import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Environment variable schema for validation
 */
const envSchema = z.object({
  STRAVA_CLIENT_ID: z.string().min(1, 'STRAVA_CLIENT_ID is required'),
  STRAVA_CLIENT_SECRET: z.string().min(1, 'STRAVA_CLIENT_SECRET is required'),
  STRAVA_REFRESH_TOKEN: z.string().min(1, 'STRAVA_REFRESH_TOKEN is required'),
  AUTH_TOKEN: z.string().min(32, 'AUTH_TOKEN must be at least 32 characters'),
  PORT: z.string().default('3000').transform(Number),
  // ALLOW_AUTHLESS: When "true", bypasses auth for SSE endpoints (/sse, /sse/, /message)
  // This enables Claude.ai custom connectors which don't support Bearer token auth
  ALLOW_AUTHLESS: z.string().default('false').transform((val) => val.toLowerCase() === 'true'),
});

/**
 * Validates and returns environment variables
 * @throws {Error} If required environment variables are missing
 */
export function getConfig() {
  const result = envSchema.safeParse({
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
    STRAVA_REFRESH_TOKEN: process.env.STRAVA_REFRESH_TOKEN,
    AUTH_TOKEN: process.env.AUTH_TOKEN,
    PORT: process.env.PORT,
    ALLOW_AUTHLESS: process.env.ALLOW_AUTHLESS,
  });

  if (!result.success) {
    throw new Error(
      `Missing or invalid environment variables:\n${result.error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')}`
    );
  }

  return result.data;
}

export type Config = z.infer<typeof envSchema>;

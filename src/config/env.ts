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
  AUTH_TOKEN: z
    .string()
    .min(32, 'AUTH_TOKEN must be at least 32 characters')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  PORT: z.string().default('3000').transform(Number),
  SECRETS_MANAGER_ARN: z.string().optional(),
  OAUTH_ENABLED: z.string().default('false').transform((val) => val.toLowerCase() === 'true'),
  OAUTH_CLIENTS_TABLE: z.string().optional(),
  OAUTH_CODES_TABLE: z.string().optional(),
  OAUTH_TOKENS_TABLE: z.string().optional(),
  OAUTH_ALLOWED_REDIRECT_URIS: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
        : undefined
    ),
  OAUTH_REGISTRATION_TOKEN: z.string().optional(),
  OAUTH_ACCESS_TOKEN_TTL_SECONDS: z
    .string()
    .default('3600')
    .transform((val) => Number(val)),
  OAUTH_REFRESH_TOKEN_TTL_SECONDS: z
    .string()
    .default('2592000')
    .transform((val) => Number(val)),
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
    SECRETS_MANAGER_ARN: process.env.SECRETS_MANAGER_ARN,
    OAUTH_ENABLED: process.env.OAUTH_ENABLED,
    OAUTH_CLIENTS_TABLE: process.env.OAUTH_CLIENTS_TABLE,
    OAUTH_CODES_TABLE: process.env.OAUTH_CODES_TABLE,
    OAUTH_TOKENS_TABLE: process.env.OAUTH_TOKENS_TABLE,
    OAUTH_ALLOWED_REDIRECT_URIS: process.env.OAUTH_ALLOWED_REDIRECT_URIS,
    OAUTH_REGISTRATION_TOKEN: process.env.OAUTH_REGISTRATION_TOKEN,
    OAUTH_ACCESS_TOKEN_TTL_SECONDS: process.env.OAUTH_ACCESS_TOKEN_TTL_SECONDS,
    OAUTH_REFRESH_TOKEN_TTL_SECONDS: process.env.OAUTH_REFRESH_TOKEN_TTL_SECONDS,
  });

  if (!result.success) {
    throw new Error(
      `Missing or invalid environment variables:\n${result.error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')}`
    );
  }

  if (result.data.OAUTH_ENABLED) {
    if (!result.data.OAUTH_CLIENTS_TABLE || !result.data.OAUTH_CODES_TABLE || !result.data.OAUTH_TOKENS_TABLE) {
      throw new Error('OAuth is enabled but OAUTH_* table names are missing');
    }
  }

  return result.data;
}

export type Config = z.infer<typeof envSchema>;

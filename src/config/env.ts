import { z } from 'zod';

/**
 * Schema for environment variables validation
 * Uses Zod for runtime type checking and transformation
 */
const envSchema = z.object({
  // Required API credentials
  APIHOST: z.string().min(1, 'APIHOST cannot be empty'),
  APIKEY: z.string().min(1, 'APIKEY cannot be empty'),
  APIUSER: z.string().min(1, 'APIUSER cannot be empty'),

  // Optional server configuration
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').transform(Number).default('1337'),

  // Optional logging configuration
  MCP_ENABLE_FILE_LOGGING: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
  MCP_LOG_DIRECTORY: z.string().default('logs'),
  MCP_DEBUG_CONSOLE: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
});

/**
 * Validates environment variables and returns parsed values
 * Throws descriptive error if validation fails
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.format();
    const missingRequired: string[] = [];

    // Extract missing required variables
    if (errors.APIHOST?._errors.length) missingRequired.push('APIHOST');
    if (errors.APIKEY?._errors.length) missingRequired.push('APIKEY');
    if (errors.APIUSER?._errors.length) missingRequired.push('APIUSER');

    // Create detailed error message
    const errorMessage = [
      'Environment validation failed:',
      missingRequired.length > 0
        ? `\nMissing required variables: ${missingRequired.join(', ')}`
        : `\nValidation errors: ${JSON.stringify(errors, null, 2)}`,
      '\nPlease ensure these environment variables are set in your MCP server configuration.',
      '\nExample claude_desktop_config.json:',
      JSON.stringify({
        mcpServers: {
          "mcp-onesearch-api-poc": {
            env: {
              APIHOST: "onesearch-api.nejmgroup-dev.org",
              APIKEY: "your-api-key",
              APIUSER: "your-api-user"
            }
          }
        }
      }, null, 2)
    ].filter(Boolean).join('\n');

    throw new Error(errorMessage);
  }

  return result.data;
}

/**
 * Perform validation immediately on module load
 * This ensures the application fails fast if configuration is invalid
 */
const env = validateEnv();

/**
 * Centralized, typed, readonly configuration object
 * Exported for use throughout the application
 */
export const config = {
  api: {
    host: env.APIHOST,
    key: env.APIKEY,
    user: env.APIUSER,
    baseUrl: `https://${env.APIHOST}/api/v1`,
  },
  server: {
    port: env.PORT,
  },
  logging: {
    enableFileLogging: env.MCP_ENABLE_FILE_LOGGING,
    logDirectory: env.MCP_LOG_DIRECTORY,
    debugConsole: env.MCP_DEBUG_CONSOLE,
  },
} as const;

/**
 * Type export for use in other modules
 */
export type Config = typeof config;

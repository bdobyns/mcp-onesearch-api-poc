import { vi } from 'vitest';

/**
 * Sets up test environment variables with valid default values
 * Use this in beforeEach for tests that need environment configuration
 */
export function setupTestEnv() {
  vi.stubEnv('APIHOST', 'test-api.example.org');
  vi.stubEnv('APIKEY', 'test-key-12345');
  vi.stubEnv('APIUSER', 'test-user');
  vi.stubEnv('PORT', '1337');
  vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'false');
  vi.stubEnv('MCP_LOG_DIRECTORY', 'logs');
  vi.stubEnv('MCP_DEBUG_CONSOLE', 'false');
}

/**
 * Cleans up all stubbed environment variables
 * Use this in afterEach to ensure tests don't pollute each other
 */
export function cleanupTestEnv() {
  vi.unstubAllEnvs();
}

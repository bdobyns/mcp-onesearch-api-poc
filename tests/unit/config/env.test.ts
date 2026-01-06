import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env configuration', () => {
  beforeEach(() => {
    vi.resetModules(); // Clear module cache before each test
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Valid configuration', () => {
    it('should validate with all required variables', async () => {
      vi.stubEnv('APIHOST', 'test-host.example.org');
      vi.stubEnv('APIKEY', 'test-api-key-12345');
      vi.stubEnv('APIUSER', 'test-user');

      const { config } = await import('../../../src/config/env.js');

      expect(config.api.host).toBe('test-host.example.org');
      expect(config.api.key).toBe('test-api-key-12345');
      expect(config.api.user).toBe('test-user');
      expect(config.api.baseUrl).toBe('https://test-host.example.org/api/v1');
    });

    it('should use default PORT when not specified', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const { config } = await import('../../../src/config/env.js');

      expect(config.server.port).toBe(1337);
    });

    it('should transform PORT string to number', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('PORT', '3000');

      const { config } = await import('../../../src/config/env.js');

      expect(config.server.port).toBe(3000);
      expect(typeof config.server.port).toBe('number');
    });

    it('should default MCP_ENABLE_FILE_LOGGING to false', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const { config } = await import('../../../src/config/env.js');

      expect(config.logging.enableFileLogging).toBe(false);
    });

    it('should transform MCP_ENABLE_FILE_LOGGING true string to boolean', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');

      const { config } = await import('../../../src/config/env.js');

      expect(config.logging.enableFileLogging).toBe(true);
      expect(typeof config.logging.enableFileLogging).toBe('boolean');
    });

    it('should default MCP_LOG_DIRECTORY to logs', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const { config } = await import('../../../src/config/env.js');

      expect(config.logging.logDirectory).toBe('logs');
    });

    it('should use custom MCP_LOG_DIRECTORY when provided', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_LOG_DIRECTORY', '/var/log/mcp');

      const { config } = await import('../../../src/config/env.js');

      expect(config.logging.logDirectory).toBe('/var/log/mcp');
    });

    it('should default MCP_DEBUG_CONSOLE to false', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const { config } = await import('../../../src/config/env.js');

      expect(config.logging.debugConsole).toBe(false);
    });

    it('should transform MCP_DEBUG_CONSOLE true string to boolean', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_DEBUG_CONSOLE', 'true');

      const { config } = await import('../../../src/config/env.js');

      expect(config.logging.debugConsole).toBe(true);
    });
  });

  describe('Missing required variables', () => {
    it('should throw when APIHOST is missing', async () => {
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      // APIHOST not set

      await expect(async () => {
        await import('../../../src/config/env.js');
      }).rejects.toThrow(/APIHOST/);
    });

    it('should throw when APIKEY is missing', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIUSER', 'test-user');
      // APIKEY not set

      await expect(async () => {
        await import('../../../src/config/env.js');
      }).rejects.toThrow(/APIKEY/);
    });

    it('should throw when APIUSER is missing', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      // APIUSER not set

      await expect(async () => {
        await import('../../../src/config/env.js');
      }).rejects.toThrow(/APIUSER/);
    });

    it('should include "Missing required variables" in error message', async () => {
      vi.stubEnv('APIKEY', 'test-key');
      // APIHOST and APIUSER missing

      await expect(async () => {
        await import('../../../src/config/env.js');
      }).rejects.toThrow(/Missing required variables/);
    });
  });

  describe('Invalid values', () => {
    it('should throw error for non-numeric PORT', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('PORT', 'not-a-number');

      await expect(async () => {
        await import('../../../src/config/env.js');
      }).rejects.toThrow();
    });

    it('should throw error for empty APIHOST', async () => {
      vi.stubEnv('APIHOST', '');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      await expect(async () => {
        await import('../../../src/config/env.js');
      }).rejects.toThrow(/APIHOST/);
    });
  });

  describe('Config type safety', () => {
    it('should export config with expected structure', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const { config } = await import('../../../src/config/env.js');

      // Verify config structure
      expect(config).toHaveProperty('api');
      expect(config).toHaveProperty('server');
      expect(config).toHaveProperty('logging');
      expect(config.api).toHaveProperty('host');
      expect(config.api).toHaveProperty('key');
      expect(config.api).toHaveProperty('user');
      expect(config.api).toHaveProperty('baseUrl');
    });
  });
});

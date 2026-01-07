import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdir } from 'fs/promises';
import { createWriteStream, WriteStream } from 'fs';

// Mock fs and fs/promises modules
vi.mock('fs', () => ({
  createWriteStream: vi.fn(),
  WriteStream: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
}));

describe('Logger', () => {
  let mockWriteStream: Partial<WriteStream>;
  let mockStderrWrite: ReturnType<typeof vi.spyOn>;
  let mockProcessOn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Mock WriteStream
    mockWriteStream = {
      write: vi.fn(),
      end: vi.fn(),
    };

    // Mock createWriteStream
    vi.mocked(createWriteStream).mockReturnValue(mockWriteStream as WriteStream);

    // Mock mkdir
    vi.mocked(mkdir).mockResolvedValue(undefined);

    // Mock process.stderr.write
    mockStderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    // Mock process.on
    mockProcessOn = vi.spyOn(process, 'on').mockImplementation(() => process);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    mockStderrWrite.mockRestore();
    mockProcessOn.mockRestore();
  });

  describe('Singleton pattern', () => {
    it('should return the same instance when getInstance is called multiple times', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const { Logger } = await import('../../../src/util/Logger.js');

      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('File logging disabled', () => {
    it('should not create log file when file logging is disabled', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'false');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      expect(createWriteStream).not.toHaveBeenCalled();
      expect(logger.isFileLoggingEnabled()).toBe(false);
    });

    it('should write to stderr but not to file when logging', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'false');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      logger.info('test message');

      expect(mockStderrWrite).toHaveBeenCalled();
      expect(mockWriteStream.write).not.toHaveBeenCalled();
    });

    it('should return empty string from getLogPath when file logging disabled', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'false');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      expect(logger.getLogPath()).toBe('');
    });
  });

  describe('File logging enabled', () => {
    it('should create log directory when file logging is enabled', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');
      vi.stubEnv('MCP_LOG_DIRECTORY', 'test-logs');

      const { Logger } = await import('../../../src/util/Logger.js');
      Logger.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mkdir).toHaveBeenCalledWith('test-logs', { recursive: true });
    });

    it('should create write stream when file logging is enabled', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');

      const { Logger } = await import('../../../src/util/Logger.js');
      Logger.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(createWriteStream).toHaveBeenCalled();
      const callArgs = vi.mocked(createWriteStream).mock.calls[0];
      expect(callArgs[0]).toMatch(/mcp-server-.*\.log/);
      expect(callArgs[1]).toEqual({ flags: 'a' });
    });

    it('should write to both stderr and file when logging', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      logger.info('test message');

      expect(mockStderrWrite).toHaveBeenCalled();
      expect(mockWriteStream.write).toHaveBeenCalled();
    });

    it('should return log file path when file logging enabled', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');
      vi.stubEnv('MCP_LOG_DIRECTORY', 'test-logs');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      const logPath = logger.getLogPath();
      expect(logPath).toMatch(/test-logs\/mcp-server-.*\.log/);
    });

    it('should handle file logging initialization failure', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');

      vi.mocked(mkdir).mockRejectedValueOnce(new Error('Permission denied'));

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(logger.isFileLoggingEnabled()).toBe(false);
      expect(mockStderrWrite).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize file logging')
      );
    });

    it('should set isFileLoggingEnabled to true when initialization succeeds', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(logger.isFileLoggingEnabled()).toBe(true);
    });
  });

  describe('Logging methods', () => {
    beforeEach(() => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'false');
    });

    it('should format info messages correctly', async () => {
      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      logger.info('test message');

      expect(mockStderrWrite).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[INFO\] test message\n/)
      );
    });

    it('should format error messages correctly', async () => {
      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      logger.error('error message');

      expect(mockStderrWrite).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[ERROR\] error message\n/)
      );
    });

    it('should format warn messages correctly', async () => {
      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      logger.warn('warning message');

      expect(mockStderrWrite).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[WARN\] warning message\n/)
      );
    });

    it('should format debug messages correctly', async () => {
      vi.stubEnv('MCP_DEBUG_CONSOLE', 'true');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      logger.debug('debug message');

      expect(mockStderrWrite).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[DEBUG\] debug message\n/)
      );
    });

    it('should include ISO timestamp in formatted messages', async () => {
      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      logger.info('test');

      const call = mockStderrWrite.mock.calls[0][0] as string;
      // Extract timestamp from message
      const timestampMatch = call.match(/\[(.*?)\]/);
      expect(timestampMatch).toBeTruthy();

      // Verify it's a valid ISO timestamp
      const timestamp = timestampMatch![1];
      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('should log method be an alias for info', async () => {
      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      logger.log('test message');

      expect(mockStderrWrite).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[INFO\] test message\n/)
      );
    });
  });

  describe('Debug console configuration', () => {
    it('should write debug messages to stderr when debugConsole is true', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_DEBUG_CONSOLE', 'true');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'false');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      logger.debug('debug message');

      expect(mockStderrWrite).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[DEBUG\] debug message\n/)
      );
    });

    it('should not write debug messages to stderr when debugConsole is false', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_DEBUG_CONSOLE', 'false');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'false');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      logger.debug('debug message');

      expect(mockStderrWrite).not.toHaveBeenCalled();
    });

    it('should write debug messages to file when file logging enabled regardless of debugConsole', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_DEBUG_CONSOLE', 'false');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      logger.debug('debug message');

      expect(mockWriteStream.write).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[DEBUG\] debug message\n/)
      );
    });
  });

  describe('Process exit handlers', () => {
    it('should register exit handlers on initialization', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const { Logger } = await import('../../../src/util/Logger.js');
      Logger.getInstance();

      expect(mockProcessOn).toHaveBeenCalledWith('exit', expect.any(Function));
      expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });
  });

  describe('Close method', () => {
    it('should close log stream when close is called', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      logger.close();

      expect(mockWriteStream.end).toHaveBeenCalled();
    });

    it('should handle close when log stream is null', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'false');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      expect(() => logger.close()).not.toThrow();
    });

    it('should set log stream to null after closing', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      logger.close();

      // Try to log after closing - should not throw but also not write to stream
      mockWriteStream.write = vi.fn();
      logger.info('after close');

      expect(mockWriteStream.write).not.toHaveBeenCalled();
      expect(mockStderrWrite).toHaveBeenCalled();
    });
  });

  describe('Logger instance export', () => {
    it('should export a logger instance', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const { logger } = await import('../../../src/util/Logger.js');

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.log).toBe('function');
    });

    it('should export same instance as Logger.getInstance()', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const { logger, Logger } = await import('../../../src/util/Logger.js');

      expect(logger).toBe(Logger.getInstance());
    });
  });

  describe('Log file naming', () => {
    it('should use sanitized timestamp in log filename', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      const logPath = logger.getLogPath();

      // Verify filename format: mcp-server-{sanitized-timestamp}.log
      expect(logPath).toMatch(/mcp-server-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.log$/);

      // Verify no colons or periods in timestamp (except final .log)
      const filename = logPath.split('/').pop()!;
      const timestamp = filename.replace('mcp-server-', '').replace('.log', '');
      expect(timestamp).not.toMatch(/[:.]/);
    });
  });

  describe('Custom log directory', () => {
    it('should use custom log directory from environment', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('MCP_ENABLE_FILE_LOGGING', 'true');
      vi.stubEnv('MCP_LOG_DIRECTORY', '/custom/logs/path');

      const { Logger } = await import('../../../src/util/Logger.js');
      const logger = Logger.getInstance();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mkdir).toHaveBeenCalledWith('/custom/logs/path', { recursive: true });
      expect(logger.getLogPath()).toMatch(/^\/custom\/logs\/path\/mcp-server-.*\.log$/);
    });
  });
});

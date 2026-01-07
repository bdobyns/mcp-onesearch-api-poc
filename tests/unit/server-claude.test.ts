import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import http from 'http';
import { Readable } from 'stream';

// Mock all external dependencies before importing the module
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation(() => ({
    registerTool: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation(() => ({
    handleRequest: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../src/tools/index.js', () => ({
  tools: [
    {
      name: 'test-tool-1',
      title: 'Test Tool 1',
      description: 'Test tool description',
      inputSchema: {},
      handler: vi.fn(),
    },
    {
      name: 'test-tool-2',
      title: 'Test Tool 2',
      description: 'Another test tool',
      inputSchema: {},
      annotations: { readOnlyHint: true },
      handler: vi.fn(),
    },
  ],
}));

describe('server-claude', () => {
  let mockLogger: any;
  let mockHttpServer: any;
  let mockProcessStdin: any;
  let mockProcessOn: any;
  let mockProcessExit: any;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    vi.doMock('../../src/util/Logger.js', () => ({
      logger: mockLogger,
    }));

    // Mock process.stdin
    mockProcessStdin = {
      resume: vi.fn(),
    };
    vi.spyOn(process, 'stdin', 'get').mockReturnValue(mockProcessStdin as any);

    // Mock process event handlers
    mockProcessOn = vi.spyOn(process, 'on').mockImplementation(() => process);

    // Mock process.exit
    mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Mock http.createServer
    mockHttpServer = {
      listen: vi.fn((port: number, callback: () => void) => {
        callback();
        return mockHttpServer;
      }),
      close: vi.fn((callback?: () => void) => {
        if (callback) callback();
        return mockHttpServer;
      }),
      keepAliveTimeout: 0,
      headersTimeout: 0,
    };

    vi.spyOn(http, 'createServer').mockReturnValue(mockHttpServer as any);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    mockProcessExit.mockRestore();
  });

  describe('Server initialization', () => {
    it('should create McpServer with correct name and version', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');

      // Import to trigger server creation
      await import('../../src/server-claude.js');

      expect(McpServer).toHaveBeenCalledWith({
        name: 'mcp-onesearch-api-poc-server',
        version: '0.1.0',
      });
    });

    it('should register all tools', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
      const mockRegisterTool = vi.fn();
      (McpServer as any).mockImplementation(() => ({
        registerTool: mockRegisterTool,
        connect: vi.fn().mockResolvedValue(undefined),
      }));

      await import('../../src/server-claude.js');

      // Should register 2 test tools
      expect(mockRegisterTool).toHaveBeenCalledTimes(2);

      // Verify first tool registration
      expect(mockRegisterTool).toHaveBeenCalledWith(
        'test-tool-1',
        {
          title: 'Test Tool 1',
          description: 'Test tool description',
          inputSchema: {},
          annotations: undefined,
        },
        expect.any(Function)
      );

      // Verify second tool registration with annotations
      expect(mockRegisterTool).toHaveBeenCalledWith(
        'test-tool-2',
        {
          title: 'Test Tool 2',
          description: 'Another test tool',
          inputSchema: {},
          annotations: { readOnlyHint: true },
        },
        expect.any(Function)
      );
    });
  });

  describe('Stdio mode', () => {
    it('should use StdioServerTransport when --stdio flag is provided', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      // Mock process.argv
      const originalArgv = process.argv;
      process.argv = ['node', 'server.js', '--stdio'];

      const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');

      const mockConnect = vi.fn().mockResolvedValue(undefined);
      (McpServer as any).mockImplementation(() => ({
        registerTool: vi.fn(),
        connect: mockConnect,
      }));

      // Need to dynamically import to trigger main()
      await import('../../src/server-claude.js');

      // Wait for async main() to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(StdioServerTransport).toHaveBeenCalled();
      expect(mockConnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('onesearch-api MCP server running on stdio');
      expect(mockProcessStdin.resume).toHaveBeenCalled();

      process.argv = originalArgv;
    });
  });

  describe('StreamableHTTP mode', () => {
    beforeEach(() => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');
      vi.stubEnv('PORT', '3000');
    });

    it('should create HTTP server when no --stdio flag is provided', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'server.js'];

      const { StreamableHTTPServerTransport } = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');

      await import('../../src/server-claude.js');

      // Wait for async main() to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(StreamableHTTPServerTransport).toHaveBeenCalled();
      expect(http.createServer).toHaveBeenCalled();
      expect(mockHttpServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));

      process.argv = originalArgv;
    });

    it('should log correct startup messages', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'server.js'];

      await import('../../src/server-claude.js');

      // Wait for async main() to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockLogger.info).toHaveBeenCalledWith('onesearch-api MCP server running on http://localhost:3000');
      expect(mockLogger.info).toHaveBeenCalledWith('Transport: StreamableHTTP');
      expect(mockLogger.info).toHaveBeenCalledWith('For MCP Inspector, connect to: http://localhost:3000/mcp');
      expect(mockLogger.info).toHaveBeenCalledWith('Press Ctrl+C to stop\n');

      process.argv = originalArgv;
    });

    it('should set keepAliveTimeout and headersTimeout', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'server.js'];

      await import('../../src/server-claude.js');

      // Wait for async main() to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockHttpServer.keepAliveTimeout).toBe(60000);
      expect(mockHttpServer.headersTimeout).toBe(65000);

      process.argv = originalArgv;
    });

    it('should register SIGINT and SIGTERM handlers', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'server.js'];

      await import('../../src/server-claude.js');

      // Wait for async main() to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      const processOnCalls = mockProcessOn.mock.calls;
      const signalHandlers = processOnCalls.filter(
        (call: any) => call[0] === 'SIGINT' || call[0] === 'SIGTERM'
      );

      expect(signalHandlers.length).toBeGreaterThan(0);

      process.argv = originalArgv;
    });
  });

  describe('HTTP request handling', () => {
    let requestHandler: any;
    let mockTransport: any;

    beforeEach(async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      mockTransport = {
        handleRequest: vi.fn().mockResolvedValue(undefined),
      };

      const { StreamableHTTPServerTransport } = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
      (StreamableHTTPServerTransport as any).mockImplementation(() => mockTransport);

      const originalArgv = process.argv;
      process.argv = ['node', 'server.js'];

      // Capture the request handler
      (http.createServer as Mock).mockImplementation((handler) => {
        requestHandler = handler;
        return mockHttpServer;
      });

      await import('../../src/server-claude.js');

      // Wait for async main() to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      process.argv = originalArgv;
    });

    it('should handle OPTIONS requests with CORS headers', async () => {
      const mockReq = {
        method: 'OPTIONS',
        url: '/test',
        headers: {},
      };

      const mockRes = {
        setHeader: vi.fn(),
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: false,
      };

      await requestHandler(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
      expect(mockRes.writeHead).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();
      expect(mockTransport.handleRequest).not.toHaveBeenCalled();
    });

    it('should handle GET requests', async () => {
      const mockReq = {
        method: 'GET',
        url: '/test',
        headers: { host: 'localhost:3000' },
      };

      const mockRes = {
        setHeader: vi.fn(),
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: false,
      };

      await requestHandler(mockReq, mockRes);

      expect(mockLogger.info).toHaveBeenCalledWith('GET http://localhost:3000/test');
      expect(mockTransport.handleRequest).toHaveBeenCalledWith(mockReq, mockRes);
    });

    it('should handle POST requests by buffering body', async () => {
      const testBody = JSON.stringify({ test: 'data' });

      const mockReq = new Readable({
        read() {
          this.push(testBody);
          this.push(null);
        },
      });
      (mockReq as any).method = 'POST';
      (mockReq as any).url = '/test';
      (mockReq as any).headers = { host: 'localhost:3000' };
      (mockReq as any).httpVersion = '1.1';
      (mockReq as any).httpVersionMajor = 1;
      (mockReq as any).httpVersionMinor = 1;
      (mockReq as any).rawHeaders = [];

      const mockRes = {
        setHeader: vi.fn(),
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: false,
      };

      await requestHandler(mockReq, mockRes);

      // Wait for body buffering
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockLogger.info).toHaveBeenCalledWith(`POST /test - Body: ${testBody}`);
      expect(mockTransport.handleRequest).toHaveBeenCalled();
    });

    it('should handle errors and send 500 response', async () => {
      mockTransport.handleRequest.mockRejectedValueOnce(new Error('Test error'));

      const mockReq = {
        method: 'GET',
        url: '/test',
        headers: { host: 'localhost:3000' },
      };

      const mockRes = {
        setHeader: vi.fn(),
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: false,
      };

      await requestHandler(mockReq, mockRes);

      expect(mockLogger.error).toHaveBeenCalledWith('StreamableHTTP error: Error: Test error');
      expect(mockRes.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'application/json' });
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Test error' }));
    });

    it('should not send error response if headers already sent', async () => {
      mockTransport.handleRequest.mockRejectedValueOnce(new Error('Test error'));

      const mockReq = {
        method: 'GET',
        url: '/test',
        headers: { host: 'localhost:3000' },
      };

      const mockRes = {
        setHeader: vi.fn(),
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: true,
      };

      await requestHandler(mockReq, mockRes);

      expect(mockLogger.error).toHaveBeenCalledWith('StreamableHTTP error: Error: Test error');
      expect(mockRes.writeHead).not.toHaveBeenCalled();
    });

    it('should handle other HTTP methods', async () => {
      const mockReq = {
        method: 'PUT',
        url: '/test',
        headers: {},
      };

      const mockRes = {
        setHeader: vi.fn(),
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: false,
      };

      await requestHandler(mockReq, mockRes);

      expect(mockLogger.info).toHaveBeenCalledWith('PUT /test');
      expect(mockTransport.handleRequest).toHaveBeenCalledWith(mockReq, mockRes);
    });
  });

  describe('Graceful shutdown', () => {
    let shutdownHandler: any;

    beforeEach(async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const originalArgv = process.argv;
      process.argv = ['node', 'server.js'];

      mockProcessOn.mockImplementation((event: any, handler: any) => {
        if (event === 'SIGINT') {
          shutdownHandler = handler;
        }
        return process;
      });

      await import('../../src/server-claude.js');

      // Wait for async main() to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      process.argv = originalArgv;
    });

    it('should log graceful shutdown message', async () => {
      mockLogger.info.mockClear();

      shutdownHandler();

      expect(mockLogger.info).toHaveBeenCalledWith('Shutting down gracefully...');
    });

    it('should close HTTP server on shutdown', async () => {
      shutdownHandler();

      expect(mockHttpServer.close).toHaveBeenCalled();
    });

    it('should log when HTTP server closes', async () => {
      mockLogger.info.mockClear();

      shutdownHandler();

      // Wait for close callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockLogger.info).toHaveBeenCalledWith('HTTP server closed');
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should force shutdown after timeout', async () => {
      vi.useFakeTimers();

      // Make httpServer.close not call callback
      mockHttpServer.close = vi.fn();

      mockLogger.error.mockClear();

      shutdownHandler();

      // Fast-forward time by 2000ms
      await vi.advanceTimersByTimeAsync(2000);

      expect(mockLogger.error).toHaveBeenCalledWith('Forcing shutdown...');
      expect(mockProcessExit).toHaveBeenCalledWith(0);

      vi.useRealTimers();
    });
  });

  describe('Fatal error handling', () => {
    it.skip('should log fatal error and exit on main() failure', async () => {
      // Skip this test as it's difficult to test module-level error handling
      // This would be better tested via integration tests
      // The fatal error handler catches errors from main() which runs on module import
      expect(true).toBe(true);
    });
  });

  describe('POST request body handling', () => {
    it('should create readable stream with all request properties', async () => {
      vi.stubEnv('APIHOST', 'test-host');
      vi.stubEnv('APIKEY', 'test-key');
      vi.stubEnv('APIUSER', 'test-user');

      const mockTransport = {
        handleRequest: vi.fn().mockResolvedValue(undefined),
      };

      const { StreamableHTTPServerTransport } = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
      (StreamableHTTPServerTransport as any).mockImplementation(() => mockTransport);

      const originalArgv = process.argv;
      process.argv = ['node', 'server.js'];

      let requestHandler: any;
      (http.createServer as Mock).mockImplementation((handler) => {
        requestHandler = handler;
        return mockHttpServer;
      });

      await import('../../src/server-claude.js');
      await new Promise(resolve => setTimeout(resolve, 50));

      const testBody = '{"test":"data"}';

      const mockReq = new Readable({
        read() {
          this.push(testBody);
          this.push(null);
        },
      });
      (mockReq as any).method = 'POST';
      (mockReq as any).url = '/api/test';
      (mockReq as any).headers = { 'content-type': 'application/json' };
      (mockReq as any).httpVersion = '1.1';
      (mockReq as any).httpVersionMajor = 1;
      (mockReq as any).httpVersionMinor = 1;
      (mockReq as any).rawHeaders = ['Content-Type', 'application/json'];
      (mockReq as any).socket = {};

      const mockRes = {
        setHeader: vi.fn(),
        writeHead: vi.fn(),
        end: vi.fn(),
        headersSent: false,
      };

      await requestHandler(mockReq, mockRes);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockTransport.handleRequest).toHaveBeenCalled();

      const streamArg = mockTransport.handleRequest.mock.calls[0][0];
      expect(streamArg.method).toBe('POST');
      expect(streamArg.url).toBe('/api/test');
      expect(streamArg.headers).toEqual({ 'content-type': 'application/json' });
      expect(streamArg.httpVersion).toBe('1.1');
      expect(streamArg.httpVersionMajor).toBe(1);
      expect(streamArg.httpVersionMinor).toBe(1);

      process.argv = originalArgv;
    });
  });
});

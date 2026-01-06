import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import http from "http";
import { tools } from "./tools/index.js";
import { logger } from "./util/Logger.js";

// Create MCP server instance
const server = new McpServer({
  name: "mcp-onesearch-api-poc-server",
  version: "0.1.0"
});

// Register all tools
tools.forEach(tool => {
  (server as any).registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations
    },
    tool.handler
  );
});

async function main() {
  const useStdio = process.argv.includes("--stdio");
  
  if (useStdio) {
    // stdio mode for Claude Desktop
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("onesearch-api MCP server running on stdio");
    process.stdin.resume();
  } else {
    // StreamableHTTP mode for MCP Inspector
    const port = process.env.PORT ? parseInt(process.env.PORT) : 1337;
    
    // Create the transport once
    const transport = new StreamableHTTPServerTransport();
    await server.connect(transport);
    
    const httpServer = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      try {
        // Enhanced logging based on request method
        if (req.method === 'GET') {
          const fullUrl = `http://${req.headers.host}${req.url}`;
          logger.info(`GET ${fullUrl}`);
          await (transport as any).handleRequest(req, res);
        } else if (req.method === 'POST') {
          // Buffer the body
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(chunk));
          
          await new Promise<void>((resolve) => {
            req.on('end', () => {
              const body = Buffer.concat(chunks).toString();
              logger.info(`POST ${req.url} - Body: ${body}`);
              resolve();
            });
          });
          
          // Create a new IncomingMessage-like object with the buffered body
          const { Readable } = await import('stream');
          const bodyStream = new Readable({
            read() {
              this.push(Buffer.concat(chunks));
              this.push(null);
            }
          });
          
          // Copy all critical properties
          (bodyStream as any).method = req.method;
          (bodyStream as any).url = req.url;
          (bodyStream as any).headers = req.headers;
          (bodyStream as any).httpVersion = req.httpVersion;
          (bodyStream as any).httpVersionMajor = req.httpVersionMajor;
          (bodyStream as any).httpVersionMinor = req.httpVersionMinor;
          (bodyStream as any).rawHeaders = req.rawHeaders;
          (bodyStream as any).socket = req.socket;
          
          await (transport as any).handleRequest(bodyStream, res);
        } else {
          logger.info(`${req.method} ${req.url}`);
          await (transport as any).handleRequest(req, res);
        }
      
      } catch (error: any) {
        logger.error('StreamableHTTP error: ' + error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      }
    });
    
    // Graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down gracefully...');
      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forcing shutdown...');
        process.exit(0);
      }, 2000);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    httpServer.listen(port, () => {
      logger.info(`onesearch-api MCP server running on http://localhost:${port}`);
      logger.info(`Transport: StreamableHTTP`);
      logger.info(`For MCP Inspector, connect to: http://localhost:${port}/mcp`);
      logger.info(`Press Ctrl+C to stop\n`);
    });
    
    httpServer.keepAliveTimeout = 60000;
    httpServer.headersTimeout = 65000;
  }
}

main().catch((error) => {
  logger.error("Fatal server error: " + error);
  process.exit(1);
});

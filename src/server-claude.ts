import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { fetchByDoi } from "./api/fetchByDoi.js";
import { fetchSimpleQuery } from "./api/simplequery.js";
import http from "http";

// Create MCP server instance
const server = new McpServer({
  name: "research-mcp-server",
  version: "1.0.0"
});

// Define schemas
const DoiSchema = z.object({
  doi: z.string().describe("DOI of the article to fetch")
});

const SimpleQuerySchema = z.object({
  context: z.string().describe("Journal or context to query"),
  query: z.string().describe("Search query string")
});

// Register DoiTool using registerTool
(server as any).registerTool(
  "fetch_by_doi",
  {
    title: "Fetch Article by DOI",
    description: "Fetch an academic article by its DOI (Digital Object Identifier). Can be used to retrieve articles from the New England Journal of Medicine, NEJM Catalyst, NEJM Evidence, NEJM AI, and NEJM Clinician. DOI must start with 10.1056/",
    inputSchema: DoiSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: any) => {
    const doi = params.doi as string;
    try {
      const article = await fetchByDoi(doi);
      return {
        content: [
          {
            type: "text",
            text: article
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching article: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Register SimpleQuery
(server as any).registerTool(
  "simple_query",
  {
    title: "Query Articles",
    description: "Query academic articles by journal context and search query. Supported contexts include New England Journal of Medicine, NEJM Catalyst, NEJM Evidence, NEJM AI, and NEJM Clinician.",
    inputSchema: SimpleQuerySchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: any) => {
    const context = params.context as string;
    const query = params.query as string;
    try {
      const results = await fetchSimpleQuery({ context, query });
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error querying articles: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Store active SSE transports by session
const sseTransports = new Map<string, SSEServerTransport>();

async function main() {
  const useStdio = process.argv.includes("--stdio");
  
  // Handle graceful shutdown
  let httpServer: http.Server | null = null;
  
  const shutdown = () => {
    console.error('\nShutting down gracefully...');
    
    // Close all SSE connections
    for (const [sessionId, transport] of sseTransports.entries()) {
      console.error(`Closing SSE session: ${sessionId}`);
      sseTransports.delete(sessionId);
    }
    
    // Close HTTP server
    if (httpServer) {
      httpServer.close(() => {
        console.error('HTTP server closed');
        process.exit(0);
      });
      
      // Force close after 2 seconds
      setTimeout(() => {
        console.error('Forcing shutdown...');
        process.exit(0);
      }, 2000);
    } else {
      process.exit(0);
    }
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  if (useStdio) {
    // Claude Desktop mode - use stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Research MCP server running on stdio");
  } else {
    // HTTP mode with both SSE (for MCP clients) and REST (for testing)
    const port = process.env.PORT ? parseInt(process.env.PORT) : 1337;
    
    httpServer = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      // SSE endpoint for MCP clients
      if (req.url === '/sse' && req.method === 'GET') {
        console.error('SSE connection established');
        
        // Generate unique session ID
        const sessionId = crypto.randomUUID();
        const messageEndpoint = `/sse/${sessionId}/message`;
        
        console.error(`Creating SSE transport with session: ${sessionId}`);
        console.error(`Message endpoint: ${messageEndpoint}`);
        
        // Create transport and store it
        const transport = new SSEServerTransport(messageEndpoint, res);
        sseTransports.set(sessionId, transport);
        
        // Clean up on connection close
        res.on('close', () => {
          console.error(`SSE connection closed for session: ${sessionId}`);
          sseTransports.delete(sessionId);
        });
        
        // Connect server to transport
        await server.connect(transport);
      } 
      // Handle session-based message endpoints from SSE
      else if (req.url?.match(/^\/sse\/[^/]+\/message$/) && req.method === 'POST') {
        const sessionId = req.url.split('/')[2];
        console.error(`Received POST for session: ${sessionId}`);
        
        const transport = sseTransports.get(sessionId);
        if (!transport) {
          console.error(`No transport found for session: ${sessionId}`);
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Session not found' }));
          return;
        }
        
        // Read the request body and let the transport handle it
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            console.error(`Message body: ${body}`);
            // The SSE transport handles the message internally
            // Just acknowledge receipt
            res.writeHead(202, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: true }));
          } catch (error: any) {
            console.error('Error handling message:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      }
      // REST endpoint for testing tools - GET to list tools
      else if (req.url === '/mcp' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          tools: [
            {
              name: 'fetch_by_doi',
              description: 'Fetch an academic article by its DOI',
              parameters: {
                doi: 'string - DOI of the article (e.g., 10.1056/CLINjwNA59525)'
              }
            },
            {
              name: 'simple_query',
              description: 'Query academic articles by journal context and search query',
              parameters: {
                context: 'string - Journal or context to query',
                query: 'string - Search query string'
              }
            }
          ]
        }));
      }
      // REST endpoint for testing tools - POST to call a tool
      else if (req.url === '/mcp' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const request = JSON.parse(body);
            const { tool, arguments: args } = request;
            
            console.error(`REST API call: ${tool}`, args);
            
            if (tool === 'fetch_by_doi') {
              const article = await fetchByDoi(args.doi);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: true, 
                tool: 'fetch_by_doi',
                result: article 
              }));
            } else if (tool === 'simple_query') {
              const results = await fetchSimpleQuery({ 
                context: args.context, 
                query: args.query 
              });
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: true, 
                tool: 'simple_query',
                result: results 
              }));
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false,
                error: `Tool not found: ${tool}. Available tools: fetch_by_doi, simple_query` 
              }));
            }
          } catch (error: any) {
            console.error('REST API error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: false,
              error: error.message,
              stack: error.stack 
            }));
          }
        });
      }
      // Health check endpoint
      else if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          name: "research-mcp-server",
          version: "1.0.0",
          status: "running",
          endpoints: {
            sse: "/sse (for MCP clients like MCP Inspector)",
            mcp_rest: "/mcp (GET - list tools, POST - call tool for testing)"
          },
          examples: {
            list_tools: "curl http://localhost:1337/mcp",
            call_doi_tool: 'curl -X POST http://localhost:1337/mcp -H "Content-Type: application/json" -d \'{"tool":"fetch_by_doi","arguments":{"doi":"10.1056/CLINjwNA59525"}}\'',
            call_query_tool: 'curl -X POST http://localhost:1337/mcp -H "Content-Type: application/json" -d \'{"tool":"simple_query","arguments":{"context":"NEJM","query":"diabetes"}}\''
          }
        }));
      } 
      else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    
    httpServer.listen(port, () => {
      console.error(`\nResearch MCP server running on http://localhost:${port}`);
      console.error(`\nEndpoints:`);
      console.error(`  Health check: http://localhost:${port}/health`);
      console.error(`  SSE (MCP Inspector): http://localhost:${port}/sse`);
      console.error(`  MCP REST API: http://localhost:${port}/mcp`);
      console.error(`\nTest with curl:`);
      console.error(`  curl http://localhost:${port}/mcp`);
      console.error(`  curl -X POST http://localhost:1337/mcp -H "Content-Type: application/json" -d '{"tool":"fetch_by_doi","arguments":{"doi":"10.1056/CLINjwNA59525"}}'`);
      console.error(`\nPress Ctrl+C to stop`);
      console.error(``);
    });
    
    // Set keepalive timeout to allow graceful shutdown
    httpServer.keepAliveTimeout = 1000;
    httpServer.headersTimeout = 2000;
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
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

// Register tools
(server as any).registerTool(
  "fetch_by_doi",
  {
    title: "Fetch Article by DOI",
    description: "Fetch an academic article by its DOI (Digital Object Identifier). Can be used to retrieve articles from the New England Journal of Medicine, NEJM Catalyst, NEJM Evidence, NEJM AI, NEJM Journal Watch, and NEJM Clinician. DOI must start with 10.1056/",
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
        content: [{ type: "text", text: article }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error fetching article: ${error.message}` }],
        isError: true
      };
    }
  }
);

(server as any).registerTool(
  "simple_query",
  {
    title: "Query Articles",
    description: "Query academic articles by journal context and search query. Supported contexts include New England Journal of Medicine, NEJM Catalyst, NEJM Evidence, NEJM AI, NEJM Journal Watch, and NEJM Clinician.",
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
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error querying articles: ${error.message}` }],
        isError: true
      };
    }
  }
);

async function main() {
  const useStdio = process.argv.includes("--stdio");
  
  if (useStdio) {
    // stdio mode for Claude Desktop
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Research MCP server running on stdio");
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
        // Let the transport handle the request
        console.error(`${req.method} ${req.url}`);
        await (transport as any).handleRequest(req, res);
      } catch (error: any) {
        console.error('StreamableHTTP error:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      }
    });
    
    // Graceful shutdown
    const shutdown = () => {
      console.error('\nShutting down gracefully...');
      httpServer.close(() => {
        console.error('HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('Forcing shutdown...');
        process.exit(0);
      }, 2000);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    httpServer.listen(port, () => {
      console.error(`\nResearch MCP server running on http://localhost:${port}`);
      console.error(`Transport: StreamableHTTP`);
      console.error(`\nFor MCP Inspector, connect to: http://localhost:${port}`);
      console.error(`Press Ctrl+C to stop\n`);
    });
    
    httpServer.keepAliveTimeout = 60000;
    httpServer.headersTimeout = 65000;
  }
}

main().catch((error) => {
  console.error("Fatal server error:", error);
  process.exit(1);
});

// server-fixed.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetchByDoi } from "./api/fetchByDoi.js";
import { fetchSimpleQuery } from "./api/simplequery.js";

// Create MCP server instance
const server = new McpServer({
  name: "research-mcp-server",
  version: "1.0.0"
});

// Define schema for DoiTool
const DoiSchema = z.object({
  doi: z.string().describe("DOI of the article to fetch")
});

// Define schema for SimpleQuery
const SimpleQuerySchema = z.object({
  context: z.string().describe("Journal or context to query"),
  query: z.string().describe("Search query string")
});

// Register DoiTool
(server.registerTool as any)(
  "fetch_by_doi",
  {
    title: "Fetch Article by DOI",
    description: "Fetch an academic article by its DOI (Digital Object Identifier)",
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
(server.registerTool as any)(
  "simple_query",
  {
    title: "Query Articles",
    description: "Query academic articles by journal context and search query",
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
        ],
        // Wrap results in object structure if needed
        structuredContent: Array.isArray(results) 
          ? { results } 
          : results
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

// Start server with stdio transport (for Claude Desktop)
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("Research MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

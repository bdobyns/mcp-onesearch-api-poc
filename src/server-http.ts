// server.ts
import http from "http";
import { fetchByDoi } from "./api/fetchByDoi.js";
import { fetchSimpleQuery, SimpleQueryParams } from "./api/simplequery.js";

type MCPContent = { type: "text"; text: string };
type MCPResponse = { content: MCPContent[] };

interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: any;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: { code: number; message: string };
}

// ---- TOOL DEFINITIONS ----
const TOOLS = [
  {
    name: "DoiTool",
    description: "Fetch article by DOI",
    type: "tool",
    parameters: {
      doi: { type: "string", description: "DOI of the article" },
    },
    output: { type: "text" },
  },
  {
    name: "SimpleQuery",
    description: "Query articles",
    type: "tool",
    parameters: {
      context: { type: "string", description: "Journal to query" },
      query: { type: "string", description: "Query string" },
    },
    output: { type: "text" },
  },
];

// ---- RESOURCE DEFINITIONS ----
const RESOURCES = [
  { name: "dummy", type: "resource", description: "Dummy resource to satisfy Claude Desktop" },
];

// Utility to build MCP-compliant text response
function makeTextResponse(text: string): MCPResponse {
  return { content: [{ type: "text", text }] };
}

// ---- JSON-RPC HANDLER ----
async function handleRequest(req: JSONRPCRequest): Promise<JSONRPCResponse> {
  try {
    switch (req.method) {
      case "tools.list":
        return { jsonrpc: "2.0", id: req.id, result: TOOLS.map((t) => t.name) };

      case "tools.describe":
        if (!req.params?.tool) {
          // Return full tool descriptions if no tool specified
          return { jsonrpc: "2.0", id: req.id, result: TOOLS };
        }
        const tool = TOOLS.find((t) => t.name === req.params.tool);
        if (!tool) {
          return { jsonrpc: "2.0", id: req.id, error: { code: -32601, message: "Tool not found" } };
        }
        return { jsonrpc: "2.0", id: req.id, result: tool };

      case "resources.list":
        return { jsonrpc: "2.0", id: req.id, result: RESOURCES.map((r) => r.name) };

      case "resources.describe":
        return { jsonrpc: "2.0", id: req.id, result: RESOURCES };

      case "tools.call":
        if (!req.params?.tool || !req.params.input) {
          return { jsonrpc: "2.0", id: req.id, error: { code: -32602, message: "Missing tool or input" } };
        }
        const { tool: toolName, input } = req.params;
        switch (toolName) {
          case "DoiTool":
            if (!input.doi) throw new Error("Missing DOI");
            const doc = await fetchByDoi(input.doi);
            return { jsonrpc: "2.0", id: req.id, result: makeTextResponse(doc) };

          case "SimpleQuery":
            const { context, query } = input as SimpleQueryParams;
            if (!context || !query) throw new Error("Missing context or query");
            const results = await fetchSimpleQuery({ context, query });
            return { jsonrpc: "2.0", id: req.id, result: makeTextResponse(JSON.stringify(results, null, 2)) };

          default:
            return { jsonrpc: "2.0", id: req.id, error: { code: -32601, message: "Tool not found" } };
        }

      default:
        return { jsonrpc: "2.0", id: req.id, error: { code: -32601, message: "Method not found" } };
    }
  } catch (err: any) {
    return { jsonrpc: "2.0", id: req.id, error: { code: -32000, message: err.message } };
  }
}

// ---- HTTP SERVER ----
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 1337;

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    let json: JSONRPCRequest;
    try {
      json = JSON.parse(body);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    const response = await handleRequest(json);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response));
  });
});

server.listen(PORT, () => {
  console.log(`Claude Desktop–compatible MCP HTTP server running on port ${PORT}`);
});

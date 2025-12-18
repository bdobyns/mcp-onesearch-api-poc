import { MCPServer } from "mcp-framework";

import { SimpleQueryTool } from "./tools/SimpleQueryTool.js";
import { BrowseArticleTypeTool } from "./tools/BrowseArticletypeTool.js";

export default {
  tools: [
    new SimpleQueryTool(),
    new BrowseArticleTypeTool(),
  ],
};

const server = new MCPServer({
    transport: {
        type: "http-stream",
        options: {
            port: process.env.PORT ? parseInt(process.env.PORT) : 1337,
            cors: {
                allowOrigin: "*",
            }
        }
    }
});

server.start();
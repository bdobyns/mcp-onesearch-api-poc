import { MCPServer } from "mcp-framework";

import { SimpleQueryTool } from "./tools/SimpleQueryTool.js";
import { BrowseArticleTypeTool } from "./tools/BrowseArticletypeTool.js";
//import { SimpleQueryResource } from "./resources/SimplequeryResource.js";
import { MorelikethisTool } from "./tools/MorelikethisTool.js";

export default {
//  resources: [
//     new SimpleQueryResource(),
//  ],
  tools: [
    new SimpleQueryTool(),
    new BrowseArticleTypeTool(),
    new MorelikethisTool(),
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
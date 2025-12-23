import { MCPServer } from "mcp-framework";

import { SimpleQueryTool } from "./tools/SimpleQueryTool.js";
import { DoiResource } from "./resources/DoiResource.js";
import { DoiTool } from "./tools/DoiTool.js"; 

const useStdio = process.argv.includes("--stdio");

export default {
  resources: [
    new DoiResource(),
 ],
  tools: [
    new SimpleQueryTool(),
    new DoiTool(),    
  ],
};

const server = new MCPServer({
    transport: useStdio
        ? { type: "stdio" }
        : {
            type: "http-stream",
            options: {
                port: process.env.PORT ? parseInt(process.env.PORT) : 1337,
                cors: {
                allowOrigin: "*",
            }
        }
    }
});

const { APIHOST, APIKEY, APIUSER } = process.env;
if (!APIHOST || !APIKEY || !APIUSER) {
      console.error("Missing required environment variables: "+ JSON.stringify({ APIHOST, APIKEY, APIUSER }));
      process.exit(1);
} 

server.start();

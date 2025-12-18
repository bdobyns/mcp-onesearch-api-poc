import { MCPServer } from "mcp-framework";

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
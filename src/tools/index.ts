import { ToolDefinition } from "./types.js";
import { fetchByDoiTool } from "./fetchByDoiTool.js";
import { simpleQueryTool } from "./simpleQueryTool.js";

export const tools: ToolDefinition[] = [
  fetchByDoiTool,
  simpleQueryTool
];

export * from "./types.js";

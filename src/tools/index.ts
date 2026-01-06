import { ToolDefinition } from "./types.js";
import { fetchByDoiTool } from "./fetchByDoiTool.js";
import { simpleQueryTool } from "./simpleQueryTool.js";
import { moreLikeThisTool } from "./moreLikeThisTool.js";

export const tools: ToolDefinition[] = [
  fetchByDoiTool,
  simpleQueryTool,
  moreLikeThisTool
];

export * from "./types.js";

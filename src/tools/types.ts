import { z } from "zod";

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: z.ZodType<any>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  handler: (params: any) => Promise<ToolResponse>;
}

export interface ToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

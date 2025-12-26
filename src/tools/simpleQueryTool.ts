import { z } from "zod";
import { fetchSimpleQuery } from "../api/simplequery.js";
import { ToolDefinition } from "./types.js";

const SimpleQuerySchema = z.object({
  context: z.string().describe("Journal or context to query"),
  query: z.string().describe("Search query string")
});

export const simpleQueryTool: ToolDefinition = {
  name: "simple_query",
  title: "Query Articles",
  description: "Query academic articles by journal context and keyword query. Supported contexts include New England Journal of Medicine, NEJM Catalyst, NEJM Evidence, NEJM AI, NEJM Journal Watch, and NEJM Clinician.",
  inputSchema: SimpleQuerySchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },
  handler: async (params: any) => {
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
};

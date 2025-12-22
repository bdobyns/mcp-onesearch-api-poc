// simplequerytool.ts
import { MCPTool, logger } from "mcp-framework";
import { z } from "zod";
import { fetchSimpleQuery } from "../api/simplequery.js";
import { QueryApiResponse } from "../api/onesearchresponse.js";

const SimpleQuerySchema = {
  context: {
    type: z.enum(["nejm", "catalyst", "evidence", "clinician", "nejm-ai"]),
    description: "Journal to query against",
  },
  query: {
    type: z.string().min(1),
    description: "Query to execute",
  },
};

type SimpleQueryInput = {
  context: z.infer<typeof SimpleQuerySchema.context.type>;
  query: z.infer<typeof SimpleQuerySchema.query.type>;
};

class SimpleQueryTool extends MCPTool<SimpleQueryInput> {
  name = "SimpleQuery";
  description =
    "Perform a simple query against a single journal and return matching articles. Articles must match all the keywords in the query.";
  schema = SimpleQuerySchema;

  async execute(input: SimpleQueryInput) {
    logger.info("SimpleQueryTool.execute called with:" + JSON.stringify(input));

    try {
      const results = await fetchSimpleQuery({ context: input.context, query: input.query });

      // MCP-compliant content array
      const content: Array<{ type: string; text: string }> = [];

      results
        .filter(r => r.title && r.doi)
        .forEach(r => {
          content.push({
            type: "text",
            text: `Title: ${r.title}\nDOI: ${r.doi.startsWith("doi://") ? r.doi : `doi://${r.doi}`}\nSnippet: ${r.text || "N/A"}\nPublication Date: ${r.pubdate || "N/A"}\n`,
          });
        });

      logger.info("results fetched: " + results.length);

      return { content };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch articles. Check server logs.";
      logger.error("SimpleQueryTool error: " + errorMsg);

      return {
        content: [
          {
            type: "text",
            text: errorMsg,
          },
        ],
      };
    }
  }
}

export { SimpleQueryTool };

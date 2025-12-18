import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios, { AxiosResponse } from "axios";
import { QueryApiResponse, QueryResult } from "../util/onesearchresponse";

/* ------------------------------------------------------------------ */
/* Input schema using Zod                                             */
/* ------------------------------------------------------------------ */
const SimpleQuerySchema = {
  context: {
    type: z.enum(["nejm", "catalyst", "evidence", "clinician", "nejm-ai"]),
    description: "The journal to query against",
  },
  query: {
    type: z.string().min(1),
    description: "The query to execute",
  },
};

type SimpleQueryInput = {
  context: z.infer<typeof SimpleQuerySchema.context.type>;
  query: z.infer<typeof SimpleQuerySchema.query.type>;
};

/* ------------------------------------------------------------------ */
/* Tool                                                               */
/* ------------------------------------------------------------------ */
class SimpleQueryTool extends MCPTool<SimpleQueryInput> {
  name = "simple-query";
  description =
    "Perform a simple query against a single journal and return matching articles.";
  schema = SimpleQuerySchema;

  async execute(input: SimpleQueryInput) {
    const { APIHOST, APIKEY, APIUSER } = process.env;

    if (!APIHOST || !APIKEY || !APIUSER) {
      throw new Error(
        "Missing required environment variables: APIHOST, APIKEY, APIUSER"
      );
    }

    const url = `${APIHOST}/api/v1/simple`;

    try {
      const response: AxiosResponse<QueryApiResponse> = await axios.get(url, {
        params: {
          context: input.context,
          query: input.query,
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          apikey: APIKEY,
          apiuser: APIUSER,
        },
      });

      // MCP-compliant return: content[] with resource_link
      return {
        content: [
          {
            type: "text",
            text: `Found ${response.data.results.length} articles for "${input.query}"`,
          },
          ...response.data.results.map((result: QueryResult) => ({
            type: "resource_link",
            name: result.title,
            uri: `doi:${result.doi}`,
          })),
        ],
      };
    } catch (error) {
      console.error("Error executing simple query:", error);
      throw error; // Let MCP handle the error
    }
  }
}

export { SimpleQueryTool };

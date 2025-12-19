import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios, { AxiosResponse } from "axios";
import { QueryApiResponse } from "../util/onesearchresponse";

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
  name = "simple-query";
  description =
    "Perform a simple query against a single journal and return matching articles.";
  schema = SimpleQuerySchema;

  async execute(input: SimpleQueryInput) {
    console.log("SimpleQueryTool.execute called with:", input);

    const { APIHOST, APIKEY, APIUSER } = process.env;
    if (!APIHOST || !APIKEY || !APIUSER) {
      throw new Error(
        "Missing required environment variables: APIHOST, APIKEY, APIUSER"
      );
    }

    const url = `${APIHOST}/api/v1/simple`;

    let response: AxiosResponse<QueryApiResponse>;
    try {
      response = await axios.get(url, {
        params: { context: input.context, query: input.query },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          apikey: APIKEY,
          apiuser: APIUSER,
        },
      });
    } catch (err) {
      console.error("Error fetching from API:", err);
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to fetch results: ${err}`,
          },
        ],
      };
    }

    const results = response.data.results ?? [];

    // MCP-compliant content array
    const content: Array<{ type: string; [key: string]: string }> = [];

    // Summary text
    content.push({
      type: "text",
      text: `Found ${results.length} articles for "${input.query}"`,
    });

    // Resource links (strictly MCP-compliant)
    results
      .filter(r => r.title && r.doi)
      .forEach(r => {
        content.push({
          type: "resource_link",
          name: String(r.title),
          uri: String(r.doi).startsWith("doi:") ? String(r.doi) : `doi:${r.doi}`,
        });
      });

    console.log("Returning MCP content:", JSON.stringify({ content }));

    return { content };
  }
}

export { SimpleQueryTool };

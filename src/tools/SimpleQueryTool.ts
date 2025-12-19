import { MCPTool, logger } from "mcp-framework";
import { z } from "zod";
import axios, { AxiosError, AxiosResponse } from "axios";
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
  name = "SimpleQuery";";
  description =
    "Perform a simple query against a single journal and return matching articles. Articles must match all the keywords in the query.";
  schema = SimpleQuerySchema;

  async execute(input: SimpleQueryInput) {
    logger.info("SimpleQueryTool.execute called with:" + JSON.stringify(input));

    const { APIHOST, APIKEY, APIUSER } = process.env;
    if (!APIHOST || !APIKEY || !APIUSER) {
      logger.error("Missing required environment variables: "+ JSON.stringify({ APIHOST, APIKEY, APIUSER }));
      return {
        content: [
          {
            type: "text",
            text: "Missing required environment variables: APIHOST, APIKEY, APIUSER",
          },
        ],
      };
    }

    const url = `https://${APIHOST}/api/v1/simple`;

    try {
      const response: AxiosResponse<QueryApiResponse> = await axios.get(url, {
        params: { 
          context: input.context, 
          query: input.query, 
          objectType: `${input.context}-article`,
          showResults: 'full',
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          apikey: APIKEY,
          apiuser: APIUSER,
        },
      });

      const results = response.data.results ?? [];

      // MCP-compliant content array (text only)
      const content: Array<{ type: string; text: string }> = [];

      // One text item per article
      results
        .filter(r => r.title && r.doi)
        .forEach(r => {
          content.push({
            type: "text",
            text: `Title: ${r.title}\nDOI: ${r.doi.startsWith("doi:") ? r.doi : `doi:${r.doi}`}\nJournal: ${r.journal || "N/A"}\nPublication Date: ${r.pubdate || "N/A"}\n`,
          });
        });

      logger.info("results fetched: " + results.length);

      // logger.info("Returning MCP content:", JSON.stringify({ content }));

      return { content };
    } catch (err) {
      logger.error("Error during SimpleQueryTool execution: "+JSON.stringify(err));
      let errorMsg = "Failed to fetch articles. Check server logs.";
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError;
        if (axiosErr.response) {
          errorMsg = `API error ${axiosErr.response.status}: ${JSON.stringify(
            axiosErr.response.data
          )}`;
        } else {
          errorMsg = `Axios error: ${axiosErr.message}`;
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      logger.error("Error message to return to MCP client: "+ errorMsg); 
      // Return the error via MCP content
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

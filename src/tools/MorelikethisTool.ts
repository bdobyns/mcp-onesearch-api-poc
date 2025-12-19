import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios, { AxiosError, AxiosResponse } from "axios";
import { QueryApiResponse } from "../util/onesearchresponse";

const MLTSchema = {   
  context: {
    type: z.enum(["nejm", "catalyst", "evidence", "clinician", "nejm-ai"]),
    description: "Journal to query against",
  },
  doi: {
    type: z.string(),
    description: "DOI of the article to find similar ones",
  },
};

interface MoreLikeThisInput {
  context: z.infer<typeof MLTSchema.context.type>;
  doi: z.infer<typeof MLTSchema.doi.type>;
}

class MorelikethisTool extends MCPTool<MoreLikeThisInput> {
  name = "MoreLikeThis";
  description = "Given a DOI, return more similar articles";

  schema = MLTSchema;

  async execute(input: MoreLikeThisInput) {
    const { APIHOST, APIKEY, APIUSER } = process.env;

    if (!APIHOST || !APIKEY || !APIUSER) {
      return {
        content: [
          {
            type: "text",
            text: "Missing required environment variables (APIHOST, APIKEY, APIUSER).",
          },
        ],
      };
    }

    const baseURL = `https://${APIHOST}/api/v1/morelikethis`;

    try {
      const response: AxiosResponse<QueryApiResponse> = await axios.get(baseURL, {
        params: {
          context: input.context,
          articleDOI: input.doi,
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

      if (!response.data?.results?.length) {
        return {
          content: [
            {
              type: "text",
              text: "No similar articles found.",
            },
          ],
        };
      }

      const contentItems = response.data.results.map((result) => ({
        type: "text",
        text: `Title: ${result.title || "N/A"}\nDOI: ${result.doi || "N/A"}\nJournal: ${result.journal || "N/A"}\nPublication Date: ${result.pubdate || "N/A"}\n`,
      }));

      return { content: contentItems };
    } catch (err) {
      let errorMsg = "Failed to fetch similar articles. Check server logs.";
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError;
        // Use the status code and response body if available
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

export default MorelikethisTool;

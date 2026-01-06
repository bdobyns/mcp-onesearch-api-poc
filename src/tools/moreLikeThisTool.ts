import { z } from "zod";
import { fetchMoreLikeThis } from "../api/morelikethis.js";
import { ToolDefinition } from "./types.js";

const DoiSchema = z.object({
  doi: z.string().describe("DOI of the article to find similar articles for")
});

export const moreLikeThisTool: ToolDefinition = {
  name: "more_like_this",
  title: "Find Similar Articles",
  description: "Find articles similar to a given article identified by its DOI. Returns related content from NEJM Group publications including New England Journal of Medicine, NEJM Catalyst, NEJM Evidence, NEJM AI, NEJM Journal Watch, and NEJM Clinician.",
  inputSchema: DoiSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  },
  handler: async (params: any) => {
    const doi = params.doi as string;
    try {
      const results = await fetchMoreLikeThis(doi);
      return {
        content: results.map(article => ({
          type: "text",
          text: JSON.stringify(article, null, 2)
        }))
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error finding similar articles: ${error.message}` }],
        isError: true
      };
    }
  }
};

import { z } from "zod";
import { fetchByDoi } from "../api/fetchByDoi.js";
import { ToolDefinition } from "./types.js";

const DoiSchema = z.object({
  doi: z.string().describe("DOI of the article to fetch")
});

export const fetchByDoiTool: ToolDefinition = {
  name: "fetch_by_doi",
  title: "Fetch Article by DOI",
  description: "Fetch an academic article by its DOI (Digital Object Identifier). Can be used to retrieve articles from the New England Journal of Medicine, NEJM Catalyst, NEJM Evidence, NEJM AI, NEJM Journal Watch, and NEJM Clinician. DOI must start with 10.1056/",
  inputSchema: DoiSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false // this tool provides definitive article content for a specific doi as given
  },
  handler: async (params: any) => {
    const doi = params.doi as string;
    try {
      const article = await fetchByDoi(doi);
      return {
        content: [{ type: "text", text: article }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error fetching article: ${error.message}` }],
        isError: true
      };
    }
  }
};

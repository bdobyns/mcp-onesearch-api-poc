import { MCPTool, logger } from "mcp-framework";
import { z } from "zod";
import axios, { AxiosError, AxiosResponse } from "axios";
import { QueryApiResponse } from "../util/onesearchresponse";

interface BrowseArticleTypeInput {
  context: string;
  articleType: string;
}

class BrowseArticleTypeTool extends MCPTool<BrowseArticleTypeInput> {
  name = "BrowseArticleType";
  description = "Browse articles of a specific type in a journal";

  schema = {
    context: {
      type: z.enum(["nejm", "catalyst", "evidence", "clinician", "nejm-ai"]),
      description: "The journal to query against",
    },
    articleType: {
      type: z.enum([
        "NEJM Images in Clinical Medicine",
        "Audio",
        "Video",
        "Review Article",
        "Case Study",
        "Journal Watch",
        "Guideline Watch",
        "Clinical Conversations",
        "Drug Watch",
        "Graphical Research Summary",
        "NEJM Quick Take",
        "Year in Review",
        "Letter to Readers",
        "AIDS Watch",
        "Antiretroviral Rounds",
        "Case History",
        "Clinical Practice Guideline Watch",
        "Clinical Spotlight",
        "Correction",
        "Editor's Choice",
        "Editorial",
        "Feature",
        "From the Blogs",
        "General Medicine",
        "Landmark Article",
        "Medical News",
        "Meeting Notes",
        "Meeting Report",
        "News in Context",
        "Patient Information",
        "Practice Watch",
        "Research Notes",
        "Top General Medicine Stories",
        "Top Story",
        "Vaccine Watch",
        "Question of the Week",
        "NEJM Image Challenge",
        "NEJM Research Summary",
      ]),
      description: "Which article type to browse",
    },
  };

  async execute(input: BrowseArticleTypeInput) {
    logger.info("BrowseArticleTypeTool.execute called with: "+ JSON.stringify(input));
    const { APIHOST, APIKEY, APIUSER } = process.env;

    if (!APIHOST || !APIKEY || !APIUSER) {
      logger.error("Missing required environment variables: "+ JSON.stringify({ APIHOST, APIKEY, APIUSER }));
      return {
        content: [
          {
            type: "text",
            text: "Missing required environment variables (APIHOST, APIKEY, APIUSER).",
          },
        ],
      };
    }

    const baseURL = `https://${APIHOST}/api/v1/simple`;
    const params = {
      context: input.context,
      articleType: input.articleType,
      sortBy: "pubdate-descending",
      objectType: `${input.context}-article`,
    };

    try {
      const response: AxiosResponse<QueryApiResponse> = await axios.get(baseURL, {
        params,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          apikey: APIKEY,
          apiuser: APIUSER,
        },
      });

      if (!response.data?.results?.length) {
        logger.error("No articles found for context and article type: "+ JSON.stringify(input)); 
        return {
          content: [
            {
              type: "text",
              text: "No articles found for the selected context and article type.",
            },
          ],
        };
      }

      const contentItems = response.data.results.map((result) => ({
        type: "text",
        text: `Title: ${result.title || "N/A"}\nDOI: ${result.doi || "N/A"}\nPublication Date: ${result.pubdate || "N/A"}\n`,
      }));

      logger.info("Articles fetched:"+ response.data.results.length);
      return { content: contentItems };
    } catch (err) {
      let errorMsg = "Failed to fetch articles. Check server logs.";
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
      logger.error("Error during BrowseArticleTypeTool execution: "+ errorMsg);
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

export { BrowseArticleTypeTool };

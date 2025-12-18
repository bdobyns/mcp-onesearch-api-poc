import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios, { AxiosResponse } from "axios";
import { QueryApiResponse } from "../util/onesearchresponse";

interface BrowseArticleTypeInput {
  context: string
  articleType: string;
}

class BrowseArticleTypeTool extends MCPTool<BrowseArticleTypeInput> {
  name = "BrowseArticleType";
  description = "BrowseArticleType tool description";

  schema = {
    context: {
      type: z.enum(["nejm","catalyst","evidence","clinician","nejm-ai"]),
      description: "the journal to query against",
    },
    articleType: {
      type: z.enum(["NEJM Images in Clinical Medicine",
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
"NEJM Research Summary",]),
      description: "which article type to browse",
    },

  };

  async execute(input: BrowseArticleTypeInput) {
    const { APIHOST, APIKEY, APIUSER } = process.env;

    if (!APIHOST || !APIKEY || !APIUSER) {
      throw new Error("Missing required environment variables");
    }
   
    let baseURL = APIHOST+'/api/v1/simple';
    const params = {
      context: input.context,
      articleType: input.articleType,
      sortBy: "pubdate-descending",
    };
    try {
    const response: AxiosResponse<QueryApiResponse> = await axios.get(baseURL, {
      params: params,
      headers: {
         'Content-Type': 'application/json',
         'Accept': 'application/json',
         'apikey': APIKEY,
         'apiuser': APIUSER
      }
    });

    return response.data.results;
  } catch (error) {
    console.error("Error executing articleType browse:", error);
    // throw new Error("Failed to execute articleType browse");
  }
}
}

export { BrowseArticleTypeTool };
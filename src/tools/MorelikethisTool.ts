import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface MoreLikeThisInput {
  doi: string;
}

class MorelikethisTool extends MCPTool<MoreLikeThisInput> {
  name = "MoreLikeThis";
  description = "Given a DOI, return more similar articles";

  schema = {
    doi: {
      type: z.string(),
      description: "DOI of the article to find similar ones",
    },
  };

  async execute(input: MoreLikeThisInput) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(input, null, 2),
        },
      ],
    };
  }
}

export default MorelikethisTool;

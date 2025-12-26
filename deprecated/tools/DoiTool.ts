import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { fetchByDoi } from "../api/fetchByDoi.js";

const DoiToolSchema = {
  doi: { type: z.string().min(1), description: "DOI of the article to fetch" },
};

export class DoiTool extends MCPTool<{ doi: string }> {
  name = "DoiTool";
  description = "Fetch article content by DOI";
  schema = DoiToolSchema;

  async execute(input: { doi: string }) {
    const doc = await fetchByDoi(input.doi);

    // ensure string
    const text = typeof doc === "string" ? doc : JSON.stringify(doc);

    return {
      content: [
        {
          type: "text" as const, // exact literal type required
          text: text,
        },
      ],
    };
  }
}

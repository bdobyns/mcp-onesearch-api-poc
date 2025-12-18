import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios, { AxiosResponse } from "axios";
import { QueryResult, QueryApiResponse } from "../util/onesearchresponse";

/* ------------------------------------------------------------------ */
/* Schema (single source of truth)                                     */
/* ------------------------------------------------------------------ */

const SimpleQuerySchema = {
  context: {
    type: z.enum([
      "nejm",
      "catalyst",
      "evidence",
      "clinician",
      "nejm-ai",
    ]),
    description: "The journal to query against",
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
      throw new Error("Missing required environment variables");
    }

    const url = `${APIHOST}/api/v1/simple`;

    try {
      const response: AxiosResponse<QueryApiResponse> =
        await axios.get(url, {
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

      return {
        content: response.data.results.map((result: QueryResult) => ({
          type: "resource",
          resource: {
            uri: `doi:${result.doi}`,
            name: result.title,
            mimeType: "application/json",
            data: JSON.stringify(
              {
                doi: result.doi,
                pubdate: result.pubdate,
                articleID: result.articleID,
                landingDoi: result.landingDoi,
                articleType: result.articleType,
                journal: result.journal,
                citation: result.citation,
                authors: result.stringAuthors,
                isFree: result.isFree,
                thumbnail: result.thumbnail,
                text: result.text,
                mediaType: result.mediaType,
                mediaTitle: result.mediaTitle,
              },
              null,
              2
            ),
          },
        })),
      };
    } catch (error) {
      console.error("Error executing simple query", {
        input,
        error,
      });
      throw error;
    }
  }
}

export { SimpleQueryTool };

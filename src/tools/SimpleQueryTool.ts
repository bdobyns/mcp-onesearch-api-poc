import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios, { AxiosResponse } from "axios";
import { QueryResult, QueryApiResponse } from "../util/onesearchresponse";

interface SimpleQueryInput {
  context: string;
  query: string;
}

class SimpleQueryTool extends MCPTool<SimpleQueryInput> {
  name = "simple-query";
  description = "Perform a simple query against a single journal. The name of the journal is provided in the context. returns an array of results that include information about each result.";

  schema = {
    context: {
      type: z.enum(["nejm","catalyst","evidence","clinician","nejm-ai"]),
      description: "the journal to query against",
    },

    query: {
      type: z.string(),
      description: "query to execute",
    },
  };

  async execute(input: SimpleQueryInput) {
    const { APIHOST, APIKEY, APIUSER } = process.env;

    if (!APIHOST || !APIKEY || !APIUSER) {
      throw new Error("Missing required environment variables");
    }

    let baseURL = APIHOST+'/api/v1/simple';
    const params = {
      context: input.context,
      query: input.query
    };
    try {
    const response: AxiosResponse<QueryApiResponse> = await axios.get(baseURL,{
      params: params,
      headers: {
         'Content-Type': 'application/json',
         'Accept': 'application/json',         
         'apikey': APIKEY,
         'apiuser': APIUSER
      }
    });

    return {
      content: response.data.results.map( result => {
        return {
          type: "resource",
          resource: {
            doi: result.doi,
            title: result.title,
            authors: result.stringAuthors,
            pubdate: result.pubdate,
            articleID: result.articleID,
            landingDoi: result.landingDoi,
            articleType: result.articleType,
            journal: result.journal,
            citation: result.citation,
            isFree: result.isFree,
            thumbnail: result.thumbnail,
            text: result.text,
            mediaType: result.mediaType,
            mediaTitle: result.mediaTitle,
          }
        }
      })
    }
  } catch (error) {
    console.error("Error executing simple query:", error);
    // throw new Error("Failed to execute simple query");
  }
}
}

export { SimpleQueryTool };


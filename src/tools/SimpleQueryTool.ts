import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { axios } from "axios";

interface SimpleQueryInput {
  context: string;
  query: string;
}

class SimpleQueryTool extends MCPTool<SimpleQueryInput> {
  name = "simple-query";
  description = "Perform a simple query against a single journal. The name of the journal is provided in the context. returns an array of results that include information about each result.";

  schema = {
    context: {
      type: z.enum(["nejm","catalyst","evidence","clinician","nejm-ai"]);
    },

    query: {
      type: z.string(),
      description: "query to execute",
    },
  };

  async execute(input: SimpleQueryInput) {
    let baseURL = process.env.APIHOST+'/api/v1/simple';
    const params = {
      context: input.context,
      query: input.query
    };
    try {
    const results = await axios.get(baseURL,
      params: params,
      headers: {
         'Content-Type': 'application/json',
         'Accept': 'application/json',
         'x-nejmgroup-correlation-id': req.correlationId,                
         'apikey': process.env.APIKEY,
         'apiuser': process.env.APIUSER
      }
    });
  } catch (error) {
    console.error("Error executing simple query:", error);
    // throw new Error("Failed to execute simple query");
  }
}

export default SimpleQueryTool;
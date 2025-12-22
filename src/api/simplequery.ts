// ../api/simplequery.ts
import axios, { AxiosResponse, AxiosError } from "axios";
import { QueryApiResponse } from "./onesearchresponse";

export type SimpleQueryParams = {
  context: string;
  query: string;
};

export async function fetchSimpleQuery(params: SimpleQueryParams): Promise<any[]> {
  const { APIHOST, APIKEY, APIUSER } = process.env;

  if (!APIHOST || !APIKEY || !APIUSER) {
    throw new Error(`Missing required environment variables: ${JSON.stringify({ APIHOST, APIKEY, APIUSER })}`);
  }

  const url = `https://${APIHOST}/api/v1/simple`;

  try {
    const response: AxiosResponse<QueryApiResponse> = await axios.get(url, {
      params: { 
        context: params.context, 
        query: params.query,
        objectType: `${params.context}-article`,
        showResults: 'full',
      },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        apikey: APIKEY,
        apiuser: APIUSER,
      },
    });

    return response.data.results ?? [];
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response) {
        throw new Error(`API error ${axiosErr.response.status}: ${JSON.stringify(axiosErr.response.data)}`);
      } else {
        throw new Error(`Axios error: ${axiosErr.message}`);
      }
    } else if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error during SimpleQuery API call");
  }
}

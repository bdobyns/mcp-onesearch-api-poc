import axios, { AxiosResponse, AxiosError } from "axios";
import { QueryApiResponse } from "./onesearchresponse.js";
import { logger } from "../util/Logger.js";

export async function fetchMoreLikeThis(doi: string): Promise<any[]> {
  const { APIHOST, APIKEY, APIUSER } = process.env;

  const missingVars = [];
  if (!APIHOST) missingVars.push('APIHOST');
  if (!APIKEY) missingVars.push('APIKEY');
  if (!APIUSER) missingVars.push('APIUSER');
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  logger.info(`fetchMoreLikeThis called with DOI: ${doi}`);

  const url = `https://${APIHOST}/api/v1/morelikethis`;

  try {
    const response: AxiosResponse<QueryApiResponse> = await axios.get(url, {
      params: {
        doi: doi,
        context: "federated",
        objectType: "nejm-article;catalyst-article;evidence-article;clinician-article;nejm-ai-article",
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
    throw new Error("Unknown error during MoreLikeThis API call");
  }
}

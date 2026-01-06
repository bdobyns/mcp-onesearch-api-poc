import axios, { AxiosResponse, AxiosError } from "axios";
import { apiClient } from "./client.js";
import { QueryApiResponse } from "./onesearchresponse.js";
import { logger } from "../util/Logger.js";

export async function fetchMoreLikeThis(doi: string): Promise<any[]> {
  logger.info(`fetchMoreLikeThis called with DOI: ${doi}`);

  try {
    const response: AxiosResponse<QueryApiResponse> = await apiClient.get('/morelikethis', {
      params: {
        doi: doi,
        context: "federated",
        objectType: "nejm-article;catalyst-article;evidence-article;clinician-article;nejm-ai-article",
        showResults: 'full',
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

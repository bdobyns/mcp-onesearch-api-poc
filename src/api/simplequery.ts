// ../api/simplequery.ts
import axios, { AxiosResponse, AxiosError } from "axios";
import { apiClient } from "./client.js";
import { QueryApiResponse } from "./onesearchresponse.js";
import { logger } from "../util/Logger.js";
import { validateAndNormalizeContext } from "../util/contextUtils.js";

export type SimpleQueryParams = {
  context: string;
  query: string;
};

export async function fetchSimpleQuery(params: SimpleQueryParams): Promise<any[]> {
  logger.info(`fetchSimpleQuery called with context: ${params.context}, query: ${params.query}`);

  // Validate and normalize context
  const { normalizedContext, objectType } = validateAndNormalizeContext(params.context);

  try {
    const response: AxiosResponse<QueryApiResponse> = await apiClient.get('/simple', {
      params: {
        context: normalizedContext,
        query: params.query,
        objectType: objectType,
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
    throw new Error("Unknown error during SimpleQuery API call");
  }
}

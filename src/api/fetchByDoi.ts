import axios from "axios";
import { apiClient } from "./client.js";
import { logger } from "../util/Logger.js";

export async function fetchByDoi (
  doi: string
): Promise<string> {
  logger.info("fetchByDoi called with DOI: " + doi);

  let context = "nejm";
  // Infer context from DOI, simple heuristic
  if (doi.includes('NEJM')) context = 'nejm';
  else if (doi.includes('CAT')) context = 'catalyst';
  else if (doi.includes('EVID')) context = 'evidence';
  else if (doi.includes('AI')) context = 'nejm-ai';       
  else context = 'clinician'; // catchall for everything else

  try {
    const response = await apiClient.get("/content", {
      params: {
        doi: doi,
        context,
        format: "json"
      }
    });

    const data = response.data;

    return String(data.document || ""); // return the naked JATS XML for now
/*    doi: data.doi,
      title: data.title,
      publicationDate: data.publicationDate,
      abstract: data.displayAbstract,
      specialty: data.specialty ?? [],
      topic: data.topic ?? [],
      articleCategory: data.articleCategory ?? [],
      articleType: data.articleType ?? [],
      doctype: data.doctype,
      document: data.document // JATS XML
 */   
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const message =
        err.response?.data?.message ??
        err.message;

      throw new Error(
        `fetchByDoi failed for ${doi} (${status ?? "no status"}): ${message}`
      );
    }

    throw err;
  }
}

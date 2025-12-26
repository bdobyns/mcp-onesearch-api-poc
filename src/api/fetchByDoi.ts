import axios from "axios";
import { logger} from "mcp-framework";

const client = axios.create({
  baseURL: "https://"+process.env.APIHOST+"/api/v1",
  timeout: 10_000,
  headers: {
    Accept: "application/json",
    apikey: process.env.APIKEY,
    apiuser: process.env.APIUSER,
  }
});

export async function fetchByDoi (
  doi: string
): Promise<string> {
    logger.info("fetchByDoi called with DOI: "+ doi);
  
  // Validate environment variables exist and are not empty
  const { APIHOST, APIKEY, APIUSER } = process.env;
  if (!APIHOST || !APIKEY || !APIUSER) {
    throw new Error(`Missing required environment variables: ${JSON.stringify({ APIHOST, APIKEY, APIUSER })}`);
  }

  let context = "nejm";
  // Infer context from DOI, simple heuristic
  if (doi.includes('NEJM')) context = 'nejm';
  else if (doi.includes('CAT')) context = 'catalyst';
  else if (doi.includes('EVID')) context = 'evidence';
  else if (doi.includes('AI')) context = 'nejm-ai';       
  else context = 'clinician'; // catchall for everything else

  try {
    const response = await client.get("/content", {
      params: {
        doi: doi,
        context,
        format: "json"
      }
    });

    const data = response.data;

    return String(data.document || "") ; // return the naked JATS XML for now
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

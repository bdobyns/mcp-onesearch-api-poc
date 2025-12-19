import { MCPResource, logger } from "mcp-framework";
import { fetchByDoi } from "../api/fetchByDoi.js";

export class DoiResource extends MCPResource {
  uri = "doi://{doi}";
  name = "DoiResource";
  description = "Fetch article metadata and content by DOI";
  static examples = [
    "doi://10.1056/NEJMoa2502866",
    "doi://10.1056/CLINraNA59612"
  ];


  async read() {
    // The framework guarantees the resolved URI
    const uri = this.uri;

    // uri will look like: doi://10.1056/NEJMoa2502866
    const doi = uri.replace(/^doi:\/\//, "");

    if (!doi) {
      throw new Error("Missing DOI in resource URI");
    }

    logger.debug(`Fetching DOI ${doi}`);

    const doc = await fetchByDoi(doi);

    return [
      {
        uri: `doi://${doi}`,
        mimeType: "application/json",
        data: JSON.stringify(doc)
      }
    ];
  }
}

/**
 * A single article result
 */
interface QueryResult {
  doi: string;
  pubdate: string;
  articleID: string;
  landingDoi: string;
  displayType: string[];
  volume: string;
  issue: string;
  citation: string;
  thumbnail: string;
  title: string;
  duration: number | null;
  hasCME: boolean;
  hasPoll: boolean;
  isArchive: boolean;
  isFree: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  hasInteractive: boolean;
  hasVisualAbstract: boolean;
  hasPDF: boolean;
  stringAuthors: string;
  relatedContent: string[];
  articleType: string[];
  journal: string | null;
  articleCategory: string[];
  text: string;
  mediaType: string | null;
  mediaTitle: string | null;
  relatedObject: unknown[];
  aboutness: string[];
  friendlyJournalTitle: string[];
  isSponsored: boolean | null;
  isEditorsPick: boolean | null;
  authorId: string | null;
  customMetaGroup: unknown | null;
  relatedArticlesInfo: unknown | null;
}

/**
 * Full API response envelope
 */
interface QueryApiResponse {
  total: number;
  start: number;
  pageLength: number;
  results: QueryResult[];
  facets: unknown | null;
  banner: unknown | null;
  errorResponse: unknown | null;
  diagnostic: string;
  query: string;
}

export{QueryResult, QueryApiResponse};

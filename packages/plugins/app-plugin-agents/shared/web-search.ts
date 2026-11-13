/** The ordinary Native OnlineAgent tool; provider-hosted tools stay internal. */
export const WEB_SEARCH_TOOL = 'webSearch';

export const WEB_SEARCH_LIMITS: Readonly<{
  queriesPerCall: number;
  queriesPerExecution: number;
  concurrency: number;
  totalTimeoutMs: number;
  queryTimeoutMs: number;
  queryCharacters: number;
  findingsCharacters: number;
  sources: number;
  titleCharacters: number;
  urlCharacters: number;
}> = {
  queriesPerCall: 4,
  queriesPerExecution: 8,
  concurrency: 2,
  totalTimeoutMs: 60_000,
  queryTimeoutMs: 30_000,
  queryCharacters: 1000,
  findingsCharacters: 6000,
  sources: 10,
  titleCharacters: 300,
  urlCharacters: 4096,
};

export type WebSearchInput = { queries: string[] };
export type WebSearchSource = {
  title: string;
  url: string;
  /** Provider-returned evidence, never model-authored text. */
  snippet?: string;
  summary?: string;
  content?: string;
};
export type WebSearchItem =
  | {
      query: string;
      status: 'success';
      findings: string;
      sources: WebSearchSource[];
    }
  | {
      query: string;
      status: 'unverified';
      findings: string;
      sources: [];
    }
  | {
      query: string;
      status: 'failed';
      reason: 'timeout' | 'unavailable' | 'noEvidence';
      /** Local per-query rejection; upstream failures still throw ModelError. */
      code?: 'badResponse';
    };
export type WebSearchResult = { results: WebSearchItem[] };

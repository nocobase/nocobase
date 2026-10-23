import { z } from 'zod';
import type {
  WebSearchInput,
  WebSearchItem,
  WebSearchResult,
  WebSearchSource,
} from './web-search.js';
import { WEB_SEARCH_LIMITS } from './web-search.js';

const characters = (value: string): number => [...value].length;
const limited = (value: string, max: number): string =>
  [...value].slice(0, max).join('');

export const WebSearchInputSchema: z.ZodType<WebSearchInput> = z.strictObject({
  queries: z
    .array(
      z
        .string()
        .trim()
        .refine(
          (value) =>
            characters(value) >= 1 &&
            characters(value) <= WEB_SEARCH_LIMITS.queryCharacters,
        ),
    )
    .min(1)
    .max(WEB_SEARCH_LIMITS.queriesPerCall)
    .transform((queries) => [...new Set(queries)]),
});

export function safeSearchSource(value: {
  title?: string;
  url: string;
}): WebSearchSource | null {
  if (characters(value.url) > WEB_SEARCH_LIMITS.urlCharacters) return null;
  try {
    const url = new URL(value.url);
    if (characters(url.href) > WEB_SEARCH_LIMITS.urlCharacters) return null;
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    return {
      title: limited(
        value.title?.trim() || url.hostname,
        WEB_SEARCH_LIMITS.titleCharacters,
      ),
      url: url.href,
    };
  } catch {
    return null;
  }
}

export function searchItem(
  query: string,
  text: string,
  sources: readonly { title?: string; url: string }[],
  executed: boolean,
): WebSearchItem {
  const safe: WebSearchSource[] = [];
  const seen = new Set<string>();
  for (const value of sources) {
    const source = safeSearchSource(value);
    if (!source || seen.has(source.url)) continue;
    safe.push(source);
    seen.add(source.url);
    if (safe.length === WEB_SEARCH_LIMITS.sources) break;
  }
  if (!executed || !safe.length)
    return { query, status: 'failed', reason: 'noEvidence' };
  return {
    query,
    status: 'success',
    findings:
      limited(text.trim(), WEB_SEARCH_LIMITS.findingsCharacters) ||
      'Sources were retrieved; no summary was returned.',
    sources: safe,
  };
}

/** Alibaba may return useful text without proving that its search switch was acted on. */
export function unverifiedSearchItem(
  query: string,
  text: string,
): WebSearchItem {
  const findings = limited(text.trim(), WEB_SEARCH_LIMITS.findingsCharacters);
  return findings
    ? { query, status: 'unverified', findings, sources: [] }
    : { query, status: 'failed', reason: 'noEvidence' };
}
const ResultSchema = z.object({
  results: z
    .array(
      z.discriminatedUnion('status', [
        z.object({
          query: z.string(),
          status: z.literal('success'),
          findings: z.string(),
          sources: z.array(z.object({ title: z.string(), url: z.string() })),
        }),
        z.object({
          query: z.string(),
          status: z.literal('unverified'),
          findings: z.string(),
          sources: z.tuple([]),
        }),
        z.object({
          query: z.string(),
          status: z.literal('failed'),
          reason: z.enum(['timeout', 'unavailable', 'noEvidence']),
        }),
      ]),
    )
    .max(WEB_SEARCH_LIMITS.queriesPerCall),
});

/** Public/history/model projections reconstruct only known safe evidence, never the raw provider body. */
export function publicSearchResult(value: unknown): WebSearchResult {
  const parsed = ResultSchema.parse(value);
  return {
    results: parsed.results.map((item) =>
      item.status === 'success'
        ? searchItem(
            limited(item.query, WEB_SEARCH_LIMITS.queryCharacters),
            item.findings,
            item.sources,
            true,
          )
        : item.status === 'unverified'
          ? unverifiedSearchItem(
              limited(item.query, WEB_SEARCH_LIMITS.queryCharacters),
              item.findings,
            )
          : {
              query: limited(item.query, WEB_SEARCH_LIMITS.queryCharacters),
              status: item.status,
              reason: item.reason,
            },
    ),
  };
}

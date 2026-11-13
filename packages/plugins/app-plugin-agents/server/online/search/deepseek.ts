import { z } from 'zod';
import { ModelError } from '../gateway.js';
import {
  baseUrlOf,
  headersOf,
  modelFetch,
  type ModelConnection,
} from '../providers.js';
import { ByteLimitError, readBoundedBytes } from '../files/input.js';
import { officialSearchEndpoint } from '../capabilities.js';
import { safeSearchSource, searchItem } from './results.js';
import {
  WEB_SEARCH_LIMITS,
  type WebSearchItem,
  type WebSearchSource,
} from '../../../shared/web-search.js';

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const SearchSchema = z.object({
  results: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
        summary: z.string(),
      }),
    )
    .max(50),
});

/** One official Search request; cancellation and timeouts belong to the shared gateway. */
async function request(
  connection: ModelConnection,
  query: string,
  signal: AbortSignal,
): Promise<unknown> {
  if (connection.provider !== 'deepseek' || !officialSearchEndpoint(connection))
    throw new ModelError(
      'config',
      'DeepSeek search requires its official root or /v1 endpoint.',
    );
  if (!connection.apiKey)
    throw new ModelError('auth', 'The service has no API key.');
  signal.throwIfAborted();
  try {
    const response = await modelFetch(
      `${new URL(baseUrlOf(connection) || 'https://api.deepseek.com').origin}/v1/tools/search`,
      {
        method: 'POST',
        headers: {
          ...headersOf(connection),
          Authorization: `Bearer ${connection.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          count: WEB_SEARCH_LIMITS.sources,
          need_content: false,
        }),
        signal,
        redirect: 'error',
      },
    );
    if (response.status !== 200) {
      await response.body?.cancel();
      const status = response.status;
      throw new ModelError(
        status === 401
          ? 'auth'
          : status === 402
            ? 'quota'
            : status === 429
              ? 'rateLimit'
              : status === 408 || status >= 500
                ? 'network'
                : 'badResponse',
        `DeepSeek search request failed (HTTP ${status}).`,
        { status },
      );
    }
    if (!response.body)
      throw new ModelError(
        'badResponse',
        'DeepSeek returned no response body.',
      );
    const bytes = await readBoundedBytes(
      response.body,
      signal,
      MAX_RESPONSE_BYTES,
    );
    try {
      const parsed: unknown = JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      );
      return parsed;
    } catch {
      throw new ModelError('badResponse', 'DeepSeek returned invalid JSON.');
    }
  } catch (error) {
    // Preserve the merged signal's reason, including a sibling's configuration failure.
    signal.throwIfAborted();
    if (error instanceof ModelError) throw error;
    if (error instanceof ByteLimitError)
      throw new ModelError(
        'badResponse',
        'DeepSeek response exceeded its byte limit.',
      );
    // Do not retain transport causes: they can contain request headers or upstream text.
    throw new ModelError(
      'network',
      'DeepSeek search could not reach the upstream service.',
    );
  }
}

function redact(value: string, key: string | null): string {
  return key ? value.replaceAll(key, '[redacted]') : value;
}

export async function deepseekSearch(
  connection: ModelConnection,
  query: string,
  signal: AbortSignal,
): Promise<WebSearchItem> {
  signal.throwIfAborted();
  if ([...query].length > 128)
    return { query, status: 'failed', reason: 'unavailable' };
  const parsed = SearchSchema.safeParse(
    await request(connection, query, signal),
  );
  if (!parsed.success)
    throw new ModelError(
      'badResponse',
      'DeepSeek returned an invalid search response.',
    );
  const sources: WebSearchSource[] = [];
  const findings: string[] = [];
  const seen = new Set<string>();
  for (const item of parsed.data.results) {
    if (connection.apiKey && item.url.includes(connection.apiKey)) continue;
    const source = safeSearchSource({
      title: redact(item.title, connection.apiKey),
      url: item.url,
    });
    if (!source || seen.has(source.url)) continue;
    sources.push(source);
    seen.add(source.url);
    findings.push(
      `[${sources.length}] ${source.title}\n${redact(item.summary || item.snippet, connection.apiKey)}`,
    );
    if (sources.length === WEB_SEARCH_LIMITS.sources) break;
  }
  return searchItem(query, findings.join('\n\n'), sources, true);
}

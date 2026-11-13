import { z } from 'zod';
import { ModelError, type WebFetchResult } from '../gateway.js';
import {
  baseUrlOf,
  headersOf,
  modelFetch,
  type ModelConnection,
} from '../providers.js';
import { ByteLimitError, readBoundedBytes } from '../files/input.js';
import { officialSearchEndpoint } from './capabilities.js';
import { safeSearchSource, searchItem } from './results.js';
import {
  WEB_SEARCH_LIMITS,
  type WebSearchItem,
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
        content: z.string(),
      }),
    )
    .max(50),
});
const FetchSchema = z.object({ title: z.string(), content: z.string() });

/** Only the configured official service is contacted; target pages are fetched by DeepSeek. */
async function request(
  connection: ModelConnection,
  operation: 'search' | 'fetch',
  body: Record<string, unknown>,
  signal: AbortSignal,
  record: () => Promise<void>,
  callerSignal?: AbortSignal,
): Promise<unknown> {
  if (connection.provider !== 'deepseek' || !officialSearchEndpoint(connection))
    throw new ModelError(
      'config',
      'DeepSeek retrieval requires its official root or /v1 endpoint.',
    );
  if (!connection.apiKey)
    throw new ModelError('auth', 'The service has no API key.');
  if (signal.aborted) throw stopped(callerSignal);
  try {
    try {
      const response = await modelFetch(
        `${new URL(baseUrlOf(connection) || 'https://api.deepseek.com').origin}/v1/tools/${operation}`,
        {
          method: 'POST',
          headers: {
            ...headersOf(connection),
            Authorization: `Bearer ${connection.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
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
          `DeepSeek ${operation} request failed (HTTP ${status}).`,
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
        // Parse only bounded JSON; never retain raw upstream errors, headers or request causes.
        const parsed: unknown = JSON.parse(
          new TextDecoder('utf-8', { fatal: true }).decode(bytes),
        );
        return parsed;
      } catch {
        throw new ModelError('badResponse', 'DeepSeek returned invalid JSON.');
      }
    } catch (error) {
      if (signal.aborted) throw stopped(callerSignal);
      if (error instanceof ModelError) throw error;
      if (error instanceof ByteLimitError)
        throw new ModelError(
          'badResponse',
          'DeepSeek response exceeded its byte limit.',
        );
      throw new ModelError(
        'network',
        'DeepSeek retrieval could not reach the upstream service.',
      );
    }
  } finally {
    // Attempts include empty results, errors, cancellation and timeouts, not just billed successes.
    await record();
  }
}

function stopped(callerSignal?: AbortSignal): ModelError {
  return callerSignal?.aborted
    ? new ModelError('aborted', 'The call was stopped.')
    : new ModelError('network', 'DeepSeek retrieval timed out.');
}

function redact(value: string, connection: ModelConnection): string {
  return connection.apiKey
    ? value.replaceAll(connection.apiKey, '[redacted]')
    : value;
}

export async function deepseekSearch(
  connection: ModelConnection,
  query: string,
  signal: AbortSignal,
  record: () => Promise<void>,
  callerSignal?: AbortSignal,
): Promise<WebSearchItem> {
  if ([...query].length > 128)
    return {
      query,
      status: 'failed',
      reason: 'unavailable',
      code: 'badResponse',
    };
  const parsed = SearchSchema.safeParse(
    await request(
      connection,
      'search',
      {
        query,
        count: WEB_SEARCH_LIMITS.sources,
        need_content: true,
      },
      signal,
      record,
      callerSignal,
    ),
  );
  if (!parsed.success)
    throw new ModelError(
      'badResponse',
      'DeepSeek returned an invalid search response.',
    );
  const seen = new Set<string>();
  const sources = parsed.data.results
    .flatMap((item) => {
      // Do not create a citation if the upstream echoes a credential in its URL.
      if (connection.apiKey && item.url.includes(connection.apiKey)) return [];
      const safe = safeSearchSource({
        title: redact(item.title, connection),
        url: item.url,
        snippet: redact(item.snippet, connection),
        summary: redact(item.summary, connection),
        content: redact(item.content, connection),
      });
      if (!safe || seen.has(safe.url)) return [];
      seen.add(safe.url);
      return [safe];
    })
    .slice(0, WEB_SEARCH_LIMITS.sources);
  return searchItem(
    query,
    sources
      .map(
        (item, i) =>
          `[${i + 1}] ${item.title}\n${item.summary || item.snippet}`,
      )
      .join('\n\n'),
    sources,
    true,
  );
}

export async function deepseekFetch(
  connection: ModelConnection,
  url: string,
  signal: AbortSignal,
  record: () => Promise<void>,
  callerSignal?: AbortSignal,
): Promise<WebFetchResult> {
  try {
    const target = new URL(url);
    if (
      [...url].length > 8192 ||
      !['http:', 'https:'].includes(target.protocol) ||
      !target.hostname ||
      target.username ||
      target.password
    )
      throw new Error('Invalid URL.');
  } catch {
    throw new ModelError(
      'badResponse',
      'Web fetch requires an HTTP(S) URL without credentials, at most 8192 characters.',
    );
  }
  const parsed = FetchSchema.safeParse(
    await request(connection, 'fetch', { url }, signal, record, callerSignal),
  );
  if (!parsed.success || !parsed.data.content.trim())
    throw new ModelError(
      'badResponse',
      'DeepSeek returned no usable page content.',
    );
  return {
    url,
    title: redact(parsed.data.title, connection),
    content: redact(parsed.data.content, connection),
  };
}

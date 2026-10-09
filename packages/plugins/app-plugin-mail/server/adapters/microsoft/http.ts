import type {
  MailProviderError,
  MailProviderResult,
} from '../../../shared/mail.js';
import type { MailProviderSendResult } from '../../contracts/provider.js';

import type { MicrosoftMailProviderConfig } from './types.js';
import { HTTP_TIMEOUT_MS, MAX_PROVIDER_JSON_BYTES } from './constants.js';
import { failure, unknownError } from './errors.js';

export function fetchWithTimeout(
  input: Parameters<typeof globalThis.fetch>[0],
  init: RequestInit = {},
): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(HTTP_TIMEOUT_MS);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;
  return globalThis.fetch(input, { ...init, signal });
}

export async function readJson<T>(response: Response): Promise<T> {
  if (!response.body) return (await response.json()) as T;
  const reader =
    response.body.getReader() as ReadableStreamDefaultReader<Uint8Array>;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    total += chunk.value.byteLength;
    if (total > MAX_PROVIDER_JSON_BYTES) {
      await reader.cancel();
      throw new Error('Microsoft Provider response exceeded the size limit.');
    }
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

export async function graphRequest<T>(
  config: MicrosoftMailProviderConfig,
  token: string,
  pathOrUrl: string,
  init: RequestInit,
): Promise<MailProviderResult<T>> {
  try {
    const resolvedUrl = resolveGraphUrl(config, pathOrUrl);
    if (!resolvedUrl.ok) return resolvedUrl;
    const response = await fetchWithTimeout(resolvedUrl.value, {
      ...init,
      headers: {
        ...init.headers,
        authorization: `Bearer ${token}`,
        accept: 'application/json',
        Prefer: 'IdType="ImmutableId", outlook.body-content-type="html"',
      },
    });
    return response.ok
      ? { ok: true, value: await readJson<T>(response) }
      : { ok: false, error: await responseError(response) };
  } catch (error) {
    return {
      ok: false,
      error: unknownError(error, 'MICROSOFT_REQUEST_FAILED'),
    };
  }
}

export function resolveGraphUrl(
  config: MicrosoftMailProviderConfig,
  pathOrUrl: string,
): MailProviderResult<string> {
  const baseUrl = new URL(graphBase(config));
  const url = /^https?:\/\//i.test(pathOrUrl)
    ? new URL(pathOrUrl)
    : new URL(
        `${baseUrl.href}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`,
      );
  const basePath = `${baseUrl.pathname.replace(/\/$/, '')}/`;
  if (url.origin !== baseUrl.origin || !url.pathname.startsWith(basePath)) {
    return failure(
      'MICROSOFT_PAGING_URL_INVALID',
      'Microsoft Graph returned a paging URL outside the configured API endpoint.',
      'provider',
      false,
    );
  }
  return { ok: true, value: url.href };
}

export function graphBase(config: MicrosoftMailProviderConfig): string {
  return (config.graphBaseUrl ?? 'https://graph.microsoft.com/v1.0').replace(
    /\/$/,
    '',
  );
}

export async function responseError(
  response: Response,
): Promise<MailProviderError> {
  let message = `Microsoft Graph request failed with status ${response.status}.`;
  try {
    const body = await readJson<{
      error?: { code?: string; message?: string };
    }>(response);
    message = body.error?.message ?? message;
  } catch {
    // Some Provider errors do not use a JSON response body.
  }
  const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
  return {
    code: `MICROSOFT_HTTP_${response.status}`,
    message,
    category:
      response.status === 401 || response.status === 403
        ? 'authentication'
        : response.status === 429
          ? 'rate_limit'
          : 'provider',
    retryable: response.status === 429 || response.status >= 500,
    retryAfterMs,
  };
}

/** The delay a `Retry-After` header asks for, in milliseconds, given as seconds or as an HTTP date. */
export function parseRetryAfter(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return seconds > 0 ? seconds * 1000 : undefined;
  }
  const retryAt = Date.parse(value);
  const delay = retryAt - Date.now();
  return Number.isFinite(retryAt) && delay > 0 ? delay : undefined;
}

export async function submissionResponse(
  response: Response,
): Promise<MailProviderSendResult> {
  const error = await responseError(response);
  return {
    status: response.status >= 500 ? 'submission_unknown' : 'failed',
    error: response.status >= 500 ? { ...error, retryable: false } : error,
  };
}

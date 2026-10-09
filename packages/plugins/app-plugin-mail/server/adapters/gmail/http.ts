import type {
  MailProviderError,
  MailProviderReasonCode,
  MailProviderResult,
} from '../../../shared/mail.js';
import type { MailProviderSendResult } from '../../contracts/provider.js';

import type { GmailMailProviderConfig } from './types.js';
import { unknownError } from './errors.js';
import { HTTP_TIMEOUT_MS, MAX_PROVIDER_JSON_BYTES } from './constants.js';

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
      throw new Error('Gmail Provider response exceeded the size limit.');
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

export async function gmailRequest<T>(
  config: GmailMailProviderConfig,
  accessToken: string,
  path: string,
  init: RequestInit,
): Promise<MailProviderResult<T>> {
  try {
    const response = await fetchWithTimeout(`${apiBase(config)}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
      },
    });
    return response.ok
      ? { ok: true, value: await readJson<T>(response) }
      : { ok: false, error: await responseError('GMAIL', response) };
  } catch (error) {
    return { ok: false, error: unknownError(error, 'GMAIL_REQUEST_FAILED') };
  }
}

export function apiBase(config: GmailMailProviderConfig): string {
  return (config.apiBaseUrl ?? 'https://gmail.googleapis.com/gmail/v1').replace(
    /\/$/,
    '',
  );
}

export async function responseError(
  prefix: string,
  response: Response,
): Promise<MailProviderError> {
  let message = `${prefix} request failed with status ${response.status}.`;
  let reasons = new Set<string>();
  try {
    const body = await readJson<unknown>(response);
    if (isRecord(body)) {
      if (typeof body.error === 'string') {
        message =
          (typeof body.error_description === 'string'
            ? body.error_description
            : undefined) ?? body.error;
      } else if (isRecord(body.error)) {
        message =
          (typeof body.error.message === 'string'
            ? body.error.message
            : undefined) ?? message;
        reasons = googleErrorReasons(body.error);
      }
    }
  } catch {
    // Some Provider errors do not use a JSON response body.
  }
  const authenticationFailure =
    response.status === 401 ||
    (response.status === 403 &&
      (reasons.has('authError') || reasons.has('insufficientPermissions')));
  const rateLimitFailure =
    response.status === 429 ||
    (response.status === 403 &&
      (reasons.has('rateLimitExceeded') ||
        reasons.has('userRateLimitExceeded')));
  const reasonCode = gmailReasonCode(reasons);
  return {
    code: `${prefix}_HTTP_${response.status}`,
    message,
    category: authenticationFailure
      ? 'authentication'
      : rateLimitFailure
        ? 'rate_limit'
        : 'provider',
    retryable: rateLimitFailure || response.status >= 500,
    retryAfterMs: parseRetryAfter(response.headers.get('retry-after')),
    ...(reasonCode ? { reasonCode } : {}),
  };
}

function gmailReasonCode(
  reasons: ReadonlySet<string>,
): MailProviderReasonCode | undefined {
  const reasonCodes: readonly (readonly [string, MailProviderReasonCode])[] = [
    ['rateLimitExceeded', 'gmailRateLimitExceeded'],
    ['userRateLimitExceeded', 'gmailUserRateLimitExceeded'],
    ['dailyLimitExceeded', 'gmailDailyLimitExceeded'],
    ['domainPolicy', 'gmailDomainPolicy'],
    ['insufficientPermissions', 'gmailInsufficientPermissions'],
    ['authError', 'gmailAuthError'],
    ['accessNotConfigured', 'gmailApiNotEnabled'],
  ];
  for (const [reason, code] of reasonCodes) {
    if (reasons.has(reason)) return code;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function googleErrorReasons(error: Record<string, unknown>): Set<string> {
  const reasons = new Set<string>();
  for (const key of ['errors', 'details'] as const) {
    const entries = error[key];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries as unknown[]) {
      if (isRecord(entry) && typeof entry.reason === 'string') {
        reasons.add(entry.reason);
      }
    }
  }
  return reasons;
}

export function parseRetryAfter(value: string | null): number | undefined {
  if (value === null) return undefined;
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
  const error = await responseError('GMAIL', response);
  return {
    status: response.status >= 500 ? 'submission_unknown' : 'failed',
    error: response.status >= 500 ? { ...error, retryable: false } : error,
  };
}

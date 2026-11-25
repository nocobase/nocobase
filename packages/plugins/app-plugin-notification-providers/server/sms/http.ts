import { providerErrorCode } from '../error.js';
import {
  SmsProviderError,
  smsErrorCodeForStatus,
  type SmsErrorCode,
} from './errors.js';

/** Errors that happen before the request leaves this machine: nothing was submitted. */
const PRE_SUBMISSION_ERRORS = new Set([
  'EAI_AGAIN',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'UND_ERR_CONNECT_TIMEOUT',
]);

export interface SmsHttpResponse {
  readonly status: number;
  readonly body: unknown;
  readonly retryAfterMs: number | undefined;
}

/**
 * One request to a provider's signed API. A transport failure or an answer without JSON is an
 * `SMS_PROVIDER_UNAVAILABLE` error whose outcome says whether the request can have reached the provider; the caller
 * reads the JSON body, which carries the provider's own error codes even on a 4xx or 5xx status.
 */
export async function postToProvider(
  url: string,
  init: {
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
    readonly signal: AbortSignal;
  },
): Promise<SmsHttpResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: init.headers,
      body: init.body,
      signal: init.signal,
      redirect: 'manual',
    });
  } catch (error) {
    const code = providerErrorCode(error);
    throw new SmsProviderError('SMS_PROVIDER_UNAVAILABLE', {
      providerCode: init.signal.aborted ? 'ABORTED' : code,
      outcome:
        !init.signal.aborted && code && PRE_SUBMISSION_ERRORS.has(code)
          ? 'retryable'
          : 'unknown',
      cause: error,
    });
  }
  const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    // The parse error is not kept: it can quote the start of the provider's answer.
    await response.body?.cancel().catch(() => undefined);
    // An unreadable success may have been submitted, so it stays unknown. An unreadable refusal is classified by its
    // HTTP status, like a refusal without a business code.
    throw new SmsProviderError(
      response.ok
        ? 'SMS_PROVIDER_UNAVAILABLE'
        : smsErrorCodeForStatus(response.status),
      {
        providerCode: `HTTP-${response.status}`,
        retryAfterMs,
      },
    );
  }
  return { status: response.status, body, retryAfterMs };
}

export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined;
}

/** Reads `value[key]` when `value` is an object. */
export function field(value: unknown, key: string): unknown {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

export function text(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : undefined;
}

/**
 * The stable code of a provider's refusal: its known business code first, and the HTTP status only when the answer has
 * no business code or one this package does not know.
 */
export function refusalCode(
  known: SmsErrorCode | undefined,
  status: number,
): SmsErrorCode {
  return known && known !== 'SMS_REJECTED'
    ? known
    : smsErrorCodeForStatus(status);
}

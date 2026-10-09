import type {
  MailProviderError,
  MailProviderResult,
} from '../../../shared/mail.js';

export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw signal.reason ?? new Error('Operation aborted.');
}

export function failure<T>(
  code: string,
  message: string,
  category: MailProviderError['category'],
  retryable: boolean,
): MailProviderResult<T> {
  return { ok: false, error: { code, message, category, retryable } };
}

/**
 * Classify an IMAP (imapflow) or SMTP (nodemailer) failure. IMAP servers report the reason as a response code (RFC
 * 5530) such as `[AUTHENTICATIONFAILED]`, `[UNAVAILABLE]` or Gmail's `[THROTTLED]`, which imapflow exposes as
 * `serverResponseCode`; SMTP servers report a reply code, where 4xx is transient and 5xx permanent.
 */
export function classifyError(error: unknown, code: string): MailProviderError {
  const value = error as {
    code?: unknown;
    responseCode?: unknown;
    responseText?: unknown;
    serverResponseCode?: unknown;
    authenticationFailed?: unknown;
    throttleReset?: unknown;
    response?: unknown;
    message?: unknown;
  };
  const serverResponseCode =
    typeof value.serverResponseCode === 'string'
      ? value.serverResponseCode.toUpperCase()
      : undefined;
  const providerCode =
    typeof value.code === 'string'
      ? value.code
      : typeof value.serverResponseCode === 'string'
        ? value.serverResponseCode
        : code;
  const responseCode =
    typeof value.responseCode === 'number' ? value.responseCode : undefined;
  const message =
    typeof value.responseText === 'string'
      ? value.responseText
      : typeof value.response === 'string'
        ? value.response
        : typeof value.message === 'string'
          ? value.message
          : `${code} failed.`;
  const authenticationFailure =
    value.authenticationFailed === true ||
    providerCode === 'EAUTH' ||
    AUTHENTICATION_RESPONSE_CODES.has(serverResponseCode ?? '') ||
    responseCode === 401 ||
    responseCode === 535;
  const rateLimited =
    providerCode === 'ETHROTTLE' ||
    RATE_LIMIT_RESPONSE_CODES.has(serverResponseCode ?? '') ||
    (responseCode !== undefined &&
      responseCode >= 400 &&
      SMTP_RATE_LIMIT_TEXT.test(message));
  const category: MailProviderError['category'] = authenticationFailure
    ? 'authentication'
    : rateLimited
      ? 'rate_limit'
      : providerCode === 'EENVELOPE'
        ? 'recipient'
        : TIMEOUT_CODES.has(providerCode)
          ? 'timeout'
          : NETWORK_CODES.has(providerCode)
            ? 'network'
            : 'provider';
  const transientReply =
    responseCode !== undefined && responseCode >= 400 && responseCode < 500;
  const retryAfterMs =
    typeof value.throttleReset === 'number' && value.throttleReset > 0
      ? value.throttleReset
      : undefined;
  return {
    code: providerCode,
    message,
    category,
    retryable:
      category === 'network' ||
      category === 'timeout' ||
      (category === 'rate_limit' && responseCode === undefined) ||
      serverResponseCode === 'UNAVAILABLE' ||
      (category !== 'authentication' && transientReply),
    ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
  };
}

const NETWORK_CODES = new Set([
  'ECONNRESET',
  'EPIPE',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ESOCKET',
  'ECONNECTION',
  'EDNS',
  'NoConnection',
]);

const TIMEOUT_CODES = new Set([
  'ETIMEDOUT',
  'ETIMEOUT',
  'GREETING_TIMEOUT',
  'UPGRADE_TIMEOUT',
]);

/** IMAP response codes (RFC 5530) after which only signing in again, with new credentials, can succeed. */
const AUTHENTICATION_RESPONSE_CODES = new Set([
  'AUTHENTICATIONFAILED',
  'AUTHORIZATIONFAILED',
  'EXPIRED',
]);

/** IMAP response codes for a throttled connection, such as Gmail's `THROTTLED`. */
const RATE_LIMIT_RESPONSE_CODES = new Set(['THROTTLED']);

/** SMTP replies that report a sending rate or quota limit, such as `421 4.7.0 Try again later, too many messages`. */
const SMTP_RATE_LIMIT_TEXT =
  /\b(?:rate limit|too many (?:messages|connections|recipients)|quota exceeded|sending limit|throttl)/iu;

import {
  MAIL_PROVIDER_ERROR_CATEGORIES,
  type MailProviderError,
  type MailProviderErrorCategory,
  type MailProviderReasonCode,
} from '../../shared/mail.js';

/** The canonical statuses a Mail domain error may report; the API maps each one to its HTTP status. */
export type MailErrorStatus =
  | 'INVALID_ARGUMENT'
  | 'FAILED_PRECONDITION'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'ABORTED';

export interface MailErrorOptions {
  readonly status: MailErrorStatus;
  /** Stable UPPER_SNAKE_CASE reason within the `mail` domain. */
  readonly reason: string;
  readonly message: string;
  /**
   * The identifier a NOT_FOUND error is about, such as `accountId`. The API answers 404 when the request path names
   * it and 400 with a field violation when the request body or query refers to it.
   */
  readonly field?: string;
  readonly cause?: unknown;
}

/**
 * A failure Mail reports to its caller: a missing resource, a state that forbids the operation, or a conflict. Every
 * other error escaping Mail is an unexpected failure.
 */
export class MailError extends Error {
  public readonly status: MailErrorStatus;
  public readonly reason: string;
  public readonly field: string | undefined;

  public constructor(options: MailErrorOptions) {
    super(
      options.message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = 'MailError';
    this.status = options.status;
    this.reason = options.reason;
    this.field = options.field;
  }
}

export function mailNotFound(
  reason: string,
  message: string,
  field: string,
): MailError {
  return new MailError({ status: 'NOT_FOUND', reason, message, field });
}

/**
 * A request Mail cannot act on because its input is invalid, such as an unreadable page token or too many
 * attachments. The API answers 400 `INVALID_MAIL_REQUEST`, with a field violation when `field` names the input.
 * Unexpected failures must not use this: they stay ordinary errors and become an opaque 500.
 */
export function mailInvalidArgument(
  message: string,
  field?: string,
  cause?: unknown,
): MailError {
  return new MailError({
    status: 'INVALID_ARGUMENT',
    reason: 'INVALID_MAIL_REQUEST',
    message,
    ...(field === undefined ? {} : { field }),
    ...(cause === undefined ? {} : { cause }),
  });
}

export function mailFailedPrecondition(
  reason: string,
  message: string,
): MailError {
  return new MailError({ status: 'FAILED_PRECONDITION', reason, message });
}

export const mailAccountNotFound = (field = 'accountId'): MailError =>
  mailNotFound('MAIL_ACCOUNT_NOT_FOUND', 'Mail account was not found.', field);

export const mailMessageNotFound = (field = 'messageId'): MailError =>
  mailNotFound('MAIL_MESSAGE_NOT_FOUND', 'Mail message was not found.', field);

export const mailAccountRemoving = (): MailError =>
  mailFailedPrecondition(
    'MAIL_ACCOUNT_REMOVING',
    'Mail account is being removed.',
  );

export const mailAccountInactive = (): MailError =>
  mailFailedPrecondition(
    'MAIL_ACCOUNT_INACTIVE',
    'Mail account is not active.',
  );

export const mailAttachmentStorageUnavailable = (): MailError =>
  mailFailedPrecondition(
    'MAIL_ATTACHMENT_STORAGE_NOT_CONFIGURED',
    'Mail attachment storage is not configured.',
  );

/** Whether a value carries a Provider error, such as a `MailProviderRequestError` raised through `assertProviderResult`. */
export function isMailProviderError(
  value: unknown,
): value is import('../../shared/mail.js').MailProviderError {
  if (!isRecord(value)) return false;
  return (
    typeof value.code === 'string' &&
    typeof value.category === 'string' &&
    (MAIL_PROVIDER_ERROR_CATEGORIES as readonly string[]).includes(
      value.category,
    ) &&
    typeof value.retryable === 'boolean'
  );
}

const PUBLIC_REASON_CODES = new Set([
  'gmailRateLimitExceeded',
  'gmailUserRateLimitExceeded',
  'gmailDailyLimitExceeded',
  'gmailDomainPolicy',
  'gmailInsufficientPermissions',
  'gmailAuthError',
  'gmailApiNotEnabled',
]);

/**
 * How the HTTP API answers a Provider failure a route met while it waited for the Provider:
 *
 * - `RATE_LIMITED`: the Provider throttled the request or a quota ran out; `429 RESOURCE_EXHAUSTED`, with `Retry-After`
 *   when the Provider said how long to wait.
 * - `UNAVAILABLE`: the Provider could not be reached, timed out, or failed on its side (an HTTP 5xx, a transient SMTP
 *   4xx reply); `503 UNAVAILABLE`.
 * - `REAUTHORIZATION_REQUIRED`: the account's authorization was revoked or has expired and only reconnecting the
 *   account restores it; `400 FAILED_PRECONDITION` with reason `MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED`.
 * - `REJECTED`: the Provider refused this request, such as a recipient or content it does not accept or an operation
 *   its configuration forbids; `400 FAILED_PRECONDITION` with reason `MAIL_PROVIDER_REQUEST_FAILED`.
 */
export type MailProviderFailureKind =
  'RATE_LIMITED' | 'UNAVAILABLE' | 'REAUTHORIZATION_REQUIRED' | 'REJECTED';

/** Classify a Provider failure by the category and retryability the Provider adapter assigned to it. */
export function classifyMailProviderError(
  error: MailProviderError,
): MailProviderFailureKind {
  switch (error.category) {
    case 'rate_limit':
      return 'RATE_LIMITED';
    case 'network':
    case 'timeout':
      return 'UNAVAILABLE';
    case 'provider':
      return error.retryable ? 'UNAVAILABLE' : 'REJECTED';
    case 'authentication':
      return error.retryable ? 'UNAVAILABLE' : 'REAUTHORIZATION_REQUIRED';
    default:
      return 'REJECTED';
  }
}

/**
 * A Provider failure thrown to the caller of a synchronous operation. It carries the adapter's `MailProviderError`
 * fields on itself, so code that reads `code`, `category` or `retryable` off a caught error keeps working, and the
 * HTTP API answers it by its `kind` rather than with an opaque 500.
 */
export class MailProviderRequestError
  extends Error
  implements MailProviderError
{
  public readonly code: string;
  public readonly category: MailProviderErrorCategory;
  public readonly retryable: boolean;
  public readonly retryAfterMs: number | undefined;
  public readonly reasonCode: MailProviderReasonCode | undefined;
  public readonly recipients: MailProviderError['recipients'] | undefined;
  public readonly kind: MailProviderFailureKind;

  public constructor(
    error: MailProviderError,
    options: { readonly cause?: unknown } = {},
  ) {
    super(
      error.message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = 'MailProviderRequestError';
    this.code = error.code;
    this.category = error.category;
    this.retryable = error.retryable;
    this.retryAfterMs = error.retryAfterMs;
    this.reasonCode = error.reasonCode;
    this.recipients = error.recipients;
    this.kind = classifyMailProviderError(error);
  }
}

export function assertProviderResult<T>(
  result: import('../../shared/mail.js').MailProviderResult<T>,
): T {
  if (!result.ok) throw new MailProviderRequestError(result.error);
  return result.value;
}

export function toManagementActionError(
  cause: unknown,
): import('../../shared/mail.js').MailPublicError {
  if (isMailProviderError(cause)) return toPublicError(cause);
  return {
    code: 'MAIL_MANAGEMENT_ACTION_FAILED',
    category: 'unknown',
    retryable: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toPublicError(
  error: import('../../shared/mail.js').MailProviderError,
): import('../../shared/mail.js').MailPublicError {
  return {
    code: error.code,
    category: error.category,
    retryable: error.retryable,
    retryAfterMs: error.retryAfterMs,
    ...(PUBLIC_REASON_CODES.has(error.reasonCode ?? '')
      ? { reasonCode: error.reasonCode }
      : {}),
    ...(error.recipients ? { recipients: error.recipients } : {}),
  };
}

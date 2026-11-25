import type {
  NotificationProviderErrorCategory,
  ProviderSendResult,
} from '@nocobase/app-plugin-notification';

/** The stable error codes of an SMS submission. Administrators and callers read these, never the provider's own codes. */
export const SMS_ERROR_CODES = [
  'SMS_SIGNATURE_INVALID',
  'SMS_TEMPLATE_INVALID',
  'SMS_PARAMS_INVALID',
  'SMS_INVALID_PHONE',
  'SMS_AUTH_FAILED',
  'SMS_INSUFFICIENT_BALANCE',
  'SMS_RATE_LIMITED',
  'SMS_PROVIDER_UNAVAILABLE',
  'SMS_REJECTED',
] as const;
export type SmsErrorCode = (typeof SMS_ERROR_CODES)[number];

/**
 * What happened to the submission: `permanent` was refused and retrying cannot help, `retryable` was refused before
 * the provider acted on it, `unknown` may or may not have been sent.
 */
export type SmsErrorOutcome = 'permanent' | 'retryable' | 'unknown';

interface SmsErrorDescription {
  readonly category: NotificationProviderErrorCategory;
  readonly outcome: SmsErrorOutcome;
  readonly message: string;
}

const descriptions: Readonly<Record<SmsErrorCode, SmsErrorDescription>> = {
  SMS_SIGNATURE_INVALID: {
    category: 'configuration',
    outcome: 'permanent',
    message:
      'The SMS signature does not exist or has not been approved by the provider. Check signName and the signature review status.',
  },
  SMS_TEMPLATE_INVALID: {
    category: 'configuration',
    outcome: 'permanent',
    message:
      'The SMS template does not exist, has not been approved, or does not match the message. Check the template ID.',
  },
  SMS_PARAMS_INVALID: {
    category: 'content',
    outcome: 'permanent',
    message:
      'The template variables are missing or not accepted by the provider. Check the template params mapping.',
  },
  SMS_INVALID_PHONE: {
    category: 'recipient',
    outcome: 'permanent',
    message:
      'The provider does not accept this phone number or cannot deliver to it.',
  },
  SMS_AUTH_FAILED: {
    category: 'authentication',
    outcome: 'permanent',
    message:
      'The provider rejected the credentials. Check the access key and secret and their permission to send SMS.',
  },
  SMS_INSUFFICIENT_BALANCE: {
    category: 'provider',
    outcome: 'permanent',
    message:
      'The provider account has no balance or SMS package left. Top up the account.',
  },
  SMS_RATE_LIMITED: {
    category: 'rate_limit',
    outcome: 'retryable',
    message:
      'The provider limited the sending frequency for this number or account. Try again later.',
  },
  SMS_PROVIDER_UNAVAILABLE: {
    category: 'provider',
    outcome: 'unknown',
    message:
      'The provider is unavailable or did not answer. The message may or may not have been sent.',
  },
  SMS_REJECTED: {
    category: 'provider',
    outcome: 'permanent',
    message: 'The provider rejected the message.',
  },
};

export interface SmsProviderErrorOptions {
  /** The provider's own error code, such as `isv.SMS_SIGNATURE_ILLEGAL`. */
  readonly providerCode?: string | undefined;
  /** The provider's request id, for its support. */
  readonly requestId?: string | undefined;
  readonly retryAfterMs?: number | undefined;
  /** Overrides the default of the code, for a network failure known to precede the submission. */
  readonly outcome?: SmsErrorOutcome | undefined;
  /** The provider's own message, shown only for `SMS_REJECTED`. */
  readonly detail?: string | undefined;
  readonly cause?: unknown;
}

/** An SMS provider's refusal or failure, already mapped to a stable code. It never carries template parameters. */
export class SmsProviderError extends Error {
  public readonly code: SmsErrorCode;
  public readonly category: NotificationProviderErrorCategory;
  public readonly outcome: SmsErrorOutcome;
  public readonly providerCode: string | undefined;
  public readonly requestId: string | undefined;
  public readonly retryAfterMs: number | undefined;

  public constructor(
    code: SmsErrorCode,
    options: SmsProviderErrorOptions = {},
  ) {
    const description = descriptions[code];
    const reference = [
      options.providerCode ? `provider code ${options.providerCode}` : '',
      options.requestId ? `request ${options.requestId}` : '',
    ].filter(Boolean);
    const detail = options.detail
      ? ` ${sanitizeSmsDetail(options.detail)}`
      : '';
    super(
      `${description.message}${detail}${
        reference.length ? ` (${reference.join(', ')})` : ''
      }`,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = 'SmsProviderError';
    this.code = code;
    this.category = description.category;
    this.outcome = options.outcome ?? description.outcome;
    this.providerCode = options.providerCode;
    this.requestId = options.requestId;
    this.retryAfterMs = options.retryAfterMs;
  }
}

/** A provider's free text without phone numbers, links or control characters, and short enough for a log line. */
export function sanitizeSmsDetail(value: string): string {
  const text = value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/https?:\/\/\S+/gi, '[link]')
    .replace(/\+?\d[\d\s-]{5,}\d/g, '[number]')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return text.length <= 200 ? text : `${text.slice(0, 199)}…`;
}

/** The notification result of a refused or failed submission. */
export function smsErrorResult(error: SmsProviderError): ProviderSendResult {
  const send = {
    code: error.code,
    category: error.category,
    message: error.message,
  };
  if (error.outcome === 'unknown')
    return { status: 'submission_unknown', error: send };
  return {
    status: 'failed',
    disposition: error.outcome === 'retryable' ? 'same_provider' : 'never',
    error: send,
    ...(error.retryAfterMs === undefined
      ? {}
      : { retryAfterMs: error.retryAfterMs }),
  };
}

/** The result of any error thrown while sending: a mapped provider error keeps its code, anything else is unknown. */
export function smsFailureResult(
  error: unknown,
  signal: AbortSignal,
): ProviderSendResult {
  if (error instanceof SmsProviderError) return smsErrorResult(error);
  return {
    status: 'submission_unknown',
    error: {
      code: signal.aborted ? 'SMS_ABORTED' : 'SMS_UNEXPECTED_ERROR',
      category: signal.aborted ? 'timeout' : 'unknown',
      message: signal.aborted
        ? 'The SMS request was aborted before the provider answered.'
        : 'The SMS could not be submitted because of an unexpected error.',
    },
  };
}

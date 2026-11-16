import { MAIL_PROVIDER_ERROR_CATEGORIES } from '../shared/mail.js';
import { redactMailText } from './redaction.js';
/** The shared application logger, narrowed to the levels Mail uses. */
export interface MailLogger {
  info?(data: object, message: string): void;
  warn?(data: object, message: string): void;
  error?(data: object, message: string): void;
}

export interface MailLogError {
  readonly type?: string;
  readonly message: string;
  readonly stack?: string;
  readonly code?: string;
}

/** Retain useful diagnostics without SDK payloads or the message-bearing stack header. */
export function mailLogError(
  error: unknown,
  secrets: readonly string[] = [],
): MailLogError {
  const value =
    error !== null && typeof error === 'object'
      ? (error as Record<string, unknown>)
      : {};
  const providerFailure =
    (typeof value.category === 'string' &&
      (MAIL_PROVIDER_ERROR_CATEGORIES as readonly string[]).includes(
        value.category,
      ) &&
      typeof value.retryable === 'boolean') ||
    'mailError' in value ||
    'providerError' in value;
  // Provider text needs credential context; these failures also have dedicated allowlisted diagnostics.
  const message =
    providerFailure && secrets.length === 0
      ? 'Mail provider operation failed.'
      : (redactMailText(
          typeof error === 'string' ? error : value.message,
          secrets,
        ) ?? 'Unknown mail error');
  const type =
    error instanceof Error ? redactMailText(error.name, secrets) : undefined;
  const frames =
    typeof value.stack === 'string'
      ? value.stack
          .split('\n')
          .filter((line) =>
            /^\s+at .*(?::\d+:\d+\)?|<anonymous>\)?)$/u.test(line),
          )
          .slice(0, 20)
          .map((line) => redactMailText(line, secrets))
          .join('\n')
      : undefined;
  return {
    ...(type ? { type } : {}),
    message,
    ...(typeof value.code === 'string'
      ? { code: mailLogCode(value.code, secrets) }
      : {}),
    ...(frames ? { stack: frames } : {}),
  };
}

/** A failed logging transport must never change a delivery or persistence result. */
export function writeMailLog(
  logger: MailLogger | undefined,
  level: keyof MailLogger,
  data: object,
  message: string,
): void {
  try {
    logger?.[level]?.(data, message);
  } catch {
    // Retrying a successful send because logging failed could duplicate delivery.
  }
}

/** Keep existing summary logs useful without exposing arbitrary provider strings. */
export function mailLogCode(
  value: string,
  secrets: readonly string[] = [],
): string {
  if (redactMailText(value, secrets) !== value) return 'MAIL_PROVIDER_FAILURE';
  return /^(?:[A-Z][A-Z0-9_]{1,80}|(?:GMAIL|MICROSOFT)_OAUTH_(?:invalid_request|invalid_client|invalid_grant|unauthorized_client|unsupported_grant_type|invalid_scope|access_denied|consent_required|interaction_required|login_required|temporarily_unavailable|server_error|slow_down))$/u.test(
    value,
  )
    ? value
    : 'MAIL_PROVIDER_FAILURE';
}

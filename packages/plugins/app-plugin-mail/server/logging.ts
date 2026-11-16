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
}

/** Callers without credential context must not serialize arbitrary SDK text or stacks. */
export function mailLogError(_error: unknown): MailLogError {
  return { message: 'Mail operation failed.' };
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
export function mailLogCode(value: string): string {
  return /^(?:(?:MAIL|IMAP|SMTP|GMAIL|MICROSOFT)_[A-Z0-9_]{1,80}|E(?:AUTH|CONNREFUSED|CONNRESET|TIMEDOUT|TIMEOUT|NOTFOUND|AI_AGAIN|SOCKET|CONNECTION|DNS|PIPE)|AUTHENTICATIONFAILED|UNAVAILABLE)$/u.test(
    value,
  )
    ? value
    : 'MAIL_PROVIDER_FAILURE';
}

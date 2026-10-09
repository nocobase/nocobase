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

/** Keep Error details JSON-safe without copying arbitrary SDK request payloads. */
export function mailLogError(error: unknown): MailLogError {
  if (error instanceof Error) {
    return { type: error.name, message: error.message, stack: error.stack };
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return {
      message:
        typeof error.message === 'string'
          ? error.message
          : 'Unknown mail error',
    };
  }
  return { message: typeof error === 'string' ? error : 'Unknown mail error' };
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

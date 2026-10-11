/**
 * Studio's own refusals, thrown by its services: a canonical status and a stable code. The HTTP routes answer them in
 * the standard error body with the code as `reason` and domain `nb-studio` (`../http/errors.ts`); the CLI commands
 * translate them into the agents protocol.
 */
import {
  apiErrorStatusCodes,
  type ApiErrorStatus,
} from '@nocobase/app-server/router';

export class AccessError extends Error {
  public readonly apiStatus: ApiErrorStatus;
  /** The HTTP status of `apiStatus`. */
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Readonly<Record<string, unknown>>;

  public constructor(
    apiStatus: ApiErrorStatus,
    code: string,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = 'AccessError';
    this.apiStatus = apiStatus;
    this.status = apiErrorStatusCodes[apiStatus];
    this.code = code;
    if (details) this.details = details;
  }
}

export const invalid = (
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): AccessError => new AccessError('INVALID_ARGUMENT', code, message, details);

export const forbidden = (message: string, code = 'FORBIDDEN'): AccessError =>
  new AccessError('PERMISSION_DENIED', code, message);

/** `what` in words; the reason defaults to it in UPPER_SNAKE_CASE, `ROLE_NOT_FOUND` for `Role`. */
export const notFound = (
  what: string,
  code = `${what.trim().replace(/\W+/gu, '_').toUpperCase()}_NOT_FOUND`,
): AccessError => new AccessError('NOT_FOUND', code, `${what} not found.`);

/** A valid request the current state forbids. */
export const conflict = (
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): AccessError =>
  new AccessError('FAILED_PRECONDITION', code, message, details);

export const alreadyExists = (code: string, message: string): AccessError =>
  new AccessError('ALREADY_EXISTS', code, message);

export const unauthorized = (
  message: string,
  code = 'UNAUTHENTICATED',
): AccessError => new AccessError('UNAUTHENTICATED', code, message);

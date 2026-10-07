/**
 * Domain errors. Services never choose an HTTP status: they throw an error of a `kind`, and the route layer turns it
 * into an `ApiError` (`http.ts`). `code` is the stable machine-readable code that becomes the response's `reason`.
 */
export type DomainErrorKind =
  'invalid' | 'unauthorized' | 'forbidden' | 'notFound' | 'conflict';

export interface DomainErrorOptions {
  /** The domain that defined `code`, when it is passed through from another plugin; `projects` otherwise. */
  readonly domain?: string;
  /** What `notFound` could not find, such as `Issue`. */
  readonly resource?: string;
}

export class DomainError extends Error {
  public readonly kind: DomainErrorKind;
  public readonly code: string;
  /** Machine-readable facts for the response's `metadata`; never secrets. */
  public readonly details?: Readonly<Record<string, unknown>>;
  public readonly domain?: string;
  public readonly resource?: string;

  public constructor(
    kind: DomainErrorKind,
    code: string,
    message: string,
    details?: Readonly<Record<string, unknown>>,
    options: DomainErrorOptions = {},
  ) {
    super(message);
    this.name = 'DomainError';
    this.kind = kind;
    this.code = code;
    if (details) this.details = details;
    if (options.domain) this.domain = options.domain;
    if (options.resource) this.resource = options.resource;
  }
}

export function invalid(
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): DomainError {
  return new DomainError('invalid', code, message, details);
}

export function forbidden(message: string, code = 'FORBIDDEN'): DomainError {
  return new DomainError('forbidden', code, message);
}

/** An object that does not exist, or that the caller may not see: the two are indistinguishable on purpose. */
export function notFound(what: string): DomainError {
  return new DomainError(
    'notFound',
    'NOT_FOUND',
    `${what} not found.`,
    undefined,
    { resource: what },
  );
}

export function conflict(
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): DomainError {
  return new DomainError('conflict', code, message, details);
}

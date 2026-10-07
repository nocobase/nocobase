export type SecretsErrorCode =
  | 'SECRETS_NOT_CONFIGURED'
  | 'SECRETS_KEY_UNKNOWN'
  | 'SECRETS_MALFORMED'
  | 'SECRETS_AUTH_FAILED';

/** A secret could not be sealed or opened. `code` says why; the message never contains key material or plaintext. */
export class SecretsError extends Error {
  public readonly code: SecretsErrorCode;

  public constructor(
    code: SecretsErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'SecretsError';
    this.code = code;
  }
}

/** Recognised by `name` as well as by class, so a second copy of this package is still recognised. */
export function isSecretsError(error: unknown): error is SecretsError {
  return (
    error instanceof SecretsError ||
    (error instanceof Error &&
      error.name === 'SecretsError' &&
      typeof Reflect.get(error, 'code') === 'string')
  );
}

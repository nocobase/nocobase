export interface ApplicationNotConfiguredDetails {
  /** The configuration key that is missing, such as `auth.secret`. */
  readonly key?: string;
  /** The environment variable that can supply it instead, when the application maps one. */
  readonly environmentVariable?: string;
}

/**
 * The application has nothing to start with: no configuration supplies what it cannot run without.
 *
 * It states what is missing and nothing more. The remedy depends on how the application is run — a standalone start
 * points at `pnpm nocobase config init`, while an application run by a host is configured through that host — so the entry
 * point that prints the error adds it, and a host showing the same error to an operator does not pass on advice that does
 * not apply. Recognised by `name` as well as by class, so a second copy of this package in the process is still
 * recognised.
 */
export class ApplicationNotConfiguredError extends Error {
  public readonly key?: string;
  public readonly environmentVariable?: string;

  public constructor(
    message: string,
    details: ApplicationNotConfiguredDetails = {},
  ) {
    super(message);
    this.name = 'ApplicationNotConfiguredError';
    this.key = details.key;
    this.environmentVariable = details.environmentVariable;
  }
}

/** Whether `error`, or anything in its cause chain, reports an application that has not been configured. */
export function findApplicationNotConfigured(
  error: unknown,
): ApplicationNotConfiguredError | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current instanceof Error; depth += 1) {
    if (
      current instanceof ApplicationNotConfiguredError ||
      current.name === 'ApplicationNotConfiguredError'
    )
      return current;
    current = current.cause;
  }
  return undefined;
}

/** One of the person's accounts, as Better Auth's `listAccounts` returns it. */
export interface LinkedAccountRecord {
  readonly id: string;
  readonly providerId: string;
}

/** The ways to sign in the application offers right now. */
export interface AvailableSignInMethods {
  /** Password sign-in is on (`auth.emailAndPassword.enabled` is not `false`). */
  readonly password: boolean;
  /** The single sign-on and social providers the application configures. */
  readonly providers: readonly string[];
}

/** Whether an account is still a way to sign in: its method is on and, for a provider, still configured. */
export function isUsable(
  account: LinkedAccountRecord,
  available: AvailableSignInMethods,
): boolean {
  return account.providerId === 'credential'
    ? available.password
    : available.providers.includes(account.providerId);
}

/**
 * Whether the person can unlink an account and still sign in: another account of theirs must be usable. An account
 * whose provider the administrator removed, or a password while password sign-in is off, does not count, although
 * Better Auth's own check counts every stored account.
 */
export function canUnlink(
  target: LinkedAccountRecord,
  accounts: readonly LinkedAccountRecord[],
  available: AvailableSignInMethods,
): boolean {
  return accounts.some(
    (account) => account.id !== target.id && isUsable(account, available),
  );
}

/** The part of the browser's public configuration `passwordSignInKnownOn` reads. */
export interface PublicConfigReader {
  has(path: string): boolean;
  get(path: string): unknown;
}

/**
 * Whether password sign-in is known to be on, from what `defineAuthConfig` publishes. An application that does not
 * declare its `auth` section with `defineAuthConfig` publishes nothing; password sign-in may be off there, so a
 * stored password is not counted as a way to sign in, and the person keeps the account they could still use.
 */
export function passwordSignInKnownOn(config: PublicConfigReader): boolean {
  return (
    config.has('auth.emailAndPassword.enabled') &&
    config.get('auth.emailAndPassword.enabled') !== false
  );
}

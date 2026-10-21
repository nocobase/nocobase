import type { Auth } from '@nocobase/app-plugin-authentication';
import type { DatabaseManager } from '@nocobase/db';

import { demoDataError } from './data/service.js';
import type { DemoAccountSummary } from './data/types.js';

/** A demo account a visitor may enter without typing its password. */
export interface DemoSignInAccount {
  readonly username: string;
  readonly name: string;
  readonly role: string;
  /** Whether the request is signed in as this account. */
  readonly current: boolean;
}

export interface DemoAccountSignInDependencies {
  readonly auth: Auth;
  readonly database: DatabaseManager;
  /** Whether quick sign-in is switched on and the application runs as a demo. */
  readonly enabled: () => boolean;
  /** The dataset and the accounts its completed import lists, with their passwords; none while it is not imported. */
  readonly accounts: () => Promise<{
    readonly datasetId: string | null;
    readonly accounts: readonly DemoAccountSummary[];
  }>;
}

interface Candidate extends DemoAccountSummary {
  readonly id: string;
  readonly email: string;
}

/** The path below the API root every route of this service is reached under. */
const ROUTE_SEGMENT = '/demoMode/';

/**
 * Signs visitors in as the demo accounts the imported dataset lists, through Better Auth's own password sign-in with
 * the password the dataset publishes, so the session is an ordinary one: sign-out, expiry and every guard work as for
 * a typed password. Only accounts the dataset created, still enabled, are offered.
 */
export class DemoAccountSignIn {
  public constructor(private readonly deps: DemoAccountSignInDependencies) {}

  public async list(headers: Headers): Promise<DemoSignInAccount[]> {
    const candidates = await this.candidates();
    if (!candidates.length) return [];
    const session = await this.deps.auth
      .getSession(headers, { disableRefresh: true })
      .catch(() => null);
    return candidates.map((account) => ({
      username: account.username,
      name: account.name,
      role: account.role,
      current: session?.user.id === account.id,
    }));
  }

  /**
   * Ends the request's own session, if any, and signs in as `username`. Returns the `Set-Cookie` headers Better Auth
   * answered the sign-in with.
   */
  public async signIn(
    request: Request,
    username: string,
    clientAddress?: string,
  ): Promise<{ account: DemoSignInAccount; cookies: string[] }> {
    const account = (await this.candidates()).find(
      (candidate) => candidate.username === username,
    );
    if (!account)
      throw demoDataError(
        'DEMO_ACCOUNT_NOT_FOUND',
        `No demo account ${username} can be entered.`,
        'NOT_FOUND',
      );
    const authRoot = authRootOf(request.url);
    const forwarded = new Headers(request.headers);
    for (const name of ['content-length', 'content-type'])
      forwarded.delete(name);
    if (forwarded.has('cookie'))
      // Best effort: the visitor's previous session would otherwise linger until it expires.
      await this.deps.auth
        .handler(
          new Request(`${authRoot}/sign-out`, {
            method: 'POST',
            headers: forwarded,
          }),
          { clientAddress },
        )
        .catch(() => undefined);
    forwarded.delete('cookie');
    forwarded.set('content-type', 'application/json');
    const response = await this.deps.auth.handler(
      new Request(`${authRoot}/sign-in/email`, {
        method: 'POST',
        headers: forwarded,
        body: JSON.stringify({
          email: account.email,
          password: account.password,
          rememberMe: false,
        }),
      }),
      { clientAddress },
    );
    if (!response.ok)
      throw demoDataError(
        'DEMO_ACCOUNT_SIGN_IN_FAILED',
        `Signing in as the demo account ${username} failed with ${response.status}; check that the dataset lists its password.`,
      );
    return {
      account: {
        username: account.username,
        name: account.name,
        role: account.role,
        current: true,
      },
      cookies: response.headers.getSetCookie(),
    };
  }

  private async candidates(): Promise<Candidate[]> {
    if (!this.deps.enabled()) return [];
    const { datasetId, accounts } = await this.deps.accounts();
    if (!datasetId || !accounts.length) return [];
    const query = this.deps.database.query();
    const users = await query
      .selectFrom('user')
      .select(['id', 'username', 'email'])
      .where(
        'username',
        'in',
        accounts.map((account) => account.username),
      )
      .where('disabledAt', 'is', null)
      .execute<{ id: unknown; username: unknown; email: unknown }>();
    if (!users.length) return [];
    const owned = new Set(
      (
        await query
          .selectFrom('demoModeAccounts')
          .select(['userId'])
          .where('datasetId', '=', datasetId)
          .where(
            'userId',
            'in',
            users.map((user) => String(user.id)),
          )
          .execute<{ userId: unknown }>()
      ).map((row) => String(row.userId)),
    );
    const byUsername = new Map(
      users
        .filter((user) => owned.has(String(user.id)))
        .map((user) => [String(user.username), user]),
    );
    return accounts.flatMap((account) => {
      const user = byUsername.get(account.username);
      return user
        ? [{ ...account, id: String(user.id), email: String(user.email) }]
        : [];
    });
  }
}

/** Better Auth's root for a request this service answers: the same API root, so the application's base path holds. */
function authRootOf(url: string): string {
  const parsed = new URL(url);
  const index = parsed.pathname.lastIndexOf(ROUTE_SEGMENT);
  return `${parsed.origin}${index < 0 ? '' : parsed.pathname.slice(0, index)}/auth`;
}

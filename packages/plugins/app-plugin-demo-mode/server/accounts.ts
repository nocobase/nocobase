import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type { Auth } from '@nocobase/app-plugin-authentication';
import type { DatabaseManager } from '@nocobase/db';

import { demoDataError } from './errors.js';
import { migratePartitionedCookies } from './sign-in-cookies.js';
import type { DemoAccountSummary } from '../shared/data.js';

import type { DemoSignInAccount } from '../shared/accounts.js';
export type { DemoSignInAccount } from '../shared/accounts.js';

export interface DemoAccountSignInDependencies {
  readonly auth: Auth;
  readonly database: DatabaseManager;
  /** Whether quick sign-in is switched on and the application runs as a demo. */
  readonly enabled: () => boolean;
  readonly authorization?: () => AppAuthorization | undefined;
  /** Optional dataset labels; these never determine which system accounts can sign in. */
  readonly accounts: () => Promise<readonly DemoAccountSummary[]>;
}

interface Candidate {
  readonly id: string;
  readonly username: string;
  readonly name: string;
  readonly role: string;
}

/** The path below the API root every route of this service is reached under. */
const ROUTE_SEGMENT = '/demoMode/';

/** Offers every enabled person account in a demo, with ordinary sessions issued by Authentication. */
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
        `No account ${username} can be entered.`,
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
    const response = await this.deps.auth.signInUser(
      account.id,
      new Request(request.url, { method: 'POST', headers: forwarded }),
      { clientAddress },
    );
    if (!response.ok)
      throw demoDataError(
        'DEMO_ACCOUNT_SIGN_IN_FAILED',
        `Signing in as ${username} failed with ${response.status}.`,
      );
    return {
      account: {
        username: account.username,
        name: account.name,
        role: account.role,
        current: true,
      },
      cookies: migratePartitionedCookies(response.headers.getSetCookie()),
    };
  }

  /** Signs an anonymous home-page visitor in as an existing Super Admin, leaving an existing session intact. */
  public async signInDefault(
    request: Request,
    clientAddress?: string,
  ): Promise<string[]> {
    if (!this.deps.enabled()) return [];
    if (
      await this.deps.auth.getSession(request.headers, { disableRefresh: true })
    )
      return [];
    const sets = this.deps.authorization?.()?.permissionSets;
    if (!sets) return [];
    const roots = new Set(
      (await sets.list())
        .filter((set) => sets.protection(set.key)?.unrestricted)
        .map((set) => set.key),
    );
    const administrators = new Set(
      (await sets.listAssignments())
        .filter(
          (assignment) =>
            assignment.subject.type === 'user' &&
            roots.has(assignment.permissionSet),
        )
        .map((assignment) => String(assignment.subject.id)),
    );
    const account = (await this.candidates()).find((candidate) =>
      administrators.has(candidate.id),
    );
    if (!account) return [];
    return (await this.signIn(request, account.username, clientAddress))
      .cookies;
  }

  private async candidates(): Promise<Candidate[]> {
    if (!this.deps.enabled()) return [];
    const [accounts, users] = await Promise.all([
      this.deps.accounts(),
      this.deps.database
        .query()
        .selectFrom('user')
        .select(['id', 'username', 'email', 'name'])
        .where('disabledAt', 'is', null)
        .where('deletedAt', 'is', null)
        .where('kind', '=', 'person')
        .orderBy('createdAt', 'asc')
        .orderBy('id', 'asc')
        .execute<{
          id: string;
          username: string | null;
          email: string;
          name: string;
        }>(),
    ]);
    const labels = new Map(
      accounts.map((account) => [account.username, account.role]),
    );
    return users.map((user) => ({
      id: String(user.id),
      username: user.username || user.email,
      name: user.name,
      role: labels.get(user.username ?? '') ?? '',
    }));
  }
}

/** Better Auth's root for a request this service answers: the same API root, so the application's base path holds. */
function authRootOf(url: string): string {
  const parsed = new URL(url);
  const index = parsed.pathname.lastIndexOf(ROUTE_SEGMENT);
  return `${parsed.origin}${index < 0 ? '' : parsed.pathname.slice(0, index)}/auth`;
}

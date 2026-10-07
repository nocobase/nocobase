/**
 * Members: users who have used this plugin. A user's first request makes them a member and gives them the
 * application's default role for new members, so an account the administrator creates can start working without
 * further setup; roles are kept and assigned by the application (`projectsAccessToken`).
 */
import type { ExecutorCandidate } from '../../../shared/kinds.js';
import type { ApiKeyActor, Me, Member } from '../../../shared/members.js';
import type { Viewer } from '../../access/viewer.js';
import { isUniqueViolation } from '../../kernel/db.js';
import type { IdSource } from '../../kernel/ids.js';
import type { TxRunner } from '../../kernel/tx.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import type { UserDirectory } from '../../kernel/users.js';
import { insertMember, isMember } from './member.store.js';
import type { DatabaseConnection } from '@nocobase/db';

/** Where roles live: the application (`ProjectsAccess`). */
export interface RoleAssignments {
  /** Gives a new member the default role, once; runs in the caller's transaction. */
  admit(conn: DatabaseConnection, userId: string): Promise<void>;
  /** After commit: tells sessions and caches that the user's roles changed. */
  changed(userId: string): Promise<void>;
}

export interface MemberService {
  /** Makes the user a member on their first request. */
  ensure(userId: string): Promise<void>;
  /** Makes the user a member on the caller's connection, as accepting an invitation does. */
  admit(conn: DatabaseConnection, userId: string): Promise<void>;
  /** Everyone who may be named as an owner, lead or member: every active person (no API key identities). */
  list(viewer: Viewer): Promise<Member[]>;
  me(viewer: Viewer): Promise<Me>;
  /**
   * Every API key identity (service account), deleted ones included, by name: for naming the actor of what one did.
   */
  apiKeyActors(): Promise<ApiKeyActor[]>;
  /** The executors of other kinds (agents, say) the viewer may give work to. */
  executors(viewer: Viewer): Promise<ExecutorCandidate[]>;
}

export function createMemberService(deps: {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly users: UserDirectory;
  readonly roles: RoleAssignments;
  readonly kinds: KindRegistry;
}): MemberService {
  // Members are never removed, so a user seen once needs no further lookup in this process.
  const known = new Set<string>();

  async function admit(
    conn: DatabaseConnection,
    userId: string,
  ): Promise<void> {
    if (await isMember(conn, userId)) return;
    // An API key identity (a service account) is never a member: admitting it would give it the default role, so its first
    // request would widen what its keys reach. Its roles are given explicitly.
    if (!(await deps.users.people(conn, [userId])).has(userId)) return;
    await insertMember(conn, deps.ids.next(), userId);
    await deps.roles.admit(conn, userId);
  }

  return {
    async ensure(userId) {
      if (known.has(userId)) return;
      const conn = deps.tx.read();
      if (!(await deps.users.people(conn, [userId])).has(userId)) {
        known.add(userId);
        return;
      }
      if (!(await isMember(conn, userId))) {
        try {
          await deps.tx.run((tx) => admit(tx.conn, userId));
          await deps.roles.changed(userId);
        } catch (error) {
          // A concurrent first request made them a member already.
          if (!isUniqueViolation(error)) throw error;
        }
      }
      known.add(userId);
    },

    admit,

    async list() {
      const users = await deps.users.listActive(deps.tx.read());
      return users.map((user) => ({
        userId: user.id,
        name: user.name,
        email: user.email,
      }));
    },

    async me(viewer) {
      const names = await deps.users.names(deps.tx.read(), [viewer.userId]);
      return {
        userId: viewer.userId,
        name: names.get(viewer.userId) ?? viewer.userId,
        permissions: viewer.permissions,
        kinds: deps.kinds.info(),
      };
    },

    apiKeyActors() {
      return deps.users.apiKeyActors(deps.tx.read());
    },

    executors(viewer) {
      return deps.kinds.executorCandidates(deps.tx.read(), viewer.userId);
    },
  };
}

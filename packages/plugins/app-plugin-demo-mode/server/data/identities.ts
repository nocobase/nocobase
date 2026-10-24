import { randomBytes, scrypt } from 'node:crypto';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type { DemoDataDependencies } from './service.js';
import type {
  DemoAccountSpec,
  DemoPermissionSetSpec,
  DemoTrackedRecord,
} from '../../shared/data.js';
import { demoDataError } from '../errors.js';

/** Bookkeeping the plugin tracks besides an application's rows; each is undone through its owning plugin. */
export const USER = '@user';
export const PERMISSION_SET = '@permissionSet';
export const ASSIGNMENT = '@permissionSetAssignment';

/** What a reset carries from the import it clears into the one it runs, by `carriedKey`. */
export interface Carried {
  /** The accounts, Permission Sets and assignments the cleared import tracked. */
  readonly records: ReadonlySet<string>;
  /** Those the new import created again; the rest are released once it finishes. */
  readonly touched: Set<string>;
}

export const carriedKey = (collection: string, recordId: string): string =>
  `${collection}\u0000${recordId}`;

export class DemoIdentities {
  public constructor(
    private readonly deps: Pick<
      DemoDataDependencies,
      'database' | 'users' | 'authorization'
    >,
    private readonly datasetId: () => string,
    private readonly assertLease: (
      id: string,
      operationId: string,
    ) => Promise<void>,
  ) {}
  /** Releases identities except declared accounts and their permissions; returns the tracking that must stay. */
  public async release(
    datasetId: string,
    operationId: string,
    records: readonly DemoTrackedRecord[],
    preserveAccounts: readonly string[] = [],
    touched?: ReadonlySet<string>,
  ): Promise<readonly DemoTrackedRecord[]> {
    const kept = new Set<string>();
    const sets = this.deps.authorization?.()?.permissionSets;
    if (preserveAccounts.length) {
      const accounts = await this.deps.database
        .query()
        .selectFrom('demoModeAccounts')
        .innerJoin('user', 'user.id', 'demoModeAccounts.userId')
        .select(['demoModeAccounts.userId'])
        .where('demoModeAccounts.datasetId', '=', datasetId)
        .where('user.username', 'in', preserveAccounts)
        .execute<{ userId: string }>();
      const users = new Set(accounts.map(({ userId }) => String(userId)));
      for (const id of users) kept.add(carriedKey(USER, id));
      const releasing = new Set(
        records
          .filter((r) => r.collection === ASSIGNMENT)
          .map((r) => r.recordId),
      );
      for (const assignment of (await sets?.listAssignments()) ?? []) {
        if (
          assignment.subject.type !== 'user' ||
          !users.has(String(assignment.subject.id))
        )
          continue;
        // A regenerated account loses obsolete tracked grants; an omitted retained account keeps its access.
        if (
          touched?.has(carriedKey(USER, String(assignment.subject.id))) &&
          releasing.has(String(assignment.id))
        )
          continue;
        kept.add(carriedKey(ASSIGNMENT, String(assignment.id)));
        kept.add(carriedKey(PERMISSION_SET, assignment.permissionSet));
      }
    }
    const of = (collection: string) =>
      records
        .filter(
          (record) =>
            record.collection === collection &&
            !kept.has(carriedKey(collection, record.recordId)),
        )
        .map((record) => record.recordId);
    for (const id of of(ASSIGNMENT)) {
      await this.assertLease(datasetId, operationId);
      await sets?.revoke(id).catch(() => undefined);
    }
    const users = this.deps.users?.();
    for (const id of of(USER)) {
      await this.assertLease(datasetId, operationId);
      await sets
        ?.replaceSubjectAssignments({
          subject: { type: 'user', id },
          managedPermissionSets: (await sets.list()).map((set) => set.key),
          permissionSets: [],
        })
        .catch(() => undefined);
      if (!users) continue;
      await users.revokeSessions(id).catch(() => undefined);
      // Keep identities reusable: the Users plugin reserves deleted usernames and email addresses.
      await users.disable(id);
    }
    for (const key of of(PERMISSION_SET)) {
      await this.assertLease(datasetId, operationId);
      await sets?.delete(key).catch(() => undefined);
    }
    return records.filter((record) =>
      kept.has(carriedKey(record.collection, record.recordId)),
    );
  }

  public async createAccount(
    spec: DemoAccountSpec,
    track: (
      collection: string,
      ids: string | readonly string[],
      keyField?: string,
    ) => Promise<void>,
    carried?: Carried,
  ): Promise<string> {
    const users = this.deps.users?.();
    if (!users)
      throw demoDataError(
        'DEMO_DATA_ACCOUNTS_UNAVAILABLE',
        'Demo accounts need the users plugin.',
      );
    const password = spec.password ?? `${spec.username}123`;
    const existing = await this.deps.database
      .query()
      .selectFrom('user')
      .select(['id', 'email'])
      .where('username', '=', spec.username)
      .executeTakeFirst<{ id: unknown; email: unknown }>();
    let id: string;
    if (existing) {
      const ownership = await this.deps.database
        .query()
        .selectFrom('demoModeAccounts')
        .select(['userId', 'passwordHash'])
        .where('userId', '=', String(existing.id))
        .where('datasetId', '=', this.datasetId())
        .executeTakeFirst<{ userId: string; passwordHash: string }>();
      // A matching username and email do not prove ownership of an existing account.
      if (
        !ownership ||
        String(existing.email).toLowerCase() !== spec.email.toLowerCase()
      )
        throw demoDataError(
          'DEMO_DATA_ACCOUNT_CONFLICT',
          `The username ${spec.username} belongs to another account.`,
          'ALREADY_EXISTS',
        );
      id = String(existing.id);
      await users.update(id, { name: spec.name });
      const passwordHash = await hashPassword(password, ownership.passwordHash);
      // Setting a password signs the account out; an account a reset carries keeps its sessions while it stays the same.
      if (
        !carried?.records.has(carriedKey(USER, id)) ||
        ownership.passwordHash !== passwordHash
      )
        await users.resetPassword(id, password);
      await this.deps.database
        .query()
        .updateTable('demoModeAccounts')
        .set({ passwordHash })
        .where('userId', '=', id)
        .execute();
      await users.enable(id);
      // Clearing dropped the account's assignments; its role scopes come back as a new account would get them.
      for (const [scope, value] of Object.entries(spec.roleScopes ?? {}))
        await users.replaceRoleScope(id, scope, value);
    } else {
      id = String(
        (
          await users.create({
            name: spec.name,
            username: spec.username,
            email: spec.email,
            password,
            ...(spec.roleScopes ? { roleScopes: spec.roleScopes } : {}),
          })
        ).id,
      );
      await this.deps.database
        .query()
        .insertInto('demoModeAccounts')
        .values({
          userId: id,
          datasetId: this.datasetId(),
          passwordHash: await hashPassword(password),
        })
        .execute();
    }
    await track(USER, id);
    for (const permissionSet of spec.permissionSets ?? [])
      await track(ASSIGNMENT, await this.assign(id, permissionSet, carried));
    return id;
  }

  public async createPermissionSet(
    spec: DemoPermissionSetSpec,
    track: (
      collection: string,
      ids: string | readonly string[],
      keyField?: string,
    ) => Promise<void>,
    carried?: Carried,
  ): Promise<void> {
    const sets = this.permissionSets();
    const grants = spec.grants;
    if (await sets.get(spec.key)) {
      if (!carried?.records.has(carriedKey(PERMISSION_SET, spec.key)))
        throw demoDataError(
          'DEMO_DATA_PERMISSION_SET_EXISTS',
          `A Permission Set ${spec.key} exists already.`,
          'ALREADY_EXISTS',
        );
      // Updated in place, so the accounts a reset carries keep what they may do throughout.
      await sets.update(spec.key, { key: spec.key, title: spec.title, grants });
      await track(PERMISSION_SET, spec.key);
      return;
    }
    await sets.create({ key: spec.key, title: spec.title, grants });
    await track(PERMISSION_SET, spec.key);
  }

  public async assign(
    userId: string,
    permissionSet: string,
    carried?: Carried,
  ): Promise<string> {
    const sets = this.permissionSets();
    if (carried) {
      const kept = (await sets.listAssignments(permissionSet)).find(
        (assignment) =>
          assignment.subject.type === 'user' &&
          String(assignment.subject.id) === userId &&
          carried.records.has(carriedKey(ASSIGNMENT, String(assignment.id))),
      );
      if (kept) return String(kept.id);
    }
    const assignment = await sets.assign({
      subject: { type: 'user', id: userId },
      permissionSet,
    });
    return String(assignment.id);
  }

  private permissionSets(): AppAuthorization['permissionSets'] {
    const sets = this.deps.authorization?.()?.permissionSets;
    if (!sets)
      throw demoDataError(
        'DEMO_DATA_PERMISSIONS_UNAVAILABLE',
        'Demo roles need the authorization plugin.',
      );
    return sets;
  }
}

/** A salted snapshot of the last password applied through Users, never a second authentication source. */
async function hashPassword(
  password: string,
  previous?: string,
): Promise<string> {
  const salt = previous?.split(':')[0] || randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 32, (error, key) => {
      if (error) reject(error);
      else resolve(`${salt}:${key.toString('hex')}`);
    });
  });
}

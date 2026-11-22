/**
 * System keys: API keys that act as an identity of their own rather than as a member. Each one is a service account
 * this plugin creates for it, a hidden Permission Set that account holds (`system-key-<account id>`), and one API key
 * of that account whose own permissions are the same as the set's, so the two intersect. A system key outlives any
 * member; an owner only receives its reminders.
 *
 * Only accounts listed in `apiKeySystemKeys` are system keys: an application's other service accounts, such as the
 * organization keys an application built itself, are never listed or changed here. Managed keys are system keys another
 * feature creates and adjusts for a person (`createManaged`, `setPermissionsManaged`, `rotateManaged`); their manager is
 * told when an administrator disables or deletes one.
 */
import { createHash, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication/server';
import type { AuthorizationIdentity } from '@nocobase/authorization/core';
import type { DatabaseConnection } from '@nocobase/db';

import {
  decodeKeyPermissions,
  encodeKeyPermissions,
  type ApiKeyView,
  type CreatedApiKey,
  type KeyPermissions,
} from '../shared/scopes.js';
import { ApiKeyRequestError, type ScopedApiKeys } from './scoped-keys.js';
import { ApiKeyScopeError } from './scopes.js';

/** The owner of every system key's hidden Permission Set; Studio's organization keys use another. */
export const SYSTEM_KEY_OWNER = '@nocobase/app-plugin-api-keys';
/** The key of a system key's hidden Permission Set. */
export const SYSTEM_KEY_SET_PREFIX = 'system-key-';
export const systemKeySet = (identityId: string): string =>
  `${SYSTEM_KEY_SET_PREFIX}${identityId}`;

/** Who manages a managed system key, shown as "Managed · <title>". */
export interface SystemKeyManagedBy {
  readonly kind: string;
  readonly id: string;
  readonly title: string;
}

/** What a manager of system keys is told: an administrator disabled or deleted one of its keys. */
export interface SystemKeyManager {
  onRevoked(input: {
    /** The stored notice: the same on every attempt to deliver it, so a manager can tell a repeat. */
    readonly noticeId: string;
    readonly identityId: string;
    readonly managedBy: SystemKeyManagedBy;
    readonly actorId: string | null;
    readonly how: 'disabled' | 'deleted';
  }): void | Promise<void>;
}

/** A system key as its list and detail show it: never its secret. */
export interface SystemKeyView extends ApiKeyView {
  /** The service account the key acts as. */
  readonly identityId: string;
  readonly owner: { readonly id: string; readonly name: string } | null;
  readonly managedBy: SystemKeyManagedBy | null;
  readonly createdById: string | null;
  readonly permissions: KeyPermissions;
}

export type SystemKeyAction =
  | 'create'
  | 'update'
  | 'permissions'
  | 'rotate'
  | 'disable'
  | 'enable'
  | 'delete'
  | 'adopt';

/** One entry of a system key's activity. */
export interface SystemKeyEvent {
  readonly id: string;
  readonly action: SystemKeyAction;
  /** Who did it; null for the system itself, such as an automatic rotation or idle disabling. */
  readonly actor: { readonly id: string; readonly name: string } | null;
  readonly details: Readonly<Record<string, unknown>> | null;
  readonly createdAt: string;
}

/** What `create` takes. */
export interface CreateSystemKeyInput {
  readonly name: string;
  readonly description?: string | null;
  readonly ownerId?: string | null;
  readonly expiresInDays: number | null;
  readonly permissions: unknown;
}

/**
 * What `adopt` takes: an existing service account, the key of it to adopt, the grants the account held and its history.
 * The key keeps its own scope, so what it may do stays the intersection of both, record limits included.
 */
export interface AdoptSystemKeyInput {
  readonly identityId: string;
  /** The key to adopt; it must belong to the service account. */
  readonly keyId: string;
  /**
   * The grants to give the hidden set; each must be one the account holds now, exactly, record scopes included
   * (`ADOPT_NOT_HELD` otherwise). Left out, it takes every grant the account holds.
   */
  readonly permissions?: KeyPermissions;
  readonly ownerId?: string | null;
  readonly managedBy?: SystemKeyManagedBy | null;
  readonly createdById?: string | null;
  readonly events?: readonly {
    readonly action: SystemKeyAction;
    readonly actorId: string | null;
    readonly details?: Readonly<Record<string, unknown>> | null;
    readonly createdAt: Date | string;
  }[];
}

interface SystemRow {
  readonly identityId: string;
  readonly keyId: string;
  readonly ownerId: string | null;
  readonly managedBy: unknown;
  readonly createdById: string | null;
}

export interface SystemApiKeysOptions {
  readonly connection: () => DatabaseConnection;
  readonly keys: ScopedApiKeys;
  readonly users: () => UserAdministrationService;
  readonly authorization: () => AppAuthorization | undefined;
}

const json = (value: unknown): unknown => {
  let parsed = value;
  while (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      return null;
    }
  }
  return parsed;
};

function isDisabled(user: object): boolean {
  const disabledAt: unknown = Reflect.get(user, 'disabledAt');
  const status: unknown = Reflect.get(user, 'status');
  return (
    (disabledAt !== null && disabledAt !== undefined) || status === 'disabled'
  );
}

function managedByOf(value: unknown): SystemKeyManagedBy | null {
  const parsed = json(value);
  if (!parsed || typeof parsed !== 'object') return null;
  const { kind, id, title } = parsed as Record<string, unknown>;
  return typeof kind === 'string' &&
    typeof id === 'string' &&
    typeof title === 'string'
    ? { kind, id, title }
    : null;
}

/**
 * Whether a data scope value is one a system key may hold: every record, chosen records, or none. A system key has no
 * person behind it, so a scope counted from "me" (mine, my team's) would select nothing meaningful.
 */
function systemScope(value: unknown): boolean {
  if (value === '' || value === null || value === undefined) return true;
  if (value === 'allRecords') return true;
  if (typeof value !== 'object') return false;
  const { type, key, params } = value as Record<string, unknown>;
  return (
    type === 'all' ||
    type === 'records' ||
    (type === 'recordAccess' && key === 'allRecords' && params === undefined)
  );
}

/** Refuses permissions a system key may not hold: a scope counted from a person, or a level relative to one. */
export function assertSystemPermissions(permissions: KeyPermissions): void {
  for (const grant of permissions.grants)
    for (const entry of grant.actions) {
      const label = `${grant.resource.type}:${grant.resource.id}.${entry.action}`;
      if (entry.action.endsWith('.related'))
        throw new ApiKeyScopeError(
          'SYSTEM_KEY_SCOPE',
          `${label}: a system key has no person to be related to; give it the action on all records, limited to the ones it needs.`,
        );
      const scopes: unknown = entry.policy?.scopes;
      if (scopes && typeof scopes === 'object')
        for (const [scope, value] of Object.entries(scopes))
          if (!systemScope(value))
            throw new ApiKeyScopeError(
              'SYSTEM_KEY_SCOPE',
              `${label}: the records of ${scope} must be all of them or chosen ones; a system key has no person for "mine".`,
            );
    }
}

/** The grants of the sets an account holds, each action entry once, leaving out its own hidden set. */
function heldGrants(
  sets: readonly {
    readonly key: string;
    readonly grants: readonly KeyPermissions['grants'][number][];
  }[],
  own: string,
): KeyPermissions['grants'][number][] {
  const byResource = new Map<string, KeyPermissions['grants'][number]>();
  const seen = new Set<string>();
  for (const set of sets) {
    if (set.key === own) continue;
    for (const grant of set.grants) {
      const key = JSON.stringify([grant.resource.type, grant.resource.id]);
      const current = byResource.get(key) ?? {
        resource: { type: grant.resource.type, id: grant.resource.id },
        actions: [],
      };
      const actions = [...current.actions];
      for (const entry of grant.actions) {
        const id = JSON.stringify([key, entry.action, entry.policy ?? null]);
        if (seen.has(id)) continue;
        seen.add(id);
        actions.push(entry);
      }
      byResource.set(key, { ...current, actions });
    }
  }
  return [...byResource.values()].filter((grant) => grant.actions.length);
}

/**
 * A value with object keys sorted and record ids in order, so the same grants compare equal however they were written:
 * `{ type: 'records', ids }` lists the same records in any order.
 */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  const entries = Object.keys(value)
    .sort()
    .map((key): [string, unknown] => [key, canonical(Reflect.get(value, key))]);
  const result = Object.fromEntries(entries) as Record<string, unknown>;
  if (result.type === 'records' && Array.isArray(result.ids))
    result.ids = [...(result.ids as unknown[])].map(String).sort();
  return result;
}

/**
 * A digest of what an import asked for, or that it took what the account held: every grant as one resource, action
 * and policy, listed once and in order, and the records each business is limited to, so the same request compares
 * equal however its grants were split, ordered or repeated.
 */
export function importRequest(permissions: KeyPermissions | undefined): string {
  if (!permissions) return 'held';
  const entries = new Set<string>();
  for (const grant of permissions.grants)
    for (const entry of grant.actions)
      entries.add(
        JSON.stringify([
          grant.resource.type,
          grant.resource.id,
          entry.action,
          canonical(entry.policy ?? null),
        ]),
      );
  const objects = Object.fromEntries(
    Object.entries(permissions.objects ?? {})
      .map(([business, ids]): [string, string[]] => [
        business,
        [...new Set(ids)].sort(),
      ])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  return JSON.stringify({ grants: [...entries].sort(), objects });
}

/** `permissions` when the account holds every action of it exactly, record scopes included. */
function onlyHeld(
  permissions: KeyPermissions,
  held: readonly KeyPermissions['grants'][number][],
): KeyPermissions {
  const holds = (
    resource: { type: string; id: string },
    entry: KeyPermissions['grants'][number]['actions'][number],
  ): boolean =>
    held.some(
      (grant) =>
        grant.resource.type === resource.type &&
        grant.resource.id === resource.id &&
        grant.actions.some(
          (item) =>
            item.action === entry.action &&
            isDeepStrictEqual(
              canonical(item.policy ?? null),
              canonical(entry.policy ?? null),
            ),
        ),
    );
  for (const grant of permissions.grants)
    for (const entry of grant.actions)
      if (!holds(grant.resource, entry))
        throw new ApiKeyRequestError(
          400,
          'ADOPT_NOT_HELD',
          `The account does not hold ${grant.resource.type}:${grant.resource.id}.${entry.action} as given, so the key cannot get it.`,
        );
  return { grants: permissions.grants.map((grant) => ({ ...grant })) };
}

/**
 * Renames a Permission Set in its tables, its assignments along: an assignment's id names its set, so it is renamed
 * too. Refuses a name already taken.
 */
/** A Permission Set's key and an assignment's id are at most this long. */
const MAX_KEY_LENGTH = 255;
/** Room an assignment's id needs besides its set's key: `<subject type>:<subject id>:`, each at most 64. */
const ASSIGNMENT_ID_ROOM = 130;

/**
 * The key a released set gets: `role-<old key>`, or for a long one its start and a digest of the whole, short enough
 * that the set's key and its assignments' ids fit their columns.
 */
export function releasedKey(key: string): string {
  const limit = MAX_KEY_LENGTH - ASSIGNMENT_ID_ROOM;
  const plain = `role-${key}`;
  if (plain.length <= limit) return plain;
  const digest = createHash('sha256').update(key).digest('hex').slice(0, 12);
  return `${plain.slice(0, limit - digest.length - 1)}-${digest}`;
}

export async function renameSet(
  connection: DatabaseConnection,
  key: string,
  newKey: string,
): Promise<void> {
  if (!newKey || newKey.length > MAX_KEY_LENGTH)
    throw new ApiKeyRequestError(
      400,
      'NOT_RESERVED',
      `A Permission Set's key is 1 to ${MAX_KEY_LENGTH} characters.`,
    );
  const taken = await connection.query
    .selectFrom('authorizationPermissionSets')
    .select(['key'])
    .where('key', '=', newKey)
    .executeTakeFirst();
  if (taken)
    throw new ApiKeyRequestError(
      400,
      'NOT_RESERVED',
      `A Permission Set named ${newKey} exists already.`,
    );
  await connection.query
    .updateTable('authorizationPermissionSets')
    .set({ key: newKey, updatedAt: new Date() })
    .where('key', '=', key)
    .execute();
  const assignments = await connection.query
    .selectFrom('authorizationPermissionSetAssignments')
    .select(['id', 'subjectType', 'subjectId'])
    .where('permissionSetKey', '=', key)
    .execute();
  const idOf = (assignment: (typeof assignments)[number]) =>
    `${String(assignment.subjectType)}:${String(assignment.subjectId)}:${newKey}`;
  // Checked before anything is written: an assignment's id names its set, and has to fit its column too.
  const tooLong = assignments.find(
    (assignment) => idOf(assignment).length > MAX_KEY_LENGTH,
  );
  if (tooLong)
    throw new ApiKeyRequestError(
      400,
      'NOT_RESERVED',
      `${newKey} is too long for the id of an assignment of ${key}; choose a shorter key.`,
    );
  for (const assignment of assignments)
    await connection.query
      .updateTable('authorizationPermissionSetAssignments')
      .set({
        id: idOf(assignment),
        permissionSetKey: newKey,
      })
      .where('id', '=', assignment.id as string)
      .execute();
}

export class SystemApiKeys {
  private readonly managersByKind = new Map<string, SystemKeyManager>();
  private releaseProtection: (() => void)[] = [];

  /** The managers of managed keys, by `managedBy.kind`; `add` returns what removes one. */
  readonly managers: {
    add(kind: string, manager: SystemKeyManager): () => void;
  } = {
    add: (kind, manager) => {
      if (this.managersByKind.has(kind))
        throw new Error(`A manager of ${kind} system keys is already added.`);
      this.managersByKind.set(kind, manager);
      return () => {
        if (this.managersByKind.get(kind) === manager)
          this.managersByKind.delete(kind);
      };
    },
  };

  constructor(private readonly options: SystemApiKeysOptions) {}

  private get db(): DatabaseConnection {
    return this.options.connection();
  }

  private requireAuthorization(): AppAuthorization {
    const authz = this.options.authorization();
    if (!authz)
      throw new ApiKeyRequestError(
        400,
        'SYSTEM_KEYS_UNAVAILABLE',
        'System keys need the authorization plugin.',
      );
    return authz;
  }

  /**
   * Protects every system key's hidden Permission Set, present or created later by any process: hidden from the
   * management lists, never edited or assigned there, and assignable to a user only. Call at boot in every process.
   * `except` are sets under the prefix that are no system key's (`collisions`), which stay as they were; a set another
   * owner protects by name, such as a root set an application configured under the prefix, stays theirs.
   */
  protectAll(except: readonly string[] = []): void {
    const authz = this.options.authorization();
    if (!authz || this.releaseProtection.length) return;
    this.releaseProtection.push(
      authz.permissionSets.protect({
        owner: SYSTEM_KEY_OWNER,
        keys: [],
        prefixes: [SYSTEM_KEY_SET_PREFIX],
        ...(except.length ? { except } : {}),
        allow: [],
        assignableTo: ['user'],
        hidden: true,
      }),
    );
  }

  /**
   * Permission Sets in the reserved `system-key-` prefix that are no system key's, such as a role an administrator named
   * so before: the prefix protection hides them and keeps them from being edited, so the application should rename
   * them. Read at boot.
   */
  async collisions(): Promise<string[]> {
    const authz = this.options.authorization();
    if (!authz) return [];
    const listed = new Set(
      (
        await this.db.query
          .selectFrom('apiKeySystemKeys')
          .select(['identityId'])
          .execute()
      ).map((row) => systemKeySet(String(row.identityId))),
    );
    return (await authz.permissionSets.list())
      .map((set) => set.key)
      .filter(
        (key) => key.startsWith(SYSTEM_KEY_SET_PREFIX) && !listed.has(key),
      );
  }

  /** Lifts every protection this service added, as at shutdown. */
  release(): void {
    for (const release of this.releaseProtection.splice(0)) release();
  }

  private async row(identityId: string): Promise<SystemRow> {
    const row = await this.db.query
      .selectFrom('apiKeySystemKeys')
      .selectAll()
      .where('identityId', '=', identityId)
      .executeTakeFirst<SystemRow>();
    if (!row)
      throw new ApiKeyRequestError(
        404,
        'SYSTEM_KEY_NOT_FOUND',
        'System key not found.',
      );
    return row;
  }

  /** An owner receives a key's reminders, so it is a person who can act: never a service account or a disabled user. */
  private async requirePerson(userId: string): Promise<void> {
    const user = await this.options.users().get(userId);
    if (!user || user.kind === 'service' || isDisabled(user))
      throw new ApiKeyRequestError(
        400,
        'INVALID_OWNER',
        'The owner must be an active member, not a service account.',
      );
  }

  /** A managed key is only viewed, disabled or deleted outside its manager. */
  private requireUnmanaged(
    row: SystemRow,
    options: { readonly managed?: boolean },
    what: string,
  ): void {
    if (managedByOf(row.managedBy) && !options.managed)
      throw new ApiKeyRequestError(
        400,
        'SYSTEM_KEY_MANAGED',
        `This key is managed: it ${what}.`,
      );
  }

  private async person(
    userId: string | null,
  ): Promise<{ id: string; name: string } | null> {
    if (!userId) return null;
    const user = await this.options.users().get(userId);
    return user ? { id: user.id, name: user.name } : { id: userId, name: '' };
  }

  private async view(row: SystemRow): Promise<SystemKeyView> {
    const key = await this.options.keys.get(row.identityId, row.keyId);
    const stored = decodeKeyPermissions(
      (
        await this.db.query
          .selectFrom('apikey')
          .select(['permissions'])
          .where('id', '=', row.keyId)
          .executeTakeFirst<{ permissions: unknown }>()
      )?.permissions,
    );
    return {
      ...key,
      identityId: row.identityId,
      owner: await this.person(row.ownerId),
      managedBy: managedByOf(row.managedBy),
      createdById: row.createdById,
      permissions: await this.permissionsOf(row.identityId, stored),
    };
  }

  /** What a system key holds: its own permissions, or for a key adopted with a scope in another format, its set's. */
  private async permissionsOf(
    identityId: string,
    stored: ReturnType<typeof decodeKeyPermissions>,
  ): Promise<KeyPermissions> {
    if (stored?.version === '2') return stored.permissions;
    const set = await this.options
      .authorization()
      ?.permissionSets.get(systemKeySet(identityId));
    return { grants: [...(set?.grants ?? [])] };
  }

  /**
   * System keys newest first, paged: the managed ones or the others when `managed` says, their name matching
   * `search`. Filtered, joined to their keys and counted by the database, so a page reads one page of keys.
   */
  async list(
    input: {
      readonly search?: string;
      readonly managed?: boolean;
      /** Only the system key whose API key this is. */
      readonly keyId?: string;
      readonly page?: number;
      readonly pageSize?: number;
    } = {},
  ): Promise<{ data: SystemKeyView[]; total: number }> {
    const search = input.search?.trim().toLocaleLowerCase();
    const pattern = search ? `%${search.replace(/[%_\\]/gu, '')}%` : undefined;
    const filtered = () => {
      let query = this.db.query
        .selectFrom('apiKeySystemKeys')
        .innerJoin('apikey', 'apikey.id', 'apiKeySystemKeys.keyId');
      if (input.managed !== undefined)
        query = query.where(
          'apiKeySystemKeys.managedBy',
          input.managed ? 'is not' : 'is',
          null,
        );
      if (pattern)
        query = query.where((eb) =>
          eb(eb.fn.lower('apikey.name'), 'like', pattern),
        );
      if (input.keyId) query = query.where('apikey.id', '=', input.keyId);
      return query;
    };
    const pageSize = Math.min(Math.max(input.pageSize ?? 50, 1), 100);
    const page = Math.max(input.page ?? 1, 1);
    const [counted, rows] = await Promise.all([
      filtered()
        .select((eb) => [eb.fn.countAll().as('total')])
        .executeTakeFirst<{ total: unknown }>(),
      filtered()
        .selectAll('apikey')
        .select([
          'apiKeySystemKeys.identityId as systemIdentityId',
          'apiKeySystemKeys.ownerId as systemOwnerId',
          'apiKeySystemKeys.managedBy as systemManagedBy',
          'apiKeySystemKeys.createdById as systemCreatedById',
        ])
        .orderBy('apiKeySystemKeys.createdAt', 'desc')
        .orderBy('apiKeySystemKeys.identityId', 'desc')
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .execute(),
    ]);
    const records = rows as unknown as Record<string, unknown>[];
    const ownerIds = [
      ...new Set(
        records.flatMap((row) =>
          typeof row.systemOwnerId === 'string' ? [row.systemOwnerId] : [],
        ),
      ),
    ];
    const owners = new Map(
      (ownerIds.length
        ? await this.db.query
            .selectFrom('user')
            .select(['id', 'name'])
            .where('id', 'in', ownerIds)
            .execute()
        : []
      ).map((row) => [
        String(row.id),
        typeof row.name === 'string' ? row.name : '',
      ]),
    );
    const views = await Promise.all(
      records.map(async (row) => ({
        row,
        permissions: await this.permissionsOf(
          String(row.systemIdentityId),
          decodeKeyPermissions(row.permissions),
        ),
      })),
    );
    return {
      data: views.map(({ row, permissions }) => {
        const ownerId =
          typeof row.systemOwnerId === 'string' ? row.systemOwnerId : null;
        return {
          ...this.options.keys.viewOfRow(row),
          identityId: String(row.systemIdentityId),
          owner: ownerId
            ? { id: ownerId, name: owners.get(ownerId) ?? '' }
            : null,
          managedBy: managedByOf(row.systemManagedBy),
          createdById:
            typeof row.systemCreatedById === 'string'
              ? row.systemCreatedById
              : null,
          permissions,
        };
      }),
      total: Number(counted?.total ?? 0),
    };
  }

  async get(identityId: string): Promise<SystemKeyView> {
    return this.view(await this.row(identityId));
  }

  /** Whether a user is a system key's service account: one this plugin lists. */
  async isSystemKey(identityId: string): Promise<boolean> {
    return Boolean(
      await this.db.query
        .selectFrom('apiKeySystemKeys')
        .select(['identityId'])
        .where('identityId', '=', identityId)
        .executeTakeFirst(),
    );
  }

  /** What a system key's activity shows, newest first. */
  async events(identityId: string): Promise<SystemKeyEvent[]> {
    await this.row(identityId);
    const rows = await this.db.query
      .selectFrom('apiKeyEvents')
      .selectAll()
      .where('identityId', '=', identityId)
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .execute();
    const people = new Map<string, { id: string; name: string } | null>();
    const actorOf = (row: { actorId?: unknown }) =>
      typeof row.actorId === 'string' && row.actorId ? row.actorId : null;
    for (const row of rows) {
      const actorId = actorOf(row);
      if (actorId && !people.has(actorId))
        people.set(actorId, await this.person(actorId));
    }
    return rows.map((row) => ({
      id: String(row.id),
      action: String(row.action) as SystemKeyAction,
      actor: people.get(actorOf(row) ?? '') ?? null,
      details: (json(row.details) as Record<string, unknown> | null) ?? null,
      createdAt: new Date(row.createdAt as string).toISOString(),
    }));
  }

  private async record(
    identityId: string,
    action: SystemKeyAction,
    actorId: string | null,
    details: Readonly<Record<string, unknown>> | null = null,
    at: Date = new Date(),
    connection: DatabaseConnection = this.db,
    id: string = randomUUID(),
  ): Promise<void> {
    await connection.query
      .insertInto('apiKeyEvents')
      .values({
        id,
        identityId,
        action,
        actorId,
        details: details ? JSON.stringify(details) : null,
        createdAt: at,
      })
      .execute();
  }

  /** Checks permissions `identity` would give a system key: never more than it holds, and no scope counted from "me". */
  private async checkPermissions(
    input: unknown,
    identity: AuthorizationIdentity,
  ): Promise<KeyPermissions> {
    const grants: unknown =
      input && typeof input === 'object'
        ? (input as Record<string, unknown>).grants
        : undefined;
    // A system key may start with nothing: its permissions are given one by one afterwards.
    if (Array.isArray(grants) && grants.length === 0) return { grants: [] };
    const permissions = await this.options.keys.checkPermissions(
      input,
      identity,
    );
    assertSystemPermissions(permissions);
    return permissions;
  }

  /**
   * Creates a system key: its service account, its hidden Permission Set and its key, with permissions `actor` may give.
   * `managedBy` makes it a managed key. Answers its secret, shown once.
   */
  async create(
    actorId: string,
    input: CreateSystemKeyInput,
    managedBy: SystemKeyManagedBy | null = null,
  ): Promise<CreatedApiKey & { key: SystemKeyView }> {
    const authz = this.requireAuthorization();
    const identity = await this.options.keys.identityOf(actorId);
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 100)
      throw new ApiKeyRequestError(
        400,
        'INVALID_NAME',
        'Give the key a name of at most 100 characters.',
      );
    const permissions = await this.checkPermissions(
      input.permissions,
      identity,
    );
    if (input.ownerId) await this.requirePerson(input.ownerId);
    const account = await this.options.users().createServiceAccount({
      name,
      description: input.description ?? null,
    });
    const set = systemKeySet(account.id);
    try {
      await authz.permissionSets.create({
        key: set,
        title: name,
        grants: permissions.grants,
      });
      await authz.permissionSets.assign({
        subject: { type: 'user', id: account.id },
        permissionSet: set,
      });
      const created = await this.options.keys.issueChecked(account.id, {
        name,
        description: input.description ?? null,
        scope: { groups: {} },
        permissions,
        expiresInDays: input.expiresInDays,
      });
      const now = new Date();
      await this.db.query
        .insertInto('apiKeySystemKeys')
        .values({
          identityId: account.id,
          keyId: created.key.id,
          ownerId: input.ownerId ?? null,
          managedBy: managedBy ? JSON.stringify(managedBy) : null,
          createdById: actorId,
          remindedAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      await this.options.keys.applyIdleRule(created.key.id);
      await this.record(account.id, 'create', actorId, {
        expiresInDays: input.expiresInDays,
        permissions,
        ...(managedBy ? { managedBy } : {}),
      });
      return { key: await this.get(account.id), secret: created.secret };
    } catch (error) {
      await this.discard(account.id, actorId);
      throw error;
    }
  }

  /** Removes what a failed creation left behind. */
  private async discard(identityId: string, actorId: string): Promise<void> {
    const authz = this.options.authorization();
    await this.options.keys.revokeAll(identityId).catch(() => undefined);
    await authz?.permissionSets
      .delete(systemKeySet(identityId))
      .catch(() => undefined);
    await this.options
      .users()
      .remove(identityId, actorId)
      .catch(() => undefined);
  }

  /** Renames a system key, changes its description or its owner. */
  async update(
    identityId: string,
    actorId: string,
    input: {
      readonly name?: string;
      readonly description?: string | null;
      readonly ownerId?: string | null;
    },
    options: { readonly managed?: boolean } = {},
  ): Promise<SystemKeyView> {
    const row = await this.row(identityId);
    this.requireUnmanaged(row, options, 'is edited where it is managed');
    const before = await this.view(row);
    if (input.ownerId) await this.requirePerson(input.ownerId);
    await this.options.keys.update(identityId, row.keyId, {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
    });
    if (input.name !== undefined || input.description !== undefined)
      await this.options.users().updateServiceAccount(identityId, {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.description === undefined
          ? {}
          : { description: input.description }),
      });
    if (input.ownerId !== undefined)
      await this.db.query
        .updateTable('apiKeySystemKeys')
        .set({ ownerId: input.ownerId, updatedAt: new Date() })
        .where('identityId', '=', identityId)
        .execute();
    const after = await this.get(identityId);
    await this.record(identityId, 'update', actorId, {
      before: {
        name: before.name,
        description: before.description,
        ownerId: before.owner?.id ?? null,
      },
      after: {
        name: after.name,
        description: after.description,
        ownerId: after.owner?.id ?? null,
      },
    });
    return after;
  }

  /**
   * Writes a system key's permissions to its hidden set and to its key, which then intersect as before, through
   * `connection`, which the caller's transaction is.
   */
  private async writePermissions(
    connection: DatabaseConnection,
    row: SystemRow,
    permissions: KeyPermissions,
    options: { readonly keyScope?: boolean } = {},
  ): Promise<void> {
    const sets =
      this.requireAuthorization().permissionSets.withTransaction(connection);
    const set = systemKeySet(row.identityId);
    const current = await sets.get(set);
    if (current)
      await sets.update(set, {
        key: set,
        ...(current.title === undefined ? {} : { title: current.title }),
        grants: permissions.grants,
      });
    else {
      await sets.create({ key: set, grants: permissions.grants });
      await sets.assign({
        subject: { type: 'user', id: row.identityId },
        permissionSet: set,
      });
    }
    if (options.keyScope !== false)
      await connection.query
        .updateTable('apikey')
        .set({ permissions: encodeKeyPermissions(permissions) })
        .where('id', '=', row.keyId)
        .execute();
  }

  /**
   * Replaces a system key's permissions with ones `actorId` may give, at once, recording what they were and are. One
   * change at a time per key: the set, the key's scope and the activity are written in one transaction, after the key's
   * row is locked, so the recorded before is what the change replaced. A managed key's permissions change only through
   * its manager (`setPermissionsManaged`).
   */
  async setPermissions(
    identityId: string,
    actorId: string,
    input: unknown,
    options: { readonly managed?: boolean } = {},
  ): Promise<SystemKeyView> {
    this.requireUnmanaged(
      await this.row(identityId),
      options,
      'changes its permissions where it is managed',
    );
    const permissions = await this.checkPermissions(
      input,
      await this.options.keys.identityOf(actorId),
    );
    await this.db.transaction(async (connection) => {
      // Locks the key's row: a second change waits here until this one commits.
      await connection.query
        .updateTable('apiKeySystemKeys')
        .set({ updatedAt: new Date() })
        .where('identityId', '=', identityId)
        .execute();
      const row = await connection.query
        .selectFrom('apiKeySystemKeys')
        .selectAll()
        .where('identityId', '=', identityId)
        .executeTakeFirst<SystemRow>();
      if (!row)
        throw new ApiKeyRequestError(
          404,
          'SYSTEM_KEY_NOT_FOUND',
          'System key not found.',
        );
      const stored = decodeKeyPermissions(
        (
          await connection.query
            .selectFrom('apikey')
            .select(['permissions'])
            .where('id', '=', row.keyId)
            .executeTakeFirst<{ permissions: unknown }>()
        )?.permissions,
      );
      // A key adopted with a scope of its own in another format is described by its set, which says what it holds.
      const before =
        stored?.version === '2'
          ? stored.permissions
          : {
              grants: [
                ...((
                  await this.requireAuthorization()
                    .permissionSets.withTransaction(connection)
                    .get(systemKeySet(identityId))
                )?.grants ?? []),
              ],
            };
      await this.writePermissions(connection, row, permissions);
      await this.record(
        identityId,
        'permissions',
        actorId,
        { before, after: permissions },
        new Date(),
        connection,
      );
    });
    return this.get(identityId);
  }

  /** Gives a system key a new value; its identity, name, permissions and history stay. `actorId` null: the system. */
  async rotate(
    identityId: string,
    actorId: string | null,
    options: { readonly managed?: boolean } = {},
  ): Promise<CreatedApiKey & { key: SystemKeyView }> {
    const row = await this.row(identityId);
    this.requireUnmanaged(row, options, 'is rotated where it is managed');
    const rotated = await this.options.keys.rotate(identityId, row.keyId);
    // A new value starts a new idle period: the last one's reminder no longer counts.
    await this.db.query
      .updateTable('apiKeySystemKeys')
      .set({ remindedAt: null, updatedAt: new Date() })
      .where('identityId', '=', identityId)
      .execute();
    await this.record(identityId, 'rotate', actorId, {
      start: rotated.key.start,
    });
    return { key: await this.get(identityId), secret: rotated.secret };
  }

  /**
   * Stores the notice that a managed key's manager is to get, in the transaction that revokes the key, so the two
   * commit together. Answers its id, which `deliverNotices` delivers it by; none for a key nobody manages.
   */
  private async storeNotice(
    connection: DatabaseConnection,
    row: SystemRow,
    actorId: string | null,
    how: 'disabled' | 'deleted',
  ): Promise<string | undefined> {
    const managedBy = managedByOf(row.managedBy);
    if (!managedBy) return undefined;
    const id = randomUUID();
    await connection.query
      .insertInto('apiKeyManagerNotices')
      .values({
        id,
        identityId: row.identityId,
        managedBy: JSON.stringify(managedBy),
        actorId,
        how,
        attempts: 0,
        createdAt: new Date(),
      })
      .execute();
    return id;
  }

  /**
   * Delivers stored notices to managers, oldest first: one by its id, or every one. A notice is removed once its
   * manager took it; one whose manager is not added in this process, or fails, stays for the next attempt (the daily
   * schedule). The manager gets the notice's id, the same on every attempt, to tell a repeat from another revocation.
   * Answers how many were delivered.
   */
  async deliverNotices(noticeId?: string): Promise<number> {
    let query = this.db.query
      .selectFrom('apiKeyManagerNotices')
      .selectAll()
      .orderBy('createdAt', 'asc');
    if (noticeId) query = query.where('id', '=', noticeId);
    const notices = (await query.execute()) as unknown as {
      id: string;
      identityId: string;
      managedBy: unknown;
      actorId: string | null;
      how: string;
      attempts: unknown;
    }[];
    let delivered = 0;
    for (const notice of notices) {
      const managedBy = managedByOf(notice.managedBy);
      const manager = managedBy
        ? this.managersByKind.get(managedBy.kind)
        : undefined;
      if (!managedBy || !manager) continue;
      try {
        await manager.onRevoked({
          noticeId: String(notice.id),
          identityId: String(notice.identityId),
          managedBy,
          actorId: typeof notice.actorId === 'string' ? notice.actorId : null,
          how: notice.how === 'deleted' ? 'deleted' : 'disabled',
        });
        await this.db.query
          .deleteFrom('apiKeyManagerNotices')
          .where('id', '=', notice.id)
          .execute();
        delivered += 1;
      } catch {
        await this.db.query
          .updateTable('apiKeyManagerNotices')
          .set({ attempts: Number(notice.attempts ?? 0) + 1 })
          .where('id', '=', notice.id)
          .execute();
      }
    }
    return delivered;
  }

  /** Delivers a notice just committed, if any; one that fails stays stored for the next attempt. */
  private async deliver(noticeId: string | undefined): Promise<void> {
    if (noticeId) await this.deliverNotices(noticeId);
  }

  private async setEnabled(
    identityId: string,
    actorId: string | null,
    enabled: boolean,
    details: Readonly<Record<string, unknown>> | null = null,
  ): Promise<SystemKeyView> {
    const row = await this.row(identityId);
    // The new state, its activity and the manager's notice commit together.
    const noticeId = await this.db.transaction(async (connection) => {
      await connection.query
        .updateTable('apikey')
        .set({ enabled, updatedAt: new Date() })
        .where('id', '=', row.keyId)
        .execute();
      await this.record(
        identityId,
        enabled ? 'enable' : 'disable',
        actorId,
        details,
        new Date(),
        connection,
      );
      return enabled
        ? undefined
        : this.storeNotice(connection, row, actorId, 'disabled');
    });
    await this.deliver(noticeId);
    return this.get(identityId);
  }

  /** Stops the key at once; its manager, if any, is told. `actorId` null: the system, such as idle disabling. */
  disable(
    identityId: string,
    actorId: string | null,
    details: Readonly<Record<string, unknown>> | null = null,
  ): Promise<SystemKeyView> {
    return this.setEnabled(identityId, actorId, false, details);
  }

  /** Turns a disabled key on again; a managed one only through its manager (`enableManaged`). */
  async enable(
    identityId: string,
    actorId: string,
    options: { readonly managed?: boolean } = {},
  ): Promise<SystemKeyView> {
    this.requireUnmanaged(
      await this.row(identityId),
      options,
      'is enabled where it is managed',
    );
    return this.setEnabled(identityId, actorId, true);
  }

  /**
   * Deletes the key, its hidden set and its service account; the activity stays. Its manager, if any, is told. The
   * keys, the set, the listing, the activity and the notice commit together; the account, which the authentication
   * plugin removes on its own connection, goes after, and a key that is gone already lets that be done again.
   */
  async remove(identityId: string, actorId: string): Promise<void> {
    const registered = await this.db.query
      .selectFrom('apiKeySystemKeys')
      .selectAll()
      .where('identityId', '=', identityId)
      .executeTakeFirst<SystemRow>();
    if (!registered) {
      // Deleted already, the account's removal or the manager's notice failing after: removing again finishes them.
      const unfinished = await this.unfinishedDeletion(identityId);
      if (unfinished) {
        if (!unfinished.accountRemoved) {
          await this.options.users().remove(identityId, actorId);
          await this.markAccountRemoved(unfinished.eventId);
        }
        await this.deliverPending(identityId);
        return;
      }
      throw new ApiKeyRequestError(
        404,
        'SYSTEM_KEY_NOT_FOUND',
        'System key not found.',
      );
    }
    const row = registered;
    const sets = this.requireAuthorization().permissionSets;
    const noticeId = await this.db.transaction(async (connection) => {
      await connection.query
        .deleteFrom('apikey')
        .where('referenceId', '=', identityId)
        .where('configId', '=', 'default')
        .execute();
      const bound = sets.withTransaction(connection);
      if (await bound.get(systemKeySet(identityId)))
        await bound.delete(systemKeySet(identityId));
      await connection.query
        .deleteFrom('apiKeySystemKeys')
        .where('identityId', '=', identityId)
        .execute();
      await this.record(
        identityId,
        'delete',
        actorId,
        null,
        new Date(),
        connection,
      );
      return this.storeNotice(connection, row, actorId, 'deleted');
    });
    const eventId = await this.deleteEventOf(identityId);
    await this.options.users().remove(identityId, actorId);
    if (eventId) await this.markAccountRemoved(eventId);
    await this.deliver(noticeId);
  }

  /** The id of the latest deletion recorded for a key, if any. */
  private async deleteEventOf(identityId: string): Promise<string | undefined> {
    const event = await this.db.query
      .selectFrom('apiKeyEvents')
      .select(['id'])
      .where('identityId', '=', identityId)
      .where('action', '=', 'delete')
      .orderBy('createdAt', 'desc')
      .executeTakeFirst<{ id: string }>();
    return event?.id;
  }

  /**
   * A deletion that committed but did not finish: its service account's removal (which the authentication plugin
   * does in several steps, any of which may fail after the account is marked deleted) not confirmed yet, or a
   * manager's notice still stored. Undefined when there is none, or it finished.
   */
  private async unfinishedDeletion(
    identityId: string,
  ): Promise<{ eventId: string; accountRemoved: boolean } | undefined> {
    const event = await this.db.query
      .selectFrom('apiKeyEvents')
      .select(['id', 'details'])
      .where('identityId', '=', identityId)
      .where('action', '=', 'delete')
      .orderBy('createdAt', 'desc')
      .executeTakeFirst<{ id: string; details: unknown }>();
    if (!event) return undefined;
    const details = json(event.details) as Record<string, unknown> | null;
    const accountRemoved = details?.accountRemoved === true;
    if (!accountRemoved) return { eventId: event.id, accountRemoved };
    const notice = await this.db.query
      .selectFrom('apiKeyManagerNotices')
      .select(['id'])
      .where('identityId', '=', identityId)
      .executeTakeFirst();
    return notice ? { eventId: event.id, accountRemoved } : undefined;
  }

  /** Records on the deletion that its service account is removed, so deleting again answers that nothing is left. */
  private async markAccountRemoved(eventId: string): Promise<void> {
    await this.db.query
      .updateTable('apiKeyEvents')
      .set({ details: JSON.stringify({ accountRemoved: true }) })
      .where('id', '=', eventId)
      .execute();
  }

  /** Delivers the notices still stored for one key. */
  private async deliverPending(identityId: string): Promise<void> {
    const pending = await this.db.query
      .selectFrom('apiKeyManagerNotices')
      .select(['id'])
      .where('identityId', '=', identityId)
      .execute();
    for (const notice of pending) await this.deliverNotices(String(notice.id));
  }

  /**
   * Renames a Permission Set in the prefix reserved for system keys that is no system key's, such as a role an
   * application had named so before, moving its assignments with it. Optional: such a set keeps working under its name
   * (`protectAll`'s `except`); renaming frees the name. Answers the new key: `newKey`, or one made from the old key
   * that fits the set's and its assignments' 255-character keys.
   */
  async releaseReserved(key: string, newKey?: string): Promise<string> {
    if (!key.startsWith(SYSTEM_KEY_SET_PREFIX))
      throw new ApiKeyRequestError(
        400,
        'NOT_RESERVED',
        `${key} is not in the prefix reserved for system keys.`,
      );
    const target = newKey ?? releasedKey(key);
    if (target.startsWith(SYSTEM_KEY_SET_PREFIX))
      throw new ApiKeyRequestError(
        400,
        'NOT_RESERVED',
        'Rename it out of the reserved prefix.',
      );
    await this.db.transaction(async (connection) => {
      const listed = await connection.query
        .selectFrom('apiKeySystemKeys')
        .select(['identityId'])
        .where('identityId', '=', key.slice(SYSTEM_KEY_SET_PREFIX.length))
        .executeTakeFirst();
      if (listed)
        throw new ApiKeyRequestError(
          400,
          'NOT_RESERVED',
          `${key} is a system key's set.`,
        );
      await renameSet(connection, key, target);
    });
    return target;
  }

  // Managed keys: another feature creates and adjusts them for a person, who never needs to manage system keys, and
  // never gives one more than that person holds.

  /** Creates a managed system key for `userId`, with no more than `userId` holds. */
  createManaged(
    userId: string,
    input: CreateSystemKeyInput,
    managedBy: SystemKeyManagedBy,
  ): Promise<CreatedApiKey & { key: SystemKeyView }> {
    return this.create(userId, input, managedBy);
  }

  /** Replaces a managed key's permissions for `userId`, with no more than `userId` holds. */
  setPermissionsManaged(
    identityId: string,
    userId: string,
    permissions: unknown,
  ): Promise<SystemKeyView> {
    return this.setPermissions(identityId, userId, permissions, {
      managed: true,
    });
  }

  /** Renames a managed key, changes its description or owner, for its manager. */
  updateManaged(
    identityId: string,
    userId: string,
    input: Parameters<SystemApiKeys['update']>[2],
  ): Promise<SystemKeyView> {
    return this.update(identityId, userId, input, { managed: true });
  }

  /** Turns a managed key on again, for its manager. */
  enableManaged(identityId: string, userId: string): Promise<SystemKeyView> {
    return this.enable(identityId, userId, { managed: true });
  }

  /** Rotates a managed key; `actorId` null for its manager's own rotation. */
  rotateManaged(
    identityId: string,
    actorId: string | null,
  ): Promise<CreatedApiKey & { key: SystemKeyView }> {
    return this.rotate(identityId, actorId, { managed: true });
  }

  /**
   * Lists an existing service account and its key as a system key, keeping them as they are: for an application moving
   * its own organization keys here, such as Studio's. The account's grants go to a hidden set of this plugin's as given
   * (scopes counted from a person stay as they were: they only narrow); the key keeps its own scope, so what it may do
   * stays the intersection of both, record limits included. Its history is copied. Done in one transaction: a failure
   * leaves nothing behind and calling again starts over; once adopted, calling again answers the key. The application
   * removes its own set and records afterwards.
   */
  async adopt(input: AdoptSystemKeyInput): Promise<SystemKeyView> {
    const authz = this.requireAuthorization();
    const registered = await this.db.query
      .selectFrom('apiKeySystemKeys')
      .select(['keyId', 'importRequest'])
      .where('identityId', '=', input.identityId)
      .executeTakeFirst<{ keyId: string; importRequest: string | null }>();
    if (registered) {
      // Only the same import answers again: the same key, asking for the same grants as the import that was made, as
      // its own row records it — never the activity it brought along, which may hold imports of its own.
      if (
        String(registered.keyId) !== input.keyId ||
        registered.importRequest !== importRequest(input.permissions)
      )
        throw new ApiKeyRequestError(
          400,
          'ALREADY_SYSTEM_KEY',
          'The account is already a system key, imported with another key or other grants.',
        );
      return this.get(input.identityId);
    }
    const user = await this.options.users().get(input.identityId);
    if (!user || user.kind !== 'service')
      throw new ApiKeyRequestError(
        400,
        'NOT_A_SERVICE_ACCOUNT',
        'Only a service account can become a system key.',
      );
    if (input.ownerId) await this.requirePerson(input.ownerId);
    const identity = await this.options.keys.identityOf(input.identityId);
    const now = new Date();
    await this.db.transaction(async (connection) => {
      const key = await connection.query
        .selectFrom('apikey')
        .select(['id'])
        .where('id', '=', input.keyId)
        .where('referenceId', '=', input.identityId)
        .where('configId', '=', 'default')
        .executeTakeFirst<{ id: string }>();
      if (!key)
        throw new ApiKeyRequestError(
          400,
          'NO_KEY',
          'The service account has no such API key to adopt.',
        );
      // The set's name must be free: a role an application already has under it keeps its grants and members.
      if (
        await authz.permissionSets
          .withTransaction(connection)
          .get(systemKeySet(input.identityId))
      )
        throw new ApiKeyRequestError(
          400,
          'SYSTEM_KEY_SET_TAKEN',
          `A Permission Set named ${systemKeySet(input.identityId)} exists already; rename it with releaseReserved, then import again.`,
        );
      // What the account holds now, read in this transaction: the set never gets more.
      const held = heldGrants(
        await authz.permissionSets.withTransaction(connection).getEffective({
          principal: identity.principal,
          ...(identity.subjects ? { subjects: identity.subjects } : {}),
        }),
        systemKeySet(input.identityId),
      );
      const permissions = input.permissions
        ? onlyHeld(input.permissions, held)
        : { grants: held };
      const row: SystemRow = {
        identityId: input.identityId,
        keyId: key.id,
        ownerId: input.ownerId ?? null,
        managedBy: input.managedBy ? JSON.stringify(input.managedBy) : null,
        createdById: input.createdById ?? null,
      };
      // The key's own scope stays: the set holds the account's grants, and the two intersect as before.
      await this.writePermissions(connection, row, permissions, {
        keyScope: false,
      });
      // One transaction: a failure leaves nothing behind, and calling again starts over.
      for (const event of input.events ?? [])
        await this.record(
          input.identityId,
          event.action,
          event.actorId,
          event.details ?? null,
          new Date(event.createdAt),
          connection,
        );
      await this.record(
        input.identityId,
        'adopt',
        null,
        { keyId: key.id, request: importRequest(input.permissions) },
        now,
        connection,
      );
      await connection.query
        .insertInto('apiKeySystemKeys')
        .values({
          ...row,
          remindedAt: null,
          importRequest: importRequest(input.permissions),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    });
    return this.get(input.identityId);
  }
}

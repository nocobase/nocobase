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
import { randomUUID } from 'node:crypto';

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
export const systemKeySet = (identityId: string): string =>
  `system-key-${identityId}`;

/** Who manages a managed system key, shown as "Managed · <title>". */
export interface SystemKeyManagedBy {
  readonly kind: string;
  readonly id: string;
  readonly title: string;
}

/** What a manager of system keys is told: an administrator disabled or deleted one of its keys. */
export interface SystemKeyManager {
  onRevoked(input: {
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

/** What `adopt` takes: an existing service account and its key, with the grants it held and its history. */
export interface AdoptSystemKeyInput {
  readonly identityId: string;
  readonly permissions: KeyPermissions;
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

  /** Protects the hidden Permission Sets of the system keys there are; call at boot. */
  async protectExisting(): Promise<void> {
    const rows = await this.db.query
      .selectFrom('apiKeySystemKeys')
      .select(['identityId'])
      .execute();
    this.protect(rows.map((row) => String(row.identityId)));
  }

  private protect(identityIds: readonly string[]): void {
    const authz = this.options.authorization();
    if (!authz || !identityIds.length) return;
    this.releaseProtection.push(
      authz.permissionSets.protect({
        owner: SYSTEM_KEY_OWNER,
        keys: identityIds.map(systemKeySet),
        allow: [],
        assignableTo: ['user'],
        hidden: true,
      }),
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
      permissions:
        stored?.version === '2' ? stored.permissions : { grants: [] },
    };
  }

  /** Every system key, managed ones included, newest first; `search` matches the name. */
  async list(
    input: { readonly search?: string } = {},
  ): Promise<SystemKeyView[]> {
    const rows = await this.db.query
      .selectFrom('apiKeySystemKeys')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .execute();
    const views = await Promise.all(
      (rows as unknown as SystemRow[]).map((row) => this.view(row)),
    );
    const search = input.search?.trim().toLocaleLowerCase();
    return search
      ? views.filter((view) =>
          (view.name ?? '').toLocaleLowerCase().includes(search),
        )
      : views;
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
  ): Promise<void> {
    await this.db.query
      .insertInto('apiKeyEvents')
      .values({
        id: randomUUID(),
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
    if (input.ownerId && !(await this.options.users().get(input.ownerId)))
      throw new ApiKeyRequestError(
        400,
        'INVALID_OWNER',
        'The owner is not a user.',
      );
    const account = await this.options.users().createServiceAccount({
      name,
      description: input.description ?? null,
    });
    const set = systemKeySet(account.id);
    try {
      this.protect([account.id]);
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
  ): Promise<SystemKeyView> {
    const row = await this.row(identityId);
    const before = await this.view(row);
    if (input.ownerId && !(await this.options.users().get(input.ownerId)))
      throw new ApiKeyRequestError(
        400,
        'INVALID_OWNER',
        'The owner is not a user.',
      );
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

  /** Writes a system key's permissions to its hidden set and to its key, which then intersect as before. */
  private async writePermissions(
    row: SystemRow,
    permissions: KeyPermissions,
  ): Promise<void> {
    const authz = this.requireAuthorization();
    const set = systemKeySet(row.identityId);
    const current = await authz.permissionSets.get(set);
    if (current)
      await authz.permissionSets.update(set, {
        key: set,
        ...(current.title === undefined ? {} : { title: current.title }),
        grants: permissions.grants,
      });
    else {
      await authz.permissionSets.create({
        key: set,
        grants: permissions.grants,
      });
      await authz.permissionSets.assign({
        subject: { type: 'user', id: row.identityId },
        permissionSet: set,
      });
    }
    await this.db.query
      .updateTable('apikey')
      .set({ permissions: encodeKeyPermissions(permissions) })
      .where('id', '=', row.keyId)
      .execute();
  }

  /**
   * Replaces a system key's permissions with ones `actorId` may give, at once, recording what they were and are. A
   * managed key's permissions change only through its manager (`setPermissionsManaged`).
   */
  async setPermissions(
    identityId: string,
    actorId: string,
    input: unknown,
    options: { readonly managed?: boolean } = {},
  ): Promise<SystemKeyView> {
    const row = await this.row(identityId);
    if (managedByOf(row.managedBy) && !options.managed)
      throw new ApiKeyRequestError(
        400,
        'SYSTEM_KEY_MANAGED',
        'This key is managed: its permissions change where it is managed.',
      );
    const before = (await this.view(row)).permissions;
    const permissions = await this.checkPermissions(
      input,
      await this.options.keys.identityOf(actorId),
    );
    await this.writePermissions(row, permissions);
    await this.record(identityId, 'permissions', actorId, {
      before,
      after: permissions,
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
    if (managedByOf(row.managedBy) && !options.managed)
      throw new ApiKeyRequestError(
        400,
        'SYSTEM_KEY_MANAGED',
        'This key is managed: it is rotated where it is managed.',
      );
    const rotated = await this.options.keys.rotate(identityId, row.keyId);
    await this.record(identityId, 'rotate', actorId, {
      start: rotated.key.start,
    });
    return { key: await this.get(identityId), secret: rotated.secret };
  }

  private async tell(
    row: SystemRow,
    actorId: string | null,
    how: 'disabled' | 'deleted',
  ): Promise<void> {
    const managedBy = managedByOf(row.managedBy);
    if (!managedBy) return;
    await this.managersByKind
      .get(managedBy.kind)
      ?.onRevoked({ identityId: row.identityId, managedBy, actorId, how });
  }

  private async setEnabled(
    identityId: string,
    actorId: string | null,
    enabled: boolean,
    details: Readonly<Record<string, unknown>> | null = null,
  ): Promise<SystemKeyView> {
    const row = await this.row(identityId);
    await this.db.query
      .updateTable('apikey')
      .set({ enabled, updatedAt: new Date() })
      .where('id', '=', row.keyId)
      .execute();
    await this.record(
      identityId,
      enabled ? 'enable' : 'disable',
      actorId,
      details,
    );
    if (!enabled) await this.tell(row, actorId, 'disabled');
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

  enable(identityId: string, actorId: string): Promise<SystemKeyView> {
    return this.setEnabled(identityId, actorId, true);
  }

  /** Deletes the key, its hidden set and its service account; the activity stays. Its manager, if any, is told. */
  async remove(identityId: string, actorId: string): Promise<void> {
    const row = await this.row(identityId);
    const authz = this.requireAuthorization();
    await this.options.keys.revokeAll(identityId);
    if (await authz.permissionSets.get(systemKeySet(identityId)))
      await authz.permissionSets.delete(systemKeySet(identityId));
    await this.db.query
      .deleteFrom('apiKeySystemKeys')
      .where('identityId', '=', identityId)
      .execute();
    await this.options.users().remove(identityId, actorId);
    await this.record(identityId, 'delete', actorId);
    await this.tell(row, actorId, 'deleted');
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

  /** Rotates a managed key; `actorId` null for its manager's own rotation. */
  rotateManaged(
    identityId: string,
    actorId: string | null,
  ): Promise<CreatedApiKey & { key: SystemKeyView }> {
    return this.rotate(identityId, actorId, { managed: true });
  }

  /**
   * Lists an existing service account and its key as a system key, keeping them as they are: for an application moving
   * its own organization keys here, such as Studio's. Its permissions go to a hidden set of this plugin's, granted as
   * given (scopes counted from a person stay as they were: they only narrow), and its history is copied. The
   * application removes its own set and records afterwards.
   */
  async adopt(input: AdoptSystemKeyInput): Promise<SystemKeyView> {
    this.requireAuthorization();
    const user = await this.options.users().get(input.identityId);
    if (!user || user.kind !== 'service')
      throw new ApiKeyRequestError(
        400,
        'NOT_A_SERVICE_ACCOUNT',
        'Only a service account can become a system key.',
      );
    if (await this.isSystemKey(input.identityId))
      return this.get(input.identityId);
    const key = await this.db.query
      .selectFrom('apikey')
      .select(['id'])
      .where('referenceId', '=', input.identityId)
      .orderBy('createdAt', 'desc')
      .executeTakeFirst<{ id: string }>();
    if (!key)
      throw new ApiKeyRequestError(
        400,
        'NO_KEY',
        'The service account has no API key to adopt.',
      );
    const now = new Date();
    this.protect([input.identityId]);
    await this.db.query
      .insertInto('apiKeySystemKeys')
      .values({
        identityId: input.identityId,
        keyId: key.id,
        ownerId: input.ownerId ?? null,
        managedBy: input.managedBy ? JSON.stringify(input.managedBy) : null,
        createdById: input.createdById ?? null,
        remindedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await this.writePermissions(
      await this.row(input.identityId),
      input.permissions,
    );
    for (const event of input.events ?? [])
      await this.record(
        input.identityId,
        event.action,
        event.actorId,
        event.details ?? null,
        new Date(event.createdAt),
      );
    await this.record(input.identityId, 'adopt', null);
    return this.get(input.identityId);
  }
}

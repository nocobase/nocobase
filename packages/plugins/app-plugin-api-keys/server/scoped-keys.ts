/**
 * Keys with scopes: creating, listing, rotating and revoking a user's keys, and recognizing the key behind a request.
 * The caller authorizes who may manage whose keys; this service only ever acts on the user it is told.
 */
import {
  isServiceAccount,
  type Auth,
  type AuthSession,
} from '@nocobase/app-plugin-authentication/server';
import type {
  Authorization,
  AuthorizationIdentity,
  KeyScope,
} from '@nocobase/authorization/core';
import type { DatabaseConnection } from '@nocobase/db';
import { APIError } from 'better-auth/api';

import {
  decodeKeyPermissions,
  decodeKeyScope,
  encodeKeyPermissions,
  KEY_SCOPE_LEVELS,
  pickedObjects,
  type ApiKeyView,
  type CreatedApiKey,
  type GrantableAction,
  type GrantablePermissions,
  type GrantableResource,
  type KeyPermissionGrant,
  type KeyPermissions,
  type KeyResourceRef,
  type KeyScopeInput,
  type KeyScopeObject,
  type KeyScopeOptions,
  type KeyTemplateView,
  type LocalizedText,
} from '../shared/scopes.js';
import { ownKeyPolicySlotOf, type ApiKeysPlugin } from './api-keys.js';
import { MAX_KEY_NAME } from './constants.js';
import { API_KEY_HEADER, isApiKeySession } from './key-sessions.js';
import { ApiKeyScopeError, type ApiKeyScopes } from './scopes.js';

/** The expiry the editor proposes for a scoped key. */
export const DEFAULT_SCOPED_KEY_DAYS = 90;

/** `apiKeys` in the application's configuration. */
export interface ApiKeysConfig {
  /** The longest a scoped key may live, in days. Unset allows "never expires". */
  readonly maxScopedKeyDays?: number | null;
}

/** A refused key operation: a status and a stable code. */
export class ApiKeyRequestError extends Error {
  constructor(
    readonly status: 400 | 403 | 404,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiKeyRequestError';
  }
}

export interface ScopedApiKeysOptions {
  readonly auth: Pick<Auth, 'pluginApi'>;
  readonly connection: () => DatabaseConnection;
  readonly scopes: ApiKeyScopes;
  /** The application's authorization, to say what a user holds and to build their identity; optional. */
  readonly authorization?: () => Authorization | undefined;
  readonly config?: () => ApiKeysConfig | undefined;
}

interface KeyRow {
  readonly id: string;
  readonly name: string | null;
  readonly start: string | null;
  readonly enabled: unknown;
  readonly referenceId: string;
  readonly configId: string;
  readonly createdAt: unknown;
  readonly expiresAt: unknown;
  readonly lastRequest: unknown;
  readonly permissions: unknown;
  readonly metadata: unknown;
}

/**
 * Whether a user may create (and rotate) keys of their own, as an application decides it. Without one, everyone may.
 * Listing and revoking one's keys stay open, so a person who loses the permission can still clean up.
 */
export type OwnKeyPolicy = (userId: string) => Promise<boolean>;

/** A key's fields as `create` would issue it, checked but not yet issued (`ScopedApiKeys.check`). */
export interface CheckedApiKey {
  readonly name: string;
  readonly description: string | null;
  /**
   * The format-`1` groups the key was asked with; `{ groups: {} }` for one asked with `permissions`; null for a key
   * that is its owner in full.
   *
   * @deprecated Read `permissions`.
   */
  readonly scope: KeyScopeInput | null;
  /**
   * What the key may do; null for its owner in full. Left out by a caller that builds this itself with a format-`1`
   * `scope`, which is then converted.
   */
  readonly permissions?: KeyPermissions | null;
  readonly expiresInDays: number | null;
}

/** What `ScopedApiKeys.upgradeLegacyScopes` did: counts, and the ids of the first keys that failed to convert. */
export interface LegacyUpgradeSummary {
  readonly converted: number;
  /** Keys naming a group not registered now, left in format `1`. */
  readonly kept: number;
  readonly failed: number;
  readonly failedKeyIds: readonly string[];
}

const UPGRADE_BATCH_SIZE = 200;
const MAX_REPORTED_FAILURES = 10;

/** The built-in template: every action that only reads, of what the caller holds. */
export const READ_ONLY_TEMPLATE_ID = 'read-only';

const READ_ONLY_ACTIONS = new Set(['access', 'read', 'view']);

/** What a user holds today, to bound what they may give a key. */
interface Ceiling {
  readonly unrestricted: boolean;
  readonly held: ReadonlyMap<string, ReadonlySet<string>>;
}

/** A value of `permissions` the column holds while a key is being made: an unknown format, which grants nothing. */
const PENDING_PERMISSIONS = { $v: ['pending'] };

const resourceKey = (resource: KeyResourceRef) =>
  JSON.stringify([resource.type, resource.id]);

const DAY_SECONDS = 24 * 60 * 60;
const MAX_DESCRIPTION = 500;

/**
 * Lets the hook on Better Auth's own `/api-key/create` ask `keys` whether a person may create a key of their own, as
 * `/api/apiKeys` does. The plugin's provider calls it at boot; returns what disconnects it.
 */
export async function connectOwnKeyPolicy(
  auth: Pick<Auth, 'administrationContext'>,
  keys: Pick<ScopedApiKeys, 'mayCreateOwn'>,
): Promise<() => void> {
  const context = await auth.administrationContext();
  const slots = (context.options.plugins ?? [])
    .map((plugin) => ownKeyPolicySlotOf(plugin))
    .filter((slot) => slot !== undefined);
  const check = (userId: string) => keys.mayCreateOwn(userId);
  for (const slot of slots) slot.current = check;
  return () => {
    for (const slot of slots) if (slot.current === check) slot.current = null;
  };
}

export class ScopedApiKeys {
  private readonly resolved = new WeakMap<Request, Promise<KeyScope | null>>();
  private ownKeyPolicy: OwnKeyPolicy | null = null;

  constructor(private readonly options: ScopedApiKeysOptions) {}

  /**
   * Sets who may create keys of their own (`/api/apiKeys` and Better Auth's `/api-key/create`). Returns what removes
   * it again.
   */
  setOwnKeyPolicy(policy: OwnKeyPolicy): () => void {
    this.ownKeyPolicy = policy;
    return () => {
      if (this.ownKeyPolicy === policy) this.ownKeyPolicy = null;
    };
  }

  /** Whether `userId` may create keys of their own; true unless the application set a policy that says otherwise. */
  async mayCreateOwn(userId: string): Promise<boolean> {
    return this.ownKeyPolicy ? this.ownKeyPolicy(userId) : true;
  }

  /** Refuses with 403 `API_KEY_CREATION_FORBIDDEN` unless `userId` may create keys of their own. */
  async requireOwnCreation(userId: string): Promise<void> {
    if (!(await this.mayCreateOwn(userId)))
      throw new ApiKeyRequestError(
        403,
        'API_KEY_CREATION_FORBIDDEN',
        'You may not create API keys of your own.',
      );
  }

  private get maxScopedKeyDays(): number | null {
    const value = this.options.config?.()?.maxScopedKeyDays;
    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? value
      : null;
  }

  /** The identity a request of `userId` would carry, as the authorization plugin's middleware builds it. */
  async identityOf(userId: string): Promise<AuthorizationIdentity> {
    const principal = { type: 'user', id: userId };
    const authz = this.options.authorization?.();
    return {
      principal,
      subjects: [
        { type: 'authenticated', id: '*' },
        ...(authz ? await authz.subjects.resolveFor(principal) : []),
      ],
    };
  }

  /** What the editor offers for keys of `userId`, with what that user holds today. */
  async scopeOptions(userId: string): Promise<KeyScopeOptions> {
    const authz = this.options.authorization?.();
    const context = authz ? authz.for(await this.identityOf(userId)) : null;
    const groups = await Promise.all(
      this.options.scopes.groups.list().map(async (group) => {
        const levels = KEY_SCOPE_LEVELS.filter(
          (level) => group.levels[level] !== undefined,
        );
        const held: Partial<Record<(typeof levels)[number], boolean>> = {};
        for (const level of levels) {
          const access = this.options.scopes.accessOf(group, level);
          // A ref is held when any of its actions is (a business action at any of its levels).
          held[level] = context
            ? (
                await Promise.all(
                  access.map(async ({ resource, actions }) =>
                    (
                      await Promise.all(
                        actions.map((action) =>
                          context.can({ resource, action }),
                        ),
                      )
                    ).some(Boolean),
                  ),
                )
              ).every(Boolean)
            : true;
        }
        return {
          id: group.id,
          category: group.category,
          title: group.title,
          description: group.description ?? null,
          levels,
          access: group.levels,
          held,
          objects: group.objects
            ? { business: group.objects.business, title: group.objects.title }
            : null,
        };
      }),
    );
    return {
      groups,
      presets: this.options.scopes.presets.list().map((preset) => ({
        id: preset.id,
        title: preset.title,
        description: preset.description ?? null,
        groups: preset.groups,
        expiresInDays: preset.expiresInDays ?? null,
      })),
      maxScopedKeyDays: this.maxScopedKeyDays,
      defaultExpiresInDays: Math.min(
        DEFAULT_SCOPED_KEY_DAYS,
        this.maxScopedKeyDays ?? DEFAULT_SCOPED_KEY_DAYS,
      ),
    };
  }

  /** The records a group may be limited to, as `identity` may see them. */
  async scopeObjects(
    groupId: string,
    identity: AuthorizationIdentity,
    query: { readonly search?: string; readonly ids?: readonly string[] } = {},
  ): Promise<readonly KeyScopeObject[]> {
    const source = this.options.scopes.groups.objects(groupId);
    if (!source)
      throw new ApiKeyRequestError(
        404,
        'UNKNOWN_SCOPE_GROUP',
        `${groupId} has no records to choose from.`,
      );
    return source.list({ identity, ...query });
  }

  /** `userId`'s keys of the default configuration, newest first. */
  async list(userId: string): Promise<ApiKeyView[]> {
    const rows = await this.options
      .connection()
      .query.selectFrom('apikey')
      .selectAll()
      .where('referenceId', '=', userId)
      .where('configId', '=', 'default')
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'asc')
      .execute();
    return rows.map((row) => this.viewOf(row as unknown as KeyRow));
  }

  /**
   * Creates a key for `userId`. `identity` is whoever chooses the records of a group limited to some: each must be
   * one they may see.
   */
  async create(
    userId: string,
    input: unknown,
    identity: AuthorizationIdentity,
  ): Promise<CreatedApiKey> {
    return this.issue(userId, await this.check(input, identity));
  }

  /**
   * Checks what `create` would issue — name, description, scope, the records it picks (`identity` must see each) and
   * expiry — without issuing anything, so a caller can refuse before creating whatever the key belongs to.
   */
  async check(
    input: unknown,
    identity: AuthorizationIdentity,
  ): Promise<CheckedApiKey> {
    const body = isRecord(input) ? input : {};
    const name = text(body.name, 'name', MAX_KEY_NAME, true, 'INVALID_NAME')!;
    const description = text(
      body.description,
      'description',
      MAX_DESCRIPTION,
      false,
    );
    if (body.permissions !== undefined && body.scope !== undefined)
      throw new ApiKeyScopeError(
        'INVALID_SCOPE',
        'Send either permissions or the deprecated scope, not both.',
      );
    let scope: KeyScopeInput | null = null;
    let permissions: KeyPermissions | null = null;
    if (body.permissions !== undefined && body.permissions !== null) {
      permissions = await this.checkPermissions(body.permissions, identity);
      scope = { groups: {} };
    } else if (body.scope !== undefined && body.scope !== null) {
      scope = this.options.scopes.validate(body.scope);
      await this.checkObjects(scope, identity);
      permissions = this.fromLegacy(scope).permissions;
    }
    const expiresInDays = this.expiryOf(body.expiresInDays, scope !== null);
    return { name, description, scope, permissions, expiresInDays };
  }

  /**
   * Checks format-`2` permissions `identity` would give a key: well formed, each action registered and one a key may
   * hold (`KEY_ACTION_HUMAN_ONLY`), each held by `identity` today (`KEY_SCOPE_EXCEEDS_YOURS`), and each record a
   * business is limited to one `identity` may see. Answers them with each resource listed once.
   */
  async checkPermissions(
    input: unknown,
    identity: AuthorizationIdentity,
  ): Promise<KeyPermissions> {
    const authz = this.options.authorization?.();
    if (!authz)
      throw new ApiKeyScopeError(
        'INVALID_SCOPE',
        'Permissions need the authorization plugin.',
      );
    const shape = permissionsShape(input);
    const ceiling = await this.ceiling(identity);
    const merged = new Map<
      string,
      Map<string, KeyPermissionGrant['actions'][number]>
    >();
    const resources = new Map<string, KeyResourceRef>();
    for (const grant of shape.grants) {
      const key = resourceKey(grant.resource);
      resources.set(key, grant.resource);
      const actions =
        merged.get(key) ??
        new Map<string, KeyPermissionGrant['actions'][number]>();
      for (const entry of grant.actions) {
        const label = `${grant.resource.type}:${grant.resource.id}.${entry.action}`;
        const declared = authz.resourceTypes.action(
          grant.resource,
          entry.action,
        );
        if (!declared)
          throw new ApiKeyScopeError(
            'UNKNOWN_PERMISSION',
            `${label} is not a permission.`,
          );
        if (declared.humanOnly !== undefined)
          throw new ApiKeyScopeError(
            'KEY_ACTION_HUMAN_ONLY',
            `${label} is a person's only: no API key may hold it.`,
          );
        if (entry.policy) {
          const problem =
            grant.resource.type === 'composite'
              ? authz.compositeResources.validateGrant({
                  resource: grant.resource,
                  action: entry.action,
                  policy: entry.policy,
                })
              : `${grant.resource.type} takes no record scope`;
          if (problem !== undefined)
            throw new ApiKeyScopeError(
              'INVALID_SCOPE',
              `${label}: ${problem}.`,
            );
        }
        if (!holds(ceiling, grant.resource, entry.action))
          throw new ApiKeyRequestError(
            403,
            'KEY_SCOPE_EXCEEDS_YOURS',
            `You do not hold ${label}, so you may not give it to a key.`,
          );
        actions.set(entry.action, entry);
      }
      merged.set(key, actions);
    }
    const grants = [...merged].map(([key, actions]) => ({
      resource: resources.get(key)!,
      actions: [...actions.values()],
    }));
    const objects: Record<string, readonly string[]> = {};
    for (const [business, ids] of Object.entries(shape.objects)) {
      const source = this.objectSource(business);
      if (!source)
        throw new ApiKeyScopeError(
          'SCOPE_OBJECTS_NOT_OFFERED',
          `${business} cannot be limited to some records.`,
        );
      const found = new Set(
        (await source.list({ identity, ids })).map((item) => item.id),
      );
      const missing = ids.filter((id) => !found.has(id));
      if (missing.length > 0)
        throw new ApiKeyScopeError(
          'UNKNOWN_SCOPE_OBJECT',
          `${business} has no record ${missing.join(', ')} you may choose.`,
        );
      objects[business] = ids;
    }
    return {
      grants,
      ...(Object.keys(objects).length > 0 ? { objects } : {}),
    };
  }

  /**
   * What `userId` may give a key of their own today: the actions they hold (those no key may hold marked), the
   * templates resolved to them, and the businesses a key may be limited to some records of.
   */
  async grantable(
    userId: string,
    identity?: AuthorizationIdentity,
  ): Promise<GrantablePermissions> {
    const who = identity ?? (await this.identityOf(userId));
    const ceiling = await this.ceiling(who);
    const grants = this.catalog().flatMap((entry): GrantableResource[] => {
      const actions = entry.actions.filter((action) =>
        holds(ceiling, entry.resource, action.action),
      );
      return actions.length > 0 ? [{ ...entry, actions }] : [];
    });
    return {
      unrestricted: ceiling.unrestricted,
      grants,
      templates: this.templates().map((template) =>
        this.resolveTemplate(template, ceiling),
      ),
      objectSources: this.objectSources(),
      maxScopedKeyDays: this.maxScopedKeyDays,
      defaultExpiresInDays: Math.min(
        DEFAULT_SCOPED_KEY_DAYS,
        this.maxScopedKeyDays ?? DEFAULT_SCOPED_KEY_DAYS,
      ),
      mayCreate: await this.mayCreateOwn(userId),
    };
  }

  /**
   * The permissions a template gives a key `identity` makes: each action of it that `identity` holds, at every level
   * they hold it, limited to `objects` for the businesses it picks records of (none when left out). For code that
   * makes keys from a template, such as a CI integration.
   */
  async templatePermissions(
    templateId: string,
    identity: AuthorizationIdentity,
    objects: Readonly<Record<string, readonly string[]>> = {},
  ): Promise<KeyPermissions> {
    const template = this.templates().find((entry) => entry.id === templateId);
    if (!template)
      throw new ApiKeyRequestError(
        404,
        'UNKNOWN_TEMPLATE',
        `${templateId} is not a key template.`,
      );
    const view = this.resolveTemplate(template, await this.ceiling(identity));
    const picked: Record<string, readonly string[]> = {};
    for (const business of view.pick)
      picked[business] = objects[business] ?? [];
    return {
      grants: view.permissions.grants,
      ...(view.pick.length > 0 ? { objects: picked } : {}),
    };
  }

  /**
   * Converts every key still stored in format `1` whose groups are all registered now, exactly as it is enforced
   * today, keeping the groups for the deprecated views. A key naming a group not registered now stays as it is
   * (`kept`) and is tried again on the next start. Reads `batchSize` keys at a time and writes only a row still holding
   * the value it read, so it is safe to run twice. A key that fails to convert stays in format `1`, which still works;
   * the summary names it by id only, never its permissions or secret.
   */
  async upgradeLegacyScopes(
    options: { readonly batchSize?: number } = {},
  ): Promise<LegacyUpgradeSummary> {
    const batchSize = options.batchSize ?? UPGRADE_BATCH_SIZE;
    const summary = {
      converted: 0,
      kept: 0,
      failed: 0,
      failedKeyIds: [] as string[],
    };
    let after: string | null = null;
    for (;;) {
      let query = this.options
        .connection()
        .query.selectFrom('apikey')
        .select(['id', 'permissions'])
        .where('permissions', 'is not', null);
      if (after !== null) query = query.where('id', '>', after);
      const rows = (await query
        .orderBy('id', 'asc')
        .limit(batchSize)
        .execute()) as unknown as Pick<KeyRow, 'id' | 'permissions'>[];
      for (const row of rows) {
        const decoded = decodeKeyPermissions(row.permissions);
        if (decoded?.version !== '1') continue;
        try {
          const { permissions, complete } = this.fromLegacy(decoded.scope);
          if (!complete) {
            summary.kept += 1;
            continue;
          }
          const result = await this.options
            .connection()
            .query.updateTable('apikey')
            .set({
              permissions: encodeKeyPermissions(permissions, decoded.scope),
            })
            .where('id', '=', row.id)
            .where('permissions', '=', row.permissions as string)
            .execute();
          if ((result.updatedCount ?? 0) > 0) summary.converted += 1;
        } catch {
          summary.failed += 1;
          if (summary.failedKeyIds.length < MAX_REPORTED_FAILURES)
            summary.failedKeyIds.push(row.id);
        }
      }
      if (rows.length < batchSize) break;
      after = rows.at(-1)!.id;
    }
    return summary;
  }

  /** Issues a key `check` accepted. */
  issueChecked(userId: string, input: CheckedApiKey): Promise<CreatedApiKey> {
    return this.issue(userId, input);
  }

  /** One of `userId`'s keys. */
  async get(userId: string, keyId: string): Promise<ApiKeyView> {
    return this.viewOf(await this.requireRow(userId, keyId));
  }

  /**
   * Gives a key a new secret in place: the same key — id, name, description, scope and owner — with a new value, and
   * an expiry renewed for the lifetime it had. The old value stops at once.
   */
  async rotate(userId: string, keyId: string): Promise<CreatedApiKey> {
    const row = await this.requireRow(userId, keyId);
    const created = parseDate(row.createdAt);
    const expires = row.expiresAt == null ? null : parseDate(row.expiresAt);
    const lifetime =
      created && expires
        ? Math.max(
            1,
            Math.round((expires.getTime() - created.getTime()) / 86_400_000),
          )
        : null;
    // Better Auth generates and hashes the new value, as for any key (its prefix, length and hashing options apply);
    // the value moves onto the existing row and the row Better Auth made for it goes.
    const fresh = await this.createUpstream({
      body: {
        userId,
        name: row.name ?? 'API key',
        ...(lifetime === null ? {} : { expiresIn: lifetime * DAY_SECONDS }),
      },
    });
    const value = await this.options
      .connection()
      .query.selectFrom('apikey')
      .select(['key', 'start', 'prefix', 'expiresAt', 'createdAt', 'updatedAt'])
      .where('id', '=', fresh.id)
      .executeTakeFirst<{
        key: string;
        start: string | null;
        prefix: string | null;
        expiresAt: unknown;
        createdAt: unknown;
        updatedAt: unknown;
      }>();
    try {
      if (!value) throw new Error('The rotated key was not stored.');
      // Stored as Better Auth stored them for the new value, so its own reads see the same encoding. `createdAt` is
      // when the current value was issued, which the renewed lifetime counts from.
      await this.options
        .connection()
        .query.updateTable('apikey')
        .set({
          key: value.key,
          start: value.start,
          prefix: value.prefix,
          expiresAt: value.expiresAt,
          createdAt: value.createdAt,
          updatedAt: value.updatedAt,
        })
        .where('id', '=', keyId)
        .execute();
    } finally {
      await this.remove(fresh.id);
    }
    return {
      key: this.viewOf(await this.requireRow(userId, keyId)),
      secret: fresh.key,
    };
  }

  /**
   * Replaces a key's scope. `identity` is whoever chooses it: each record a group is limited to must be one they may
   * see. The caller decides who may change a key and whether the new scope is one they may give. A key without a scope
   * cannot be given one this way, nor the reverse.
   */
  async setScope(
    userId: string,
    keyId: string,
    input: unknown,
    identity: AuthorizationIdentity,
  ): Promise<ApiKeyView> {
    const row = await this.requireRow(userId, keyId);
    if (decodeKeyPermissions(row.permissions) === null)
      throw new ApiKeyRequestError(
        400,
        'KEY_NOT_SCOPED',
        'This key has no scope to change.',
      );
    const scope = this.options.scopes.validate(input);
    await this.checkObjects(scope, identity);
    await this.options
      .connection()
      .query.updateTable('apikey')
      .set({
        permissions: encodeKeyPermissions(
          this.fromLegacy(scope).permissions,
          scope,
        ),
      })
      .where('id', '=', keyId)
      .execute();
    return this.viewOf(await this.requireRow(userId, keyId));
  }

  /** Renames a key or changes its description; a field left out stays. */
  async update(
    userId: string,
    keyId: string,
    input: unknown,
  ): Promise<ApiKeyView> {
    const row = await this.requireRow(userId, keyId);
    const body = isRecord(input) ? input : {};
    const name =
      body.name === undefined
        ? row.name
        : text(body.name, 'name', MAX_KEY_NAME, true, 'INVALID_NAME');
    const description =
      body.description === undefined
        ? descriptionOf(row.metadata)
        : text(body.description, 'description', MAX_DESCRIPTION, false);
    await this.options
      .connection()
      .query.updateTable('apikey')
      .set({
        name,
        metadata: description ? JSON.stringify({ description }) : null,
      })
      .where('id', '=', keyId)
      .execute();
    return this.viewOf(await this.requireRow(userId, keyId));
  }

  async revoke(userId: string, keyId: string): Promise<void> {
    await this.requireRow(userId, keyId);
    await this.remove(keyId);
  }

  /** Every key of `userId`, as when the account is deleted. */
  async revokeAll(userId: string): Promise<void> {
    await this.options
      .connection()
      .query.deleteFrom('apikey')
      .where('referenceId', '=', userId)
      .where('configId', '=', 'default')
      .execute();
  }

  /**
   * The scope of the credential behind a request, as the authorization identity carries it: `resolve`'s, or for a
   * person's key without permissions one bounded only by that person — still a credential, so it never takes an action
   * a person's only. Null for a session.
   */
  async credentialScope(
    session: NonNullable<AuthSession>,
    request: Request,
  ): Promise<KeyScope | null> {
    const scope = await this.resolve(session, request);
    if (scope) return scope;
    return isApiKeySession(session, request.headers, [API_KEY_HEADER])
      ? this.options.scopes.unbounded(session.session.id)
      : null;
  }

  /**
   * The scope of the key a request authenticated with: compiled from its stored permissions, unbounded for a service
   * account's key without any, and null for a session or a person's key without any. Read once per request.
   * `auth.required()` refuses a request this answers a scope for unless the route takes scoped keys.
   */
  resolve(
    session: NonNullable<AuthSession>,
    request: Request,
  ): Promise<KeyScope | null> {
    const known = this.resolved.get(request);
    if (known) return known;
    const result = this.lookup(session, request);
    this.resolved.set(request, result);
    return result;
  }

  private async lookup(
    session: NonNullable<AuthSession>,
    request: Request,
  ): Promise<KeyScope | null> {
    // Better Auth's key session carries the key as its token and the key's id as its id; a cookie session never does.
    if (!isApiKeySession(session, request.headers, [API_KEY_HEADER]))
      return null;
    const row = await this.options
      .connection()
      .query.selectFrom('apikey')
      .select(['id', 'permissions'])
      .where('id', '=', session.session.id)
      .executeTakeFirst<Pick<KeyRow, 'id' | 'permissions'>>();
    if (!row) return null;
    const stored = decodeKeyPermissions(row.permissions);
    if (stored?.version === '2')
      return this.options.scopes.compilePermissions(row.id, stored.permissions);
    if (stored) return this.options.scopes.compile(row.id, stored.scope);
    return isServiceAccount(session.user)
      ? this.options.scopes.unbounded(row.id)
      : null;
  }

  private async issue(
    userId: string,
    input: CheckedApiKey,
  ): Promise<CreatedApiKey> {
    const legacy =
      input.scope && Object.keys(input.scope.groups).length > 0
        ? input.scope
        : null;
    const permissions =
      input.permissions ??
      (input.scope ? this.fromLegacy(input.scope).permissions : null);
    const created = await this.createUpstream({
      body: {
        userId,
        name: input.name,
        ...(input.expiresInDays === null
          ? {}
          : { expiresIn: input.expiresInDays * DAY_SECONDS }),
        // Made granting nothing, then given its permissions below: Better Auth's `permissions` holds only its own
        // shape. Its secret is not out until this returns.
        ...(permissions ? { permissions: PENDING_PERMISSIONS } : {}),
      },
    });
    // Written directly rather than through Better Auth, whose `metadata` stays off (`enableMetadata`) so that a key's
    // holder cannot write to it over HTTP.
    try {
      if (permissions || input.description)
        await this.options
          .connection()
          .query.updateTable('apikey')
          .set({
            ...(permissions
              ? { permissions: encodeKeyPermissions(permissions, legacy) }
              : {}),
            ...(input.description
              ? { metadata: JSON.stringify({ description: input.description }) }
              : {}),
          })
          .where('id', '=', created.id)
          .execute();
    } catch (error) {
      await this.remove(created.id);
      throw error;
    }
    const row = await this.requireRow(userId, created.id);
    return { key: this.viewOf(row), secret: created.key };
  }

  private async createUpstream(
    input: Parameters<ApiKeysPlugin['endpoints']['createApiKey']>[0],
  ) {
    const endpoints = this.options.auth.pluginApi<ApiKeysPlugin>('api-key');
    try {
      return await endpoints.createApiKey(input);
    } catch (error) {
      if (!(error instanceof APIError) || error.statusCode !== 400) throw error;
      const code = error.body?.code;
      throw new ApiKeyRequestError(
        400,
        code === 'INVALID_NAME_LENGTH' || code === 'NAME_REQUIRED'
          ? 'INVALID_NAME'
          : 'INVALID_KEY',
        error.message,
      );
    }
  }

  private async remove(keyId: string): Promise<void> {
    const endpoints = this.options.auth.pluginApi<ApiKeysPlugin>('api-key');
    await endpoints.deleteServerApiKey({
      body: { keyId, configId: 'default' },
    });
  }

  private async requireRow(userId: string, keyId: string): Promise<KeyRow> {
    const row = await this.options
      .connection()
      .query.selectFrom('apikey')
      .selectAll()
      .where('id', '=', keyId)
      .where('referenceId', '=', userId)
      .where('configId', '=', 'default')
      .executeTakeFirst<KeyRow>();
    if (!row)
      throw new ApiKeyRequestError(404, 'KEY_NOT_FOUND', 'API key not found.');
    return row;
  }

  /** A format-`1` scope as the format-`2` permissions it is enforced as, without actions a person's only. */
  private fromLegacy(scope: KeyScopeInput): {
    permissions: KeyPermissions;
    complete: boolean;
  } {
    const { permissions, complete } = this.options.scopes.convert(scope);
    const authz = this.options.authorization?.();
    if (!authz) return { permissions, complete };
    const grants = permissions.grants.flatMap((grant) => {
      const actions = grant.actions.filter(
        ({ action }) => authz.humanOnly(grant.resource, action) === undefined,
      );
      return actions.length > 0 ? [{ ...grant, actions }] : [];
    });
    return { permissions: { ...permissions, grants }, complete };
  }

  /** What `identity` holds today, by its own grants: never a credential's scope. */
  private async ceiling(identity: AuthorizationIdentity): Promise<Ceiling> {
    const authz = this.options.authorization?.();
    if (!authz) return { unrestricted: false, held: new Map() };
    const snapshot = await authz
      .for({
        principal: identity.principal,
        ...(identity.subjects ? { subjects: identity.subjects } : {}),
      })
      .snapshot();
    const held = new Map<string, Set<string>>();
    for (const permission of snapshot.permissions)
      held.set(resourceKey(permission.resource), new Set(permission.actions));
    return { unrestricted: snapshot.unrestricted, held };
  }

  /** Every catalog resource and its actions, as the editor lists them. */
  private catalog(): GrantableResource[] {
    const authz = this.options.authorization?.();
    if (!authz) return [];
    return authz.resourceTypes.list().flatMap((type) =>
      (type.items?.list() ?? []).map((item) => ({
        resource: { type: type.type, id: item.id },
        title: item.title,
        actions: item.actions.map((action): GrantableAction => ({
          action: action.name,
          title: action.title ?? null,
          humanOnly: action.humanOnly ?? null,
          risk: action.risk ?? null,
        })),
      })),
    );
  }

  /** The templates on offer: read-only, then the plugins', then the deprecated presets converted. */
  private templates(): TemplateSource[] {
    const authz = this.options.authorization?.();
    const presets = this.options.scopes.presets
      .list()
      .map((preset): TemplateSource => {
        const scope: KeyScopeInput = {
          groups: Object.fromEntries(
            Object.entries(preset.groups).map(([id, grant]) => [
              id,
              {
                level: grant.level,
                ...(grant.objects === 'pick' ? { objects: [] } : {}),
              },
            ]),
          ),
        };
        const { permissions } = this.fromLegacy(scope);
        return {
          id: preset.id,
          title: preset.title,
          description: preset.description ?? null,
          expiresInDays: preset.expiresInDays ?? null,
          grants: permissions.grants.map((grant) => ({
            resource: grant.resource,
            actions: grant.actions.map(({ action }) => action),
            ...(permissions.objects?.[grant.resource.id]
              ? { objects: 'pick' as const }
              : {}),
          })),
          exact: true,
        };
      });
    return [
      {
        id: READ_ONLY_TEMPLATE_ID,
        title: {
          key: 'templates.readOnly',
          ns: '@nocobase/app-plugin-api-keys',
        },
        description: null,
        expiresInDays: null,
        grants: null,
        exact: false,
      },
      ...(authz?.credentials.templates.list() ?? []).map(
        (template): TemplateSource => ({
          id: template.id,
          title: template.title,
          description: template.description ?? null,
          expiresInDays: template.expiresInDays ?? null,
          grants: template.grants,
          exact: false,
        }),
      ),
      ...presets,
    ];
  }

  /** A template as the permissions it gives a key of a user holding `ceiling`. */
  private resolveTemplate(
    template: TemplateSource,
    ceiling: Ceiling,
  ): KeyTemplateView {
    const catalog = this.catalog();
    const pick = new Set<string>();
    const grants: KeyPermissionGrant[] = [];
    if (template.grants === null) {
      // Read-only: of every resource held, the actions that only read.
      for (const entry of catalog) {
        const actions = entry.actions.filter(
          (action) =>
            READ_ONLY_ACTIONS.has(action.action.split('.')[0]) &&
            action.humanOnly === null &&
            holds(ceiling, entry.resource, action.action),
        );
        if (actions.length > 0)
          grants.push({
            resource: entry.resource,
            actions: actions.map(({ action }) => ({ action })),
          });
      }
    } else
      for (const grant of template.grants) {
        const entry = catalog.find(
          (candidate) =>
            resourceKey(candidate.resource) === resourceKey(grant.resource),
        );
        const actions = (entry?.actions ?? []).filter(
          (action) =>
            grant.actions.some((name) =>
              template.exact
                ? action.action === name
                : action.action === name ||
                  action.action.startsWith(`${name}.`),
            ) &&
            action.humanOnly === null &&
            holds(ceiling, grant.resource, action.action),
        );
        if (actions.length === 0) continue;
        grants.push({
          resource: grant.resource,
          actions: actions.map(({ action }) => ({ action })),
        });
        if (grant.objects === 'pick') pick.add(grant.resource.id);
      }
    return {
      id: template.id,
      title: template.title,
      description: template.description,
      expiresInDays: template.expiresInDays,
      permissions: {
        grants,
        ...(pick.size > 0
          ? { objects: Object.fromEntries([...pick].map((id) => [id, []])) }
          : {}),
      },
      pick: [...pick],
    };
  }

  /** The source of records `business` may be limited to: the authorization plugin's, or a deprecated group's. */
  private objectSource(business: string) {
    const source = this.options
      .authorization?.()
      ?.credentials.objectSources.get(business);
    if (source) return source;
    const group = this.options.scopes.groups
      .list()
      .find((entry) => entry.objects?.business === business);
    return group ? this.options.scopes.groups.objects(group.id) : undefined;
  }

  private objectSources(): string[] {
    const authz = this.options.authorization?.();
    const businesses = new Set(authz?.credentials.objectSources.list() ?? []);
    for (const group of this.options.scopes.groups.list())
      if (group.objects && this.options.scopes.groups.objects(group.id))
        businesses.add(group.objects.business);
    return [...businesses].sort();
  }

  private viewOf(row: KeyRow): ApiKeyView {
    const stored = decodeKeyPermissions(row.permissions);
    return {
      ...viewOf(row),
      permissions:
        stored === null
          ? null
          : stored.version === '2'
            ? stored.permissions
            : this.fromLegacy(stored.scope).permissions,
    };
  }

  private async checkObjects(
    scope: KeyScopeInput,
    identity: AuthorizationIdentity,
  ): Promise<void> {
    for (const [groupId, grant] of Object.entries(scope.groups)) {
      const picked = pickedObjects(grant);
      if (!picked) continue;
      const source = this.options.scopes.groups.objects(groupId);
      const found = new Set(
        (source ? await source.list({ identity, ids: picked }) : []).map(
          (item) => item.id,
        ),
      );
      const missing = picked.filter((id) => !found.has(id));
      if (missing.length > 0)
        throw new ApiKeyScopeError(
          'UNKNOWN_SCOPE_OBJECT',
          `${groupId} has no record ${missing.join(', ')} you may choose.`,
        );
    }
  }

  private expiryOf(value: unknown, scoped: boolean): number | null {
    const max = scoped ? this.maxScopedKeyDays : null;
    if (value === null || value === undefined) {
      if (max !== null)
        throw new ApiKeyRequestError(
          400,
          'EXPIRY_REQUIRED',
          `A scoped key expires within ${max} days.`,
        );
      return null;
    }
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 365 ||
      (max !== null && value > max)
    )
      throw new ApiKeyRequestError(
        400,
        'INVALID_EXPIRY',
        `expiresInDays must be a whole number of days from 1 to ${max ?? 365}, or null.`,
      );
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(
  value: unknown,
  name: string,
  max: number,
  required: boolean,
  code = 'INVALID_KEY',
): string | null {
  if (value === undefined || value === null || value === '') {
    if (required)
      throw new ApiKeyRequestError(400, code, `${name} is required.`);
    return null;
  }
  if (typeof value !== 'string' || value.trim().length > max)
    throw new ApiKeyRequestError(
      400,
      code,
      `${name} must be text of at most ${max} characters.`,
    );
  const trimmed = value.trim();
  if (!trimmed && required)
    throw new ApiKeyRequestError(400, code, `${name} is required.`);
  return trimmed || null;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'number' || typeof value === 'bigint')
    return new Date(Number(value));
  if (typeof value === 'string') {
    const numeric = /^-?\d+(?:\.\d+)?$/u.test(value.trim());
    const date = new Date(numeric ? Number(value) : value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function iso(value: unknown): string | null {
  return parseDate(value)?.toISOString() ?? null;
}

function descriptionOf(metadata: unknown): string | null {
  let value: unknown = metadata;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown;
      // Better Auth may store the object stringified twice.
      if (typeof value === 'string') value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  const description = isRecord(value) ? value.description : undefined;
  return typeof description === 'string' && description ? description : null;
}

/** A template as `ScopedApiKeys` offers it: `grants` null for read-only; `exact` for a converted preset's actions. */
interface TemplateSource {
  readonly id: string;
  readonly title: LocalizedText;
  readonly description: LocalizedText | null;
  readonly expiresInDays: number | null;
  readonly grants:
    | readonly {
        readonly resource: KeyResourceRef;
        readonly actions: readonly string[];
        readonly objects?: 'all' | 'pick';
      }[]
    | null;
  readonly exact: boolean;
}

function holds(
  ceiling: Ceiling,
  resource: KeyResourceRef,
  action: string,
): boolean {
  return (
    ceiling.unrestricted ||
    (ceiling.held.get(resourceKey(resource))?.has(action) ?? false)
  );
}

/** The shape of format-`2` permissions, untrusted: throws `INVALID_SCOPE` or `EMPTY_SCOPE`. */
function permissionsShape(input: unknown): {
  grants: KeyPermissionGrant[];
  objects: Record<string, string[]>;
} {
  const invalid = (message: string) =>
    new ApiKeyScopeError('INVALID_SCOPE', message);
  if (!isRecord(input) || !Array.isArray(input.grants))
    throw invalid('Permissions are { grants: [...], objects?: {...} }.');
  const grants = (input.grants as unknown[]).map(
    (grant): KeyPermissionGrant => {
      if (
        !isRecord(grant) ||
        !isRecord(grant.resource) ||
        typeof grant.resource.type !== 'string' ||
        !grant.resource.type ||
        typeof grant.resource.id !== 'string' ||
        !grant.resource.id ||
        !Array.isArray(grant.actions) ||
        grant.actions.length === 0
      )
        throw invalid(
          'Each grant is { resource: { type, id }, actions: [{ action, policy? }] }.',
        );
      return {
        resource: { type: grant.resource.type, id: grant.resource.id },
        actions: (grant.actions as unknown[]).map((entry) => {
          if (
            !isRecord(entry) ||
            typeof entry.action !== 'string' ||
            !entry.action ||
            (entry.policy !== undefined &&
              (!isRecord(entry.policy) ||
                typeof entry.policy.type !== 'string'))
          )
            throw invalid('Each action is { action, policy? }.');
          return {
            action: entry.action,
            ...(entry.policy === undefined
              ? {}
              : { policy: entry.policy as { type: string } }),
          };
        }),
      };
    },
  );
  if (grants.length === 0)
    throw new ApiKeyScopeError(
      'EMPTY_SCOPE',
      'A scoped key needs at least one permission.',
    );
  const objects: Record<string, string[]> = {};
  if (input.objects !== undefined) {
    if (!isRecord(input.objects))
      throw invalid('objects is { <business>: [<id>, …] }.');
    for (const [business, ids] of Object.entries(input.objects)) {
      if (
        !Array.isArray(ids) ||
        ids.some((id) => typeof id !== 'string' || !id.trim())
      )
        throw invalid(`objects.${business} must be a list of ids.`);
      objects[business] = [...new Set(ids as string[])];
    }
  }
  return { grants, objects };
}

function viewOf(row: KeyRow): Omit<ApiKeyView, 'permissions'> {
  return {
    id: row.id,
    name: row.name,
    description: descriptionOf(row.metadata),
    start: row.start,
    enabled:
      typeof row.enabled === 'boolean'
        ? row.enabled
        : Number(row.enabled) === 1,
    createdAt: iso(row.createdAt) ?? new Date(0).toISOString(),
    expiresAt: iso(row.expiresAt),
    lastUsedAt: iso(row.lastRequest),
    scope: decodeKeyScope(row.permissions),
  };
}

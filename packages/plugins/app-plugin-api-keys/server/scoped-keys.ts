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

import {
  decodeKeyScope,
  encodeKeyScope,
  KEY_SCOPE_LEVELS,
  pickedObjects,
  type ApiKeyView,
  type CreatedApiKey,
  type KeyScopeInput,
  type KeyScopeObject,
  type KeyScopeOptions,
} from '../shared/scopes.js';
import { ownKeyPolicySlotOf, type ApiKeysPlugin } from './api-keys.js';
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
  readonly scope: KeyScopeInput | null;
  readonly expiresInDays: number | null;
}

const DAY_SECONDS = 24 * 60 * 60;
const MAX_NAME = 100;
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
    return rows.map((row) => viewOf(row as unknown as KeyRow));
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
    const name = text(body.name, 'name', MAX_NAME, true)!;
    const description = text(
      body.description,
      'description',
      MAX_DESCRIPTION,
      false,
    );
    const scope =
      body.scope === null || body.scope === undefined
        ? null
        : this.options.scopes.validate(body.scope);
    if (scope) await this.checkObjects(scope, identity);
    const expiresInDays = this.expiryOf(body.expiresInDays, scope !== null);
    return { name, description, scope, expiresInDays };
  }

  /** Issues a key `check` accepted. */
  issueChecked(userId: string, input: CheckedApiKey): Promise<CreatedApiKey> {
    return this.issue(userId, input);
  }

  /** One of `userId`'s keys. */
  async get(userId: string, keyId: string): Promise<ApiKeyView> {
    return viewOf(await this.requireRow(userId, keyId));
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
    const endpoints = this.options.auth.pluginApi<ApiKeysPlugin>('api-key');
    const fresh = await endpoints.createApiKey({
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
      key: viewOf(await this.requireRow(userId, keyId)),
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
    if (decodeKeyScope(row.permissions) === null)
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
      .set({ permissions: JSON.stringify(encodeKeyScope(scope)) })
      .where('id', '=', keyId)
      .execute();
    return viewOf(await this.requireRow(userId, keyId));
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
        : text(body.name, 'name', MAX_NAME, true);
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
    return viewOf(await this.requireRow(userId, keyId));
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
   * The scope of the key a request authenticated with: compiled from its stored scope, unbounded for a service
   * account's unscoped key, and null for a session or a person's unscoped key. Read once per request.
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
    const scope = decodeKeyScope(row.permissions);
    if (scope) return this.options.scopes.compile(row.id, scope);
    return isServiceAccount(session.user)
      ? this.options.scopes.unbounded(row.id)
      : null;
  }

  private async issue(
    userId: string,
    input: {
      readonly name: string;
      readonly description: string | null;
      readonly scope: KeyScopeInput | null;
      readonly expiresInDays: number | null;
    },
  ): Promise<CreatedApiKey> {
    const endpoints = this.options.auth.pluginApi<ApiKeysPlugin>('api-key');
    const created = await endpoints.createApiKey({
      body: {
        userId,
        name: input.name,
        ...(input.expiresInDays === null
          ? {}
          : { expiresIn: input.expiresInDays * DAY_SECONDS }),
        ...(input.scope ? { permissions: encodeKeyScope(input.scope) } : {}),
      },
    });
    // Written directly rather than through Better Auth, whose `metadata` stays off (`enableMetadata`) so that a key's
    // holder cannot write to it over HTTP.
    if (input.description)
      await this.options
        .connection()
        .query.updateTable('apikey')
        .set({ metadata: JSON.stringify({ description: input.description }) })
        .where('id', '=', created.id)
        .execute();
    const row = await this.requireRow(userId, created.id);
    return { key: viewOf(row), secret: created.key };
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
): string | null {
  if (value === undefined || value === null || value === '') {
    if (required)
      throw new ApiKeyRequestError(400, 'INVALID_KEY', `${name} is required.`);
    return null;
  }
  if (typeof value !== 'string' || value.trim().length > max)
    throw new ApiKeyRequestError(
      400,
      'INVALID_KEY',
      `${name} must be text of at most ${max} characters.`,
    );
  const trimmed = value.trim();
  if (!trimmed && required)
    throw new ApiKeyRequestError(400, 'INVALID_KEY', `${name} is required.`);
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

function viewOf(row: KeyRow): ApiKeyView {
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

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
import { parseRecordSelection } from '@nocobase/authorization/core';
import type { DatabaseConnection } from '@nocobase/db';
import { isDeepStrictEqual } from 'node:util';

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
  type KeyPermissionPolicy,
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
  /**
   * Whether a person may create a key that is them in full ("same as me": `permissions: null`). Off unless set: such a
   * key can do everything its owner can, account endpoints included. Keys that exist keep working either way.
   */
  readonly allowSameAsMe?: boolean | null;
}

/** The settings item whose `create` lets a person create keys of their own, when no application policy is set. */
export const PERSONAL_API_KEYS_SETTINGS = 'personalApiKeys';
/** The settings item of the system settings' API keys page: `read` opens it, `manage` manages system keys. */
export const API_KEYS_SETTINGS = 'apiKeys';

/** A key as its detail shows it: what it may do, and the part of that its owner no longer holds. */
export interface ApiKeyDetail extends ApiKeyView {
  /**
   * The actions of `permissions` the owner no longer holds, which the key lost with them; they come back when the
   * owner holds them again. Empty for a key that is its owner in full.
   */
  readonly lapsed: readonly KeyPermissionGrant[];
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
  /**
   * For composite actions, by `scopeActionKey`, the record access keys each data scope is held at, from the roles
   * that give the action. Absent for an action held with no record scope known here: every scope is then open.
   */
  readonly scopes: ReadonlyMap<string, ReadonlyMap<string, HeldScope>>;
}

/** One data scope of a composite action as the holder's roles give it, each value as its role stores it or defaults. */
interface HeldScope {
  /**
   * The value of a role that reaches every record, as that role stores it: core's own every-record selection or the
   * built-in `allRecords`; undefined when no role does. A scope no role names and the action declares no default for
   * reaches no record, as core resolves it.
   */
  readonly unbounded: unknown;
  /** The values, as stored or declared, beside their normalized selections; none for a role giving no records. */
  readonly values: readonly {
    readonly raw: unknown;
    readonly selection: unknown;
  }[];
  /** The record access keys the values name, for an editor to offer; `allRecords` when unbounded. */
  readonly keys: ReadonlySet<string>;
}

/** The record access key that reaches every record. */
const ALL_RECORDS = 'allRecords';

const scopeActionKey = (resource: KeyResourceRef, action: string) =>
  JSON.stringify([resource.type, resource.id, action]);

/**
 * A data scope value as core compares it: none (`null`) for an empty value, a record access key as its selection, any
 * other selection as parsed, parameters included; `undefined` for a value that does not parse.
 */
function normalizedSelection(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return null;
  try {
    return parseRecordSelection(
      typeof value === 'string' ? { type: 'recordAccess', key: value } : value,
    );
  } catch {
    return undefined;
  }
}

/**
 * Whether a data scope value is no wider than what is held of it: none, anything under a role that reaches every
 * record, or exactly a selection one of the holder's roles gives, parameters and all.
 */
function withinHeld(value: unknown, held: HeldScope): boolean {
  const selection = normalizedSelection(value);
  if (selection === null) return true;
  if (selection === undefined) return false;
  if (held.unbounded !== undefined) return true;
  return held.values.some((entry) =>
    isDeepStrictEqual(entry.selection, selection),
  );
}

/**
 * The value a key gets for a data scope it leaves out: what the holder holds at the time, pinned so the key never
 * follows the holder's roles wider later. Every record as core's own selection when held; otherwise the first value
 * one of the holder's roles gives, kept as it is stored, parameters included, so it is never wider than they are.
 */
function heldDefault(held: HeldScope): unknown {
  if (held.unbounded !== undefined) return held.unbounded;
  return held.values.find((entry) => entry.selection !== null)?.raw ?? '';
}

/** Whether a selection reaches every record: core's own, or the built-in `allRecords` with no parameters. */
function reachesEveryRecord(selection: unknown): boolean {
  return (
    isRecord(selection) &&
    (selection.type === 'all' ||
      (selection.type === 'recordAccess' &&
        selection.key === ALL_RECORDS &&
        selection.params === undefined))
  );
}

/** The policy a key's composite action gets when it names none: the holder's record scopes at the time. */
function heldPolicy(
  held: ReadonlyMap<string, HeldScope> | undefined,
): KeyPermissionPolicy | undefined {
  if (!held?.size) return undefined;
  return {
    type: 'composite',
    scopes: Object.fromEntries(
      [...held].map(([scope, entry]) => [scope, heldDefault(entry)]),
    ),
  };
}

/** An action a template gives, with the record scopes the holder has of it now when it has any. */
function pinnedAction(
  ceiling: Ceiling,
  resource: KeyResourceRef,
  action: string,
): KeyPermissionGrant['actions'][number] {
  const policy = heldPolicy(
    ceiling.scopes.get(scopeActionKey(resource, action)),
  );
  return policy ? { action, policy } : { action };
}

/** The slice of a Permission Sets API this service reads, when the application has one. */
interface PermissionSetsReader {
  getEffective(input: {
    readonly principal: { readonly type: string; readonly id: string };
    readonly subjects?: readonly {
      readonly type: string;
      readonly id: string;
    }[];
  }): Promise<
    readonly {
      readonly key: string;
      readonly grants: readonly KeyPermissionGrant[];
    }[]
  >;
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
  keys: Pick<ScopedApiKeys, 'mayCreateOwn' | 'requireSameAsMeAllowed'>,
): Promise<() => void> {
  const context = await auth.administrationContext();
  const slots = (context.options.plugins ?? [])
    .map((plugin) => ownKeyPolicySlotOf(plugin))
    .filter((slot) => slot !== undefined);
  const check = (userId: string) => keys.mayCreateOwn(userId);
  const sameAsMe = async (userId: string) => {
    try {
      await keys.requireSameAsMeAllowed(userId);
      return true;
    } catch (error) {
      if (error instanceof ApiKeyRequestError) return false;
      throw error;
    }
  };
  for (const slot of slots) {
    slot.current = check;
    slot.sameAsMe = sameAsMe;
  }
  return () => {
    for (const slot of slots) {
      if (slot.current === check) slot.current = null;
      if (slot.sameAsMe === sameAsMe) slot.sameAsMe = null;
    }
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

  /**
   * Whether `userId` may create keys of their own: the application's policy when it set one; otherwise whether their
   * roles hold `settings:personalApiKeys/create`, when that permission is registered; otherwise true.
   */
  async mayCreateOwn(userId: string): Promise<boolean> {
    if (this.ownKeyPolicy) return this.ownKeyPolicy(userId);
    const authz = this.options.authorization?.();
    const resource = { type: 'settings', id: PERSONAL_API_KEYS_SETTINGS };
    if (!authz?.resourceTypes.action(resource, 'create')) return true;
    return authz
      .for(await this.identityOf(userId))
      .can({ resource, action: 'create' });
  }

  /** Whether a person may create a key that is them in full; see `ApiKeysConfig.allowSameAsMe`. */
  get allowSameAsMe(): boolean {
    return this.options.config?.()?.allowSameAsMe === true;
  }

  /**
   * Refuses with 403 `SAME_AS_ME_DISABLED` a key that would be `userId` in full while such keys are off. A service
   * account's key is bounded by the account's own permissions, so it is not one.
   */
  async requireSameAsMeAllowed(userId: string): Promise<void> {
    if (this.allowSameAsMe) return;
    const user = await this.options
      .connection()
      .query.selectFrom('user')
      .select(['kind'])
      .where('id', '=', userId)
      .executeTakeFirst<{ kind: unknown }>();
    if (isServiceAccount(user)) return;
    throw new ApiKeyRequestError(
      403,
      'SAME_AS_ME_DISABLED',
      'Keys with the same permissions as their owner are turned off: choose what the key may do.',
    );
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
        const held = ceiling.scopes.get(
          scopeActionKey(grant.resource, entry.action),
        );
        const values: unknown = entry.policy?.scopes;
        if (held && isRecord(values))
          for (const [scope, value] of Object.entries(values)) {
            const scoped = held.get(scope);
            if (scoped && !withinHeld(value, scoped))
              throw new ApiKeyRequestError(
                403,
                'KEY_SCOPE_EXCEEDS_YOURS',
                `${label}: the records of ${scope} you give a key cannot reach further than yours.`,
              );
          }
        // A data scope the key leaves out is pinned to what the maker holds now, so the key does not widen when
        // the maker's roles do later.
        const pinned = heldPolicy(held);
        const filled =
          pinned && isRecord(pinned.scopes)
            ? {
                ...entry,
                policy: {
                  ...pinned,
                  ...entry.policy,
                  type: 'composite',
                  scopes: {
                    ...pinned.scopes,
                    ...(isRecord(values) ? values : {}),
                  },
                },
              }
            : entry;
        if (filled !== entry) {
          const problem = authz.compositeResources.validateGrant({
            resource: grant.resource,
            action: entry.action,
            policy: filled.policy,
          });
          if (problem !== undefined)
            throw new ApiKeyScopeError(
              'INVALID_SCOPE',
              `${label}: choose its records (${problem}).`,
            );
        }
        actions.set(entry.action, filled);
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
      const actions = entry.actions
        .filter((action) => holds(ceiling, entry.resource, action.action))
        .map((action): GrantableAction => {
          const scopes = ceiling.scopes.get(
            scopeActionKey(entry.resource, action.action),
          );
          const policy = heldPolicy(scopes);
          return scopes
            ? {
                ...action,
                scopes: Object.fromEntries(
                  [...scopes].map(([scope, held]) => [
                    scope,
                    [...held.keys].sort(),
                  ]),
                ),
                ...(policy ? { policy } : {}),
              }
            : action;
        });
      return actions.length > 0 ? [{ ...entry, actions }] : [];
    });
    // Resources of a type without items, such as pages, which the client lists from its routes: the ones held.
    const listed = new Set(grants.map((grant) => resourceKey(grant.resource)));
    const authz = this.options.authorization?.();
    for (const [key, actions] of ceiling.held) {
      if (listed.has(key) || !authz) continue;
      const [type, id] = JSON.parse(key) as [string, string];
      if (!this.pickableType(type)) continue;
      const resource = { type, id };
      const held = [...actions].flatMap((action): GrantableAction[] => {
        const declared = authz.resourceTypes.action(resource, action);
        return declared
          ? [
              {
                action,
                title: declared.title ?? null,
                humanOnly: declared.humanOnly ?? null,
                risk: declared.risk ?? null,
              },
            ]
          : [];
      });
      if (held.length > 0)
        grants.push({ resource, title: null, actions: held });
    }
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
      allowSameAsMe: this.allowSameAsMe,
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

  /** One of `userId`'s keys with the actions it lost with its owner (`ApiKeyDetail.lapsed`). */
  async detail(userId: string, keyId: string): Promise<ApiKeyDetail> {
    const view = this.viewOf(await this.requireRow(userId, keyId));
    if (!view.permissions) return { ...view, lapsed: [] };
    const ceiling = await this.ceiling(await this.identityOf(userId));
    const lapsed = view.permissions.grants.flatMap((grant) => {
      const actions = grant.actions.filter(
        ({ action }) => !holds(ceiling, grant.resource, action),
      );
      return actions.length > 0 ? [{ resource: grant.resource, actions }] : [];
    });
    return { ...view, lapsed };
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
    if (!permissions) await this.requireSameAsMeAllowed(userId);
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

  /**
   * The records `identity` may limit a key to for `business` (an object source the authorization plugin registers,
   * whose id is its grants' resource id), narrowed by `search` or looked up by `ids`.
   */
  async objects(
    business: string,
    identity: AuthorizationIdentity,
    filter: { readonly search?: string; readonly ids?: readonly string[] } = {},
  ): Promise<readonly KeyScopeObject[]> {
    const source = this.objectSource(business);
    if (!source)
      throw new ApiKeyRequestError(
        404,
        'UNKNOWN_OBJECT_SOURCE',
        `${business} cannot be limited to some records.`,
      );
    return source.list({ identity, ...filter });
  }

  /**
   * Whether a resource type without items is one a person gives a key resource by resource, such as pages or users. A
   * type with record access, such as database collections, is reached through the composite actions that expand into
   * it, never given on its own.
   */
  private pickableType(type: string): boolean {
    const types = this.options.authorization?.()?.resourceTypes;
    return Boolean(types?.has(type) && !types.get(type).recordAccess);
  }

  /** What `identity` holds today, by its own grants: never a credential's scope. */
  private async ceiling(identity: AuthorizationIdentity): Promise<Ceiling> {
    const authz = this.options.authorization?.();
    if (!authz)
      return { unrestricted: false, held: new Map(), scopes: new Map() };
    const snapshot = await authz
      .for({
        principal: identity.principal,
        ...(identity.subjects ? { subjects: identity.subjects } : {}),
      })
      .snapshot();
    const held = new Map<string, Set<string>>();
    for (const permission of snapshot.permissions)
      held.set(resourceKey(permission.resource), new Set(permission.actions));
    return {
      unrestricted: snapshot.unrestricted,
      held,
      scopes: snapshot.unrestricted
        ? new Map()
        : await this.heldScopes(authz, identity),
    };
  }

  /**
   * The record scopes `identity` holds composite actions at, from the Permission Sets assigned to it, when the
   * application's authorization has them. Read only when a key's permissions are offered or checked, never per call.
   */
  private async heldScopes(
    authz: Authorization,
    identity: AuthorizationIdentity,
  ): Promise<Map<string, Map<string, HeldScope>>> {
    const scopes = new Map<string, Map<string, HeldScope>>();
    const sets: unknown = Reflect.get(authz, 'permissionSets');
    if (!isRecord(sets) || typeof sets.getEffective !== 'function')
      return scopes;
    // Only the sets this identity holds, read for it alone.
    const held = await (sets as unknown as PermissionSetsReader).getEffective({
      principal: identity.principal,
      ...(identity.subjects ? { subjects: identity.subjects } : {}),
    });
    for (const set of held)
      for (const grant of set.grants) {
        if (grant.resource.type !== 'composite') continue;
        for (const { action, policy } of grant.actions) {
          const declared = authz.compositeResources.getAction(
            grant.resource.id,
            action,
          );
          if (!declared?.dataScopes?.length) continue;
          const stored: unknown = policy?.scopes;
          const key = scopeActionKey(grant.resource, action);
          const byScope = scopes.get(key) ?? new Map<string, HeldScope>();
          for (const scope of declared.dataScopes) {
            // A scope the role leaves out takes the action's declared default, as core does; none reaches every record.
            // Neither stored nor declared, core selects nothing for it: the branch reads no record.
            const raw: unknown =
              (isRecord(stored) && scope.key in stored
                ? stored[scope.key]
                : scope.defaultValue) ?? '';
            const selection = normalizedSelection(raw);
            const entry: HeldScope = byScope.get(scope.key) ?? {
              unbounded: undefined,
              values: [],
              keys: new Set<string>(),
            };
            const unbounded = reachesEveryRecord(selection);
            const named =
              isRecord(selection) &&
              selection.type === 'recordAccess' &&
              typeof selection.key === 'string'
                ? selection.key
                : undefined;
            byScope.set(scope.key, {
              unbounded: entry.unbounded ?? (unbounded ? raw : undefined),
              values:
                selection === undefined
                  ? entry.values
                  : [...entry.values, { raw, selection }],
              keys: new Set([
                ...entry.keys,
                ...(named ? [named] : []),
                ...(unbounded ? [ALL_RECORDS] : []),
              ]),
            });
          }
          scopes.set(key, byScope);
        }
      }
    return scopes;
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
            actions: actions.map(({ action }) =>
              pinnedAction(ceiling, entry.resource, action),
            ),
          });
      }
      // And of resources of a type without items, such as users, the ones held.
      const listed = new Set(
        catalog.map((entry) => resourceKey(entry.resource)),
      );
      const authz = this.options.authorization?.();
      for (const [key, held] of ceiling.held) {
        if (listed.has(key)) continue;
        const [type, id] = JSON.parse(key) as [string, string];
        if (!this.pickableType(type)) continue;
        const actions = [...held].filter(
          (action) =>
            READ_ONLY_ACTIONS.has(action.split('.')[0]) &&
            authz?.humanOnly({ type, id }, action) === undefined,
        );
        if (actions.length > 0)
          grants.push({
            resource: { type, id },
            actions: actions.sort().map((action) => ({ action })),
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
          actions: actions.map(({ action }) =>
            pinnedAction(ceiling, grant.resource, action),
          ),
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

/**
 * An organization's API keys (Settings › API keys): keys that belong to no person, for CI, scripts and other systems.
 *
 * - **One key, one hidden identity.** Each key acts as a service account of the authentication plugin made for it
 *   alone (`kind: service`), named after the key. The identity is never a member, never in a picker and never in a
 *   role list; what the key does is shown under the key's name with an "API key" tag.
 * - **The key's permissions are chosen on the key**, from the API keys plugin's permission groups (none, read, write,
 *   admin; some limited to records). The identity holds them through a permission set of its own (`api-key-<id>`),
 *   hidden and protected so nothing but this service changes or assigns it. Its grants are the creator's own
 *   permissions narrowed to the chosen groups, so each business action reaches as far as the creator's does (related
 *   or all) and no further. The key carries the same groups as its scope, which the authorization core intersects
 *   with the identity's grants on every request: the key may do exactly what was chosen.
 * - **No escalation.** Whoever creates a key, or changes its permissions, gives only what they hold themselves at that
 *   moment (403 `KEY_SCOPE_EXCEEDS_YOURS`, naming the groups), and limits a group only to records they may see.
 * - **Rotation keeps everything but the secret**: the same identity, key id, name and permissions.
 * - Who: `studio.apiKeys` `read` lists the keys and their history; `manage` does everything else. The routes take a
 *   sign-in, never an API key (`routes.ts`).
 * - Every change is recorded (`studioApiKeyEvents`): created, updated, permissions changed (before and after), rotated,
 *   disabled, enabled, deleted, with who did it (nobody for a rotation Studio made on its own).
 * - **Keys Studio manages** for a repository's CI (`../builds/ci-setup.ts`) are made, narrowed and rotated through the
 *   `…Managed` methods, by someone who manages the project rather than API keys: the no-escalation rule holds all the
 *   same. They are listed with the repository they belong to (`managedBy`), and disabling or deleting one tells Studio
 *   (`onRevoked`), which hands the CI back to the manual setup.
 *
 * The account (kind, no sign-in, disabling stops its keys) is the authentication plugin's; the key and its scope are
 * the API keys plugin's (`ScopedApiKeys`); the grants are the authorization plugin's permission sets.
 */
import type {
  ApiKeyScopes,
  ScopedApiKeys,
} from '@nocobase/app-plugin-api-keys/server';
import type {
  ApiKeyView,
  KeyScopeInput,
  KeyScopeOptions,
} from '@nocobase/app-plugin-api-keys/shared/scopes';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication/server';
import type {
  AuthorizationIdentity,
  KeyScope,
} from '@nocobase/authorization/core';
import type { DatabaseManager } from '@nocobase/db';

import type {
  CreatedOrgApiKey,
  OrgApiKey,
  OrgApiKeyEvent,
  OrgApiKeyManager,
} from '../../shared/access.js';
import { AccessError, forbidden, invalid, notFound } from './errors.js';
import type { Catalog } from './catalog.js';
import { grantsOf, narrowedByScope, type RoleGrants } from './grants.js';
import type { AccessViewer, StudioAccess } from './service.js';

/** The prefix of the permission set that holds a key identity's grants: never a role. */
export const API_KEY_SET_PREFIX = 'api-key-';

/** The permission set of the key whose identity is `userId`. */
export const apiKeySetOf = (userId: string): string =>
  `${API_KEY_SET_PREFIX}${userId}`;

/** Whether a permission set is a key identity's own rather than a role. */
export const isApiKeySet = (key: string): boolean =>
  key.startsWith(API_KEY_SET_PREFIX);

/**
 * Who may create API keys of their own: holders of `studio.personalApiKeys` `create`, which every built-in role has, so
 * an organization turns personal keys off by taking it from its roles (`ScopedApiKeys.setOwnKeyPolicy`).
 */
export function personalKeyPolicy(
  access: () => Pick<StudioAccess, 'grantsOfUser'>,
): (userId: string) => Promise<boolean> {
  return async (userId) =>
    (await access().grantsOfUser(userId)).settings[
      'studio.personalApiKeys/create'
    ];
}

const EVENTS = 'studioApiKeyEvents';
const OWNER = 'studio/api-keys';
const MAX_NAME = 100;
const MAX_DESCRIPTION = 500;

type EventAction = OrgApiKeyEvent['action'];

export interface OrgApiKeyServiceOptions {
  readonly users: () => UserAdministrationService;
  readonly keys: () => ScopedApiKeys;
  readonly scopes: () => ApiKeyScopes;
  readonly authz: () => Pick<AppAuthorization, 'permissionSets'>;
  readonly access: () => Pick<StudioAccess, 'grantsOf' | 'catalog'>;
  readonly database: Pick<DatabaseManager, 'connection'>;
  readonly newId: () => string;
  readonly now?: () => Date;
  /** The repositories the keys among `ids` are managed for (`OrgApiKey.managedBy`). */
  readonly managedBy?: (
    ids: readonly string[],
  ) => Promise<ReadonlyMap<string, OrgApiKeyManager>>;
  /** A key was disabled or deleted: Studio stops counting on it. Its failure does not undo what was done. */
  readonly onRevoked?: (
    id: string,
    actorId: string,
    how: 'disabled' | 'deleted',
  ) => Promise<void>;
}

export interface OrgApiKeyService {
  /** Protects every key identity's permission set, as at boot; returns what lifts the protections. */
  protectAll(): Promise<() => void>;
  list(viewer: AccessViewer): Promise<OrgApiKey[]>;
  get(viewer: AccessViewer, id: string): Promise<OrgApiKey>;
  /** The editor's groups and presets, with what the viewer holds: what they may give. */
  scopeOptions(viewer: AccessViewer): Promise<KeyScopeOptions>;
  create(
    viewer: AccessViewer,
    identity: AuthorizationIdentity,
    input: unknown,
  ): Promise<CreatedOrgApiKey>;
  update(viewer: AccessViewer, id: string, input: unknown): Promise<OrgApiKey>;
  setScope(
    viewer: AccessViewer,
    identity: AuthorizationIdentity,
    id: string,
    input: unknown,
  ): Promise<OrgApiKey>;
  rotate(viewer: AccessViewer, id: string): Promise<CreatedOrgApiKey>;
  disable(viewer: AccessViewer, id: string): Promise<OrgApiKey>;
  enable(viewer: AccessViewer, id: string): Promise<OrgApiKey>;
  remove(viewer: AccessViewer, id: string): Promise<void>;
  events(viewer: AccessViewer, id: string): Promise<OrgApiKeyEvent[]>;
  // --- Keys Studio manages (a repository's CI) ---------------------------------------------------------------------
  /** Creates a key for `viewer` without asking for `studio.apiKeys` `manage`; they give only what they hold. */
  createManaged(
    viewer: AccessViewer,
    identity: AuthorizationIdentity,
    input: unknown,
  ): Promise<CreatedOrgApiKey>;
  /** Changes a key's permissions as `viewer`, without asking for `studio.apiKeys` `manage`. */
  setScopeManaged(
    viewer: AccessViewer,
    identity: AuthorizationIdentity,
    id: string,
    scope: unknown,
  ): Promise<OrgApiKey>;
  /** A new secret for the key, by `actorId` or by Studio itself (null). */
  rotateManaged(id: string, actorId: string | null): Promise<CreatedOrgApiKey>;
  /** The key, or null when there is none; for Studio's own use, no permission asked. */
  find(id: string): Promise<OrgApiKey | null>;
}

interface EventRow {
  readonly id: string;
  readonly identityId: string;
  readonly action: string;
  readonly actorId: string | null;
  readonly details: unknown;
  readonly createdAt: unknown;
}

function requireRead(viewer: AccessViewer): void {
  if (!viewer.permissions.settings['studio.apiKeys/read'])
    throw forbidden('You may not see the organization’s API keys.');
}

function requireManage(viewer: AccessViewer): void {
  if (!viewer.permissions.settings['studio.apiKeys/manage'])
    throw forbidden('Only someone who manages API keys may do this.');
}

function record(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    throw invalid('INVALID_API_KEY', 'The body must be a JSON object.');
  return input as Record<string, unknown>;
}

function nameOf(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.trim().length > MAX_NAME
  )
    throw invalid('INVALID_NAME', `name must be 1 to ${MAX_NAME} characters.`);
  return value.trim();
}

function descriptionOf(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > MAX_DESCRIPTION)
    throw invalid(
      'INVALID_DESCRIPTION',
      `description must be at most ${MAX_DESCRIPTION} characters.`,
    );
  return value.trim() || null;
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string') {
    const numeric = /^-?\d+(?:\.\d+)?$/u.test(value.trim());
    const date = new Date(numeric ? Number(value) : value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date(0).toISOString();
}

function parsed(value: unknown): Record<string, unknown> | null {
  let result = value;
  if (typeof result === 'string')
    try {
      result = JSON.parse(result) as unknown;
    } catch {
      return null;
    }
  return typeof result === 'object' && result !== null && !Array.isArray(result)
    ? (result as Record<string, unknown>)
    : null;
}

/**
 * Whether `holder` holds one compiled permission: a page, a settings capability, or a business action at any level (a
 * scope covering `edit` lists `edit.related` and `edit.all`, and the key gets the holder's own level of it).
 */
function holds(
  holder: RoleGrants,
  resource: { readonly type: string; readonly id: string },
  action: string,
  catalog: Catalog,
): boolean {
  if (resource.type === 'page')
    return (
      action === 'access' &&
      (holder.pages as readonly string[]).includes(resource.id)
    );
  if (resource.type === 'settings')
    return holder.settings[`${resource.id}/${action}`] === true;
  const granted = catalog.grantOf(resource, action);
  const level = granted ? holder.abilities[granted.key] : undefined;
  return level !== undefined && level !== 'none';
}

export function createOrgApiKeyService(
  options: OrgApiKeyServiceOptions,
): OrgApiKeyService {
  const now = options.now ?? (() => new Date());
  const users = () => options.users();
  const keys = () => options.keys();
  const sets = () => options.authz().permissionSets;
  const protections = new Map<string, () => void>();

  function protect(userId: string): void {
    const key = apiKeySetOf(userId);
    if (protections.has(key)) return;
    protections.set(
      key,
      sets().protect({
        owner: OWNER,
        keys: [key],
        allow: [],
        assignableTo: ['user'],
        hidden: true,
      }),
    );
  }

  function unprotect(userId: string): void {
    const key = apiKeySetOf(userId);
    protections.get(key)?.();
    protections.delete(key);
  }

  async function account(id: string) {
    const user = await users().get(id);
    if (!user || user.kind !== 'service') throw notFound('API key');
    return user;
  }

  async function keyOf(id: string): Promise<ApiKeyView | null> {
    return (await keys().list(id))[0] ?? null;
  }

  async function requireKey(id: string): Promise<ApiKeyView> {
    const key = await keyOf(id);
    if (!key) throw notFound('API key');
    return key;
  }

  async function names(ids: readonly string[]): Promise<Map<string, string>> {
    const wanted = [...new Set(ids)];
    if (wanted.length === 0) return new Map();
    const rows = await options.database
      .connection()
      .query.selectFrom('user')
      .select(['id', 'name', 'username', 'email'])
      .where('id', 'in', wanted)
      .execute();
    return new Map(
      rows.map((row) => [
        String(row.id),
        String(row.name || row.username || row.email || row.id),
      ]),
    );
  }

  async function creators(
    ids: readonly string[],
  ): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const rows = await options.database
      .connection()
      .query.selectFrom(EVENTS)
      .select(['identityId', 'actorId'])
      .where('action', '=', 'created')
      .where('identityId', 'in', [...ids])
      .execute();
    return new Map(
      rows
        .filter((row) => row.actorId)
        .map((row) => [String(row.identityId), String(row.actorId)]),
    );
  }

  async function log(
    identityId: string,
    action: EventAction,
    actorId: string | null,
    details: Record<string, unknown> | null = null,
  ): Promise<void> {
    await options.database
      .connection()
      .query.insertInto(EVENTS)
      .values({
        id: options.newId(),
        identityId,
        action,
        actorId,
        details: details === null ? null : JSON.stringify(details),
        createdAt: now(),
      })
      .execute();
  }

  async function managers(
    ids: readonly string[],
  ): Promise<ReadonlyMap<string, OrgApiKeyManager>> {
    return ids.length > 0 && options.managedBy
      ? options.managedBy(ids)
      : new Map();
  }

  function rowOf(
    user: Awaited<ReturnType<typeof account>>,
    key: ApiKeyView | null,
    createdBy: { id: string; name: string } | null,
    managedBy: OrgApiKeyManager | null = null,
  ): OrgApiKey {
    const expired =
      key?.expiresAt != null &&
      new Date(key.expiresAt).getTime() <= now().getTime();
    return {
      id: user.id,
      keyId: key?.id ?? null,
      name: user.name,
      description: user.description,
      scope: key?.scope ?? null,
      start: key?.start ?? null,
      createdBy,
      createdAt: user.createdAt.toISOString(),
      expiresAt: key?.expiresAt ?? null,
      lastUsedAt: key?.lastUsedAt ?? null,
      status:
        user.disabledAt !== null || key === null
          ? 'disabled'
          : expired
            ? 'expired'
            : 'active',
      managedBy,
    };
  }

  async function view(id: string): Promise<OrgApiKey> {
    const user = await account(id);
    const creatorId = (await creators([id])).get(id);
    const creatorName = creatorId
      ? (await names([creatorId])).get(creatorId)
      : undefined;
    return rowOf(
      user,
      await keyOf(id),
      creatorId ? { id: creatorId, name: creatorName ?? creatorId } : null,
      (await managers([id])).get(id) ?? null,
    );
  }

  async function createKey(
    viewer: AccessViewer,
    identity: AuthorizationIdentity,
    input: unknown,
  ): Promise<CreatedOrgApiKey> {
    const checked = await keys().check(input, identity);
    if (!checked.scope)
      throw invalid(
        'SCOPE_REQUIRED',
        'An organization’s API key needs its permissions chosen.',
      );
    const { grants } = await grantsFor(identity, checked.scope);
    const user = await users().createServiceAccount({
      name: checked.name,
      description: checked.description,
    });
    try {
      await writeGrants(user.id, checked.name, grants);
      const created = await keys().issueChecked(user.id, checked);
      await log(user.id, 'created', viewer.userId, {
        scope: checked.scope,
        expiresInDays: checked.expiresInDays,
      });
      return { key: await view(user.id), secret: created.secret };
    } catch (error) {
      // Leave nothing half-made behind: no grants, no key, no identity.
      await dropGrants(user.id).catch(() => undefined);
      await keys()
        .revokeAll(user.id)
        .catch(() => undefined);
      await users()
        .remove(user.id, viewer.userId)
        .catch(() => undefined);
      throw error;
    }
  }

  async function changeScope(
    viewer: AccessViewer,
    identity: AuthorizationIdentity,
    id: string,
    given: unknown,
  ): Promise<OrgApiKey> {
    const user = await account(id);
    const key = await requireKey(id);
    const scope = options.scopes().validate(given);
    const { grants } = await grantsFor(identity, scope);
    // The key's scope first: it checks the records chosen against the person choosing them.
    await keys().setScope(id, key.id, scope, identity);
    await writeGrants(id, user.name, grants);
    await log(id, 'permissions-changed', viewer.userId, {
      before: key.scope,
      after: scope,
    });
    return view(id);
  }

  async function rotateKey(
    id: string,
    actorId: string | null,
  ): Promise<CreatedOrgApiKey> {
    await account(id);
    const key = await requireKey(id);
    const rotated = await keys().rotate(id, key.id);
    await log(id, 'rotated', actorId);
    return { key: await view(id), secret: rotated.secret };
  }

  async function revoked(
    id: string,
    actorId: string,
    how: 'disabled' | 'deleted',
  ): Promise<void> {
    await options.onRevoked?.(id, actorId, how).catch((error: unknown) => {
      console.error('Could not hand a managed key’s CI back.', error);
    });
  }

  /**
   * The groups of `scope` the holder does not hold in full at the level chosen (and, for a group limited to records,
   * over those records only); empty when the holder may give the whole scope.
   */
  function exceeding(holder: RoleGrants, scope: KeyScopeInput): string[] {
    const registry = options.scopes();
    const catalog = options.access().catalog();
    return Object.entries(scope.groups)
      .filter(([groupId, grant]) => {
        const compiled = registry.compile('check', {
          groups: { [groupId]: grant },
        });
        return (compiled.permissions ?? []).some(({ resource, actions }) =>
          actions.some((action) => !holds(holder, resource, action, catalog)),
        );
      })
      .map(([groupId]) => groupId);
  }

  /** The grants the key identity holds: what the giver holds, kept to the scope. */
  async function grantsFor(
    identity: AuthorizationIdentity,
    scope: KeyScopeInput,
  ): Promise<{ grants: ReturnType<typeof grantsOf>; compiled: KeyScope }> {
    const holder = await options.access().grantsOf(identity);
    const over = exceeding(holder, scope);
    if (over.length > 0)
      throw new AccessError(
        'PERMISSION_DENIED',
        'KEY_SCOPE_EXCEEDS_YOURS',
        'A key may hold only permissions you hold yourself.',
        { groups: over },
      );
    const compiled = options.scopes().compile('grants', scope);
    const catalog = options.access().catalog();
    return {
      grants: grantsOf(narrowedByScope(holder, compiled, catalog), catalog),
      compiled,
    };
  }

  async function writeGrants(
    userId: string,
    title: string,
    grants: ReturnType<typeof grantsOf>,
  ): Promise<void> {
    const key = apiKeySetOf(userId);
    const api = sets();
    if (await api.get(key)) await api.update(key, { key, title, grants });
    else await api.create({ key, title, grants });
    protect(userId);
    const assigned = await api.listAssignments(key);
    if (
      !assigned.some(
        ({ subject }) => subject.type === 'user' && subject.id === userId,
      )
    )
      await api.assign({
        id: `user:${userId}:${key}`,
        permissionSet: key,
        subject: { type: 'user', id: userId },
      });
    await api.notifyAssignmentsChanged({ type: 'user', id: userId });
  }

  async function dropGrants(userId: string): Promise<void> {
    const key = apiKeySetOf(userId);
    const api = sets();
    if (await api.get(key)) {
      for (const assignment of await api.listAssignments(key))
        await api.revoke(assignment.id);
      await api.delete(key);
    }
    unprotect(userId);
    await api.notifyAssignmentsChanged({ type: 'user', id: userId });
  }

  return {
    async protectAll() {
      for (const set of await sets().list())
        if (isApiKeySet(set.key))
          protect(set.key.slice(API_KEY_SET_PREFIX.length));
      return () => {
        for (const release of protections.values()) release();
        protections.clear();
      };
    },

    async list(viewer) {
      requireRead(viewer);
      const accounts = [];
      for (let page = 1; ; page += 1) {
        const result = await users().list({
          kind: 'service',
          page,
          pageSize: 100,
        });
        accounts.push(...result.items);
        if (page * result.pageSize >= result.total) break;
      }
      const byIdentity = await creators(accounts.map((user) => user.id));
      const creatorNames = await names([...byIdentity.values()]);
      const managed = await managers(accounts.map((user) => user.id));
      const rows = await Promise.all(
        accounts.map(async (user) => {
          const creatorId = byIdentity.get(user.id);
          return rowOf(
            user,
            await keyOf(user.id),
            creatorId
              ? {
                  id: creatorId,
                  name: creatorNames.get(creatorId) ?? creatorId,
                }
              : null,
            managed.get(user.id) ?? null,
          );
        }),
      );
      return rows.sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) ||
          a.name.localeCompare(b.name),
      );
    },

    async get(viewer, id) {
      requireRead(viewer);
      return view(id);
    },

    async scopeOptions(viewer) {
      requireManage(viewer);
      return keys().scopeOptions(viewer.userId);
    },

    async create(viewer, identity, input) {
      requireManage(viewer);
      return createKey(viewer, identity, input);
    },

    async update(viewer, id, input) {
      requireManage(viewer);
      const body = record(input);
      await account(id);
      const key = await requireKey(id);
      const changes: Record<string, unknown> = {};
      if (body.name !== undefined) changes.name = nameOf(body.name);
      if (body.description !== undefined)
        changes.description = descriptionOf(body.description);
      if (Object.keys(changes).length === 0) return view(id);
      await users().updateServiceAccount(id, changes);
      await keys().update(id, key.id, changes);
      if (typeof changes.name === 'string') {
        const set = await sets().get(apiKeySetOf(id));
        if (set)
          await sets().update(set.key, {
            key: set.key,
            title: changes.name,
            grants: set.grants,
          });
      }
      await log(id, 'updated', viewer.userId, changes);
      return view(id);
    },

    async setScope(viewer, identity, id, input) {
      requireManage(viewer);
      await account(id);
      return changeScope(viewer, identity, id, record(input).scope);
    },

    async rotate(viewer, id) {
      requireManage(viewer);
      return rotateKey(id, viewer.userId);
    },

    async disable(viewer, id) {
      requireManage(viewer);
      await account(id);
      // The key stops at once: authentication re-reads the account on every request.
      await users().disable(id);
      await log(id, 'disabled', viewer.userId);
      await revoked(id, viewer.userId, 'disabled');
      return view(id);
    },

    async enable(viewer, id) {
      requireManage(viewer);
      await account(id);
      await users().enable(id);
      await log(id, 'enabled', viewer.userId);
      return view(id);
    },

    async remove(viewer, id) {
      requireManage(viewer);
      await account(id);
      await log(id, 'deleted', viewer.userId);
      await keys().revokeAll(id);
      await dropGrants(id);
      // The identity's record stays (deleted), so its name stays on what it did.
      await users().remove(id, viewer.userId);
      await revoked(id, viewer.userId, 'deleted');
    },

    async events(viewer, id) {
      requireRead(viewer);
      const user = await users().get(id);
      if (!user || user.kind !== 'service') throw notFound('API key');
      const rows = (await options.database
        .connection()
        .query.selectFrom(EVENTS)
        .selectAll()
        .where('identityId', '=', id)
        .execute()) as unknown as EventRow[];
      const actorNames = await names(
        rows.flatMap((row) => (row.actorId ? [row.actorId] : [])),
      );
      return rows
        .map((row) => ({
          id: row.id,
          action: row.action as EventAction,
          actor: row.actorId
            ? {
                id: row.actorId,
                name: actorNames.get(row.actorId) ?? row.actorId,
              }
            : null,
          details: parsed(row.details),
          createdAt: iso(row.createdAt),
        }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    createManaged: createKey,

    setScopeManaged: changeScope,

    rotateManaged: rotateKey,

    async find(id) {
      const user = await users().get(id);
      if (!user || user.kind !== 'service') return null;
      return view(id);
    },
  };
}

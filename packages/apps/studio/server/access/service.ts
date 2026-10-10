/**
 * Studio's roles on the authorization plugin's permission sets. Every set except the superuser set (`root`) and the
 * set every signed-in user holds (`member`) is a Studio role; Studio has one set of roles for all its plugins.
 *
 * - What a user may do (`permissionsOf`) is read from the sets they hold over the catalog the plugins registered
 *   (`catalog.ts`): each business action at the highest level whose action they hold (`edit.all` over
 *   `edit.related`), each level resolved to the users it reaches for them (`scope-levels.ts`); a holder of the
 *   superuser set may do everything.
 * - Someone who becomes a member gets the default role for new members once (`admit`); it may be taken away later.
 * - Who may: `pm.members` `read` lists, `assign` gives and takes roles, `define-roles` creates, edits and deletes
 *   them; `pm.general` `update` changes the default role. Only an owner grants or revokes `owner`, the last owner
 *   keeps it (409 `LAST_OWNER`), `owner` is not edited and no built-in role is deleted.
 * - A system administrator (a holder of the superuser set) is not listed and not assigned here.
 * - An organization's API key acts as a hidden identity (a `service` user) holding a permission set of its own
 *   (`api-keys.ts`). That set is never a role, and the identity is never a member nor given a role here.
 */
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type { ProjectsAccess } from '@nocobase/app-plugin-projects/server/tokens';
import * as projectAccess from '@nocobase/app-plugin-projects/shared/access';
import type { AuthorizationIdentity } from '@nocobase/authorization/core';
import {
  PermissionSetConflictError,
  PermissionSetLastAssignmentError,
  PermissionSetNotFoundError,
  type PermissionSet,
  type PermissionSetsApi,
} from '@nocobase/authorization/permission-sets';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';

import {
  BUILT_IN_ROLES,
  ROLES,
  type AccessMe,
  type AccessSettings,
  type MemberWithRoles,
  type Permissions,
  type Role,
} from '../../shared/access.js';
import { PAGES, type Page } from '../../shared/pages.js';
import { isApiKeySet } from './api-keys.js';
import { readCatalog, type Catalog } from './catalog.js';
import {
  alreadyExists,
  conflict,
  forbidden,
  invalid,
  notFound,
} from './errors.js';
import {
  everything,
  grantsOf,
  narrowedByScope,
  roleOf,
  type Grant,
  type RoleGrants,
} from './grants.js';
import { checkAbilities, checkSettings } from './input.js';
import {
  BUILT_IN_LEVELS,
  resolveScopes,
  type LevelResolvers,
} from './scope-levels.js';

const SETTINGS_TABLE = 'studioSettings';
const DEFAULT_ROLE = 'defaultRole';
const MAX_TITLE = 100;

export interface StudioAccessOptions {
  readonly authz: AppAuthorization;
  readonly database: Pick<DatabaseManager, 'transaction' | 'connection'>;
  /** The superuser set (`authorization.permissionSets.rootSet`). */
  readonly rootSet: string;
  /** The set every signed-in user holds (`authorization.permissionSets.defaultSet`). */
  readonly defaultSet: string;
  readonly newKey: () => string;
  /** What each scope level reaches for a caller; the built-in levels' by default. */
  readonly levels?: LevelResolvers;
}

/** The caller of an endpoint, with what they may do. */
export interface AccessViewer {
  readonly userId: string;
  readonly permissions: Permissions;
}

export interface RoleService {
  list(viewer: AccessViewer): Promise<Role[]>;
  get(viewer: AccessViewer, key: string): Promise<Role>;
  create(viewer: AccessViewer, input: unknown): Promise<Role>;
  update(viewer: AccessViewer, key: string, input: unknown): Promise<Role>;
  remove(viewer: AccessViewer, key: string): Promise<void>;
  members(viewer: AccessViewer): Promise<MemberWithRoles[]>;
  assign(
    viewer: AccessViewer,
    userId: string,
    input: unknown,
  ): Promise<MemberWithRoles>;
  settings(viewer: AccessViewer): Promise<AccessSettings>;
  /** The caller's own roles, and whether they are a system administrator. */
  me(viewer: AccessViewer): Promise<AccessMe>;
  updateSettings(viewer: AccessViewer, input: unknown): Promise<AccessSettings>;
}

export interface StudioAccess {
  readonly projects: ProjectsAccess;
  readonly roles: RoleService;
  /** What a role can hold, as the plugins registered it with the authorization plugin. */
  catalog(): Catalog;
  permissionsOf(identity: AuthorizationIdentity): Promise<Permissions>;
  /** `permissionsOf` for a user who is not the caller. */
  permissionsOfUser(userId: string): Promise<Permissions>;
  /** What a role gives `userId`, each level resolved to the users it reaches for them. */
  resolve(role: RoleGrants, userId: string): Promise<Permissions>;
  /** Everything a caller's roles give, pages included, each action at its widest level. */
  grantsOf(identity: AuthorizationIdentity): Promise<RoleGrants>;
  /** `grantsOf` for a user who is not the caller (the identity a request of theirs would carry). */
  grantsOfUser(userId: string): Promise<RoleGrants>;
  /** The roles assigned to a user directly, with their titles, and whether they are a system administrator. */
  rolesOfUser(userId: string): Promise<{
    readonly roles: readonly {
      readonly key: string;
      readonly title: Role['title'];
    }[];
    readonly superuser: boolean;
  }>;
  /** The users holding the superuser set. */
  superusers(conn: DatabaseConnection): Promise<ReadonlySet<string>>;
  /** Studio's roles: every set but the superuser and everyone's sets, and the API keys' own sets. */
  isRole(key: string): boolean;
}

interface UserRow {
  readonly id: string;
  readonly name: string | null;
  readonly username: string | null;
  readonly email: string | null;
  readonly disabledAt: string | null;
  readonly deletedAt: string | null;
  /** `person`, or `service` for an API key's identity (authentication's service account). */
  readonly kind: string | null;
}

function requireSetting(
  viewer: AccessViewer,
  key: string,
  message: string,
): void {
  if (!viewer.permissions.settings[key]) throw forbidden(message);
}

/** The projects plugin's part of a caller's permissions, every one of its keys present. */
export function projectPermissionsOf(
  permissions: Permissions,
): projectAccess.Permissions {
  return {
    scopes: Object.fromEntries(
      projectAccess.BUSINESS_KEYS.map(({ key }) => [
        key,
        permissions.scopes[key] ?? 'none',
      ]),
    ) as Record<projectAccess.BusinessKey, projectAccess.Scope>,
    settings: Object.fromEntries(
      projectAccess.SETTINGS_KEYS.map(({ key }) => [
        key,
        permissions.settings[key] === true,
      ]),
    ) as Record<projectAccess.SettingsKey, boolean>,
  };
}

function titleOf(input: unknown): string {
  if (
    typeof input !== 'string' ||
    !input.trim() ||
    input.trim().length > MAX_TITLE
  )
    throw invalid(
      'INVALID_TITLE',
      `title must be 1 to ${MAX_TITLE} characters.`,
    );
  return input.trim();
}

function pagesOf(input: unknown): Page[] {
  if (input === undefined) return [];
  if (!Array.isArray(input) || input.some((page) => typeof page !== 'string'))
    throw invalid('INVALID_PAGES', 'pages must be a list of page ids.');
  for (const page of input as string[])
    if (!(PAGES as readonly string[]).includes(page))
      throw invalid('ABILITY_NOT_OFFERED', `${page} is not a page.`);
  return PAGES.filter((page) => (input as string[]).includes(page));
}

function bodyOf(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    throw invalid(
      'INVALID_ROLE',
      'The body must be { title, pages, settings, abilities }.',
    );
  return input as Record<string, unknown>;
}

function mapped<T>(run: () => Promise<T>): Promise<T> {
  return run().catch((error: unknown) => {
    if (error instanceof PermissionSetNotFoundError) throw notFound('Role');
    if (error instanceof PermissionSetConflictError)
      throw alreadyExists(
        'ROLE_EXISTS',
        'A role with this key already exists.',
      );
    if (error instanceof PermissionSetLastAssignmentError)
      throw conflict(
        'LAST_OWNER',
        'The last owner cannot lose the owner role.',
      );
    throw error;
  });
}

export function createStudioAccess(options: StudioAccessOptions): StudioAccess {
  const { authz, database, rootSet, defaultSet } = options;
  const levels = options.levels ?? BUILT_IN_LEVELS;
  const sets = authz.permissionSets;
  // Read when needed: every plugin has registered by the time a request comes, and the registry is small.
  const catalog = (): Catalog => readCatalog(authz);
  const bound = (
    conn: DatabaseConnection,
  ): PermissionSetsApi<DatabaseConnection> => sets.withTransaction(conn);
  const isRole = (key: string) =>
    key !== rootSet && key !== defaultSet && !isApiKeySet(key);

  // People only: API keys' identities are listed and managed as keys (`api-keys.ts`), never among the members, the
  // administrators or anyone a notice goes to.
  async function activeUsers(conn: DatabaseConnection): Promise<UserRow[]> {
    const rows = await conn.repository<UserRow>('user').findMany({
      filter: (f) =>
        f.and([
          f.date('disabledAt').empty(),
          f.date('deletedAt').empty(),
          f.string('kind').ne('service'),
        ]),
    });
    return [...rows].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  }

  const nameOf = (row: UserRow) =>
    row.name || row.username || row.email || row.id;

  async function superusers(conn: DatabaseConnection): Promise<Set<string>> {
    return new Set(
      (await bound(conn).listAssignments(rootSet))
        .filter(({ subject }) => subject.type === 'user')
        .map(({ subject }) => subject.id),
    );
  }

  async function roleSets(conn: DatabaseConnection): Promise<PermissionSet[]> {
    return (await bound(conn).list()).filter((set) => isRole(set.key));
  }

  /** Direct user holders of each role. */
  async function holders(
    conn: DatabaseConnection,
  ): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    for (const { subject, permissionSet } of await bound(
      conn,
    ).listAssignments())
      if (subject.type === 'user' && isRole(permissionSet))
        result.set(permissionSet, [
          ...(result.get(permissionSet) ?? []),
          subject.id,
        ]);
    return result;
  }

  function describe(set: PermissionSet, holderIds: readonly string[]): Role {
    const grants = roleOf(set.grants, catalog());
    return {
      key: set.key,
      title: (set.title as Role['title']) ?? null,
      builtIn: BUILT_IN_ROLES.includes(set.key),
      editable: set.key !== ROLES.owner,
      pages: grants.pages,
      settings: grants.settings,
      abilities: grants.abilities,
      holderIds,
      holderCount: holderIds.length,
    };
  }

  async function view(key: string): Promise<Role> {
    const conn = database.connection();
    const set = await bound(conn).get(key);
    if (!set || !isRole(key)) throw notFound('Role');
    return describe(set, (await holders(conn)).get(key) ?? []);
  }

  function written(key: string, title: unknown, role: RoleGrants) {
    return {
      key,
      ...(title === undefined ? {} : { title: title as string }),
      grants: grantsOf(role, catalog()),
    };
  }

  function roleGrants(body: Record<string, unknown>): RoleGrants {
    return {
      pages: pagesOf(body.pages),
      settings: checkSettings(body.settings, catalog()),
      abilities: checkAbilities(body.abilities, catalog()),
    };
  }

  async function readDefaultRole(
    conn: DatabaseConnection,
  ): Promise<string | null> {
    const row = await conn.query
      .selectFrom(SETTINGS_TABLE)
      .select('value')
      .where('key', '=', DEFAULT_ROLE)
      .executeTakeFirst();
    if (!row) return ROLES.contributor;
    const value: unknown =
      typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    return typeof value === 'string' ? value : null;
  }

  // What the identity's roles give, kept to its credential's scope. `getEffective` answers the sets a principal holds,
  // not what this request may do, so the scope is applied here: without it a scoped key would reach everything its
  // owner may (the projects plugin, release management and the CLI all read their permissions through this).
  async function roleGrantsOf(
    identity: AuthorizationIdentity,
  ): Promise<RoleGrants> {
    const held = await sets.getEffective(identity);
    const current = catalog();
    const role = held.some((set) => sets.protection(set.key)?.unrestricted)
      ? everything(current)
      : roleOf(
          held.flatMap((set) => set.grants as readonly Grant[]),
          current,
        );
    return identity.keyScope
      ? narrowedByScope(role, identity.keyScope, current)
      : role;
  }

  async function resolve(
    role: RoleGrants,
    userId: string,
  ): Promise<Permissions> {
    return {
      scopes: await resolveScopes(levels, role.abilities, userId),
      settings: role.settings,
    };
  }

  async function permissionsOf(
    identity: AuthorizationIdentity,
  ): Promise<Permissions> {
    return resolve(await roleGrantsOf(identity), identity.principal.id);
  }

  // The identity a request of this user would carry: the authorization plugin's middleware adds the same subjects.
  async function identityOf(userId: string): Promise<AuthorizationIdentity> {
    const principal = { type: 'user', id: userId };
    return {
      principal,
      subjects: [
        { type: 'authenticated', id: '*' },
        ...(await authz.subjects.resolveFor(principal)),
      ],
    };
  }

  const heldBy = (
    assignments: readonly {
      subject: { type: string; id: string };
      permissionSet: string;
    }[],
    userId: string,
  ) =>
    assignments
      .filter(
        ({ subject, permissionSet }) =>
          subject.type === 'user' &&
          subject.id === userId &&
          isRole(permissionSet),
      )
      .map(({ permissionSet }) => permissionSet);

  const projects: ProjectsAccess = {
    permissionsOf: async (identity) =>
      projectPermissionsOf(await permissionsOf(identity)),
    async permissionsOfUser(userId) {
      return projectPermissionsOf(
        await permissionsOf(await identityOf(userId)),
      );
    },
    async admit(conn, userId) {
      // An API key's first request does not make its identity a member: it holds only the key's own grants.
      const user = await conn
        .repository<UserRow>('user')
        .findOne({ filter: { id: userId } });
      if (!user || user.kind === 'service') return;
      const key = await readDefaultRole(conn);
      if (!key) return;
      const api = bound(conn);
      if (!(await api.get(key))) return;
      const held = await api.listAssignments(key);
      if (
        held.some(
          ({ subject }) => subject.type === 'user' && subject.id === userId,
        )
      )
        return;
      await api.assign({
        permissionSet: key,
        subject: { type: 'user', id: userId },
      });
    },
    changed: (userId) =>
      sets.notifyAssignmentsChanged({ type: 'user', id: userId }),
    async administrators(conn) {
      const wanted = new Set<string>();
      for (const key of [ROLES.owner, ROLES.admin])
        for (const { subject } of await bound(conn).listAssignments(key))
          if (subject.type === 'user') wanted.add(subject.id);
      return (await activeUsers(conn))
        .map((row) => row.id)
        .filter((id) => wanted.has(id));
    },
  };

  const roles: RoleService = {
    async list(viewer) {
      requireSetting(
        viewer,
        'pm.members/read',
        'You may not read the member settings.',
      );
      const conn = database.connection();
      const byHolder = await holders(conn);
      const rank = (key: string) => {
        const index = BUILT_IN_ROLES.indexOf(key);
        return index === -1 ? BUILT_IN_ROLES.length : index;
      };
      return (await roleSets(conn))
        .sort((a, b) => rank(a.key) - rank(b.key))
        .map((set) => describe(set, byHolder.get(set.key) ?? []));
    },

    async get(viewer, key) {
      requireSetting(
        viewer,
        'pm.members/read',
        'You may not read the member settings.',
      );
      return view(key);
    },

    async create(viewer, input) {
      requireSetting(
        viewer,
        'pm.members/define-roles',
        'Only someone who may define roles may do this.',
      );
      const body = bodyOf(input);
      const title = titleOf(body.title);
      const key = `r-${options.newKey()}`;
      await mapped(
        async () =>
          void (await sets.create(written(key, title, roleGrants(body)))),
      );
      return view(key);
    },

    async update(viewer, key, input) {
      requireSetting(
        viewer,
        'pm.members/define-roles',
        'Only someone who may define roles may do this.',
      );
      if (!isRole(key)) throw notFound('Role');
      if (key === ROLES.owner)
        throw forbidden(
          'The owner role holds everything; it is not edited here.',
          'ROLE_NOT_EDITABLE',
        );
      const body = bodyOf(input);
      const existing = await sets.get(key);
      if (!existing) throw notFound('Role');
      // A field left out keeps what the role grants now.
      const current = roleOf(existing.grants, catalog());
      const grants: RoleGrants = {
        pages: body.pages === undefined ? current.pages : pagesOf(body.pages),
        settings:
          body.settings === undefined
            ? current.settings
            : checkSettings(body.settings, catalog()),
        abilities:
          body.abilities === undefined
            ? current.abilities
            : checkAbilities(body.abilities, catalog()),
      };
      const title =
        body.title === undefined ? existing.title : titleOf(body.title);
      await mapped(
        async () => void (await sets.update(key, written(key, title, grants))),
      );
      return view(key);
    },

    async remove(viewer, key) {
      requireSetting(
        viewer,
        'pm.members/define-roles',
        'Only someone who may define roles may do this.',
      );
      if (!isRole(key)) throw notFound('Role');
      if (BUILT_IN_ROLES.includes(key))
        throw forbidden('Built-in roles cannot be deleted.', 'ROLE_BUILT_IN');
      if (!(await sets.get(key))) throw notFound('Role');
      const assigned = await sets.listAssignments(key);
      if (assigned.length > 0)
        throw conflict(
          'ROLE_IN_USE',
          'Someone still holds this role; change their roles first.',
          {
            holderIds: assigned
              .filter((item) => item.subject.type === 'user')
              .map((item) => item.subject.id),
            holderCount: assigned.length,
          },
        );
      if ((await readDefaultRole(database.connection())) === key)
        throw conflict(
          'ROLE_IS_DEFAULT',
          'New members get this role; choose another default first.',
        );
      await mapped(() => sets.delete(key));
    },

    async members(viewer) {
      requireSetting(
        viewer,
        'pm.members/read',
        'You may not read the member settings.',
      );
      const conn = database.connection();
      const [users, assignments, admins] = await Promise.all([
        activeUsers(conn),
        bound(conn).listAssignments(),
        superusers(conn),
      ]);
      return users
        .filter((user) => !admins.has(user.id))
        .map((user) => ({
          userId: user.id,
          name: nameOf(user),
          email: user.email,
          roles: heldBy(assignments, user.id),
        }));
    },

    async assign(viewer, userId, input) {
      const requested = (input as { roles?: unknown } | null)?.roles;
      if (
        !Array.isArray(requested) ||
        requested.some((key) => typeof key !== 'string')
      )
        throw invalid('INVALID_ROLES', 'roles must be a list of role keys.');
      const keys = [...new Set(requested as string[])];
      requireSetting(
        viewer,
        'pm.members/assign',
        'Only someone who may assign roles may do this.',
      );
      const result = await database.transaction(async (conn) => {
        if ((await superusers(conn)).has(userId))
          throw forbidden(
            'A system administrator’s roles are not managed here.',
            'SYSTEM_ADMIN',
          );
        const user = await conn
          .repository<UserRow>('user')
          .findOne({ filter: { id: userId } });
        if (!user) throw notFound('User');
        // An API key's identity holds exactly the permissions chosen on the key, never a role.
        if (user.kind === 'service')
          throw forbidden(
            'An API key’s permissions are chosen on the key, not by roles.',
            'API_KEY_IDENTITY',
          );
        const available = (await roleSets(conn)).map((set) => set.key);
        for (const key of keys)
          if (!available.includes(key))
            throw invalid('UNKNOWN_ROLE', `There is no role ${key}.`);
        const assignments = await bound(conn).listAssignments();
        const current = heldBy(assignments, userId);
        const operatorIsOwner = heldBy(assignments, viewer.userId).includes(
          ROLES.owner,
        );
        const changed = [
          ...keys.filter((key) => !current.includes(key)),
          ...current.filter((key) => !keys.includes(key)),
        ];
        if (changed.includes(ROLES.owner) && !operatorIsOwner)
          throw forbidden('Only an owner may grant or revoke the owner role.');
        const active = !user.disabledAt && !user.deletedAt;
        if (!active && keys.some((key) => !current.includes(key)))
          throw invalid(
            'USER_DISABLED',
            'A disabled account cannot be given a role.',
          );
        await mapped(() =>
          bound(conn).replaceSubjectAssignments({
            subject: { type: 'user', id: userId },
            managedPermissionSets: available,
            permissionSets: keys,
          }),
        );
        return {
          userId,
          name: nameOf(user),
          email: user.email,
          roles: heldBy(await bound(conn).listAssignments(), userId),
        };
      });
      await sets.notifyAssignmentsChanged({ type: 'user', id: userId });
      return result;
    },

    async settings(viewer) {
      requireSetting(
        viewer,
        'pm.general/read',
        'You may not read the general settings.',
      );
      return { defaultRole: await readDefaultRole(database.connection()) };
    },

    async me(viewer) {
      const conn = database.connection();
      return {
        roles: heldBy(await bound(conn).listAssignments(), viewer.userId),
        superuser: (await superusers(conn)).has(viewer.userId),
      };
    },

    async updateSettings(viewer, input) {
      requireSetting(
        viewer,
        'pm.general/update',
        'You may not change the general settings.',
      );
      const value = (input as { defaultRole?: unknown } | null)?.defaultRole;
      if (value !== null && typeof value !== 'string')
        throw invalid(
          'INVALID_SETTINGS',
          'defaultRole must be a role key or null.',
        );
      await database.transaction(async (conn) => {
        if (value !== null) {
          const set = await bound(conn).get(value);
          if (!set || !isRole(value))
            throw invalid('UNKNOWN_ROLE', `There is no role ${value}.`);
        }
        const existing = await conn.query
          .selectFrom(SETTINGS_TABLE)
          .select('key')
          .where('key', '=', DEFAULT_ROLE)
          .executeTakeFirst();
        const now = new Date();
        if (existing)
          await conn.query
            .updateTable(SETTINGS_TABLE)
            .set({ value: JSON.stringify(value), updatedAt: now })
            .where('key', '=', DEFAULT_ROLE)
            .execute();
        else
          await conn.query
            .insertInto(SETTINGS_TABLE)
            .values({
              key: DEFAULT_ROLE,
              value: JSON.stringify(value),
              createdAt: now,
              updatedAt: now,
            })
            .execute();
      });
      return { defaultRole: value };
    },
  };

  return {
    projects,
    roles,
    catalog,
    permissionsOf,
    permissionsOfUser: async (userId) =>
      permissionsOf(await identityOf(userId)),
    resolve,
    grantsOf: roleGrantsOf,
    grantsOfUser: async (userId) => roleGrantsOf(await identityOf(userId)),
    async rolesOfUser(userId) {
      const conn = database.connection();
      const held = new Set(heldBy(await bound(conn).listAssignments(), userId));
      return {
        roles: (await roleSets(conn))
          .filter((set) => held.has(set.key))
          .map((set) => ({
            key: set.key,
            title: (set.title as Role['title']) ?? null,
          })),
        superuser: (await superusers(conn)).has(userId),
      };
    },
    superusers,
    isRole,
  };
}

// @vitest-environment node
/**
 * Studio's roles over a real database: the roles a new installation is seeded with, what a user may do, the default
 * role, the role service's rules and the level actions the plugins register.
 */
import { createRequire } from 'node:module';
import path from 'node:path';

import {
  createAppAuthorization,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import type { DatabaseManager } from '@nocobase/db';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { createApiKeyScopes } from '@nocobase/app-plugin-api-keys/server';
import type { KeyScope } from '@nocobase/authorization/core';

import { registerStudioKeyScopes } from '../../server/access/key-scopes.js';
import { releasesPermissionsOf } from '../../server/releases/access.js';
import { BUILT_IN_LEVELS } from '../../server/access/scope-levels.js';
import {
  createStudioAccess,
  projectPermissionsOf,
  type AccessViewer,
  type StudioAccess,
} from '../../server/access/service.js';
import { registerAccess } from './registry.js';

const require = createRequire(import.meta.url);
const packageRoot = (name: string) =>
  path.dirname(require.resolve(`${name}/package.json`));
const ROOT = path.resolve(import.meta.dirname, '../..');
const PROJECTS = '@nocobase/app-plugin-projects';

let databases: ProvisionedTestDatabases;
let testDatabase: TestDatabase;
let database: DatabaseManager;
let authz: AppAuthorization;
let access: StudioAccess;
let next = 0;

async function addUser(id: string): Promise<void> {
  const now = new Date();
  await database
    .connection()
    .repository('user')
    .createOne({
      values: {
        id,
        name: id,
        username: id,
        email: `${id}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
}

async function assign(userId: string, set: string): Promise<void> {
  const now = new Date();
  await database
    .connection()
    .query.insertInto('authorizationPermissionSetAssignments')
    .values({
      id: `user:${userId}:${set}`,
      subjectType: 'user',
      subjectId: userId,
      permissionSetKey: set,
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}

const identity = (userId: string) => ({
  principal: { type: 'user', id: userId },
  subjects: [{ type: 'authenticated', id: '*' }],
});

/** A viewer who may read the member settings, for reading a role back. */
function viewerOf(userId: string): AccessViewer {
  return {
    userId,
    permissions: {
      scopes: {},
      settings: { 'pm.members/read': true },
    },
  };
}

async function viewer(userId: string): Promise<AccessViewer> {
  return { userId, permissions: await access.permissionsOf(identity(userId)) };
}

beforeAll(async () => {
  databases = await provisionTestDatabases();
});
afterAll(() => databases.drop());

beforeEach(async () => {
  testDatabase = await databases.open({
    migrations: (
      [
        [
          path.join(
            packageRoot('@nocobase/app-plugin-authentication'),
            'database/migrations',
          ),
          '@nocobase/app-plugin-authentication',
        ],
        [
          path.join(
            packageRoot('@nocobase/app-plugin-authorization'),
            'database/migrations',
          ),
          '@nocobase/app-plugin-authorization',
        ],
        [path.join(packageRoot(PROJECTS), 'database/migrations'), PROJECTS],
        [path.join(ROOT, 'database/main/migrations'), 'studio'],
      ] as const
    ).map(([directory, packageName]) => ({ directory, packageName })),
  });
  database = testDatabase.database;
  // The platform's superuser and everyone's sets, as the authorization plugin seeds them.
  const now = new Date();
  for (const key of ['root', 'member'])
    await database
      .connection()
      .query.insertInto('authorizationPermissionSets')
      .values({
        id: key,
        key,
        title: null,
        grants: '[]',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  await addUser('root');
  await assign('root', 'root');
  // The projects plugin's seeds, then Studio's roles seed, as a new installation runs them.
  await testDatabase.seed([
    {
      directory: path.join(packageRoot(PROJECTS), 'database/seeds'),
      packageName: PROJECTS,
    },
    {
      directory: path.join(ROOT, 'database/main/seeds'),
      packageName: 'studio',
    },
  ]);
  // `root` is the superuser set by default: the plugin protects it as unrestricted.
  authz = createAppAuthorization({ connection: database.connection() });
  // The settings items and businesses the plugins and Studio register at boot.
  registerAccess(authz);
  access = createStudioAccess({
    authz,
    database,
    rootSet: 'root',
    defaultSet: 'member',
    newKey: () => `k${(next += 1)}`,
  });
});
afterEach(() => testDatabase.destroy());

async function sets() {
  return database
    .connection()
    .query.selectFrom('authorizationPermissionSets')
    .selectAll()
    .orderBy('key')
    .execute();
}

describe('seeding Studio’s roles', () => {
  it('creates the built-in roles and makes the superuser an owner and contributor', async () => {
    expect((await sets()).map((row) => row.key)).toEqual([
      'admin',
      'contributor',
      'member',
      'owner',
      'root',
    ]);
    const assignments = await database
      .connection()
      .query.selectFrom('authorizationPermissionSetAssignments')
      .select(['id', 'permissionSetKey'])
      .orderBy('id')
      .execute();
    expect(assignments).toEqual([
      { id: 'user:root:contributor', permissionSetKey: 'contributor' },
      { id: 'user:root:owner', permissionSetKey: 'owner' },
      { id: 'user:root:root', permissionSetKey: 'root' },
    ]);
    const contributor = (await sets()).find((row) => row.key === 'contributor');
    const grants = JSON.parse(String(contributor?.grants)) as {
      resource: { type: string; id: string };
      actions: { action: string }[];
    }[];
    const issues = grants.find(
      (grant) =>
        grant.resource.type === 'pm' && grant.resource.id === 'pm.issues',
    );
    // Each business action is granted as the action of its level, on its plugin's resource type.
    expect(issues?.actions.map((a) => a.action)).toEqual([
      'view.related',
      'create.related',
      'edit.related',
      'comment.related',
      'moderate-comments.related',
      'close.related',
      'change-owner.related',
    ]);
    expect(
      grants.find(
        (grant) =>
          grant.resource.type === 'pm' && grant.resource.id === 'pm.projects',
      )?.actions,
    ).toEqual([
      { action: 'view.related' },
      { action: 'create' },
      { action: 'manage.related' },
    ]);
    expect(
      grants.find(
        (grant) =>
          grant.resource.type === 'pm' &&
          grant.resource.id === 'pm.attachments',
      )?.actions,
    ).toEqual([{ action: 'upload.related' }]);
    const admin = (await sets()).find((row) => row.key === 'admin');
    expect(
      (
        JSON.parse(String(admin?.grants)) as {
          resource: { type: string; id: string };
          actions: { action: string }[];
        }[]
      ).find((grant) => grant.resource.id === 'rel.apps')?.actions,
    ).toEqual(
      expect.arrayContaining([
        { action: 'deploy.all' },
        { action: 'create' },
        { action: 'deploy-protected.all' },
      ]),
    );
    // Every seeded grant names an action a plugin registered.
    const catalog = access.catalog();
    for (const row of await sets())
      for (const grant of JSON.parse(String(row.grants)) as {
        resource: { type: string; id: string };
        actions: { action: string }[];
      }[])
        if (catalog.isBusinessType(grant.resource.type))
          for (const { action } of grant.actions)
            expect(catalog.grantOf(grant.resource, action)).toBeDefined();
    expect(
      grants.find(
        (grant) =>
          grant.resource.type === 'settings' &&
          grant.resource.id === 'pm.workflows',
      )?.actions,
    ).toEqual([{ action: 'read' }]);
    const pagesOf = (key: string) =>
      access.roles
        .get(viewerOf(key), key)
        .then((role) => [role.pages, role.settings] as const);
    const [contributorPages, contributorSettings] =
      await pagesOf('contributor');
    expect(contributorPages).toEqual([
      'pm-my-issues',
      'pm-issues',
      'pm-projects',
      'agents',
      'runtimes',
      'skills',
      'usage',
      'rel-apps',
      'reports',
    ]);
    expect(contributorSettings).toMatchObject({
      'agents.agents/read': true,
      'agents.agents/manage': false,
      'agents.runners/read': true,
      'agents.runners/manage': false,
      'agents.prices/read': true,
      'agents.prices/manage': false,
      'agents.services/read': true,
      'agents.services/manage': false,
      'rel.environments/read': true,
      'rel.environments/manage': false,
    });
    // The system knowledge page is the administrators' and owners' only.
    const [adminPages, adminSettings] = await pagesOf('admin');
    expect(adminPages).toEqual([...contributorPages, 'knowledge']);
    expect(Object.values(adminSettings).every(Boolean)).toBe(true);
    const [ownerPages, ownerSettings] = await pagesOf('owner');
    expect(ownerPages).toEqual([...contributorPages, 'knowledge']);
    expect(Object.values(ownerSettings).every(Boolean)).toBe(true);
    expect(JSON.parse(String(contributor?.title))).toEqual({
      key: 'roles.contributor',
      ns: '@nocobase/i18n/application',
    });
  });
});

describe('what a user may do', () => {
  it('reads each action at its widest level across the user’s roles', async () => {
    await addUser('alice');
    await assign('alice', 'contributor');
    const { scopes, settings } = await access.permissionsOf(identity('alice'));
    expect(scopes['pm.issues/close']).toEqual({ users: ['alice'] });
    expect(scopes['pm.projects/create']).toBe('all');
    expect(scopes['pm.issues/delete']).toBe('none');
    expect(settings['pm.members/read']).toBe(true);
    expect(settings['pm.members/assign']).toBe(false);

    await assign('alice', 'admin');
    expect(
      (await access.permissionsOf(identity('alice'))).scopes['pm.issues/close'],
    ).toBe('all');
  });

  it('lets a contributor change only the agents they own and the skills they created', async () => {
    await addUser('alice');
    await assign('alice', 'contributor');
    // What `agentsAccessToken` answers the agents plugin.
    expect(
      (await access.grantsOf(identity('alice'))).abilities[
        'agents.agents/edit'
      ],
    ).toBe('related');
    await assign('alice', 'admin');
    expect(
      (await access.grantsOf(identity('alice'))).abilities[
        'agents.agents/edit'
      ],
    ).toBe('all');
  });

  it('offers every scope level where an action relates records to users, and resolves each through Studio’s resolvers', async () => {
    expect(access.catalog().levelsOf('pm.issues/close')).toEqual([
      'none',
      'related',
      'all',
    ]);
    expect(access.catalog().levelsOf('pm.projects/create')).toEqual([
      'none',
      'all',
    ]);
    await addUser('alice');
    await assign('alice', 'contributor');
    // A level resolver may reach more users than the caller (as a department level would); the role stays as it is.
    const team = createStudioAccess({
      authz,
      database,
      rootSet: 'root',
      defaultSet: 'member',
      newKey: () => 'unused',
      levels: {
        ...BUILT_IN_LEVELS,
        related: (userId) => ({ users: [userId, 'bob'] }),
      },
    });
    const { scopes } = await team.permissionsOf(identity('alice'));
    expect(scopes['pm.issues/close']).toEqual({ users: ['alice', 'bob'] });
    expect(scopes['pm.projects/create']).toBe('all');
    expect(scopes['pm.issues/delete']).toBe('none');
  });

  it('reads another user’s permissions as their own request would', async () => {
    await addUser('alice');
    await assign('alice', 'contributor');
    const alice = await access.projects.permissionsOfUser?.('alice');
    // The projects plugin's own keys of what the user's request would get.
    expect(alice).toEqual(
      projectPermissionsOf(await access.permissionsOf(identity('alice'))),
    );
    expect(alice?.scopes['pm.issues/comment']).toEqual({ users: ['alice'] });
    expect(
      (await access.projects.permissionsOfUser?.('root'))?.scopes[
        'pm.issues/moderate-comments'
      ],
    ).toBe('all');
  });

  it('gives a system administrator everything and nobody else anything', async () => {
    const root = await access.permissionsOf(identity('root'));
    expect(Object.values(root.scopes).every((level) => level === 'all')).toBe(
      true,
    );
    expect(Object.values(root.settings).every(Boolean)).toBe(true);
    await addUser('bob');
    const bob = await access.permissionsOf(identity('bob'));
    expect(Object.values(bob.scopes).every((level) => level === 'none')).toBe(
      true,
    );
  });

  it('permits the level actions a role holds, so the client sees them', async () => {
    await addUser('alice');
    await assign('alice', 'contributor');
    const context = authz.for(identity('alice'));
    const issues = { type: 'pm', id: 'pm.issues' };
    expect(
      await context.can({ resource: issues, action: 'close.related' }),
    ).toBe(true);
    expect(await context.can({ resource: issues, action: 'close.all' })).toBe(
      false,
    );
    expect(await context.can({ resource: issues, action: 'delete' })).toBe(
      false,
    );
    const snapshot = await context.snapshot();
    expect(
      snapshot.permissions.find(
        (entry) =>
          entry.resource.type === 'pm' && entry.resource.id === 'pm.issues',
      )?.actions,
    ).toContain('close.related');
  });

  it('takes the highest level held, and reads no grant with a policy', async () => {
    await addUser('alice');
    await authz.permissionSets.create({
      key: 'mixed',
      grants: [
        {
          resource: { type: 'pm', id: 'pm.issues' },
          actions: [
            { action: 'edit.related' },
            { action: 'edit.all' },
            // The authorization plugin does not permit a grant with a policy, so neither does Studio.
            { action: 'delete', policy: { type: 'custom', anything: true } },
          ],
        },
      ],
    });
    await assign('alice', 'mixed');
    const { abilities } = await access.grantsOf(identity('alice'));
    expect(abilities['pm.issues/edit']).toBe('all');
    expect(abilities['pm.issues/delete']).toBe('none');
    expect(
      await authz.for(identity('alice')).can({
        resource: { type: 'pm', id: 'pm.issues' },
        action: 'delete',
      }),
    ).toBe(false);
  });
});

describe('the default role for new members', () => {
  it('gives the everyday role once, unless it is set to none', async () => {
    await addUser('alice');
    await database.transaction((conn) => access.projects.admit(conn, 'alice'));
    await database.transaction((conn) => access.projects.admit(conn, 'alice'));
    expect(
      (await authz.permissionSets.listAssignments('contributor')).filter(
        ({ subject }) => subject.id === 'alice',
      ),
    ).toHaveLength(1);

    await access.roles.updateSettings(await viewer('root'), {
      defaultRole: null,
    });
    await addUser('bob');
    await database.transaction((conn) => access.projects.admit(conn, 'bob'));
    expect((await access.roles.me(await viewer('bob'))).roles).toEqual([]);
  });
});

describe('the role service', () => {
  it('creates a role from pages, settings and abilities and reads it back', async () => {
    const created = await access.roles.create(await viewer('root'), {
      title: 'Tester',
      pages: ['pm-issues'],
      settings: { 'pm.labels/read': true },
      abilities: { 'pm.issues/view': 'all', 'pm.issues/edit': 'related' },
    });
    expect(created).toMatchObject({
      key: 'r-k1',
      title: 'Tester',
      builtIn: false,
      pages: ['pm-issues'],
    });
    expect(created.abilities['pm.issues/view']).toBe('all');
    expect(created.abilities['pm.issues/edit']).toBe('related');
    expect(created.abilities['pm.projects/view']).toBe('none');
    expect(created.settings['pm.labels/read']).toBe(true);
    await expect(
      access.roles.update(await viewer('root'), 'r-k1', {
        abilities: { 'pm.issues/delete': 'related' },
      }),
    ).rejects.toMatchObject({ code: 'ABILITY_NOT_OFFERED' });
  });

  it('keeps the agents plugin’s pages and settings through a save and a read', async () => {
    const root = await viewer('root');
    const created = await access.roles.create(root, {
      title: 'Agent keeper',
      pages: ['skills', 'agents', 'pm-issues'],
      settings: { 'agents.agents/manage': true, 'agents.runners/read': true },
    });
    // Pages come back in catalog order, whatever order they were sent in.
    expect(created.pages).toEqual(['pm-issues', 'agents', 'skills']);
    expect(created.settings['agents.agents/manage']).toBe(true);
    expect(created.settings['agents.agents/read']).toBe(false);
    expect(created.settings['agents.runners/read']).toBe(true);
    const stored = await authz.permissionSets.get(created.key);
    expect(stored?.grants).toEqual(
      expect.arrayContaining([
        {
          resource: { type: 'page', id: 'agents' },
          actions: [{ action: 'access' }],
        },
        {
          resource: { type: 'page', id: 'skills' },
          actions: [{ action: 'access' }],
        },
        {
          resource: { type: 'settings', id: 'agents.agents' },
          actions: [{ action: 'manage' }],
        },
        {
          resource: { type: 'settings', id: 'agents.runners' },
          actions: [{ action: 'read' }],
        },
      ]),
    );

    const updated = await access.roles.update(root, created.key, {
      pages: ['runtimes'],
      settings: { 'agents.runners/manage': true },
    });
    expect(updated.pages).toEqual(['runtimes']);
    expect(updated.settings['agents.agents/manage']).toBe(false);
    expect(updated.settings['agents.runners/manage']).toBe(true);
    expect(await access.roles.get(root, created.key)).toEqual(updated);

    // What the role gives its holder reaches the agents plugin's own checks.
    await addUser('alice');
    await assign('alice', created.key);
    expect(
      await authz.for(identity('alice')).can({
        resource: { type: 'settings', id: 'agents.runners' },
        action: 'manage',
      }),
    ).toBe(true);
    expect(
      await authz.for(identity('alice')).can({
        resource: { type: 'page', id: 'runtimes' },
        action: 'access',
      }),
    ).toBe(true);
    expect(
      await authz.for(identity('alice')).can({
        resource: { type: 'page', id: 'agents' },
        action: 'access',
      }),
    ).toBe(false);
  });

  it('refuses pages and settings no plugin declares', async () => {
    const root = await viewer('root');
    await expect(
      access.roles.create(root, { title: 'X', pages: ['agents-admin'] }),
    ).rejects.toMatchObject({ code: 'ABILITY_NOT_OFFERED' });
    await expect(
      access.roles.create(root, {
        title: 'X',
        settings: { 'agents.agents/delete': true },
      }),
    ).rejects.toMatchObject({ code: 'ABILITY_NOT_OFFERED' });
    await expect(
      access.roles.create(root, {
        title: 'X',
        settings: { 'agents.environments/read': true },
      }),
    ).rejects.toMatchObject({ code: 'ABILITY_NOT_OFFERED' });
  });

  it('lists members without system administrators, and keeps them out of assignments', async () => {
    await addUser('alice');
    const members = await access.roles.members(await viewer('root'));
    expect(members.map((member) => member.userId)).toEqual(['alice']);
    await expect(
      access.roles.assign(await viewer('root'), 'root', { roles: ['admin'] }),
    ).rejects.toMatchObject({ code: 'SYSTEM_ADMIN' });
  });

  it('counts the system administrators left out of the member list', async () => {
    await addUser('alice');
    await expect(
      access.roles.systemAdministratorCount(await viewer('root')),
    ).resolves.toBe(1);
  });

  it('lets only an owner grant the owner role', async () => {
    await addUser('alice');
    await addUser('ann');
    await assign('ann', 'admin');
    await expect(
      access.roles.assign(await viewer('ann'), 'alice', { roles: ['owner'] }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      access.roles.assign(await viewer('ann'), 'alice', {
        roles: ['contributor'],
      }),
    ).resolves.toMatchObject({ roles: ['contributor'] });
  });

  it('keeps the built-in and default roles', async () => {
    await expect(
      access.roles.remove(await viewer('root'), 'contributor'),
    ).rejects.toMatchObject({
      code: 'ROLE_BUILT_IN',
    });
    const role = await access.roles.create(await viewer('root'), {
      title: 'Guest',
    });
    await access.roles.updateSettings(await viewer('root'), {
      defaultRole: role.key,
    });
    await expect(
      access.roles.remove(await viewer('root'), role.key),
    ).rejects.toMatchObject({
      code: 'ROLE_IS_DEFAULT',
    });
  });
});

describe('API key scopes', () => {
  /** A scope compiled by the API keys plugin from Studio's groups, as a request with the key would carry it. */
  function scopeOf(
    groups: Record<
      string,
      { level: 'read' | 'write' | 'admin'; objects?: string[] }
    >,
  ): KeyScope {
    const scopes = createApiKeyScopes();
    registerStudioKeyScopes(scopes, {}, () => access.catalog());
    return scopes.compile('key-1', scopes.validate({ groups }));
  }
  const scoped = (userId: string, keyScope: KeyScope) => ({
    ...identity(userId),
    keyScope,
  });

  it('cannot exceed its scope: a superuser’s CI key reaches only release uploads and deploys', async () => {
    const keyScope = scopeOf({
      'releases.apps': { level: 'admin', objects: ['shop'] },
    });
    const permissions = await access.permissionsOf(scoped('root', keyScope));
    expect(
      Object.entries(permissions.scopes)
        .filter(([, level]) => level !== 'none')
        .map(([key]) => key)
        .every((key) => key.startsWith('rel.apps/')),
    ).toBe(true);
    expect(Object.values(permissions.settings).some(Boolean)).toBe(false);
    const grants = await access.grantsOf(scoped('root', keyScope));
    const releases = releasesPermissionsOf(
      grants,
      (await access.resolve(grants, 'root')).scopes,
    );
    expect(releases.pages).toEqual({ 'rel-apps': true });
    expect(
      Object.entries(releases.scopes)
        .filter(([, level]) => level !== 'none')
        .map(([key]) => key),
    ).toEqual([
      'rel.apps/view',
      'rel.apps/read-logs',
      'rel.apps/upload',
      'rel.apps/deploy',
      'rel.apps/operate',
    ]);
    expect(keyScope.objects('rel.apps')).toEqual(['shop']);
    // The same identity without the key holds everything.
    expect(
      Object.values(
        (await access.permissionsOf(identity('root'))).scopes,
      ).every((level) => level === 'all'),
    ).toBe(true);
  });

  it('never grants: a contributor’s key scoped to defining roles still cannot', async () => {
    await addUser('alice');
    await assign('alice', 'contributor');
    const keyScope = scopeOf({
      'studio.members': { level: 'admin' },
      'projects.issues': { level: 'read' },
    });
    const permissions = await access.permissionsOf(scoped('alice', keyScope));
    expect(permissions.settings['pm.members/define-roles']).toBe(false);
    expect(permissions.settings['pm.members/read']).toBe(true);
    expect(permissions.scopes['pm.issues/view']).toEqual({ users: ['alice'] });
    expect(permissions.scopes['pm.issues/edit']).toBe('none');
    // And the authorization plugin's own checks agree.
    const context = authz.for(scoped('alice', keyScope));
    expect(
      await context.can({
        resource: { type: 'pm', id: 'pm.issues' },
        action: 'edit.related',
      }),
    ).toBe(false);
    expect(
      await context.can({
        resource: { type: 'pm', id: 'pm.issues' },
        action: 'view.related',
      }),
    ).toBe(true);
  });

  it('checks release actions on release management’s own resource type', async () => {
    await addUser('alice');
    await assign('alice', 'contributor');
    const context = authz.for(identity('alice'));
    expect(
      await context.can({
        resource: { type: 'rel', id: 'rel.apps' },
        action: 'deploy.related',
      }),
    ).toBe(true);
    expect(
      await context.can({
        resource: { type: 'rel', id: 'rel.apps' },
        action: 'deploy-protected.related',
      }),
    ).toBe(false);
  });
});

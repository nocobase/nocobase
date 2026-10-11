// @vitest-environment node
/**
 * An organization's API keys over a real database, Better Auth and the authorization plugin: what a key may do is
 * exactly what was chosen for it, nobody gives more than they hold, a rotation keeps the key, the permission points
 * gate who manages keys and who makes their own, and a key's identity stays out of members, roles and pickers.
 */
import { createRequire } from 'node:module';
import path from 'node:path';

import {
  apiKey,
  createApiKeyScopes,
  ScopedApiKeys,
  type ApiKeyScopes,
} from '@nocobase/app-plugin-api-keys/server';
import {
  Auth,
  createUserAdministrationService,
  type UserAdministrationService,
} from '@nocobase/app-plugin-authentication/server';
import {
  createAppAuthorization,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type { AuthorizationIdentity } from '@nocobase/authorization/core';
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

import {
  apiKeySetOf,
  createOrgApiKeyService,
  personalKeyPolicy,
  type OrgApiKeyService,
} from '../../server/access/api-keys.js';
import { registerStudioKeyScopes } from '../../server/access/key-scopes.js';
import { registerAccess } from './registry.js';
import {
  createStudioAccess,
  type AccessViewer,
  type StudioAccess,
} from '../../server/access/service.js';
import { createStudioUserRoleScope } from '../../server/access/user-scope.js';

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
let auth: Auth;
let users: UserAdministrationService;
let scopes: ApiKeyScopes;
let keys: ScopedApiKeys;
let service: OrgApiKeyService;
let releaseProtections: () => void;
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

const identity = (userId: string): AuthorizationIdentity => ({
  principal: { type: 'user', id: userId },
  subjects: [{ type: 'authenticated', id: '*' }],
});

async function viewer(userId: string): Promise<AccessViewer> {
  return { userId, permissions: await access.permissionsOf(identity(userId)) };
}

/** The identity a request made with `secret` carries, as the API keys plugin's provider builds it. */
async function keyRequest(secret: string): Promise<AuthorizationIdentity> {
  const headers = new Headers({ 'x-api-key': secret });
  const session = await auth.getSession(headers);
  if (!session) throw new Error('The key did not authenticate.');
  const keyScope = await keys.resolve(
    session,
    new Request('http://localhost/api/x', { headers }),
  );
  return {
    ...identity(session.user.id),
    ...(keyScope ? { keyScope } : {}),
  };
}

/** Whether `secret` still authenticates. */
async function authenticates(secret: string): Promise<boolean> {
  try {
    return (
      (await auth.getSession(new Headers({ 'x-api-key': secret }))) !== null
    );
  } catch {
    return false;
  }
}

/** The actions of a role-derived permission set at a level other than none. */
const held = (scopes: Readonly<Record<string, string>>) =>
  Object.entries(scopes)
    .filter(([, level]) => level !== 'none')
    .map(([key, level]) => `${key}:${level}`)
    .sort();

const CI = {
  name: 'GitHub Actions',
  description: 'Deploys from main',
  expiresInDays: 90,
  scope: { groups: { 'releases.apps': { level: 'admin' } } },
};

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
            packageRoot('@nocobase/app-plugin-api-keys'),
            'database/migrations',
          ),
          '@nocobase/app-plugin-api-keys',
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
  authz = createAppAuthorization({ connection: database.connection() });
  registerAccess(authz);
  access = createStudioAccess({
    authz,
    database,
    rootSet: 'root',
    defaultSet: 'member',
    newKey: () => `k${(next += 1)}`,
  });
  auth = new Auth({
    connection: database.connection(),
    baseURL: 'http://localhost/api/auth',
    secret: 'development-secret-at-least-32-characters',
    plugins: [apiKey()],
    emailAndPassword: { enabled: true },
    session: { storeSessionInDatabase: true },
  });
  users = createUserAdministrationService({
    auth,
    connection: database.connection(),
  });
  scopes = createApiKeyScopes();
  registerStudioKeyScopes(scopes, {}, () => access.catalog());
  keys = new ScopedApiKeys({
    auth,
    connection: () => database.connection(),
    scopes,
    authorization: () => authz,
  });
  auth.addScopedCredentialCheck(
    async (session, request) => (await keys.resolve(session, request)) !== null,
  );
  service = createOrgApiKeyService({
    users: () => users,
    keys: () => keys,
    scopes: () => scopes,
    authz: () => authz,
    access: () => access,
    database,
    newId: () => `e${(next += 1)}`,
  });
  releaseProtections = await service.protectAll();
});
afterEach(async () => {
  releaseProtections();
  await testDatabase.destroy();
});

describe('an organization’s API key', () => {
  it('may do exactly what was chosen for it, whoever made it', async () => {
    const created = await service.create(
      await viewer('root'),
      identity('root'),
      CI,
    );
    expect(created.key).toMatchObject({
      name: 'GitHub Actions',
      description: 'Deploys from main',
      scope: CI.scope,
      status: 'active',
      createdBy: { id: 'root', name: 'root' },
    });
    const request = await keyRequest(created.secret);
    expect(request.principal.id).toBe(created.key.id);
    const chosen = [
      'rel.apps/deploy:all',
      'rel.apps/operate:all',
      'rel.apps/read-logs:all',
      'rel.apps/upload:all',
      'rel.apps/view:all',
    ];
    const permissions = await access.permissionsOf(request);
    expect(held(permissions.scopes)).toEqual(chosen);
    expect(Object.values(permissions.settings).some(Boolean)).toBe(false);
    // The identity's own grants are the same, so code that forgets the key's scope still finds nothing more.
    const grants = await access.grantsOfUser(created.key.id);
    expect(held(grants.abilities)).toEqual(chosen);
    expect(grants.pages).toEqual(['rel-apps']);
    expect(Object.values(grants.settings).some(Boolean)).toBe(false);
    // And the authorization plugin's own checks agree.
    const context = authz.for(request);
    expect(
      await context.can({
        resource: { type: 'rel', id: 'rel.apps' },
        action: 'deploy.all',
      }),
    ).toBe(true);
    for (const [type, id, action] of [
      ['rel', 'rel.apps', 'create'],
      ['rel', 'rel.apps', 'deploy-protected.all'],
      ['pm', 'pm.issues', 'view.all'],
    ] as const)
      expect(await context.can({ resource: { type, id }, action })).toBe(false);
  });

  it('holds no more than its creator: a contributor’s key reaches related records only, and nothing they lack', async () => {
    await addUser('alice');
    await assign('alice', 'contributor');
    // Alice is allowed to manage keys, but holds only what a contributor holds.
    const alice: AccessViewer = {
      userId: 'alice',
      permissions: {
        ...(await access.permissionsOf(identity('alice'))),
        settings: {
          ...(await access.permissionsOf(identity('alice'))).settings,
          'studio.apiKeys/read': true,
          'studio.apiKeys/manage': true,
        },
      },
    };
    await expect(
      service.create(alice, identity('alice'), {
        ...CI,
        name: 'Roles',
        scope: {
          groups: {
            'studio.members': { level: 'admin' },
            'projects.issues': { level: 'read' },
          },
        },
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'KEY_SCOPE_EXCEEDS_YOURS',
      details: { groups: ['studio.members'] },
    });
    // Nothing was left behind by the refusal.
    expect(await users.list({ kind: 'service' })).toMatchObject({ total: 0 });
    const created = await service.create(alice, identity('alice'), {
      ...CI,
      name: 'Issues',
      scope: { groups: { 'projects.issues': { level: 'write' } } },
    });
    const permissions = await access.permissionsOf(
      await keyRequest(created.secret),
    );
    expect(permissions.scopes['pm.issues/edit']).toEqual({
      users: [created.key.id],
    });
    expect(permissions.scopes['pm.issues/delete']).toBe('none');
    expect(permissions.scopes['pm.projects/view']).toBe('none');
    // Changing its permissions follows the same rule, and is recorded.
    await expect(
      service.setScope(alice, identity('alice'), created.key.id, {
        scope: { groups: { 'projects.issues': { level: 'admin' } } },
      }),
    ).rejects.toMatchObject({ code: 'KEY_SCOPE_EXCEEDS_YOURS' });
    const narrowed = await service.setScope(
      await viewer('root'),
      identity('root'),
      created.key.id,
      { scope: { groups: { 'projects.issues': { level: 'read' } } } },
    );
    expect(narrowed.scope).toEqual({
      groups: { 'projects.issues': { level: 'read' } },
    });
    const after = await access.permissionsOf(await keyRequest(created.secret));
    expect(held(after.scopes)).toEqual(['pm.issues/view:all']);
    const events = await service.events(await viewer('root'), created.key.id);
    expect(events.map((event) => event.action)).toEqual([
      'permissions-changed',
      'created',
    ]);
    expect(events[0]).toMatchObject({
      actor: { id: 'root' },
      details: {
        before: { groups: { 'projects.issues': { level: 'write' } } },
        after: { groups: { 'projects.issues': { level: 'read' } } },
      },
    });
  });

  it('keeps its id, key, permissions and identity through a rotation; only the secret changes', async () => {
    const root = await viewer('root');
    const created = await service.create(root, identity('root'), CI);
    const rotated = await service.rotate(root, created.key.id);
    expect(rotated.secret).not.toBe(created.secret);
    expect(rotated.key).toMatchObject({
      id: created.key.id,
      keyId: created.key.keyId,
      name: created.key.name,
      scope: created.key.scope,
      createdBy: created.key.createdBy,
    });
    expect(await authenticates(created.secret)).toBe(false);
    const request = await keyRequest(rotated.secret);
    expect(request.principal.id).toBe(created.key.id);
    expect(
      await authz.for(request).can({
        resource: { type: 'rel', id: 'rel.apps' },
        action: 'deploy.all',
      }),
    ).toBe(true);
    expect(
      (await service.events(root, created.key.id)).map((e) => e.action),
    ).toEqual(['rotated', 'created']);
    expect(await service.list(root)).toHaveLength(1);
  });

  it('stops when disabled or deleted, and keeps its name for what it did', async () => {
    const root = await viewer('root');
    const created = await service.create(root, identity('root'), CI);
    await expect(service.disable(root, created.key.id)).resolves.toMatchObject({
      status: 'disabled',
    });
    expect(await authenticates(created.secret)).toBe(false);
    await service.enable(root, created.key.id);
    expect(await authenticates(created.secret)).toBe(true);
    await service.update(root, created.key.id, { name: 'Release CI' });
    expect((await service.get(root, created.key.id)).name).toBe('Release CI');
    await service.remove(root, created.key.id);
    expect(await authenticates(created.secret)).toBe(false);
    expect(await service.list(root)).toEqual([]);
    expect(await authz.permissionSets.get(apiKeySetOf(created.key.id))).toBe(
      undefined,
    );
    const user = await database
      .connection()
      .query.selectFrom('user')
      .select(['name', 'deletedAt'])
      .where('id', '=', created.key.id)
      .executeTakeFirst();
    expect(user?.name).toBe('Release CI');
    expect(user?.deletedAt).not.toBeNull();
  });
});

describe('who manages keys', () => {
  it('takes studio.apiKeys: read to see them, manage to change them; owners and admins hold both', async () => {
    await addUser('alice');
    await assign('alice', 'contributor');
    await addUser('ada');
    await assign('ada', 'admin');
    const contributor = await viewer('alice');
    expect(contributor.permissions.settings['studio.apiKeys/read']).toBe(false);
    await expect(service.list(contributor)).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      service.create(contributor, identity('alice'), CI),
    ).rejects.toMatchObject({ status: 403 });
    const admin = await viewer('ada');
    expect(admin.permissions.settings['studio.apiKeys/manage']).toBe(true);
    await expect(
      service.create(admin, identity('ada'), CI),
    ).resolves.toMatchObject({ key: { name: 'GitHub Actions' } });
    // Reading alone does not change anything.
    const reader: AccessViewer = {
      userId: 'ada',
      permissions: {
        ...admin.permissions,
        settings: {
          ...admin.permissions.settings,
          'studio.apiKeys/manage': false,
        },
      },
    };
    expect(await service.list(reader)).toHaveLength(1);
    await expect(
      service.create(reader, identity('ada'), CI),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('lets every built-in role make keys of its own, until an organization takes studio.personalApiKeys away', async () => {
    await addUser('alice');
    await assign('alice', 'contributor');
    const policy = personalKeyPolicy(() => access);
    expect(await policy('alice')).toBe(true);
    expect(await policy('root')).toBe(true);
    const contributor = await authz.permissionSets.get('contributor');
    await authz.permissionSets.update('contributor', {
      key: 'contributor',
      grants: contributor!.grants.filter(
        (grant) => grant.resource.id !== 'studio.personalApiKeys',
      ),
    });
    expect(await policy('alice')).toBe(false);
    keys.setOwnKeyPolicy(policy);
    await expect(keys.requireOwnCreation('alice')).rejects.toMatchObject({
      code: 'API_KEY_CREATION_FORBIDDEN',
    });
  });
});

describe('a key’s identity', () => {
  it('is never a member, a role holder, an administrator nor offered a role', async () => {
    await addUser('alice');
    const root = await viewer('root');
    const created = await service.create(root, identity('root'), CI);
    const id = created.key.id;
    expect(
      (await access.roles.members(root)).map((member) => member.userId),
    ).toEqual(['alice']);
    await database.transaction((conn) => access.projects.admit(conn, id));
    const roles = await access.roles.list(root);
    expect(roles.map((role) => role.key)).toEqual([
      'owner',
      'admin',
      'contributor',
    ]);
    expect(roles.flatMap((role) => role.holderIds)).not.toContain(id);
    expect(
      await access.projects.administrators(database.connection()),
    ).not.toContain(id);
    await expect(
      access.roles.assign(root, id, { roles: ['contributor'] }),
    ).rejects.toMatchObject({ code: 'API_KEY_IDENTITY' });
    // The Users plugin's role picker neither offers the key's own set nor gives the identity a role.
    const scope = createStudioUserRoleScope(authz, access, 'root');
    expect((await scope.options()).map((option) => option.value)).not.toContain(
      apiKeySetOf(id),
    );
    await expect(
      database.transaction((conn) => scope.replace(id, ['contributor'], conn)),
    ).rejects.toMatchObject({ code: 'INVALID_ROLE_SCOPE_VALUE' });
    // The generic permission-set surface neither lists it nor changes it.
    expect(authz.permissionSets.protection(apiKeySetOf(id))).toMatchObject({
      hidden: true,
      allow: [],
    });
    expect(() =>
      authz.permissionSets.assertWritable(apiKeySetOf(id), 'assign'),
    ).toThrow();
    // Nor is it a person anywhere the user directory answers.
    expect((await users.list({})).items.map((user) => user.id)).not.toContain(
      id,
    );
  });
});

describe('a key Studio manages for a repository’s CI', () => {
  it('is made without managing API keys, listed with its repository, and tells Studio when it is disabled or deleted', async () => {
    const revoked: string[] = [];
    const managed = createOrgApiKeyService({
      users: () => users,
      keys: () => keys,
      scopes: () => scopes,
      authz: () => authz,
      access: () => access,
      database,
      newId: () => `e${(next += 1)}`,
      managedBy: (ids) =>
        Promise.resolve(
          new Map(
            ids.map((id) => [
              id,
              {
                resourceId: 'resource-1',
                projectId: 'project-1',
                projectName: 'Shop',
                repo: 'acme/shop',
              },
            ]),
          ),
        ),
      onRevoked: (id, actorId, how) => {
        revoked.push(`${how} ${id} by ${actorId}`);
        return Promise.resolve();
      },
    });
    // Someone who manages the project, not API keys: they still give only what they hold.
    const root = await viewer('root');
    const projectManager: AccessViewer = {
      ...root,
      permissions: {
        ...root.permissions,
        settings: {
          ...root.permissions.settings,
          'studio.apiKeys/read': false,
          'studio.apiKeys/manage': false,
        },
      },
    };
    await expect(
      managed.create(projectManager, identity('root'), CI),
    ).rejects.toMatchObject({ status: 403 });
    const created = await managed.createManaged(
      projectManager,
      identity('root'),
      { ...CI, name: 'acme/shop CI' },
    );
    expect(created.key.managedBy).toEqual({
      resourceId: 'resource-1',
      projectId: 'project-1',
      projectName: 'Shop',
      repo: 'acme/shop',
    });
    expect(await authenticates(created.secret)).toBe(true);
    // Listed with everyone else's, its repository named.
    expect(
      (await managed.list(root)).find((key) => key.id === created.key.id)
        ?.managedBy?.repo,
    ).toBe('acme/shop');
    // Studio rotates it on its own: nobody is named as the actor.
    const rotated = await managed.rotateManaged(created.key.id, null);
    expect(await authenticates(created.secret)).toBe(false);
    expect(await authenticates(rotated.secret)).toBe(true);
    expect(
      (await managed.events(root, created.key.id)).find(
        (event) => event.action === 'rotated',
      )?.actor,
    ).toBeNull();
    // Narrowed as the person, too.
    const narrowed = await managed.setScopeManaged(
      projectManager,
      identity('root'),
      created.key.id,
      { groups: { 'releases.apps': { level: 'write' } } },
    );
    expect(narrowed.scope).toEqual({
      groups: { 'releases.apps': { level: 'write' } },
    });
    expect(await managed.find('nobody')).toBeNull();
    // Still the organization's to disable or delete: Studio hears of it.
    await managed.disable(root, created.key.id);
    await managed.remove(root, created.key.id);
    expect(revoked).toEqual([
      `disabled ${created.key.id} by root`,
      `deleted ${created.key.id} by root`,
    ]);
  });
});

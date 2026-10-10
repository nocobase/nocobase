// @vitest-environment node
/**
 * Release management on Studio's roles over a real database: what the built-in roles give, what "related" means
 * through the repositories of projects someone leads, agents kept off protected environments, a deployment request
 * decided through the inbox, and the Preview environment a fresh installation gets.
 */
import { createSecretsService } from '@nocobase/app-server/secrets';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { createAppAuthorization } from '@nocobase/app-plugin-authorization';
import {
  createDriverRegistry,
  createReleases,
  SYSTEM_CALLER,
  type Releases,
} from '@nocobase/app-plugin-releases/server';
import type { ReleasesAccess } from '@nocobase/app-plugin-releases/server/tokens';
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

import type { InboxSend } from '../../server/inbox/port.js';
import { registerAccess } from '../access/registry.js';
import { createStudioAccess } from '../../server/access/service.js';
import { createStudioReleasesAccess } from '../../server/releases/access.js';
import {
  bindReleasesInbox,
  releaseFacts,
} from '../../server/releases/inbox.js';
import {
  createRepositoryLinks,
  type LinkViewer,
  type RepositoryLinks,
} from '../../server/releases/links.js';
import {
  createPreviewEnvironment,
  linkReleases,
} from '../../server/releases/provider.js';
import { createArtifact, createFakeDriver } from './fixtures.js';

const require = createRequire(import.meta.url);
const packageRoot = (name: string) =>
  path.dirname(require.resolve(`${name}/package.json`));
const ROOT = path.resolve(import.meta.dirname, '../..');
const PROJECTS = '@nocobase/app-plugin-projects';
const RELEASES = '@nocobase/app-plugin-releases';

let databases: ProvisionedTestDatabases;
let testDatabase: TestDatabase;
let database: DatabaseManager;
let access: ReturnType<typeof createStudioAccess>;
let links: RepositoryLinks;
let port: ReleasesAccess;
let releases: Releases;
let dir: string;
let next = 0;

async function addUser(id: string, roles: readonly string[] = []) {
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
  for (const set of roles)
    await database
      .connection()
      .query.insertInto('authorizationPermissionSetAssignments')
      .values({
        id: `user:${id}:${set}`,
        subjectType: 'user',
        subjectId: id,
        permissionSetKey: set,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
}

async function viewer(userId: string): Promise<LinkViewer> {
  return {
    userId,
    permissions: await access.permissionsOf({
      principal: { type: 'user', id: userId },
      subjects: [{ type: 'authenticated', id: '*' }],
    }),
  };
}

/** A project led by `lead`, visible to its members only, with one repository. */
async function project(
  id: string,
  lead: string,
  members: readonly string[] = [],
): Promise<string> {
  const now = new Date();
  const conn = database.connection();
  await conn.query
    .insertInto('pmProjects')
    .values({
      id,
      name: id,
      visibility: 'members',
      status: 'in_progress',
      priority: 'none',
      leadUserId: lead,
      createdAt: now,
      updatedAt: now,
    })
    .execute();
  for (const userId of members)
    await conn.query
      .insertInto('pmProjectMembers')
      .values({ id: `${id}-${userId}`, projectId: id, userId, createdAt: now })
      .execute();
  await conn.query
    .insertInto('pmProjectResources')
    .values({
      id: `${id}-repo`,
      projectId: id,
      type: 'gitRepo',
      url: `https://git.example.com/${id}.git`,
      position: 0,
      createdAt: now,
      updatedAt: now,
    })
    .execute();
  return `${id}-repo`;
}

beforeAll(async () => {
  databases = await provisionTestDatabases();
});
afterAll(() => databases.drop());

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'studio-releases-access-'));
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
        [path.join(packageRoot(RELEASES), 'database/migrations'), RELEASES],
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
  await addUser('root', ['root']);
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
  const authz = createAppAuthorization({ connection: database.connection() });
  registerAccess(authz);
  access = createStudioAccess({
    authz,
    database,
    rootSet: 'root',
    defaultSet: 'member',
    newKey: () => `k${(next += 1)}`,
  });
  const drivers = createDriverRegistry();
  drivers.register(createFakeDriver('fake').driver);
  releases = createReleases({
    database,
    config: {
      artifact: {
        driver: 'fs',
        location: path.join(dir, 'artifacts'),
        visibility: 'private',
      },
      dataDir: path.join(dir, 'data'),
    },
    drivers,
    access: () => port,
    secrets: createSecretsService({
      keys: [{ version: 1, key: 'e'.repeat(64) }],
    }),
  });
  const adapter = linkReleases(() => releases);
  links = createRepositoryLinks({
    database,
    releases: () => adapter,
    newId: () => `l${(next += 1)}`,
  });
  port = createStudioReleasesAccess({
    access: () => access,
    links: () => links,
    database,
  });
  await addUser('alice', ['admin']);
  for (const id of ['bob', 'carol', 'dave']) await addUser(id, ['contributor']);
  await releases.environments.create(SYSTEM_CALLER, {
    id: 'staging',
    name: 'Staging',
    driver: 'fake',
  });
  await releases.environments.create(SYSTEM_CALLER, {
    id: 'production',
    name: 'Production',
    driver: 'fake',
    protected: true,
  });
});

afterEach(async () => {
  await releases.releases.shutdown();
  await testDatabase.destroy();
  rmSync(dir, { recursive: true, force: true });
});

describe('the built-in roles', () => {
  it('give a contributor related work on Apps, read-only settings and no protected deploys; admins and owners everything', async () => {
    const contributor = await port.permissionsOfUser('bob');
    const related = { users: ['bob'] };
    expect(contributor.scopes).toEqual({
      'rel.apps/view': related,
      'rel.apps/read-logs': related,
      'rel.apps/create': 'none',
      'rel.apps/configure': related,
      'rel.apps/upload': related,
      'rel.apps/deploy': related,
      'rel.apps/deploy-protected': 'none',
      'rel.apps/operate': related,
      'rel.apps/delete': 'none',
    });
    expect(contributor.settings).toEqual({
      'rel.environments/read': true,
      'rel.environments/manage': false,
    });
    expect(contributor.pages).toEqual({ 'rel-apps': true });
    for (const user of ['alice', 'root']) {
      const all = await port.permissionsOfUser(user);
      expect(Object.values(all.scopes).every((scope) => scope === 'all')).toBe(
        true,
      );
      expect(Object.values(all.settings).every(Boolean)).toBe(true);
    }
    await addUser('olga', ['owner']);
    expect(
      (await port.permissionsOfUser('olga')).scopes['rel.apps/delete'],
    ).toBe('all');
  });
});

describe('related Apps', () => {
  it('are the ones a user created, or linked to a repository of a project they lead (seeing: of one they belong to)', async () => {
    const alice = await releases.callerForUser('alice');
    await releases.releases.createApp(alice, {
      id: 'crm',
      name: 'CRM',
      environmentId: 'staging',
    });
    const repo = await project('crm-project', 'bob', ['carol']);
    const callers = {
      bob: await releases.callerForUser('bob'),
      carol: await releases.callerForUser('carol'),
      dave: await releases.callerForUser('dave'),
    };
    const app = (await releases.releases.findApp('crm'))!;
    expect(await releases.guard.canApp(callers.bob, 'view', app)).toBe(false);

    // The lead may not link an App they cannot configure yet.
    await expect(
      links.save(await viewer('bob'), repo, {
        apps: [{ appId: 'crm', role: 'staging', previewEnvironmentId: null }],
      }),
    ).rejects.toMatchObject({ code: 'APP_NOT_CONFIGURABLE' });
    // An administrator links it.
    await links.save(await viewer('alice'), repo, {
      apps: [
        { appId: 'crm', role: 'staging', previewEnvironmentId: 'staging' },
      ],
    });
    expect((await links.read(await viewer('carol'), repo)).apps).toEqual([
      {
        appId: 'crm',
        role: 'staging',
        previewEnvironmentId: 'staging',
        name: 'CRM',
        environmentId: 'staging',
      },
    ]);
    // The App names the repository that builds it to whoever may see the project.
    expect(await links.appRepositories(await viewer('carol'), 'crm')).toEqual([
      {
        resourceId: repo,
        projectId: 'crm-project',
        projectName: 'crm-project',
        repo: null,
        url: 'https://git.example.com/crm-project.git',
        pullRequest: null,
      },
    ]);
    expect(await links.appRepositories(await viewer('dave'), 'crm')).toEqual(
      [],
    );

    for (const action of ['view', 'deploy', 'configure', 'operate'] as const)
      expect(await releases.guard.canApp(callers.bob, action, app)).toBe(true);
    // A member of the project sees it, but does not lead it.
    expect(await releases.guard.canApp(callers.carol, 'view', app)).toBe(true);
    expect(await releases.guard.canApp(callers.carol, 'read-logs', app)).toBe(
      true,
    );
    expect(await releases.guard.canApp(callers.carol, 'deploy', app)).toBe(
      false,
    );
    expect(await releases.guard.canApp(callers.dave, 'view', app)).toBe(false);
    // Deleting is not a contributor's, related or not.
    expect(await releases.guard.canApp(callers.bob, 'delete', app)).toBe(false);
    expect(
      (await releases.releases.listApps(callers.bob)).items.map(
        (item) => item.app.id,
      ),
    ).toEqual(['crm']);
    expect((await releases.releases.listApps(callers.dave)).items).toHaveLength(
      0,
    );
    // Only someone who manages the project changes where it deploys.
    await expect(
      links.save(await viewer('carol'), repo, { apps: [] }),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('agents', () => {
  it('are marked by their principal, and only request a deployment to a protected environment', async () => {
    expect(port.actorKindOf?.({ principal: { type: 'agent', id: 'a1' } })).toBe(
      'agent',
    );
    expect(port.actorKindOf?.({ principal: { type: 'user', id: 'bob' } })).toBe(
      'human',
    );
    const alice = await releases.callerForUser('alice');
    await releases.releases.createApp(alice, {
      id: 'shop',
      name: 'Shop',
      environmentId: 'production',
    });
    const { bytes } = await createArtifact(dir, '1.0.0');
    const release = await releases.releases.uploadRelease(alice, 'shop', {
      stream: [bytes] as never,
    });
    const agent = await releases.callerForUser('alice', 'agent');
    // Nobody deploys there directly, an agent or a person holding deploy-protected.
    for (const caller of [agent, alice])
      await expect(
        releases.releases.deploy(caller, 'shop', { releaseId: release.id }),
      ).rejects.toMatchObject({ reason: 'APPROVAL_REQUIRED' });
    await expect(
      releases.releases.deleteApp(agent, 'shop', { confirm: 'shop' }),
    ).rejects.toMatchObject({ reason: 'HUMAN_REQUIRED' });
    // The agent asks instead, and never decides.
    const request = await releases.requests.create(agent, 'shop', {
      releaseId: release.id,
    });
    expect(request).toMatchObject({ status: 'pending', requestedVia: 'agent' });
    await expect(
      releases.requests.approve(agent, request.id, undefined, 'shop'),
    ).rejects.toMatchObject({ reason: 'HUMAN_REQUIRED' });
  });
});

describe('a deployment request', () => {
  it('reaches the approvers’ inboxes, is approved from there and deploys', async () => {
    const alice = await releases.callerForUser('alice');
    await releases.environments.update(SYSTEM_CALLER, 'production', {
      approvers: ['admins'],
    });
    await releases.releases.createApp(alice, {
      id: 'shop',
      name: 'Shop',
      environmentId: 'production',
    });
    const repo = await project('shop-project', 'bob');
    await links.save(await viewer('alice'), repo, {
      apps: [{ appId: 'shop', role: 'production', previewEnvironmentId: null }],
    });
    const { bytes } = await createArtifact(dir, '1.4.0');
    const release = await releases.releases.uploadRelease(alice, 'shop', {
      stream: [bytes] as never,
    });

    const sent: InboxSend[] = [];
    const settled: unknown[] = [];
    const stop = bindReleasesInbox({
      events: releases.events,
      port: () => ({
        send: (notice) => {
          sent.push(notice);
          return Promise.resolve();
        },
        resolve: (ref) => {
          settled.push(ref);
          return Promise.resolve();
        },
        withdraw: (ref) => {
          settled.push({ ...ref, outcome: 'withdrawn' });
          return Promise.resolve();
        },
        settle: () => Promise.resolve(),
      }),
      lookup: {
        userName: (id) => Promise.resolve(id),
        environmentName: async (id) =>
          (await releases.environments.find(id))?.name ?? null,
        release: async (appId, releaseId) =>
          releaseFacts(
            await releases.releases.getRelease(SYSTEM_CALLER, appId, releaseId),
            database.connection(),
          ),
        requester: async (id) =>
          (await releases.requests.get(SYSTEM_CALLER, id)).requestedBy,
      },
    });

    // Bob leads the project the App deploys from, so he may deploy it: on a protected environment, only by asking.
    const bob = await releases.callerForUser('bob');
    await expect(
      releases.releases.deploy(bob, 'shop', { releaseId: release.id }),
    ).rejects.toMatchObject({ reason: 'APPROVAL_REQUIRED' });
    const request = await releases.requests.create(bob, 'shop', {
      releaseId: release.id,
      note: 'Ready for production.',
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      kind: 'decision',
      type: 'deployment_requested',
      // The owners and administrators: the seeded superuser owns the installation.
      userIds: ['alice', 'root'],
      decisionKey: request.id,
      data: {
        appName: 'Shop',
        environmentName: 'Production',
        releaseVersion: '1.4.0',
        requesterName: 'bob',
      },
    });

    // Bob, who is no approver, cannot approve his request; Alice, an approver, does.
    await expect(
      releases.requests.approve(bob, request.id),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    // Production is protected: approving asks for the App ID typed again, as deploying there directly does.
    await expect(
      releases.requests.approve(alice, request.id),
    ).rejects.toMatchObject({ reason: 'CONFIRMATION_REQUIRED' });
    expect(settled).toEqual([]);
    const approved = await releases.requests.approve(
      alice,
      request.id,
      undefined,
      'shop',
    );
    expect(settled).toEqual([
      { source: 'releases', decisionKey: request.id, outcome: 'approved' },
    ]);
    expect(sent[1]).toMatchObject({
      type: 'deployment_request_decided',
      userIds: ['bob'],
      data: { decision: 'approved' },
    });
    expect(
      (await releases.releases.waitForDeployment(approved.deploymentId!))
        .status,
    ).toBe('succeeded');
    stop();
  });
});

describe('a fresh installation', () => {
  it('gets an unprotected Preview environment on the Host once, when the Host is there', async () => {
    // Without the Host driver nothing is created, and the request waits.
    expect(
      await createPreviewEnvironment({
        database,
        releases,
        locale: 'zh-CN',
      }),
    ).toBe(false);
    expect(await releases.environments.find('preview')).toBeNull();

    releases.drivers.register(createFakeDriver('host').driver);
    expect(
      await createPreviewEnvironment({
        database,
        releases,
        locale: 'zh-CN',
      }),
    ).toBe(true);
    expect(await releases.environments.find('preview')).toMatchObject({
      name: '预览',
      driver: 'host',
      config: { backend: 'in-process' },
      publicUrl: '/{appId}/',
      protected: false,
      maxApps: 20,
      defaultIdleStopMinutes: 10,
      defaultDormantAfterHours: 24,
    });
    // Named in the installation's language: switching it renames the environment while Studio's name is untouched.
    expect(
      await createPreviewEnvironment({ database, releases, locale: 'en-US' }),
    ).toBe(false);
    expect((await releases.environments.find('preview'))?.name).toBe('Preview');
    await releases.environments.update(SYSTEM_CALLER, 'preview', {
      name: 'Review apps',
    });
    await createPreviewEnvironment({ database, releases, locale: 'zh-CN' });
    expect((await releases.environments.find('preview'))?.name).toBe(
      'Review apps',
    );
    // Once: deleting it does not bring it back.
    await releases.environments.remove(SYSTEM_CALLER, 'preview');
    expect(
      await createPreviewEnvironment({ database, releases, locale: 'en-US' }),
    ).toBe(false);
    expect(await releases.environments.find('preview')).toBeNull();
  });
});

// @vitest-environment node
/**
 * Deleting an App a repository builds (`server/releases/app-removal.ts`), over a real database, release management on
 * an in-memory driver and the GitHub stand-in (nothing reaches the network); the organization's API keys are a
 * stand-in recording what was asked of them:
 *
 * - before: what deleting it stops, for the Delete App confirmation, with the pull request previews of it;
 * - after: what CI recorded of it removed (its role off), the CI key narrowed to the Apps left (none at all, CI then
 *   creating the App again on its next deploy), its pull request previews removed and the project's lead told.
 */
import type { Caller } from '@nocobase/app-plugin-releases/server';
import { SYSTEM_CALLER } from '@nocobase/app-plugin-releases/server';
import { allPermissions } from '@nocobase/app-plugin-releases/shared/access';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
import {
  createCiSetup,
  type CiKeys,
  type CiSetup,
} from '../../server/builds/ci-setup.js';
import type { InboxSend } from '../../server/inbox/port.js';
import {
  createProjectInits,
  type ProjectInits,
} from '../../server/projects-init/service.js';
import {
  createAppRemoval,
  REPOSITORY_APP_REMOVED,
  type AppRemoval,
} from '../../server/releases/app-removal.js';
import {
  createRepositoryLinks,
  type LinkViewer,
  type RepositoryLinks,
} from '../../server/releases/links.js';
import {
  linkReleases,
  removalReleases,
} from '../../server/releases/provider.js';
import type { GitConnection } from '../../shared/git.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
let inits: ProjectInits;
let links: RepositoryLinks;
let ci: CiSetup;
let removal: AppRemoval;
let connection: GitConnection;
let keyApps: Map<string, string[]>;
let calls: string[];
let sent: InboxSend[];

const linkViewer = (userId: string): LinkViewer => ({
  userId,
  permissions: { scopes: h.viewer(userId).permissions.scopes },
});

function fakeKeys(): CiKeys {
  return {
    async create(userId, input) {
      const id = `key-${keyApps.size + 1}`;
      keyApps.set(id, [...input.appIds]);
      calls.push(`create ${userId} ${input.appIds.join(',')}`);
      return Promise.resolve({ id, secret: `${id}-secret` });
    },
    async setApps(userId, id, appIds) {
      calls.push(`setApps ${userId} ${id} ${appIds.join(',')}`);
      keyApps.set(id, [...appIds]);
      return Promise.resolve();
    },
    async rotate(id) {
      return Promise.resolve({ secret: `${id}-rotated` });
    },
    async find(id) {
      const appIds = keyApps.get(id);
      return Promise.resolve(
        appIds
          ? {
              id,
              name: 'acme/shop CI',
              expiresAt: null,
              status: 'active' as const,
              appIds,
            }
          : null,
      );
    },
  };
}

beforeEach(async () => {
  keyApps = new Map();
  calls = [];
  sent = [];
  h = await createBridgeHarness({ releases: true });
  for (const id of ['alice', 'bob', 'root']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  h.roles.set('root', 'owner');
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  h.github.app.installations.set('acme', '77');
  connection = await h.gitConnections.create('alice', {
    kind: 'app',
    name: 'Acme app',
    appId: h.github.app.appId,
    privateKey: h.github.app.privateKey,
    account: 'acme',
    clientId: h.github.app.clientId,
    clientSecret: h.github.app.clientSecret,
    webhookSecret: 'a-webhook-secret-long-enough',
  });
  const releases = h.releases!;
  for (const environment of [
    { id: 'preview', name: 'Preview' },
    { id: 'staging', name: 'Staging' },
    { id: 'production', name: 'Production' },
  ])
    await releases.environments.create(SYSTEM_CALLER, {
      driver: 'fake',
      ...environment,
    });
  const adapter = linkReleases(() => releases);
  const inbox = {
    send: (notice: InboxSend) => {
      sent.push(notice);
      return Promise.resolve();
    },
    resolve: () => Promise.resolve(),
    withdraw: () => Promise.resolve(),
    settle: () => Promise.resolve(),
  };
  ci = createCiSetup({
    database: h.database,
    connections: () => h.gitConnections,
    keys: fakeKeys,
    inbox: () => inbox,
    administrators: () => Promise.resolve(['root']),
    studioUrl: () => 'https://studio.example.com',
    onError: () => undefined,
  });
  let next = 0;
  links = createRepositoryLinks({
    database: h.database,
    releases: () => adapter,
    newId: () => `link-${(next += 1)}`,
    ciSetup: () => ci.hook,
  });
  removal = createAppRemoval({
    database: h.database,
    links: () => links,
    releases: () => removalReleases(() => releases),
    ciSetup: () => ci,
    inbox: () => inbox,
    onError: (message, error) => {
      throw Object.assign(new Error(message), { cause: error });
    },
  });
  releases.events.subscribe((event) => removal.releasesEvent(event));
  inits = createProjectInits({
    database: h.database,
    projects: () => h.projects,
    agents: () => h.agents,
    connections: () => h.gitConnections,
    git: () => h.git,
    links: () => links,
    ci: () => ci,
    viewerOf: (userId) => Promise.resolve(h.viewer(userId)),
    newId: () => `init-${(next += 1)}`,
    onError: () => undefined,
  });
});

afterEach(async () => {
  await inits.settled();
  await h.close();
});

/** A project Shop led by alice, its repository previewed, in staging and in production, its CI set up by Studio. */
async function shop(): Promise<string> {
  const repo = h.github.addRepo('acme/shop');
  const created = await inits.newProject(h.viewer('alice'), {
    name: 'Shop',
    codeLocation: 'existingRepo',
    existingRepo: {
      connectionId: connection.id,
      repoId: String(repo.id),
      fullName: 'acme/shop',
      cloneUrl: 'https://github.com/acme/shop.git',
      defaultBranch: 'main',
    },
    deploy: {
      previewEnvironmentId: 'preview',
      stagingEnvironmentId: 'staging',
      productionEnvironmentId: 'production',
      configureCi: true,
    },
    ci: { method: 'direct' },
  });
  return created.resourceId!;
}

/** A pull request's preview of `appId` in the repository, as Studio's previews create it: its row and its App. */
async function previewOf(
  resourceId: string,
  appId: string,
  number: number,
): Promise<string> {
  const id = `${appId}-pr-${number}`;
  await h.releases!.releases.createApp(
    { userId: 'alice', kind: 'rule', permissions: allPermissions() },
    {
      id,
      name: id,
      environmentId: 'preview',
      labels: { studio: 'preview', previewOf: appId, pr: String(number) },
      previewOf: appId,
    },
  );
  await h.database
    .connection()
    .query.insertInto('studioPreviews')
    .values({
      id: `pv-${id}`,
      resourceId,
      pullRequestId: `pr-${number}`,
      repo: 'acme/shop',
      number,
      targetAppId: appId,
      appId: id,
      environmentId: 'preview',
      status: 'ready',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .execute();
  return id;
}

/** The owner, deleting the App in release management. */
const root = (): Promise<Caller> =>
  Promise.resolve({
    userId: 'root',
    kind: 'human',
    permissions: allPermissions(),
  });

describe('the repository of a preview App', () => {
  it('names the repository and the pull request it previews', async () => {
    const resourceId = await shop();
    const preview = await previewOf(resourceId, 'shop-staging', 18);
    expect(await links.appRepositories(linkViewer('alice'), preview)).toEqual([
      expect.objectContaining({
        resourceId,
        projectName: 'Shop',
        repo: 'acme/shop',
        pullRequest: 18,
      }),
    ]);
    // The App it previews is built by the repository, not previewing a pull request.
    expect(
      await links.appRepositories(linkViewer('alice'), 'shop-staging'),
    ).toEqual([expect.objectContaining({ resourceId, pullRequest: null })]);
  });
});

describe('deleting an App a repository builds', () => {
  it('says beforehand what it stops', async () => {
    const resourceId = await shop();
    await previewOf(resourceId, 'shop-staging', 1);
    expect(await removal.usage(linkViewer('alice'), 'shop-staging')).toEqual({
      appId: 'shop-staging',
      repositories: [
        expect.objectContaining({
          resourceId,
          projectName: 'Shop',
          repo: 'acme/shop',
          role: 'staging',
          previews: true,
        }),
      ],
      runningPreviews: 1,
    });
    expect(await removal.usage(linkViewer('alice'), 'unknown')).toEqual({
      appId: 'unknown',
      repositories: [],
      runningPreviews: 0,
    });
  });

  it('removes what CI recorded of it, narrows the CI key, removes its pull request previews and tells the lead', async () => {
    const resourceId = await shop();
    expect(calls).toEqual(['create alice shop,shop-staging']);
    const preview = await previewOf(resourceId, 'shop-staging', 1);
    await h.releases!.releases.deleteApp(await root(), 'shop-staging', {
      confirm: 'shop-staging',
    });
    const deployment = await links.read(linkViewer('alice'), resourceId);
    // The staging role is off: only production is left.
    expect(deployment.apps).toEqual([
      expect.objectContaining({
        appId: 'shop',
        role: 'production',
        previewEnvironmentId: null,
      }),
    ]);
    // As the person who chose the setup, not the one who deleted the App.
    expect(calls.at(-1)).toBe('setApps alice key-1 shop');
    expect(await h.releases!.releases.findApp(preview)).toBeNull();
    expect(sent).toEqual([
      expect.objectContaining({
        source: 'ci',
        type: REPOSITORY_APP_REMOVED,
        userIds: ['alice'],
        path: expect.stringContaining(
          `/settings?section=ci&repo=${resourceId}`,
        ),
        data: expect.objectContaining({
          appId: 'shop-staging',
          repo: 'acme/shop',
          role: 'staging',
          previews: true,
        }),
      }),
    ]);
  });

  it('narrows the key to no App once none is left, nothing offered to recreate: CI does on its next deploy', async () => {
    const resourceId = await shop();
    for (const appId of ['shop-staging', 'shop'])
      await h.releases!.releases.deleteApp(await root(), appId, {
        confirm: appId,
      });
    expect(calls.at(-1)).toBe('setApps alice key-1 ');
    expect((await links.read(linkViewer('alice'), resourceId)).apps).toEqual(
      [],
    );
    expect((await ci.view(resourceId, true)).lastError).toBeNull();
  });
});

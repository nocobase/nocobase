// @vitest-environment node
/**
 * Studio configuring a repository's CI (`server/builds/ci-setup.ts`) with the `direct` run a new project carries, over a
 * real database, release management on an in-memory driver and the GitHub stand-in (nothing reaches the network); the
 * organization's API keys are a stand-in recording what was asked of them (`tests/access/api-keys.test.ts` covers the
 * managed keys themselves):
 *
 * - an existing repository gets a key limited to its Apps, written as the Actions secret `NB_STUDIO_API_KEY`, and its
 *   preview workflow in a pull request from `studio/ci-setup`; merged, the setup is `configured`;
 * - a repository Studio created waits for its initialization, then gets its key and has the workflow committed to its
 *   default branch before the branch is protected;
 * - any failure leaves it `manual` with what failed, and configuring again tries afresh with a new secret;
 * - saving other Apps narrows the key to them, the preview workflow staying as it is;
 * - the daily rotation renews keys about to expire and tells the lead and the administrators when it cannot;
 * - a key someone disabled hands the CI back to the manual setup, tells the lead, and is not replaced by a later save.
 */
import { SYSTEM_CALLER } from '@nocobase/app-plugin-releases/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
import { AccessError } from '../../server/access/errors.js';
import {
  CI_KEY_REVOKED,
  CI_KEY_ROTATION_FAILED,
  CI_SETUP_BRANCH,
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
  createRepositoryLinks,
  type LinkViewer,
  type RepositoryLinks,
} from '../../server/releases/links.js';
import { linkReleases } from '../../server/releases/provider.js';
import type { GitConnection } from '../../shared/git.js';
import type { NewProjectRequest } from '../../shared/project-init.js';
import type { DeploySettings } from '../../shared/releases.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

const STUDIO = 'https://studio.example.com';
const WORKFLOW = '.github/workflows/nb-studio-shop-preview.yml';

interface FakeKey {
  id: string;
  name: string;
  description: string;
  appIds: string[];
  secret: string;
  expiresAt: string | null;
  status: 'active' | 'disabled' | 'expired';
  createdBy: string;
}

let h: BridgeHarness;
let inits: ProjectInits;
let links: RepositoryLinks;
let ci: CiSetup;
let connection: GitConnection;
let agentId: string;
let keys: Map<string, FakeKey>;
let calls: string[];
let sent: InboxSend[];
let refuseKeys: string | null;

const alice = () => h.viewer('alice');
const linkViewer = (userId: string): LinkViewer => ({
  userId,
  permissions: { scopes: h.viewer(userId).permissions.scopes },
});

/** The organization's keys as the setup sees them, recording what it asked. */
function fakeKeys(): CiKeys {
  return {
    async create(userId, input) {
      if (refuseKeys)
        throw new AccessError(
          'PERMISSION_DENIED',
          'KEY_SCOPE_EXCEEDS_YOURS',
          refuseKeys,
        );
      const next = keys.size + 1;
      const key: FakeKey = {
        id: `key-${next}`,
        name: input.name,
        description: input.description,
        appIds: [...input.appIds],
        secret: `secret-${next}-0`,
        expiresAt: new Date(Date.now() + 90 * 86_400_000).toISOString(),
        status: 'active',
        createdBy: userId,
      };
      keys.set(key.id, key);
      calls.push(`create ${userId} ${input.appIds.join(',')}`);
      return Promise.resolve({ id: key.id, secret: key.secret });
    },
    async setApps(userId, id, appIds) {
      calls.push(`setApps ${userId} ${id} ${appIds.join(',')}`);
      keys.get(id)!.appIds = [...appIds];
      return Promise.resolve();
    },
    async rotate(id, actorId) {
      const key = keys.get(id)!;
      const round = Number(key.secret.split('-').pop()) + 1;
      key.secret = `${key.secret.split('-').slice(0, 2).join('-')}-${round}`;
      key.expiresAt = new Date(Date.now() + 90 * 86_400_000).toISOString();
      key.status = 'active';
      calls.push(`rotate ${id} ${actorId ?? 'studio'}`);
      return Promise.resolve({ secret: key.secret });
    },
    async find(id) {
      const key = keys.get(id);
      return Promise.resolve(
        key
          ? {
              id: key.id,
              name: key.name,
              expiresAt: key.expiresAt,
              status: key.status,
              appIds: key.appIds,
            }
          : null,
      );
    },
  };
}

beforeEach(async () => {
  keys = new Map();
  calls = [];
  sent = [];
  refuseKeys = null;
  h = await createBridgeHarness({ releases: true });
  for (const id of ['alice', 'bob', 'root']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  h.roles.set('root', 'owner');
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  agentId = await h.createAgent({ name: 'Coder' });
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
    { id: 'production', name: 'Production', protected: true },
  ])
    await releases.environments.create(SYSTEM_CALLER, {
      driver: 'fake',
      ...environment,
    });
  const adapter = linkReleases(() => releases);
  ci = createCiSetup({
    database: h.database,
    connections: () => h.gitConnections,
    keys: fakeKeys,
    inbox: () => ({
      send: (notice) => {
        sent.push(notice);
        return Promise.resolve();
      },
      resolve: () => Promise.resolve(),
      withdraw: () => Promise.resolve(),
      settle: () => Promise.resolve(),
    }),
    administrators: () => Promise.resolve(['root']),
    studioUrl: () => STUDIO,
    onError: () => undefined,
  });
  let next = 0;
  links = createRepositoryLinks({
    database: h.database,
    releases: () => adapter,
    newId: () => `link-${(next += 1)}`,
    ciSetup: () => ci.hook,
  });
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

const deploy = (patch: Partial<DeploySettings> = {}): DeploySettings => ({
  previewEnvironmentId: 'preview',
  stagingEnvironmentId: 'staging',
  productionEnvironmentId: 'production',
  configureCi: true,
  ...patch,
});

function existingShop(
  patch: Partial<NewProjectRequest> = {},
): NewProjectRequest {
  const repo = h.github.repos.get('acme/shop') ?? h.github.addRepo('acme/shop');
  return {
    name: 'Shop',
    codeLocation: 'existingRepo',
    existingRepo: {
      connectionId: connection.id,
      repoId: String(repo.id),
      fullName: 'acme/shop',
      cloneUrl: 'https://github.com/acme/shop.git',
      defaultBranch: 'main',
    },
    deploy: deploy(),
    ci: { method: 'direct' },
    ...patch,
  };
}

const fileOn = (branch: string) =>
  h.github.files.get(`acme/shop@${branch}:${WORKFLOW}`)?.content;

describe('an existing repository', () => {
  it('gets a key limited to its Apps as a repository secret, and the workflow in a pull request', async () => {
    const created = await inits.newProject(alice(), existingShop());
    const resourceId = created.resourceId!;
    expect(calls).toEqual(['create alice shop,shop-staging']);
    const key = keys.get('key-1')!;
    expect(key).toMatchObject({
      name: 'acme/shop CI',
      description: expect.stringContaining(
        'Managed by repository acme/shop (project Shop)',
      ),
    });
    expect(h.github.openSecret('acme/shop', 'NB_STUDIO_API_KEY')).toBe(
      key.secret,
    );
    // Proposed, never pushed to the default branch.
    expect(fileOn('main')).toBeUndefined();
    const workflow = fileOn(CI_SETUP_BRANCH)!;
    expect(workflow.split('\n')[0]).toBe(
      `# Managed by NocoBase Studio (${STUDIO}): deploys shop on the pull requests that touch it: builds the head and deploys it to the pull request's own App in preview.`,
    );
    // Pull requests by default, in the Preview environment.
    expect(workflow).toContain("ENVIRONMENT: 'preview'");
    expect(workflow).not.toContain('push:');
    const pull = h.github.pull('acme/shop', 1);
    expect(pull).toMatchObject({
      title: 'Add Studio CI workflows',
      head: { ref: CI_SETUP_BRANCH },
      base: { ref: 'main' },
    });
    expect(await ci.view(resourceId, true)).toMatchObject({
      state: 'pr-open',
      repo: 'acme/shop',
      key: { id: 'key-1', name: 'acme/shop CI', status: 'active' },
      secretName: 'NB_STUDIO_API_KEY',
      secretKind: 'GitHub Actions secret',
      workflowPaths: [WORKFLOW],
      pullRequest: {
        number: 1,
        url: 'https://github.com/acme/shop/pull/1',
      },
      lastError: null,
    });
    // Merged on GitHub: the setup notices it when read.
    h.github.merge('acme/shop', 1, 'alice-gh');
    expect((await ci.view(resourceId, false)).state).toBe('configured');
  });

  it('falls back to the manual setup on any failure, and configuring again tries with a fresh secret', async () => {
    h.github.failures.set('acme/shop/actions/secrets', 403);
    const created = await inits.newProject(alice(), existingShop());
    const resourceId = created.resourceId!;
    expect(await ci.view(resourceId, true)).toMatchObject({
      state: 'manual',
      key: { id: 'key-1' },
      lastError: 'GitHub answered 403.',
      lastFailure: { reason: 'hostForbidden' },
    });
    expect(h.github.files.size).toBe(0);
    h.github.failures.clear();
    await ci.configure('alice', resourceId, { method: 'direct' });
    expect(calls).toEqual([
      'create alice shop,shop-staging',
      'rotate key-1 alice',
    ]);
    expect(h.github.openSecret('acme/shop', 'NB_STUDIO_API_KEY')).toBe(
      keys.get('key-1')!.secret,
    );
    expect(await ci.view(resourceId, true)).toMatchObject({
      state: 'pr-open',
      lastError: null,
      lastFailure: null,
    });
  });

  it('records why a key cannot be made, such as permissions the person lacks', async () => {
    refuseKeys = 'A key may hold only permissions you hold yourself.';
    const created = await inits.newProject(alice(), existingShop());
    expect(await ci.view(created.resourceId!, true)).toMatchObject({
      state: 'manual',
      key: null,
      lastError: 'A key may hold only permissions you hold yourself.',
      lastFailure: { reason: 'keyScope' },
    });
    expect(
      h.github.requests.some((request) => request.path.endsWith('/pulls')),
    ).toBe(false);
  });

  it('keeps the key in step with the Apps saved later, the preview workflow as it is', async () => {
    const created = await inits.newProject(alice(), existingShop());
    const resourceId = created.resourceId!;
    const before = fileOn(CI_SETUP_BRANCH)!;
    await links.save(linkViewer('alice'), resourceId, {
      apps: [
        { appId: 'shop-staging', role: 'staging', previewEnvironmentId: null },
      ],
      plan: deploy({ productionEnvironmentId: null }),
    });
    expect(calls).toEqual([
      'create alice shop,shop-staging',
      'setApps alice key-1 shop-staging',
    ]);
    expect(fileOn(CI_SETUP_BRANCH)).toBe(before);
    // The same pull request still carries it.
    expect(
      h.github.requests.filter(
        (request) =>
          request.method === 'POST' && request.path.endsWith('/pulls'),
      ),
    ).toHaveLength(1);
    expect((await ci.view(resourceId, true)).state).toBe('pr-open');
  });
});

describe('a repository Studio created', () => {
  it('commits the workflow to the default branch once initialized, before protecting it', async () => {
    const created = await inits.newProject(alice(), {
      name: 'Shop',
      initAgentId: agentId,
      codeLocation: 'newRepo',
      newRepo: {
        connectionId: connection.id,
        name: 'shop',
        private: true,
        init: { method: 'prompt', prompt: 'A shop.' },
      },
      deploy: deploy(),
      ci: { method: 'direct' },
    });
    const resourceId = created.resourceId!;
    // Empty until its initialization pushes: nothing to commit to, nothing made yet.
    expect(await ci.view(resourceId, true)).toMatchObject({
      state: 'pending',
      key: null,
    });
    expect(calls).toEqual([]);
    const payload = await h.claimOne();
    // The agent's first push reaches GitHub, which tells Studio.
    h.github.repos.get('acme/shop')!.empty = false;
    await inits.repoEvent({
      type: 'push',
      repoId: 'r',
      repo: 'acme/shop',
      branch: 'main',
      created: true,
      before: '0'.repeat(40),
      after: 'abc',
    });
    await inits.runChanged(payload.run.id as string, 'completed');
    await inits.settled();
    expect(fileOn('main')).toContain('# Managed by NocoBase Studio');
    expect(h.github.repos.get('acme/shop')?.protected).toBe(true);
    // The commit came first: once protected, the branch takes no direct commit.
    const order = h.github.requests
      .filter(
        (request) =>
          request.method === 'PUT' &&
          (request.path.includes('/contents/') ||
            request.path.endsWith('/protection')),
      )
      .map((request) =>
        request.path.endsWith('/protection') ? 'protect' : 'commit',
      );
    expect(order).toEqual(['commit', 'protect']);
    expect(calls).toEqual(['create alice shop,shop-staging']);
    expect(h.github.openSecret('acme/shop', 'NB_STUDIO_API_KEY')).toBe(
      keys.get('key-1')!.secret,
    );
    expect(await ci.view(resourceId, true)).toMatchObject({
      state: 'configured',
      pullRequest: null,
      workflowSha: expect.any(String),
    });
  });
});

describe('the key over time', () => {
  async function configured(): Promise<string> {
    const created = await inits.newProject(alice(), existingShop());
    return created.resourceId!;
  }

  it('rotates a key about to expire and writes its new secret', async () => {
    const resourceId = await configured();
    await ci.rotateExpiring();
    expect(calls).toEqual(['create alice shop,shop-staging']);
    keys.get('key-1')!.expiresAt = new Date(
      Date.now() + 5 * 86_400_000,
    ).toISOString();
    await ci.rotateExpiring();
    expect(calls.at(-1)).toBe('rotate key-1 studio');
    expect(h.github.openSecret('acme/shop', 'NB_STUDIO_API_KEY')).toBe(
      keys.get('key-1')!.secret,
    );
    expect((await ci.view(resourceId, true)).lastRotatedAt).not.toBeNull();
    expect(sent).toEqual([]);
  });

  it('tells the project’s lead and the administrators when a rotation fails', async () => {
    const resourceId = await configured();
    keys.get('key-1')!.expiresAt = new Date(
      Date.now() + 3 * 86_400_000,
    ).toISOString();
    h.github.failures.set('acme/shop/actions/secrets', 404);
    await ci.rotateExpiring();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      source: 'ci',
      type: CI_KEY_ROTATION_FAILED,
      userIds: ['alice', 'root'],
      data: { repo: 'acme/shop', days: 3, keyName: 'acme/shop CI' },
      title: 'CI key for acme/shop expires in 3 days; rotate it manually',
    });
    expect(await ci.view(resourceId, true)).toMatchObject({
      lastError: expect.stringContaining('The CI key could not be rotated'),
      lastFailure: {
        reason: 'rotationFailed',
        params: { cause: 'repositoryNotFound' },
      },
    });
  });

  it('rotates at once for someone who asks', async () => {
    const resourceId = await configured();
    await ci.rotate('alice', resourceId);
    expect(calls.at(-1)).toBe('rotate key-1 alice');
    expect(h.github.openSecret('acme/shop', 'NB_STUDIO_API_KEY')).toBe(
      keys.get('key-1')!.secret,
    );
  });

  it('hands the CI back when someone disables the key, and a later save makes no other', async () => {
    const resourceId = await configured();
    keys.get('key-1')!.status = 'disabled';
    await ci.keyRevoked('key-1', 'root', 'disabled');
    expect(await ci.view(resourceId, true)).toMatchObject({
      state: 'manual',
      key: { id: 'key-1', status: 'disabled' },
      lastError: expect.stringContaining('was disabled'),
      lastFailure: { reason: 'keyRevoked', params: { how: 'disabled' } },
    });
    expect(sent).toEqual([
      expect.objectContaining({
        type: CI_KEY_REVOKED,
        userIds: ['alice'],
        data: expect.objectContaining({ how: 'disabled' }),
      }),
    ]);
    const current = await links.read(linkViewer('alice'), resourceId);
    await links.save(linkViewer('alice'), resourceId, {
      apps: current.apps.map(({ appId, role, previewEnvironmentId }) => ({
        appId,
        role,
        previewEnvironmentId,
      })),
    });
    expect(calls).toEqual(['create alice shop,shop-staging']);
    // Setting it up again makes a new key.
    await ci.setup('alice', resourceId);
    expect(calls.at(-1)).toBe('create alice shop,shop-staging');
    expect((await ci.view(resourceId, true)).key?.id).toBe('key-2');
  });
});

describe('a key revealed for a CI Studio cannot write to', () => {
  async function gitlabShop(): Promise<string> {
    const project = await h.projects.projects.create(alice(), {
      name: 'Shop',
      visibility: 'members',
    });
    return (
      await h.projects.projects.addResource(alice(), project.id, {
        type: 'gitRepo',
        url: 'https://gitlab.example.com/acme/shop.git',
        defaultRef: 'main',
      })
    ).id;
  }

  const stored = async (resourceId: string) =>
    JSON.stringify(
      await h.database
        .connection()
        .query.selectFrom('studioRepoCi')
        .selectAll()
        .where('resourceId', '=', resourceId)
        .execute(),
    );

  it('makes the repository’s managed key and answers its secret once, writing it nowhere', async () => {
    const resourceId = await gitlabShop();
    const secret = await ci.setup('alice', resourceId, { reveal: true });
    expect(calls).toEqual(['create alice ']);
    const key = keys.get('key-1')!;
    expect(secret).toBe(key.secret);
    expect(key).toMatchObject({
      name: 'acme/shop CI',
      description: expect.stringContaining('Managed by repository acme/shop'),
    });
    expect(await ci.view(resourceId, true)).toMatchObject({
      state: 'manual',
      auto: true,
      key: { id: 'key-1', name: 'acme/shop CI', status: 'active' },
      lastError: null,
    });
    expect(await stored(resourceId)).not.toContain(key.secret);
    expect(
      h.github.requests.some((request) => request.path.includes('/secrets')),
    ).toBe(false);
  });

  it('gives the same key a new secret when revealed again or rotated, and the daily rotation leaves it alone', async () => {
    const resourceId = await gitlabShop();
    const first = await ci.setup('alice', resourceId, { reveal: true });
    const again = await ci.setup('alice', resourceId, { reveal: true });
    const rotated = await ci.rotate('alice', resourceId, { reveal: true });
    expect(calls).toEqual([
      'create alice ',
      'rotate key-1 alice',
      'rotate key-1 alice',
    ]);
    expect(new Set([first, again, rotated]).size).toBe(3);
    expect(rotated).toBe(keys.get('key-1')!.secret);
    const view = await ci.view(resourceId, true);
    expect(view).toMatchObject({ state: 'manual', key: { id: 'key-1' } });
    expect(view.lastRotatedAt).not.toBeNull();
    keys.get('key-1')!.expiresAt = new Date(
      Date.now() + 3 * 86_400_000,
    ).toISOString();
    await ci.rotateExpiring();
    expect(calls).toHaveLength(3);
    expect(sent).toEqual([]);
  });

  it('takes over a repository Studio wrote the secret to, without writing it there again', async () => {
    const created = await inits.newProject(alice(), existingShop());
    const resourceId = created.resourceId!;
    const written = h.github.openSecret('acme/shop', 'NB_STUDIO_API_KEY');
    const secret = await ci.rotate('alice', resourceId, { reveal: true });
    expect(secret).toBe(keys.get('key-1')!.secret);
    expect(h.github.openSecret('acme/shop', 'NB_STUDIO_API_KEY')).toBe(written);
    expect((await ci.view(resourceId, true)).state).toBe('manual');
  });

  it('refuses, rather than records, what it cannot reveal', async () => {
    const resourceId = await gitlabShop();
    await expect(
      ci.rotate('alice', resourceId, { reveal: true }),
    ).rejects.toMatchObject({ code: 'KEY_MISSING', status: 400 });
    refuseKeys = 'A key may hold only permissions you hold yourself.';
    await expect(
      ci.setup('alice', resourceId, { reveal: true }),
    ).rejects.toMatchObject({ code: 'KEY_SCOPE_EXCEEDS_YOURS' });
    expect((await ci.view(resourceId, true)).lastError).toBeNull();
  });
});

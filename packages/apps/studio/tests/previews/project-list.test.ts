// @vitest-environment node
import { SYSTEM_CALLER } from '@nocobase/app-plugin-releases/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  ensureRepo,
  insertLink,
  updateRepo,
  upsertPullRequest,
} from '../../server/git/store.js';
import { insertPreview } from '../../server/previews/store.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { API, bindingOf, tokenConnection } from '../git/helpers.js';

let h: BridgeHarness;
let projectId: string;
let previewId: string;
let prId: string;
let resourceId: string;
beforeEach(async () => {
  h = await createBridgeHarness({ releases: true, previews: true });
  await h.addUser('alice');
  await h.addUser('bob');
  h.roles.set('alice', 'admin');
  await h.releases!.environments.create(SYSTEM_CALLER, {
    id: 'preview',
    name: 'Preview',
    driver: 'fake',
    config: {},
  });
  projectId = (
    await h.projects.projects.create(h.viewer('alice'), {
      name: 'Preview project',
      visibility: 'everyone',
    })
  ).id;
  const connection = await tokenConnection(h);
  h.github.addRepo('acme/app');
  resourceId = (
    await h.projects.projects.addResource(h.viewer('alice'), projectId, {
      type: 'gitRepo',
      url: 'https://github.com/acme/app.git',
      binding: bindingOf(connection, 'acme/app'),
    } as never)
  ).id;
  const conn = h.database.connection();
  const repo = await ensureRepo(conn, API, 'acme/app');
  await updateRepo(conn, repo.id, {
    connectionId: connection.id,
    externalId: '1',
    provider: 'github',
  });
  const { pr } = await upsertPullRequest(conn, repo.id, {
    repo: 'acme/app',
    number: 7,
    url: 'https://github.com/acme/app/pull/7',
    title: 'Manual change',
    body: null,
    state: 'open',
    draft: false,
    headRef: 'feature',
    baseRef: 'main',
    headSha: 'a'.repeat(40),
    authorLogin: 'alice',
    mergeableState: null,
    mergedAt: null,
    mergedByLogin: null,
    mergeCommitSha: null,
    closedAt: null,
  });
  prId = pr.id;
  await h.releases!.releases.createApp(
    { ...SYSTEM_CALLER, userId: 'alice' },
    {
      id: 'app-pr-7',
      name: 'Preview',
      environmentId: 'preview',
      labels: { studio: 'preview' },
    },
  );
  previewId = 'preview-7';
  await insertPreview(conn, {
    id: previewId,
    resourceId,
    pullRequestId: prId,
    repo: 'acme/app',
    number: 7,
    appId: 'app-pr-7',
    targetAppId: null,
    environmentId: 'preview',
    status: 'waiting',
    createdBy: 'alice',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});
afterEach(async () => h.close());
const list = (user = 'alice', headers?: Record<string, string>) =>
  h.request('GET', `/previews?projectId=${projectId}`, { user, headers });
const down = (user = 'alice', headers?: Record<string, string>) =>
  h.request('POST', `/previews/projects/${projectId}/${previewId}/down`, {
    user,
    headers,
  });
async function link(issueId: string) {
  await insertLink(h.database.connection(), {
    issueId,
    pullRequestId: prId,
    linkedByType: 'user',
    linkedById: 'alice',
  });
}

it('lists unlinked previews without credentials and keeps the global list issue based', async () => {
  expect((await list()).body.data).toEqual([
    expect.objectContaining({
      id: previewId,
      issueId: null,
      identifier: null,
      title: null,
      canDestroy: true,
      admin: null,
    }),
  ]);
  expect(
    (await h.request('GET', '/previews', { user: 'alice' })).body.data,
  ).toEqual([]);
  const one = await h.projects.issues.create(h.viewer('alice'), {
    title: 'First association',
    projectId,
    start: false,
  });
  const two = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Second association',
    projectId,
    start: false,
  });
  await link(one.id);
  await link(two.id);
  expect((await list()).body.data).toEqual([
    expect.objectContaining({ id: previewId, issueId: one.id, admin: null }),
  ]);
});

it('finds shared repositories and replacement directories without production Apps and deduplicates directories', async () => {
  const conn = h.database.connection();
  const resource = await conn.query
    .selectFrom('pmProjectResources')
    .selectAll()
    .where('id', '=', resourceId)
    .executeTakeFirst();
  projectId = (
    await h.projects.projects.create(h.viewer('alice'), {
      name: 'Shared repository',
      visibility: 'everyone',
    })
  ).id;
  await conn.query
    .insertInto('pmProjectResources')
    .values({ ...resource, id: 'shared-dir', projectId })
    .execute();
  await conn.query
    .insertInto('pmProjectResources')
    .values({ ...resource, id: 'other-dir', projectId })
    .execute();
  expect((await list()).body.data).toHaveLength(1);
  expect(
    (
      await h.request(
        'GET',
        `/deploys/projects/${projectId}/unreleasedIssues`,
        { user: 'alice' },
      )
    ).body.data,
  ).toMatchObject({ hasProduction: false, hasPreview: true });
  await conn.query
    .deleteFrom('pmProjectResources')
    .where('id', '=', resourceId)
    .execute();
  expect((await list()).body.data).toHaveLength(1);
  await conn.query
    .updateTable('pmProjectResources')
    .set({ bindingRepoId: 'unrelated' })
    .where('projectId', '=', projectId)
    .execute();
  expect((await list()).body.data).toEqual([]);
  expect((await down()).status).toBe(404);
});

it('does not expose hidden associations through App ownership and treats deleted issues as unlinked', async () => {
  const hidden = await h.projects.projects.create(h.viewer('alice'), {
    name: 'Private',
    visibility: 'members',
  });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Hidden change',
    projectId: hidden.id,
    start: false,
  });
  await link(issue.id);
  await h.database
    .connection()
    .query.updateTable('relApps')
    .set({ createdBy: 'bob' })
    .where('id', '=', 'app-pr-7')
    .execute();
  expect((await list('bob')).body.data).toEqual([]);
  expect(
    (
      await h.request(
        'GET',
        `/deploys/projects/${projectId}/unreleasedIssues`,
        { user: 'bob' },
      )
    ).body.data.hasPreview,
  ).toBe(false);
  await h.database
    .connection()
    .query.updateTable('pmIssues')
    .set({ deletedAt: new Date() })
    .where('id', '=', issue.id)
    .execute();
  expect((await list('bob')).body.data).toEqual([
    expect.objectContaining({ id: previewId, issueId: null }),
  ]);
});

it('enforces App permissions, anonymous access, actual key restrictions and project visibility', async () => {
  expect(
    (await h.request('GET', `/previews?projectId=${projectId}`)).status,
  ).toBe(401);
  expect(
    (
      await h.request(
        'POST',
        `/previews/projects/${projectId}/${previewId}/down`,
      )
    ).status,
  ).toBe(401);
  expect((await list('bob')).body.data).toEqual([]);
  expect((await down('bob')).status).toBe(403);
  const headers = {
    'x-test-key-scope': JSON.stringify({
      'projects.issues': { level: 'read' },
      'projects.projects': { level: 'read' },
    }),
  };
  expect((await list('alice', headers)).body.data).toEqual([]);
  expect((await down('alice', headers)).status).toBe(403);
  expect(
    (
      await h.request(
        'GET',
        `/deploys/projects/${projectId}/unreleasedIssues`,
        { user: 'alice', headers },
      )
    ).status,
  ).toBe(403);
  await h.database
    .connection()
    .query.updateTable('pmProjects')
    .set({ visibility: 'members' })
    .where('id', '=', projectId)
    .execute();
  expect((await list('bob')).status).toBe(404);
});

it('refuses a newly linked PR, destroys the actual App once and omits the retained destroyed record', async () => {
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'New link',
    projectId,
    start: false,
  });
  await link(issue.id);
  expect((await down()).body.error.reason).toBe('PREVIEW_LINKED');
  expect(await h.releases!.releases.findApp('app-pr-7')).not.toBeNull();
  await h.database
    .connection()
    .query.updateTable('pmIssues')
    .set({ deletedAt: new Date() })
    .where('id', '=', issue.id)
    .execute();
  expect((await down()).status).toBe(200);
  expect(await h.releases!.releases.findApp('app-pr-7')).toBeNull();
  expect((await down()).status).toBe(200);
  expect((await list()).body.data).toEqual([]);
  expect(
    (
      await h.request(
        'GET',
        `/deploys/projects/${projectId}/unreleasedIssues`,
        { user: 'alice' },
      )
    ).body.data,
  ).toMatchObject({ hasProduction: false, hasPreview: false });
});

it('lists multiple target Apps alongside linked previews and excludes another repository with the same PR number', async () => {
  const conn = h.database.connection();
  const original = await conn.query
    .selectFrom('studioPreviews')
    .selectAll()
    .where('id', '=', previewId)
    .executeTakeFirst();
  await h.releases!.releases.createApp(
    { ...SYSTEM_CALLER, userId: 'alice' },
    {
      id: 'web-pr-7',
      name: 'Web preview',
      environmentId: 'preview',
      labels: { studio: 'preview' },
    },
  );
  await conn.query
    .insertInto('studioPreviews')
    .values({
      ...original,
      id: 'web-preview',
      appId: 'web-pr-7',
      targetAppId: 'web',
    })
    .execute();
  expect((await list()).body.data).toHaveLength(2);
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Linked work',
    projectId,
    start: false,
  });
  await link(issue.id);
  const otherRepo = await ensureRepo(conn, API, 'other/app');
  const pr = await conn.query
    .selectFrom('studioPullRequests')
    .selectAll()
    .where('id', '=', prId)
    .executeTakeFirst();
  await conn.query
    .insertInto('studioPullRequests')
    .values({ ...pr, id: 'other-pr', repoId: otherRepo.id })
    .execute();
  await conn.query
    .insertInto('studioPreviews')
    .values({
      ...original,
      id: 'other-preview',
      pullRequestId: 'other-pr',
      appId: 'other-pr-7',
    })
    .execute();
  expect((await list()).body.data).toEqual([
    expect.objectContaining({ issueId: issue.id }),
    expect.objectContaining({ issueId: issue.id }),
  ]);
});

it('never exposes unlinked previews to a run even when its owner is an administrator', async () => {
  const agentId = await h.createAgent({
    actions: ['pm.projects/view', 'pm.issues/view', 'studio.previews/manage'],
  });
  await h.projects.issues.create(h.viewer('alice'), {
    title: 'Agent task',
    executor: { type: 'agent', id: agentId },
  });
  const payload = await h.claimOne();
  const runToken = payload.cli.credential.content.token as string;
  expect(
    (await h.request('GET', `/previews?projectId=${projectId}`, { runToken }))
      .body.data,
  ).toEqual([]);
  expect(
    (
      await h.request(
        'POST',
        `/previews/projects/${projectId}/${previewId}/down`,
        { runToken },
      )
    ).status,
  ).toBe(403);
});

it('returns linked and unlinked previews together and computes view-only App capability', async () => {
  const conn = h.database.connection();
  const original = await conn.query
    .selectFrom('studioPreviews')
    .selectAll()
    .where('id', '=', previewId)
    .executeTakeFirst();
  const pr = await conn.query
    .selectFrom('studioPullRequests')
    .selectAll()
    .where('id', '=', prId)
    .executeTakeFirst();
  await conn.query
    .insertInto('studioPullRequests')
    .values({ ...pr, id: 'second-pr', number: 8 })
    .execute();
  await h.releases!.releases.createApp(
    { ...SYSTEM_CALLER, userId: 'alice' },
    {
      id: 'app-pr-8',
      name: 'Second preview',
      environmentId: 'preview',
      labels: { studio: 'preview' },
    },
  );
  await conn.query
    .insertInto('studioPreviews')
    .values({
      ...original,
      id: 'second-preview',
      pullRequestId: 'second-pr',
      number: 8,
      appId: 'app-pr-8',
    })
    .execute();
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Linked work',
    projectId,
    start: false,
  });
  await link(issue.id);
  expect((await list()).body.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: previewId, issueId: issue.id }),
      expect.objectContaining({
        id: 'second-preview',
        issueId: null,
        canDestroy: true,
      }),
    ]),
  );
  h.roles.delete('alice');
  expect((await list()).body.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'second-preview', canDestroy: false }),
    ]),
  );
  expect(
    (
      await h.request(
        'POST',
        `/previews/projects/${projectId}/second-preview/down`,
        { user: 'alice' },
      )
    ).status,
  ).toBe(403);
});

it('refuses a PR linked while App delete permission is being resolved', async () => {
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Concurrent association',
    projectId,
    start: false,
  });
  const guard = h.releases!.guard;
  const original = guard.canApp.bind(guard);
  const check = vi
    .spyOn(guard, 'canApp')
    .mockImplementation(async (caller, action, app) => {
      if (action === 'delete') await link(issue.id);
      return original(caller, action, app);
    });
  try {
    expect((await down()).body.error.reason).toBe('PREVIEW_LINKED');
    expect(await h.releases!.releases.findApp('app-pr-7')).not.toBeNull();
  } finally {
    check.mockRestore();
  }
});

it('checks associations again inside the preview service before deleting', async () => {
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Linked while cleanup waits',
    projectId,
    start: false,
  });
  const service = h.previews!;
  const original = service.down.bind(service);
  const cleanup = vi
    .spyOn(service, 'down')
    .mockImplementation(async (id, user, beforeDelete) => {
      await link(issue.id);
      return original(id, user, beforeDelete);
    });
  try {
    expect((await down()).body.error.reason).toBe('PREVIEW_LINKED');
    expect(await h.releases!.releases.findApp('app-pr-7')).not.toBeNull();
  } finally {
    cleanup.mockRestore();
  }
});

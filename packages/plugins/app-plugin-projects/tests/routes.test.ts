// @vitest-environment node
/**
 * The production route contribution over the real services: the guard (401 for anonymous callers), permissions read
 * from the request's authorization context, and the error format. The authorization plugin is stood in by a context
 * whose decisions follow the `x-test-role` header.
 */
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRoutes } from '../server/routes/api.js';
import {
  IssueDetailSchema,
  MeSchema,
  ProjectDetailSchema,
} from '../server/routes/schemas.js';
import {
  projectsAccessToken,
  projectsDelegatedWritesToken,
  projectsRequestActorToken,
  projectsToken,
  type DelegatedWriteRequest,
  type ProjectsAccess,
} from '../server/tokens.js';
import {
  createHarness,
  permissionsOf,
  type Harness,
  type Role,
} from './harness.js';

/** The request's identity carries the `x-test-role` header as a subject, which the fake access below reads. */
function fakeAuthorization(): { middleware(): MiddlewareHandler } {
  return {
    middleware: () => async (context, next) => {
      const role = context.req.header('x-test-role') ?? 'none';
      context.set('authz', {
        identity: {
          principal: { type: 'user', id: 'alice' },
          subjects: [{ type: 'test-role', id: role }],
        },
      } as never);
      await next();
    },
  };
}

/** `admin` holds everything on every record, `member` the related scopes and read-only settings, else nothing. */
function fakeAccess(): ProjectsAccess {
  return {
    permissionsOf: (identity) =>
      Promise.resolve(
        permissionsOf(
          (identity.subjects?.find((subject) => subject.type === 'test-role')
            ?.id ?? 'none') as Role,
          identity.principal.id,
        ),
      ),
    admit: () => Promise.resolve(),
    changed: () => Promise.resolve(),
    administrators: () => Promise.resolve([]),
  };
}

let h: Harness;
let router: Hono;
let apiRouter: Hono;
let container: ServiceContainer;

beforeEach(async () => {
  h = await createHarness();
  await h.addUser('alice', 'Alice');
  const authentication = new Auth({
    connection: h.database.connection(),
    secret: 'projects-routes-test-secret-at-least-32-characters',
    baseURL: 'http://example.test',
  });
  vi.spyOn(authentication, 'getSession').mockImplementation(async (headers) => {
    const id = headers.get('x-test-user');
    if (!id) return null;
    const now = new Date();
    return {
      user: {
        id,
        name: id,
        email: `${id}@example.test`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      session: {
        id: 's',
        token: 't',
        userId: id,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: now,
        updatedAt: now,
      },
    };
  });
  // A request with `x-test-scoped` stands for a scoped API key.
  authentication.addScopedCredentialCheck(
    (_session, request) => request.headers.get('x-test-scoped') === 'yes',
  );
  container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  container.instance(authorizationToken, fakeAuthorization() as never);
  container.instance(projectsToken, h.services);
  container.instance(projectsAccessToken, fakeAccess());
  router = new Hono();
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: { app: { name: 'main', publicBasePath: '' } },
    paths: createAppPaths({ rootDir: '/tmp/projects-routes' }),
    router,
    container,
  };
  apiRouter = await apiRoutes.createRouter(app);
  router.route('/api', apiRouter);
  router.get('/api/later', (context) => context.text('later'));
});
afterEach(() => h.close());

const call = (path: string, init: RequestInit & { role?: string } = {}) => {
  const { role, ...rest } = init;
  return router.request(`/api/projects${path}`, {
    ...rest,
    headers: {
      'content-type': 'application/json',
      ...(role ? { 'x-test-user': 'alice', 'x-test-role': role } : {}),
      ...rest.headers,
    },
  });
};

describe('the /api/projects guard', () => {
  it('refuses anonymous callers and leaves other routes alone', async () => {
    const paths = [
      '/me',
      '/members',
      '/settings',
      '/labels',
      '',
      '/issues',
      '/mentionCandidates',
    ];
    const statuses = await Promise.all(
      paths.map(async (path) => (await call(path)).status),
    );
    expect(statuses).toEqual(paths.map(() => 401));
    expect(await (await router.request('/api/later')).text()).toBe('later');
  });

  it('makes the caller a member and reports their permissions', async () => {
    const response = await call('/me', { role: 'member' });
    expect(response.status).toBe(200);
    const { data } = (await response.json()) as {
      data: { permissions: { scopes: Record<string, unknown> } };
    };
    expect(data.permissions.scopes['pm.issues/view']).toEqual({
      users: ['alice'],
    });
    expect(h.admitted).toEqual(['alice']);
  });
});

describe('scoped keys and API key identities', () => {
  it('serves a scoped key the business API, but not intake or plans', async () => {
    const headers = { 'x-test-scoped': 'yes' };
    expect((await call('', { role: 'member', headers })).status).toBe(200);
    const plans = await call('/plans', { role: 'member', headers });
    expect(plans.status).toBe(403);
    expect(await plans.json()).toMatchObject({
      error: { reason: 'SCOPED_KEY_FORBIDDEN', domain: 'projects' },
    });
    expect((await call('/plans', { role: 'member' })).status).toBe(200);
  });

  it('names the API key identities to any signed-in caller', async () => {
    await h.addUser('robot', 'Release bot');
    await h.database
      .connection()
      .repository('user')
      .updateOne({ filter: { id: 'robot' }, values: { kind: 'service' } });
    const response = await call('/apiKeyActors', { role: 'none' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [{ id: 'robot', name: 'Release bot', disabled: false }],
      meta: { total: 1 },
    });
  });
});

describe('errors', () => {
  it('answers 403, 400, 404 and 409 in the standard error body', async () => {
    const forbidden = await call('/labels', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ name: 'bug' }),
    });
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toMatchObject({
      error: {
        status: 'PERMISSION_DENIED',
        reason: 'FORBIDDEN',
        domain: 'projects',
      },
    });

    const invalid = await call('/issues', {
      role: 'member',
      method: 'POST',
      body: '[]',
    });
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({
      error: { status: 'INVALID_ARGUMENT', reason: 'INVALID_INPUT' },
    });

    const unknownField = await call('/issues', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ title: 'A', colour: 'red' }),
    });
    expect(unknownField.status).toBe(400);
    expect(await unknownField.json()).toMatchObject({
      error: { reason: 'INVALID_INPUT', fieldViolations: [{ field: '' }] },
    });

    const missing = await call('/issues/PM-404', { role: 'member' });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({
      error: { reason: 'ISSUE_NOT_FOUND', domain: 'projects' },
    });

    const created = await call('/issues', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ title: 'A' }),
    });
    expect(created.status).toBe(201);
    const stale = await call('/issues/PM-1', {
      role: 'member',
      method: 'PATCH',
      body: JSON.stringify({ revision: 7, title: 'B' }),
    });
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({
      error: {
        code: 409,
        status: 'ABORTED',
        reason: 'REVISION_CONFLICT',
        domain: 'projects',
        message: 'The issue was changed meanwhile.',
      },
    });
  });

  it('answers a project the query names but that does not exist as a bad request', async () => {
    const response = await call('/issues/statuses?projectId=nope', {
      role: 'member',
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        reason: 'PROJECT_NOT_FOUND',
        fieldViolations: [{ field: 'projectId' }],
      },
    });
  });
});

describe('issues over HTTP', () => {
  it('lists cursor pages and a board', async () => {
    for (const title of ['A', 'B', 'C'])
      await call('/issues', {
        role: 'member',
        method: 'POST',
        body: JSON.stringify({ title }),
      });
    const first = (await (
      await call('/issues?pageSize=2&orderBy=number%20asc', { role: 'member' })
    ).json()) as {
      data: { identifier: string }[];
      meta: { nextPageToken?: string };
    };
    expect(first.data.map((issue) => issue.identifier)).toEqual([
      'PM-1',
      'PM-2',
    ]);
    expect(first.meta.nextPageToken).toEqual(expect.any(String));
    const last = (await (
      await call(
        `/issues?pageSize=2&orderBy=number%20asc&pageToken=${first.meta.nextPageToken ?? ''}`,
        { role: 'member' },
      )
    ).json()) as { data: { identifier: string }[]; meta: object };
    expect(last).toEqual({
      data: [expect.objectContaining({ identifier: 'PM-3' })],
      meta: {},
    });
    expect(
      (await call('/issues?pageSize=101', { role: 'member' })).status,
    ).toBe(400);
    expect(
      (await call('/issues?orderBy=title', { role: 'member' })).status,
    ).toBe(400);
    const board = (await (
      await call('/issues/board', { role: 'member' })
    ).json()) as {
      data: { columns: { status: { key: string }; issues: unknown[] }[] };
    };
    expect(
      board.data.columns.find((column) => column.status.key === 'todo')?.issues,
    ).toHaveLength(3);
  });
});

describe('issues over HTTP, by identifier and without a revision', () => {
  it('finds the sub-issues of a parent named by its identifier, and updates an issue as it is now', async () => {
    await call('/issues', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ title: 'Parent' }),
    });
    await call('/issues', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ title: 'Child', parentIssueId: 'PM-1' }),
    });
    const children = (await (
      await call('/issues?parentIssueId=PM-1', { role: 'member' })
    ).json()) as { data: { identifier: string }[] };
    expect(children.data.map((issue) => issue.identifier)).toEqual(['PM-2']);
    const updated = await call('/issues/PM-2', {
      role: 'member',
      method: 'PATCH',
      body: JSON.stringify({ title: 'Renamed' }),
    });
    expect(updated.status).toBe(200);
    expect(await updated.json()).toMatchObject({
      data: { issue: { title: 'Renamed' } },
    });
  });
});

describe('a caller acting for someone else', () => {
  it('acts as the actor the application names, and hands its writes to the delegated writes', async () => {
    const handed: DelegatedWriteRequest[] = [];
    container.instance(projectsRequestActorToken, (context) =>
      Promise.resolve(
        context.req.header('x-test-agent')
          ? { type: 'user', id: 'alice', via: 'agent' as const }
          : undefined,
      ),
    );
    container.instance(projectsDelegatedWritesToken, {
      covers: (viewer) => viewer.actor.via === 'agent',
      write: async (viewer, request) => {
        handed.push(request);
        const plan = await h.services.plans.create(
          viewer,
          {
            title: request.title,
            source: { kind: 'test' },
            rows: request.rows,
          },
          { execute: true },
        );
        return { plan, meta: { message: 'Done for the person.' } };
      },
    });
    const agent = { 'x-test-agent': 'yes' };
    const created = await call('/issues', {
      role: 'member',
      method: 'POST',
      headers: agent,
      body: JSON.stringify({ title: 'For you' }),
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      data: { identifier: 'PM-1', title: 'For you' },
      meta: { message: 'Done for the person.' },
    });
    const commented = await call('/issues/PM-1/comments', {
      role: 'member',
      method: 'POST',
      headers: agent,
      body: JSON.stringify({ content: 'Noted.' }),
    });
    expect(await commented.json()).toMatchObject({
      data: { comment: { content: 'Noted.' }, triggered: [] },
    });
    expect(handed.map((request) => request.rows[0]?.op)).toEqual([
      'issue.create',
      'comment.create',
    ]);
    // Without the actor, the same write goes straight through.
    const direct = await call('/issues/PM-1/comments', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ content: 'Myself.' }),
    });
    expect(direct.status).toBe(201);
    expect(handed).toHaveLength(2);
  });
});

describe('dependencies over HTTP', () => {
  it('links with 201, refuses a cycle with 400, and unlinks with 204', async () => {
    for (const title of ['A', 'B'])
      await call('/issues', {
        role: 'member',
        method: 'POST',
        body: JSON.stringify({ title }),
      });
    const linked = await call('/issues/PM-1/dependencies', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ dependsOnIssueId: 'PM-2' }),
    });
    expect(linked.status).toBe(201);
    const { data } = (await linked.json()) as {
      data: { dependencyId: string; identifier: string };
    };
    expect(data.identifier).toBe('PM-2');
    const cycle = await call('/issues/PM-2/dependencies', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ dependsOnIssueId: 'PM-1' }),
    });
    expect(cycle.status).toBe(400);
    expect(await cycle.json()).toMatchObject({
      error: { reason: 'DEPENDENCY_CYCLE' },
    });
    expect(
      (
        await call(`/issues/PM-1/dependencies/${data.dependencyId}`, {
          role: 'member',
          method: 'DELETE',
        })
      ).status,
    ).toBe(204);
    expect(
      (
        await call('/issues/PM-1/removeDependency', {
          role: 'member',
          method: 'POST',
          body: JSON.stringify({ dependsOnIssueId: 'PM-2' }),
        })
      ).status,
    ).toBe(404);
  });
});

describe('approvals over HTTP', () => {
  it('answers 202 with the request that holds a status change, and lets an approver decide it', async () => {
    await h.addUser('lead', 'Lead');
    const admin = h.viewer('lead', 'admin');
    const workflow = await h.installStandardWorkflow();
    await h.services.workflows.update(admin, workflow.id, {
      revision: workflow.revision,
      definition: {
        ...workflow.definition,
        transitions: [
          ...workflow.definition.transitions,
          {
            from: 'todo',
            to: 'done',
            actors: ['user'],
            approval: { approvers: ['projectLead'] },
          },
        ],
      },
    });
    const project = await h.services.projects.create(admin, { name: 'P' });
    await call('/issues', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ title: 'A', projectId: project.id }),
    });

    const held = await call('/issues/PM-1', {
      role: 'member',
      method: 'PATCH',
      body: JSON.stringify({ revision: 1, statusKey: 'done' }),
    });
    expect(held.status).toBe(202);
    const {
      data: { issue, pendingApproval },
    } = (await held.json()) as {
      data: {
        issue: { statusKey: string };
        pendingApproval: { id: string; approverUserIds: string[] };
      };
    };
    expect(issue.statusKey).toBe('todo');
    expect(pendingApproval.approverUserIds).toEqual(['lead']);

    const lead = (path: string, init: RequestInit = {}) =>
      router.request(`/api/projects${path}`, {
        ...init,
        headers: {
          'content-type': 'application/json',
          'x-test-user': 'lead',
          'x-test-role': 'member',
        },
      });
    const mine = (await (await lead('/approvals')).json()) as {
      data: { id: string }[];
    };
    expect(mine.data.map((request) => request.id)).toEqual([
      pendingApproval.id,
    ]);
    const approved = await lead(`/approvals/${pendingApproval.id}/approve`, {
      method: 'POST',
      body: '{}',
    });
    expect(approved.status).toBe(200);
    expect(await approved.json()).toMatchObject({
      data: { status: 'approved' },
    });
  });
});

describe('comments over HTTP', () => {
  it('posts, reacts with an encoded emoji, follows and lists mentions', async () => {
    await call('/issues', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ title: 'A' }),
    });
    const posted = await call('/issues/PM-1/comments', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ content: 'Hello' }),
    });
    expect(posted.status).toBe(201);
    const {
      data: { comment, triggered },
    } = (await posted.json()) as {
      data: { comment: { id: string }; triggered: unknown[] };
    };
    expect(triggered).toEqual([]);
    const reacted = await call(`/comments/${comment.id}/react`, {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ emoji: '👍' }),
    });
    expect((await reacted.json()) as unknown).toMatchObject({
      data: { reactions: [{ emoji: '👍', count: 1 }] },
    });
    const removed = await call(`/comments/${comment.id}/unreact`, {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ emoji: '👍' }),
    });
    expect(await removed.json()).toEqual({ data: { reactions: [] } });
    const unfollowed = await call('/issues/PM-1/unsubscribe', {
      role: 'member',
      method: 'POST',
    });
    expect(await unfollowed.json()).toEqual({ data: { subscribed: false } });
    const threads = (await (
      await call('/issues/PM-1/comments', { role: 'member' })
    ).json()) as { data: unknown[]; meta: object };
    expect(threads).toMatchObject({ meta: {} });
    expect(threads.data).toHaveLength(1);
    const mentions = (await (
      await call('/mentionCandidates?q=ali&issueId=PM-1', { role: 'member' })
    ).json()) as { data: { id: string }[] };
    expect(mentions.data.map((row) => row.id)).toEqual(['alice']);
    const unknownIssue = await call('/mentionCandidates?issueId=PM-99', {
      role: 'member',
    });
    expect(unknownIssue.status).toBe(400);
    expect(await unknownIssue.json()).toMatchObject({
      error: { fieldViolations: [{ field: 'issueId' }] },
    });
    expect(
      (await call('/comments/nope', { role: 'member', method: 'DELETE' }))
        .status,
    ).toBe(404);
    const denied = await call('/issues/PM-1/comments', {
      role: 'none',
      method: 'POST',
      body: JSON.stringify({ content: 'Hi' }),
    });
    expect(denied.status).toBe(404);
  });
});

describe('attachments over HTTP', () => {
  const upload = (path: string, file: File, role = 'member') => {
    const body = new FormData();
    body.append('file', file);
    return router.request(`/api/projects${path}`, {
      method: 'POST',
      body,
      headers: { 'x-test-user': 'alice', 'x-test-role': role },
    });
  };

  it('uploads, sends with a comment, serves and removes files', async () => {
    await call('/issues', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({ title: 'Broken' }),
    });
    const image = await upload(
      '/issues/PM-1/attachments',
      new File([new Uint8Array([137, 80])], '截图.png', { type: 'image/png' }),
    );
    expect(image.status).toBe(201);
    const { data: picture } = (await image.json()) as {
      data: { id: string; contentUrl: string; previewable: boolean };
    };
    expect(picture.previewable).toBe(true);
    const inline = await call(`/attachments/${picture.id}/content`, {
      role: 'member',
    });
    expect(inline.status).toBe(200);
    expect(inline.headers.get('content-type')).toBe('image/png');
    expect(inline.headers.get('content-disposition')).toBe(
      `inline; filename="__.png"; filename*=UTF-8''${encodeURIComponent('截图.png')}`,
    );
    expect(inline.headers.get('x-content-type-options')).toBe('nosniff');
    expect(inline.headers.get('cache-control')).toBe('private, no-store');
    const saved = await call(
      `/attachments/${picture.id}/content?download=true`,
      {
        role: 'member',
      },
    );
    expect(saved.headers.get('content-disposition')).toMatch(/^attachment;/u);
    expect(new Uint8Array(await saved.arrayBuffer())).toEqual(
      new Uint8Array([137, 80]),
    );

    const page = await upload(
      '/attachments',
      new File(['<h1>hi</h1>'], 'page.html', { type: 'text/html' }),
    );
    const { data: html } = (await page.json()) as { data: { id: string } };
    const posted = await call('/issues/PM-1/comments', {
      role: 'member',
      method: 'POST',
      body: JSON.stringify({
        content: 'See the page',
        attachmentIds: [html.id],
      }),
    });
    expect(posted.status).toBe(201);
    const served = await call(`/attachments/${html.id}/content`, {
      role: 'member',
    });
    expect(served.headers.get('content-disposition')).toMatch(/^attachment;/u);
    expect(served.headers.get('content-security-policy')).toBe(
      "sandbox; default-src 'none'",
    );
    expect(
      (await call(`/attachments/${picture.id}/content`, { role: 'none' }))
        .status,
    ).toBe(404);

    const listed = (await (
      await call('/issues/PM-1/attachments', { role: 'member' })
    ).json()) as { data: { id: string }[]; meta: { total: number } };
    expect(listed.data.map((file) => file.id)).toEqual([picture.id]);
    expect(listed.meta.total).toBe(1);
    const withComments = (await (
      await call('/issues/PM-1/attachments?comments=true', { role: 'member' })
    ).json()) as { data: { id: string; commentId: string | null }[] };
    expect(withComments.data.map((file) => file.id)).toEqual([
      picture.id,
      html.id,
    ]);
    expect(withComments.data[1]?.commentId).toEqual(expect.any(String));
    const removed = await call(`/attachments/${picture.id}`, {
      role: 'member',
      method: 'DELETE',
    });
    expect(removed.status).toBe(204);
    expect(h.stored.size).toBe(1);
  });

  it('refuses a body that is not one file, and one over the limit', async () => {
    const empty = await router.request('/api/projects/attachments', {
      method: 'POST',
      body: new FormData(),
      headers: { 'x-test-user': 'alice', 'x-test-role': 'member' },
    });
    expect(await empty.json()).toMatchObject({
      error: { reason: 'INVALID_FILE' },
    });
    const big = await upload(
      '/attachments',
      new File([new Uint8Array(20 * 1024 * 1024 + 70 * 1024)], 'big.bin'),
    );
    expect(big.status).toBe(413);
    expect(await big.json()).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'FILE_TOO_LARGE',
        domain: 'projects',
      },
    });
  });
});

describe('the API document', () => {
  it('declares every route under one tag and a projects operationId', async () => {
    expect(findUndeclaredApiRoutes(apiRouter)).toEqual([]);
    const document = await generateApiDocument(apiRouter, {
      info: { title: 'Test', version: '1.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const operations = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item ?? {}).map(
        (operation) => operation as { operationId?: string; tags?: string[] },
      ),
    );
    const operationIds = operations.map(({ operationId }) => operationId);
    expect(new Set(operationIds).size).toBe(operationIds.length);
    expect(
      operations.every(
        ({ operationId, tags }) =>
          operationId?.startsWith('projects') && tags?.[0] === 'Projects',
      ),
    ).toBe(true);
    expect(operationIds).toEqual(
      expect.arrayContaining([
        'projectsGetMe',
        'projectsListIssues',
        'projectsCreateIssue',
        'projectsUpdateIssue',
        'projectsApproveApproval',
        'projectsExecutePlan',
        'projectsUploadAttachment',
        'projectsDownloadAttachment',
        'projectsListProjects',
      ]),
    );
  });

  it('describes what the handlers answer', async () => {
    const me = await call('/me', { role: 'admin' });
    expect(MeSchema.safeParse((await me.json()).data).success).toBe(true);

    const project = await call('', {
      role: 'admin',
      method: 'POST',
      body: JSON.stringify({ name: 'Docs' }),
    });
    const { data: created } = (await project.json()) as {
      data: { id: string };
    };
    expect(ProjectDetailSchema.safeParse(created).success).toBe(true);

    await call('/issues', {
      role: 'admin',
      method: 'POST',
      body: JSON.stringify({ title: 'A', projectId: created.id }),
    });
    const issue = await call('/issues/PM-1', { role: 'admin' });
    const parsed = IssueDetailSchema.safeParse((await issue.json()).data);
    expect(parsed.error).toBeUndefined();
  });
});

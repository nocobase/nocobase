// @vitest-environment node
/**
 * The production route contribution over the real services: the guard (401 for anonymous callers), permissions read
 * from the request's authorization context, and the error format. The authorization plugin is stood in by a context
 * whose decisions follow the `x-test-role` header.
 */
import { setTimeout as delay } from 'node:timers/promises';

import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
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
  projectsIssueSessionToken,
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
        can: ({ action }: { action: string }) =>
          Promise.resolve(
            role === 'admin' &&
              context.req.header('x-deny-user-action') !== action,
          ),
        require: async ({ action }: { action: string }) => {
          if (
            role !== 'admin' ||
            context.req.header('x-deny-user-action') === action
          )
            throw new ApiError({
              status: 'PERMISSION_DENIED',
              reason: 'DENIED',
              domain: 'authorization',
              message: 'Denied',
            });
        },
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
  it.each([false, true])(
    'updates structured progress through PATCH (delegated=%s)',
    async (delegated) => {
      if (delegated) {
        container.instance(projectsDelegatedWritesToken, {
          covers: () => true,
          write: async (viewer, request) => {
            const plan = await h.services.plans.create(
              viewer,
              {
                title: request.title,
                source: { kind: 'test' },
                rows: request.rows,
              },
              { execute: true },
            );
            return { plan, meta: {} };
          },
        });
      }
      const issue = await h.services.issues.create(h.viewer('alice'), {
        title: 'Progress',
        statusKey: 'in_progress',
      });
      const request = (body: unknown, role?: string) =>
        call(`/issues/${issue.id}`, {
          role,
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      expect(
        (await request({ statusKey: 'blocked', needsYou: 'Choose.' })).status,
      ).toBe(401);
      expect(
        (await request({ statusKey: 'blocked', needsYou: 'Choose.' }, 'none'))
          .status,
      ).toBe(delegated ? 400 : 404);
      const optional = await request(
        { statusKey: 'blocked', next: 'Not saved' },
        'member',
      );
      expect(optional.status).toBe(200);
      expect(
        await h.services.issueQueries.detail(h.viewer('alice'), issue.id),
      ).toMatchObject({
        statusKey: 'blocked',
        needsYou: null,
        next: 'Not saved',
      });
      const changed = await request(
        {
          statusKey: 'blocked',
          needsYou: 'Choose the source. Provide its URL.',
          next: 'Implement the choice.',
        },
        'member',
      );
      expect(changed.status).toBe(200);
      expect(await changed.json()).toMatchObject({
        data: {
          issue: {
            statusKey: 'blocked',
            needsYou: 'Choose the source. Provide its URL.',
            next: 'Implement the choice.',
          },
        },
      });
      expect(
        (
          await request(
            { statusKey: 'in_review', needsYou: 'Accept the result.' },
            'member',
          )
        ).status,
      ).toBe(200);
      expect(
        (await request({ statusKey: 'in_progress' }, 'member')).status,
      ).toBe(200);
      expect(
        await h.services.issueQueries.detail(h.viewer('alice'), issue.id),
      ).toMatchObject({ needsYou: null, next: 'Implement the choice.' });
    },
  );
  it.each([true, false])(
    'returns safe shareable links to project leads when emailSent=%s',
    async (emailSent) => {
      const project = await h.services.projects.create(h.viewer('alice'), {
        name: 'Owned project',
      });
      const original = h.invitations.invite.bind(h.invitations);
      // The fixture service controls email delivery; routes and project authorization remain production code.
      vi.spyOn(h.invitations, 'invite').mockImplementation(async (input) =>
        (await original(input)).map((result) =>
          result.outcome === 'invited' ? { ...result, emailSent } : result,
        ),
      );
      const response = await call('/invitations', {
        role: 'member',
        method: 'POST',
        body: JSON.stringify({
          emails: ['victim@example.test'],
          projectIds: [project.id],
        }),
      });
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        data: {
          results: [
            {
              email: 'victim@example.test',
              outcome: 'invited',
              emailSent,
              inviteUrl: expect.stringContaining('/invite/'),
            },
          ],
        },
      });
      const id = h.invitations.rows[0]?.id ?? '';
      const resend = vi
        .spyOn(h.invitations, 'resendInvitation')
        .mockResolvedValue({
          email: 'victim@example.test',
          outcome: 'invited',
          invitationId: id,
          emailSent,
          inviteUrl: 'https://example.test/invite/registration-secret',
        });
      const resent = await call(`/invitations/${id}/resend`, {
        role: 'member',
        method: 'POST',
      });
      expect(resent.status).toBe(200);
      expect(await resent.json()).toEqual({
        data: {
          email: 'victim@example.test',
          outcome: 'invited',
          emailSent,
          inviteUrl: expect.stringContaining('/invite/'),
        },
      });
      const copy = await call(`/invitations/${id}/resend?sendEmail=false`, {
        role: 'member',
        method: 'POST',
      });
      expect(copy.status).toBe(200);
      expect(resend).toHaveBeenCalledTimes(2);
    },
  );

  it.each(['create', 'assign-role'])(
    'does not require global user %s permission for project administrators',
    async (action) => {
      await h.services.invitations.create(
        h.viewer('alice', 'admin'),
        { emails: ['new@example.test'] },
        'https://example.test',
      );
      const id = h.invitations.rows[0]?.id ?? '';
      const resend = vi.spyOn(h.invitations, 'resendInvitation');
      const response = await call(`/invitations/${id}/resend?sendEmail=false`, {
        role: 'admin',
        method: 'POST',
        headers: { 'x-deny-user-action': action },
      });
      expect(response.status).toBe(200);
      expect(resend).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps scoped credentials email-only even when their user can create accounts', async () => {
    const response = await call('/invitations', {
      role: 'admin',
      method: 'POST',
      headers: { 'x-test-scoped': 'yes' },
      body: JSON.stringify({ emails: ['scoped@example.test'] }),
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      data: {
        results: [
          { email: 'scoped@example.test', outcome: 'invited', emailSent: true },
        ],
      },
    });
    const id = h.invitations.rows[0]?.id ?? '';
    const resend = vi.spyOn(h.invitations, 'resendInvitation');
    const copy = await call(`/invitations/${id}/resend?sendEmail=false`, {
      role: 'admin',
      method: 'POST',
      headers: { 'x-test-scoped': 'yes' },
    });
    expect(copy.status).toBe(403);
    expect(resend).not.toHaveBeenCalled();
  });

  it('validates and forwards the mail-free invitation option', async () => {
    await h.services.invitations.create(
      h.viewer('alice', 'admin'),
      { emails: ['new@example.test'] },
      'https://example.test',
    );
    const id = h.invitations.rows[0]?.id ?? '';
    const resend = vi.spyOn(h.invitations, 'resendInvitation');
    const response = await call(`/invitations/${id}/resend?sendEmail=false`, {
      method: 'POST',
      role: 'admin',
    });
    expect(response.status).toBe(200);
    expect(resend).toHaveBeenCalledWith(id, {
      origin: 'http://localhost',
      sendEmail: false,
    });
    expect(await response.json()).toMatchObject({
      data: { inviteUrl: expect.stringContaining('/invite/') },
    });
    expect(
      (
        await call(`/invitations/${id}/resend?sendEmail=no`, {
          method: 'POST',
          role: 'admin',
        })
      ).status,
    ).toBe(400);
    expect(resend).toHaveBeenCalledTimes(1);
  });

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
    // Some issues by id, within the other filters; too many ids are refused.
    const ids = (await (
      await call('/issues?orderBy=number%20asc', { role: 'member' })
    ).json()) as { data: { id: string; identifier: string }[] };
    const named = (await (
      await call(
        `/issues?issueIds=${ids.data[0]!.id},${ids.data[2]!.id},unknown`,
        { role: 'member' },
      )
    ).json()) as { data: { identifier: string }[] };
    expect(named.data.map((issue) => issue.identifier).sort()).toEqual([
      'PM-1',
      'PM-3',
    ]);
    expect(
      (
        await call(
          `/issues?issueIds=${Array.from({ length: 101 }, (_, n) => `i${n}`).join(',')}`,
          { role: 'member' },
        )
      ).status,
    ).toBe(400);
    const board = (await (
      await call('/issues/board', { role: 'member' })
    ).json()) as {
      data: { columns: { status: { key: string }; issues: unknown[] }[] };
    };
    expect(
      board.data.columns.find((column) => column.status.key === 'backlog')
        ?.issues,
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

describe('dependency graph concurrency over HTTP', () => {
  it.each(['conversion', 'addition'] as const)(
    'keeps related links unique when %s races a reverse addition',
    async (operation) => {
      const viewer = h.viewer('alice');
      const a = await h.services.issues.create(viewer, { title: 'A' });
      const b = await h.services.issues.create(viewer, { title: 'B' });
      const link =
        operation === 'conversion'
          ? await h.services.subtasks.addDependency(viewer, a.id, {
              dependsOnIssueId: b.id,
            })
          : undefined;
      const responses = await Promise.all([
        link
          ? call(`/issues/${a.id}/dependencies/${link.dependencyId}`, {
              role: 'member',
              method: 'PATCH',
              body: JSON.stringify({
                expectedType: 'blockedBy',
                type: 'relatedTo',
              }),
            })
          : call(`/issues/${a.id}/dependencies`, {
              role: 'member',
              method: 'POST',
              body: JSON.stringify({
                dependsOnIssueId: b.id,
                type: 'relatedTo',
              }),
            }),
        call(`/issues/${b.id}/dependencies`, {
          role: 'member',
          method: 'POST',
          body: JSON.stringify({ dependsOnIssueId: a.id, type: 'relatedTo' }),
        }),
      ]);
      expect(responses.filter((response) => response.ok)).toHaveLength(1);
      const conflict = responses.find((response) => !response.ok)!;
      expect(conflict.status).toBe(409);
      const error = await conflict.json();
      expect(['DEPENDENCY_EXISTS', 'DEPENDENCY_GRAPH_CHANGED']).toContain(
        error.error.reason,
      );
      const detail = await h.services.issueQueries.detail(viewer, a.id);
      const reverse = await h.services.issueQueries.detail(viewer, b.id);
      expect(detail.relatedTo).toHaveLength(1);
      expect(reverse.relatedTo).toHaveLength(1);
      expect(reverse.relatedTo[0]!.dependencyId).toBe(
        detail.relatedTo[0]!.dependencyId,
      );
      if (link) {
        if (responses[0]!.ok) {
          expect(detail.relatedTo[0]!.dependencyId).toBe(link.dependencyId);
          expect(detail.blockedBy).toEqual([]);
        } else expect(detail.blockedBy).toEqual([link]);
      }
      expect(
        (
          await call(
            `/issues/${b.id}/dependencies/${reverse.relatedTo[0]!.dependencyId}`,
            {
              role: 'member',
              method: 'DELETE',
            },
          )
        ).status,
      ).toBe(204);
      expect(
        (await h.services.issueQueries.detail(viewer, a.id)).relatedTo,
      ).toEqual([]);
      expect(
        (await h.services.issueQueries.detail(viewer, b.id)).relatedTo,
      ).toEqual([]);
    },
  );

  it.each(['rehearsal', 'execution'] as const)(
    'takes the graph before issue rows throughout plan %s',
    async (phase) => {
      const viewer = h.viewer('alice');
      const a = await h.services.issues.create(viewer, { title: 'A' });
      const parent = await h.services.issues.create(viewer, {
        title: 'Parent',
      });
      const c = await h.services.issues.create(viewer, { title: 'C' });
      const d = await h.services.issues.create(viewer, { title: 'D' });
      const propose = () =>
        call('/plans', {
          role: 'member',
          method: 'POST',
          body: JSON.stringify({
            title: 'Edit then link',
            source: { kind: 'manual' },
            rows: [
              {
                op: 'issue.update',
                params: { issue: a.id, set: { title: 'Updated' } },
              },
              {
                op: 'dependency',
                params: {
                  action: 'add',
                  issue: c.id,
                  dependsOn: d.id,
                  type: 'blockedBy',
                },
              },
            ],
          }),
        });
      let plan: { id: string; revision: number } | undefined;
      if (phase === 'execution') {
        const response = await propose();
        expect(response.status).toBe(201);
        plan = (
          (await response.json()) as { data: { id: string; revision: number } }
        ).data;
      }
      const edited = Promise.withResolvers<void>();
      const hierarchyStarted = Promise.withResolvers<void>();
      const hierarchyLocked = Promise.withResolvers<void>();
      const update = h.services.issues.update.bind(h.services.issues);
      vi.spyOn(h.services.issues, 'update').mockImplementation(
        async (...args) => {
          if (args[2].parentIssueId === parent.id) hierarchyStarted.resolve();
          const result = await update(...args);
          if (args[2].title === 'Updated') {
            edited.resolve();
            await hierarchyStarted.promise;
            // Only control scheduling after real writes. With early protection, the hierarchy request waits for this
            // plan, so allow it to finish; without it, the request takes the graph and the next row deadlocks.
            await Promise.race([hierarchyLocked.promise, delay(150)]);
          }
          return result;
        },
      );
      const lock = h.services.subtasks.relations.lock.bind(
        h.services.subtasks.relations,
      );
      vi.spyOn(h.services.subtasks.relations, 'lock').mockImplementation(
        async (...args) => {
          await lock(...args);
          hierarchyLocked.resolve();
        },
      );
      const pending = plan
        ? call(`/plans/${plan.id}/execute`, {
            role: 'member',
            method: 'POST',
            body: JSON.stringify({ revision: plan.revision }),
          })
        : propose();
      await edited.promise;
      const hierarchy = call(`/issues/${a.id}`, {
        role: 'member',
        method: 'PATCH',
        body: JSON.stringify({
          revision: a.revision,
          parentIssueId: parent.id,
        }),
      });
      const [planResponse, hierarchyResponse] = await Promise.all([
        pending,
        hierarchy,
      ]);
      expect(planResponse.status).toBe(phase === 'execution' ? 200 : 201);
      expect((await planResponse.json()).data.status).toBe(
        phase === 'execution' ? 'executed' : 'pending',
      );
      expect(hierarchyResponse.status).toBe(phase === 'execution' ? 409 : 200);
      if (phase === 'execution') {
        expect(['DEPENDENCY_GRAPH_CHANGED', 'REVISION_CONFLICT']).toContain(
          (await hierarchyResponse.json()).error.reason,
        );
      }
      expect(await h.services.issueQueries.detail(viewer, a.id)).toMatchObject({
        title: phase === 'execution' ? 'Updated' : 'A',
        parentIssueId: phase === 'execution' ? null : parent.id,
      });
      expect(
        (await h.services.issueQueries.detail(viewer, c.id)).blockedBy,
      ).toHaveLength(phase === 'execution' ? 1 : 0);
    },
  );

  const convert = (issueId: string, dependencyId: string) =>
    call(`/issues/${issueId}/dependencies/${dependencyId}`, {
      role: 'member',
      method: 'PATCH',
      body: JSON.stringify({ expectedType: 'relatedTo', type: 'blockedBy' }),
    });

  async function assertConflict(response: Response) {
    expect([400, 409]).toContain(response.status);
    const body = await response.json();
    expect(['DEPENDENCY_CYCLE', 'DEPENDENCY_GRAPH_CHANGED']).toContain(
      body.error.reason,
    );
    if (response.status === 409) expect(body.error.status).toBe('ABORTED');
  }

  it('keeps concurrent standalone creation successful without advancing the graph revision', async () => {
    const graph = h.database.connection().repository('pmIssueGraph');
    const before = await graph.findOne({ filter: { id: 'default' } });
    const titles = ['Independent one', 'Independent two'];
    const responses = await Promise.all(
      titles.map((title) =>
        call('/issues', {
          role: 'member',
          method: 'POST',
          body: JSON.stringify({ title }),
        }),
      ),
    );
    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    const issues = h.database.connection().repository('pmIssues');
    for (const title of titles)
      expect(await issues.count({ filter: { title } })).toBe(1);
    const rows = await issues.findMany();
    expect(rows.map((row) => row.identifier).sort()).toEqual(['PM-1', 'PM-2']);
    expect(await graph.findOne({ filter: { id: 'default' } })).toEqual(before);
  });

  it('uses one lock order for plans that create then link and link then create', async () => {
    const viewer = h.viewer('alice');
    const a = await h.services.issues.create(viewer, { title: 'A' });
    const b = await h.services.issues.create(viewer, { title: 'B' });
    const c = await h.services.issues.create(viewer, { title: 'C' });
    const d = await h.services.issues.create(viewer, { title: 'D' });
    // These are the same ambient units that execute plan rows. Both orders must acquire the graph before the counter.
    const operations = [
      () =>
        h.services.tx.unit(async () => {
          await h.services.issues.create(viewer, {
            title: 'Created before link',
          });
          await h.services.subtasks.addDependency(viewer, a.id, {
            dependsOnIssueId: b.id,
          });
        }),
      () =>
        h.services.tx.unit(async () => {
          await h.services.subtasks.addDependency(viewer, c.id, {
            dependsOnIssueId: d.id,
          });
          await h.services.issues.create(viewer, {
            title: 'Created after link',
          });
        }),
    ];
    const results = await Promise.allSettled(operations.map((run) => run()));
    expect(results.some((result) => result.status === 'fulfilled')).toBe(true);
    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        // A conflict is retryable as a whole; native lock-order deadlocks are not accepted by this regression.
        expect(result.reason).toMatchObject({
          code: 'DEPENDENCY_GRAPH_CHANGED',
        });
        const source = index === 0 ? a : c;
        expect(
          (await h.services.issueQueries.detail(viewer, source.id)).blockedBy,
        ).toEqual([]);
        await operations[index]!();
      }
    }
    expect(
      (await h.services.issueQueries.detail(viewer, a.id)).blockedBy,
    ).toHaveLength(1);
    expect(
      (await h.services.issueQueries.detail(viewer, c.id)).blockedBy,
    ).toHaveLength(1);
    for (const title of ['Created before link', 'Created after link']) {
      expect(
        await h.database
          .connection()
          .repository('pmIssues')
          .count({ filter: { title } }),
      ).toBe(1);
    }
  });

  it('rolls back restoring a deleted node when its waits would now close a cycle', async () => {
    const viewer = h.viewer('alice', 'admin');
    const a = await h.services.issues.create(viewer, { title: 'A' });
    const b = await h.services.issues.create(viewer, { title: 'B' });
    const c = await h.services.issues.create(viewer, { title: 'C' });
    await h.services.subtasks.addDependency(viewer, b.id, {
      dependsOnIssueId: c.id,
    });
    await h.services.subtasks.addDependency(viewer, c.id, {
      dependsOnIssueId: a.id,
    });
    const ab = await h.services.subtasks.addDependency(viewer, a.id, {
      dependsOnIssueId: b.id,
      type: 'relatedTo',
    });
    expect(
      (await call(`/issues/${c.id}`, { role: 'admin', method: 'DELETE' }))
        .status,
    ).toBe(204);
    expect((await convert(a.id, ab.dependencyId)).status).toBe(200);
    const events: string[] = [];
    const off = h.services.events.on('issue.restored', (event) => {
      events.push(event.issueId);
    });
    const response = await call(`/issues/${c.id}/restore`, {
      role: 'admin',
      method: 'POST',
    });
    off();
    await assertConflict(response);
    expect(events).toEqual([]);
    expect(
      await h.database
        .connection()
        .repository('pmIssues')
        .findOne({ filter: { id: c.id } }),
    ).toMatchObject({ deletedAt: expect.anything() });
  });

  it('keeps three concurrent conversions acyclic and preserves rejected links', async () => {
    const viewer = h.viewer('alice');
    for (let trial = 0; trial < 4; trial += 1) {
      const issues = [];
      for (const title of ['A', 'B', 'C'])
        issues.push(await h.services.issues.create(viewer, { title }));
      const links = [];
      for (const [index, issue] of issues.entries()) {
        links.push(
          await h.services.subtasks.addDependency(viewer, issue.id, {
            dependsOnIssueId: issues[(index + 1) % 3]!.id,
            type: 'relatedTo',
          }),
        );
      }
      const responses = await Promise.all(
        issues.map((issue, index) =>
          convert(issue.id, links[index]!.dependencyId),
        ),
      );
      expect(
        responses.filter((response) => response.ok).length,
      ).toBeGreaterThan(0);
      expect(responses.filter((response) => response.ok).length).toBeLessThan(
        3,
      );
      for (const [index, response] of responses.entries()) {
        const detail = await h.services.issueQueries.detail(
          viewer,
          issues[index]!.id,
        );
        if (response.ok) {
          expect(detail.blockedBy).toEqual([
            expect.objectContaining({
              dependencyId: links[index]!.dependencyId,
            }),
          ]);
        } else {
          await assertConflict(response);
          expect(detail.blockedBy).toEqual([]);
          expect(detail.relatedTo).toContainEqual(
            expect.objectContaining({
              dependencyId: links[index]!.dependencyId,
            }),
          );
        }
      }
    }
  });

  it.each(['conversion', 'addition'] as const)(
    'protects disjoint endpoints when racing another %s',
    async (operation) => {
      const viewer = h.viewer('alice');
      const a = await h.services.issues.create(viewer, { title: 'A' });
      const b = await h.services.issues.create(viewer, { title: 'B' });
      const c = await h.services.issues.create(viewer, { title: 'C' });
      const d = await h.services.issues.create(viewer, { title: 'D' });
      await h.services.subtasks.addDependency(viewer, b.id, {
        dependsOnIssueId: c.id,
      });
      await h.services.subtasks.addDependency(viewer, d.id, {
        dependsOnIssueId: a.id,
      });
      const ab = await h.services.subtasks.addDependency(viewer, a.id, {
        dependsOnIssueId: b.id,
        type: 'relatedTo',
      });
      const cd =
        operation === 'conversion'
          ? await h.services.subtasks.addDependency(viewer, c.id, {
              dependsOnIssueId: d.id,
              type: 'relatedTo',
            })
          : undefined;
      const responses = await Promise.all([
        convert(a.id, ab.dependencyId),
        cd
          ? convert(c.id, cd.dependencyId)
          : call(`/issues/${c.id}/dependencies`, {
              role: 'member',
              method: 'POST',
              body: JSON.stringify({
                dependsOnIssueId: d.id,
                type: 'blockedBy',
              }),
            }),
      ]);
      expect(responses.filter((response) => response.ok)).toHaveLength(1);
      await assertConflict(responses.find((response) => !response.ok)!);
      const details = await Promise.all(
        [a, c].map((issue) => h.services.issueQueries.detail(viewer, issue.id)),
      );
      expect(details.flatMap((detail) => detail.blockedBy)).toHaveLength(1);
    },
  );

  it.each(['parent', 'stage', 'create'] as const)(
    'protects implicit waits when racing a %s change',
    async (operation) => {
      const viewer = h.viewer('alice');
      const parent = await h.services.issues.create(viewer, {
        title: 'Parent',
      });
      const a = await h.services.issues.create(viewer, {
        title: 'A',
        ...(operation === 'stage'
          ? { parentIssueId: parent.id, stage: 0 }
          : {}),
      });
      const b = await h.services.issues.create(viewer, {
        title: 'B',
        ...(operation === 'stage'
          ? { parentIssueId: parent.id, stage: 0 }
          : {}),
      });
      const ab = await h.services.subtasks.addDependency(viewer, a.id, {
        dependsOnIssueId: b.id,
        type: 'relatedTo',
      });
      const responses = await Promise.all([
        convert(a.id, ab.dependencyId),
        operation === 'create'
          ? call('/issues', {
              role: 'member',
              method: 'POST',
              body: JSON.stringify({
                title: 'Child',
                parentIssueId: b.id,
                blockedBy: [a.id],
              }),
            })
          : call(`/issues/${operation === 'parent' ? a.id : b.id}`, {
              role: 'member',
              method: 'PATCH',
              body: JSON.stringify(
                operation === 'parent'
                  ? { revision: a.revision, parentIssueId: b.id }
                  : { revision: b.revision, stage: 1 },
              ),
            }),
      ]);
      expect(responses.filter((response) => response.ok)).toHaveLength(1);
      await assertConflict(responses.find((response) => !response.ok)!);
      const detail = await h.services.issueQueries.detail(viewer, a.id);
      expect(detail.blockedBy).toHaveLength(responses[0]!.ok ? 1 : 0);
      if (!responses[1]!.ok && operation === 'parent')
        expect(detail.parentIssueId).toBeNull();
    },
  );
});

describe('dependencies over HTTP', () => {
  it.each(['id', 'target'] as const)(
    'removes converted relationships through the %s endpoint with the current direction and release effects',
    async (endpoint) => {
      const viewer = h.viewer('alice');
      const a = await h.services.issues.create(viewer, { title: 'A' });
      const b = await h.services.issues.create(viewer, { title: 'B' });
      const released: { issueId: string; releasedBy: string }[] = [];
      h.services.events.on('issue.dependencyReleased', (event) => {
        released.push({
          issueId: event.issueId,
          releasedBy: event.releasedBy.issueId,
        });
      });
      const remove = (
        issueId: string,
        otherId: string,
        dependencyId: string,
        type: 'blockedBy' | 'relatedTo',
        role: string | undefined = 'member',
      ) =>
        endpoint === 'id'
          ? call(`/issues/${issueId}/dependencies/${dependencyId}`, {
              role,
              method: 'DELETE',
            })
          : call(`/issues/${issueId}/removeDependency`, {
              role,
              method: 'POST',
              body: JSON.stringify({ dependsOnIssueId: otherId, type }),
            });
      const convert = (dependencyId: string, type: 'blockedBy' | 'relatedTo') =>
        call(`/issues/${b.id}/dependencies/${dependencyId}`, {
          role: 'member',
          method: 'PATCH',
          body: JSON.stringify({
            type,
            expectedType: type === 'blockedBy' ? 'relatedTo' : 'blockedBy',
          }),
        });
      const related = await h.services.subtasks.addDependency(viewer, a.id, {
        dependsOnIssueId: b.id,
        type: 'relatedTo',
      });
      expect((await convert(related.dependencyId, 'blockedBy')).status).toBe(
        200,
      );
      const before = await h.services.issueQueries.detail(viewer, b.id);
      expect(before.blockers).toEqual([
        expect.objectContaining({ issueId: a.id }),
      ]);
      // Conversion from the reverse end makes B the waiting issue. Only that end may now remove the prerequisite.
      expect(
        (await remove(a.id, b.id, related.dependencyId, 'blockedBy')).status,
      ).toBe(404);
      expect(
        (await remove(b.id, a.id, related.dependencyId, 'blockedBy', 'none'))
          .status,
      ).toBe(404);
      expect(
        (await h.services.issueQueries.detail(viewer, b.id)).activities,
      ).toEqual(before.activities);
      expect(released).toEqual([]);
      expect(
        (await remove(b.id, a.id, related.dependencyId, 'blockedBy')).status,
      ).toBe(204);
      const after = await h.services.issueQueries.detail(viewer, b.id);
      expect(after.blockedBy).toEqual([]);
      expect(after.blockers).toEqual([]);
      expect(
        (await h.services.issueQueries.detail(viewer, a.id)).blocks,
      ).toEqual([]);
      expect(
        after.activities.filter(
          (activity) => activity.action === 'dependency_removed',
        ),
      ).toEqual([
        expect.objectContaining({
          details: expect.objectContaining({
            dependencyId: related.dependencyId,
            dependsOnIssueId: a.id,
            type: 'blockedBy',
          }),
        }),
      ]);
      expect(released).toEqual([{ issueId: b.id, releasedBy: a.id }]);
      expect(
        (await remove(b.id, a.id, related.dependencyId, 'blockedBy')).status,
      ).toBe(404);
      expect(
        (await h.services.issueQueries.detail(viewer, b.id)).activities,
      ).toEqual(after.activities);
      expect(released).toHaveLength(1);

      const blocker = await h.services.subtasks.addDependency(viewer, b.id, {
        dependsOnIssueId: a.id,
      });
      expect((await convert(blocker.dependencyId, 'relatedTo')).status).toBe(
        200,
      );
      expect(released).toHaveLength(2);
      // Once converted back to related, either end can remove it without another release notification.
      expect(
        (await remove(a.id, b.id, blocker.dependencyId, 'relatedTo')).status,
      ).toBe(204);
      for (const issue of [a, b])
        expect(
          (await h.services.issueQueries.detail(viewer, issue.id)).relatedTo,
        ).toEqual([]);
      const final = await h.services.issueQueries.detail(viewer, b.id);
      expect(
        final.activities.filter(
          (activity) =>
            activity.action === 'dependency_removed' &&
            activity.details.type === 'relatedTo',
        ),
      ).toEqual([
        expect.objectContaining({
          details: expect.objectContaining({
            dependencyId: blocker.dependencyId,
            dependsOnIssueId: a.id,
          }),
        }),
      ]);
      expect(released).toEqual([
        { issueId: b.id, releasedBy: a.id },
        { issueId: b.id, releasedBy: a.id },
      ]);
    },
  );

  it('refuses delegated conversion without changing the relationship', async () => {
    const viewer = h.viewer('alice');
    const a = await h.services.issues.create(viewer, { title: 'A' });
    const b = await h.services.issues.create(viewer, { title: 'B' });
    const link = await h.services.subtasks.addDependency(viewer, a.id, {
      dependsOnIssueId: b.id,
      type: 'relatedTo',
    });
    const write = vi.fn();
    container.instance(projectsDelegatedWritesToken, {
      covers: () => true,
      write,
    });
    const response = await call(
      `/issues/${a.identifier}/dependencies/${link.dependencyId}`,
      {
        role: 'member',
        method: 'PATCH',
        body: JSON.stringify({ expectedType: 'relatedTo', type: 'blockedBy' }),
      },
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { status: 'FAILED_PRECONDITION', reason: 'PLAN_REQUIRED' },
    });
    expect(write).not.toHaveBeenCalled();
    const detail = await h.services.issueQueries.detail(viewer, a.id);
    expect(detail.relatedTo).toEqual([link]);
    expect(detail.blockedBy).toEqual([]);
  });

  it('changes a relationship in place and reports a stale expected type as 409', async () => {
    const viewer = h.viewer('alice');
    const a = await h.services.issues.create(viewer, { title: 'A' });
    const b = await h.services.issues.create(viewer, { title: 'B' });
    const link = await h.services.subtasks.addDependency(viewer, a.id, {
      dependsOnIssueId: b.id,
      type: 'relatedTo',
    });
    const path = `/issues/${a.identifier}/dependencies/${link.dependencyId}`;
    const body = JSON.stringify({
      expectedType: 'relatedTo',
      type: 'blockedBy',
    });
    const changed = await call(path, { role: 'member', method: 'PATCH', body });
    expect(changed.status).toBe(200);
    expect(await changed.json()).toMatchObject({
      data: {
        dependencyId: link.dependencyId,
        issueId: b.id,
        type: 'blockedBy',
      },
    });
    const stale = await call(path, { role: 'member', method: 'PATCH', body });
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({
      error: {
        status: 'ABORTED',
        reason: 'DEPENDENCY_CHANGED',
        domain: 'projects',
      },
    });
    const detail = await h.services.issueQueries.detail(viewer, a.id);
    expect(detail.blockedBy).toEqual([
      expect.objectContaining({
        dependencyId: link.dependencyId,
        type: 'blockedBy',
      }),
    ]);
    expect(detail.relatedTo).toEqual([]);
  });

  it('returns two conflicts and keeps both relationships for opposite concurrent changes', async () => {
    const viewer = h.viewer('alice');
    const a = await h.services.issues.create(viewer, { title: 'A' });
    const b = await h.services.issues.create(viewer, { title: 'B' });
    const blocking = await h.services.subtasks.addDependency(viewer, a.id, {
      dependsOnIssueId: b.id,
    });
    const related = await h.services.subtasks.addDependency(viewer, a.id, {
      dependsOnIssueId: b.id,
      type: 'relatedTo',
    });
    const responses = await Promise.all([
      call(`/issues/${a.identifier}/dependencies/${blocking.dependencyId}`, {
        role: 'member',
        method: 'PATCH',
        body: JSON.stringify({ expectedType: 'blockedBy', type: 'relatedTo' }),
      }),
      call(`/issues/${a.identifier}/dependencies/${related.dependencyId}`, {
        role: 'member',
        method: 'PATCH',
        body: JSON.stringify({ expectedType: 'relatedTo', type: 'blockedBy' }),
      }),
    ]);
    for (const response of responses) {
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({
        error: { reason: 'DEPENDENCY_EXISTS', domain: 'projects' },
      });
    }
    const detail = await h.services.issueQueries.detail(viewer, a.id);
    expect(detail.blockedBy).toEqual([blocking]);
    expect(detail.relatedTo).toEqual([related]);
    expect(detail.blockers).toHaveLength(1);
  });

  it('authenticates and authorizes conversion before validating input', async () => {
    const path = '/issues/PM-1/dependencies/missing';
    const anonymous = await call(path, { method: 'PATCH', body: '{}' });
    expect(anonymous.status).toBe(401);
    const forbidden = await call(path, {
      role: 'none',
      method: 'PATCH',
      body: '[]',
    });
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toMatchObject({
      error: {
        status: 'PERMISSION_DENIED',
        reason: 'FORBIDDEN',
        domain: 'projects',
      },
    });
  });

  it.each([
    { type: 'relatedTo' },
    { expectedType: 'blockedBy', type: 'blocks' },
    { expectedType: 'blockedBy', type: 'relatedTo', dependsOnIssueId: 'PM-2' },
  ])('rejects an invalid conversion body %j', async (body) => {
    const response = await call('/issues/PM-1/dependencies/missing', {
      role: 'member',
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { reason: 'INVALID_INPUT', fieldViolations: expect.any(Array) },
    });
  });

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

describe('comments over HTTP', () => {
  it('rejects message and provenance on public comment writes and keeps the read permission boundary', async () => {
    const issue = await h.services.issues.create(h.viewer('alice'), {
      title: 'Display message',
    });
    const message = {
      type: 'studio.runAppended',
      params: { agentName: 'Sol' },
    } as const;
    for (const extra of [{ message }, { origin: { message } }]) {
      const response = await call(`/issues/${issue.id}/comments`, {
        role: 'member',
        method: 'POST',
        body: JSON.stringify({ content: 'Hi', ...extra }),
      });
      expect(response.status).toBe(400);
    }
    await h.services.comments.post(
      { type: 'system', id: null },
      issue.id,
      { content: 'Fallback.' },
      { message, origin: { runId: 'private-run' } },
    );
    expect((await call(`/issues/${issue.id}/comments`)).status).toBe(401);
    expect(
      (await call(`/issues/${issue.id}/comments`, { role: 'none' })).status,
    ).toBe(404);
    const response = await call(`/issues/${issue.id}/comments`, {
      role: 'member',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: [{ root: { message } }],
    });
  });

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
    const later = (await (
      await call(
        `/issues/PM-1/comments?since=${encodeURIComponent('2999-01-01T00:00:00Z')}`,
        { role: 'member' },
      )
    ).json()) as { data: unknown[] };
    expect(later.data).toEqual([]);
    const invalid = await call('/issues/PM-1/comments?since=yesterday', {
      role: 'member',
    });
    expect(invalid.status).toBe(400);
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
  it('authenticates screenshot reads, checks visibility and documents the bounded response', async () => {
    expect((await call('/issues/PM-1/screenshots')).status).toBe(401);
    await h.services.issues.create(h.viewer('alice'), { title: 'Images' });
    expect(
      (await call('/issues/PM-1/screenshots', { role: 'none' })).status,
    ).toBe(404);
    const response = await call('/issues/PM-1/screenshots', { role: 'member' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [],
      meta: { limit: 100, truncated: false },
    });
  });
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
        'projectsListIssueStatuses',
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

describe('CLI session issue integration', () => {
  it('keeps ordinary creation unchanged and rejects a session context without integration', async () => {
    const created = await call('/issues', {
      role: 'admin',
      method: 'POST',
      body: JSON.stringify({ title: 'Ordinary task' }),
    });
    expect(created.status).toBe(201);
    const refused = await call('/issues', {
      role: 'admin',
      method: 'POST',
      headers: { 'x-nb-agent-session': 'foreign' },
      body: JSON.stringify({ title: 'Refused' }),
    });
    expect(refused.status).toBe(403);
  });

  it.each([false, true])(
    'defaults the project, links only successful creation and adds progress (delegated=%s)',
    async (delegated) => {
      const project = await h.services.projects.create(h.viewer('alice'), {
        name: 'Session project',
      });
      const link = vi.fn(async (_id: string) => {});
      const context = vi.fn(
        async (
          viewer: import('../server/tokens.js').Viewer,
          sessionId: string,
        ) => {
          if (sessionId !== 'own' || viewer.userId !== 'alice')
            throw new ApiError({
              status: 'PERMISSION_DENIED',
              reason: 'SESSION_CONTEXT_REFUSED',
              domain: 'agentSessions',
              message: 'Session refused.',
            });
          return { projectId: project.id, link };
        },
      );
      container.instance(projectsIssueSessionToken, {
        creationContext: context,
        progress: async () => ({
          agent: 'Sol',
          waitingFor: { reason: 'review' },
          pullRequest: 'https://example.test/pull/1',
        }),
      });
      if (delegated)
        container.instance(projectsDelegatedWritesToken, {
          covers: () => true,
          write: async (viewer, request) => ({
            plan: await h.services.plans.create(
              viewer,
              {
                title: request.title,
                source: { kind: 'test' },
                rows: request.rows,
              },
              { execute: true },
            ),
            meta: {},
          }),
        });
      const create = (sessionId: string, role = 'admin', extra = {}) =>
        call('/issues', {
          role,
          method: 'POST',
          headers: { 'x-nb-agent-session': sessionId },
          body: JSON.stringify({ title: 'Session task', ...extra }),
        });
      expect((await create('foreign')).status).toBe(403);
      expect(link).not.toHaveBeenCalled();
      const made = await create('own');
      expect(made.status).toBe(201);
      const body = await made.json();
      expect(body.data).toMatchObject({
        projectId: project.id,
        statusKey: 'backlog',
      });
      expect(link).toHaveBeenCalledExactlyOnceWith(body.data.id);
      const detail = await call(`/issues/${body.data.id}`, { role: 'admin' });
      expect(await detail.json()).toMatchObject({
        data: {
          progress: {
            agent: 'Sol',
            waitingFor: { reason: 'review' },
            pullRequest: 'https://example.test/pull/1',
          },
        },
      });
      link.mockClear();
      const forbidden = await create('own', 'none');
      expect(forbidden.status).not.toBe(201);
      expect(link).not.toHaveBeenCalled();
    },
  );
});

// @vitest-environment node
import path from 'node:path';
import { type DatabaseManager, databaseManagerToken } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  workflowServiceToken,
  type WorkflowServiceApi,
} from '@nocobase/app-plugin-workflow/server';
import type { Application } from '@nocobase/app-server/application';
import {
  ServiceContainer,
  type ServiceToken,
} from '@nocobase/service-provider';
import { type Hono, type MiddlewareHandler } from 'hono';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { quotationReviewTaskRoutes } from '../../server/routes/quotation-review-tasks.ts';

let database: DatabaseManager;
let testDatabase: TestDatabase;
let router: Hono;
let id: number;
const getRequest = vi.fn();
const getPending = vi.fn();
beforeEach(async () => {
  getRequest.mockReset().mockResolvedValue({ status: 'queued', reason: null });
  getPending
    .mockReset()
    .mockResolvedValue({ status: 'pending', correlation: null });
  testDatabase = await createTestDatabase();
  database = testDatabase.database;
  await database
    .createMigrator({
      packageName: 'review-routes',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    })
    .latest();
  const row = await database.repository('quotationReviewTasks').createOne({
    values: {
      runId: '42',
      quotationId: 'Q-100',
      totalCents: 50000,
      route: 'standard',
      status: 'submitted',
      resumeRequestId: '12345',
      createdAt: new Date(),
      decision: 'approved',
      reviewerId: 'alice',
      confirmedBy: 'Alice',
      comment: 'Checked',
    },
  });
  id = Number(row.record.id);
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  const required = (): MiddlewareHandler => async (c, next) => {
    if (!c.req.header('x-test-user'))
      return c.json({ code: 'UNAUTHENTICATED' }, 401);
    c.set('auth', { user: { id: 'alice', name: 'Alice' } });
    await next();
  };
  container.instance(authenticationToken, {
    required,
  } as unknown as typeof authenticationToken extends ServiceToken<infer T>
    ? T
    : never);
  container.instance(workflowServiceToken, {
    getInstructionApi: () => ({ getRequest, getPending }),
  } as unknown as WorkflowServiceApi);
  router = await quotationReviewTaskRoutes.createRouter({
    container,
  } as Application);
});
afterEach(async () => {
  await testDatabase.destroy();
});

it.each([
  { status: 'queued', reason: null },
  { status: 'processing', reason: null },
  { status: 'consumed', reason: null },
  { status: 'rejected', reason: 'run-ended' },
  { status: 'rejected', reason: 'stale' },
  { status: 'rejected', reason: 'commit-failed' },
  { status: 'not-found' },
])(
  'reports the recorded outcome $status ($reason) on list and detail',
  async (outcome) => {
    getRequest.mockResolvedValue(outcome);
    for (const url of [
      '/quotationReviewTasks',
      `/quotationReviewTasks/${id}`,
    ]) {
      const response = await router.request(url, {
        headers: { 'x-test-user': 'alice' },
      });
      expect(response.status).toBe(200);
      const body = (await response.json()) as { data: unknown };
      expect(Array.isArray(body.data) ? body.data[0] : body.data).toMatchObject(
        {
          resumeRequestId: '12345',
          resumeRequest: outcome,
        },
      );
    }
    expect(getRequest).toHaveBeenCalledWith('12345');
  },
);

it('keeps historical decisions readable without inventing a successful outcome', async () => {
  await database.repository('quotationReviewTasks').updateOne({
    filter: { id },
    values: { resumeRequestId: null },
  });
  const response = await router.request(`/quotationReviewTasks/${id}`, {
    headers: { 'x-test-user': 'alice' },
  });
  expect(await response.json()).toMatchObject({
    data: { resumeRequest: null },
  });
  expect(getRequest).not.toHaveBeenCalled();
});

it('requires authentication to read submission outcomes', async () => {
  expect((await router.request(`/quotationReviewTasks/${id}`)).status).toBe(
    401,
  );
  expect(getRequest).not.toHaveBeenCalled();
});

it('returns paged tasks with string ids and reviewer metadata', async () => {
  const headers = { 'x-test-user': 'alice' };
  const list = await router.request(
    '/quotationReviewTasks?pageSize=1&q=Q-100',
    { headers },
  );
  expect(await list.json()).toMatchObject({
    data: [{ id: String(id), quotationId: 'Q-100' }],
    meta: { page: 1, pageSize: 1, total: 1 },
  });
  const detail = await router.request(`/quotationReviewTasks/${id}`, {
    headers,
  });
  expect(await detail.json()).toMatchObject({
    data: { id: String(id) },
    meta: { currentReviewer: { id: 'alice', name: 'Alice' } },
  });
});

it.each([
  {
    path: '/quotationReviewTasks?pageSize=0',
    status: 400,
    reason: 'INVALID_INPUT',
  },
  {
    path: '/quotationReviewTasks/not-an-id',
    status: 400,
    reason: 'INVALID_INPUT',
  },
  { path: '/quotationReviewTasks/999999', status: 404, reason: 'NOT_FOUND' },
])('returns a standard error for $path', async ({ path, status, reason }) => {
  const response = await router.request(path, {
    headers: { 'x-test-user': 'alice' },
  });
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({
    error: { code: status, reason },
  });
});

it('validates decisions before writing and reports field violations', async () => {
  const response = await router.request(`/quotationReviewTasks/${id}/submit`, {
    method: 'POST',
    headers: { 'x-test-user': 'alice', 'content-type': 'application/json' },
    body: JSON.stringify({
      decision: 'unknown',
      comment: '',
      reviewerId: 'mallory',
    }),
  });
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    error: { reason: 'INVALID_INPUT', fieldViolations: expect.any(Array) },
  });
  expect(
    await database
      .repository('quotationReviewTasks')
      .findOne({ filter: { id } }),
  ).toMatchObject({ reviewerId: 'alice', decision: 'approved' });
});

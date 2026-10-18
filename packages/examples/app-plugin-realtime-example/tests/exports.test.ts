import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createTestDatabase,
  describeMigration,
} from '@nocobase/app-testing/server';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
  findApiDocumentSchemaProblems,
} from '@nocobase/app-server/router';
import type { Job, JobExecutionContext, JobExecutor } from '@nocobase/jobs';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type Context, type Next } from 'hono';
import {
  csvCell,
  TaskExportService,
  taskExportServiceToken,
} from '../server/export-service.js';
import { exportRoutes } from '../server/routes/exports.js';

const source = {
  packageName: '@nocobase/app-plugin-realtime-example',
  directory: path.resolve(import.meta.dirname, '../database/migrations'),
};
const tasks = {
  packageName: '@nocobase/app-plugin-notification-example',
  directory: path.resolve(
    import.meta.dirname,
    '../../app-plugin-notification-example/database/migrations',
  ),
};
const disposers: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const close of disposers.splice(0)) await close();
  vi.restoreAllMocks();
});
describeMigration('202610180001_create_realtime_example_exports', {
  sources: [source],
  up: async ({ connection, expectCollection }) => {
    await expectCollection('realtimeExampleExports').toHaveField('userId');
    await expectCollection('realtimeExampleExports').toHaveField('content');
    const content =
      '\uFEFFid,title\r\n' +
      Array.from(
        { length: 500 },
        (_, index) => `${index},"${'Quarterly report '.repeat(10)}"\r\n`,
      ).join('');
    expect(Buffer.byteLength(content, 'utf8')).toBeGreaterThan(65_535);
    const id = crypto.randomUUID();
    await connection.query
      .insertInto('realtimeExampleExports')
      .values({
        id,
        userId: 'alice',
        status: 'completed',
        createdAt: '2026-10-18T00:00:00',
        content,
      })
      .execute();
    const stored = await connection.query
      .selectFrom('realtimeExampleExports')
      .select('content')
      .where('id', '=', id)
      .executeTakeFirst();
    expect(stored?.content).toBe(content);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('realtimeExampleExports').not.toExist();
  },
});
async function fixture() {
  const db = await createTestDatabase();
  disposers.push(() => db.destroy());
  await db.database.createMigrator({ sources: [source, tasks] }).latest();
  const jobs: Job[] = [];
  const addJob = vi.fn(async (job: Job) => {
    jobs.push(job);
    return {
      jobId: crypto.randomUUID(),
      jobName: 'realtime-example-task-export',
      enqueuedAt: new Date(),
    };
  });
  const topic = {
    publishFor: vi.fn(async () => ({ eventId: crypto.randomUUID() })),
    close() {},
  };
  const service = new TaskExportService(
    db.database,
    { addJob } as unknown as JobExecutor,
    topic,
  );
  const container = new ServiceContainer();
  container.instance(taskExportServiceToken, service);
  container.instance(authenticationToken, {
    required: () => async (c: Context<AuthEnv>, next: Next) => {
      const id = c.req.header('x-test-user');
      if (!id)
        return c.json(
          {
            error: {
              status: 'UNAUTHENTICATED',
              reason: 'AUTHENTICATION_REQUIRED',
            },
          },
          401,
        );
      c.set('auth', { user: { id } } as never);
      await next();
    },
  } as never);
  const router = new Hono();
  router.route(
    '/api',
    await exportRoutes.createRouter({ container } as AppPluginApplication),
  );
  const context = (
    signal = new AbortController().signal,
  ): JobExecutionContext => ({
    jobId: 'test',
    jobName: 'realtime-example-task-export',
    enqueuedAt: new Date(),
    runAt: new Date(),
    attempt: 1,
    signal,
    reportProgress: vi.fn(async () => {}),
  });
  return { db, jobs, addJob, topic, service, router, context };
}
it('documents and protects every export operation independently', async () => {
  const { router } = await fixture();
  expect(findUndeclaredApiRoutes(router)).toEqual([]);
  const document = await generateApiDocument(router, {
    info: { title: 'Exports', version: '0' },
  });
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  for (const [method, route] of [
    ['GET', ''],
    ['POST', ''],
    ['GET', `/${crypto.randomUUID()}/file`],
  ]) {
    const response = await router.request(
      `/api/realtimeExample/exports${route}`,
      { method },
    );
    expect(response.status).toBe(401);
  }
});
it('exports only participant tasks as a durable formula-safe CSV, with private downloads', async () => {
  const { db, jobs, service, topic, router, context } = await fixture();
  const taskId = crypto.randomUUID();
  await db.database
    .connection()
    .query.insertInto('notificationExampleTasks')
    .values([
      {
        id: taskId,
        title: '=HYPERLINK("unsafe")',
        description: 'Line one,\nLine "two"',
        status: 'open',
        creatorId: 'alice',
        assigneeId: 'bob',
        createdAt: '2026-10-18T00:00:00',
        updatedAt: '2026-10-18T00:00:00',
      },
      {
        id: crypto.randomUUID(),
        title: 'Private',
        description: 'Hidden',
        status: 'open',
        creatorId: 'charlie',
        assigneeId: 'charlie',
        createdAt: '2026-10-18T00:00:00',
        updatedAt: '2026-10-18T00:00:00',
      },
    ])
    .execute();
  const response = await router.request('/api/realtimeExample/exports', {
    method: 'POST',
    headers: { 'x-test-user': 'bob', 'content-type': 'application/json' },
    body: '{}',
  });
  expect(response.status).toBe(202);
  const { data: queued } = (await response.json()) as {
    data: { id: string; status: string };
  };
  expect(queued.status).toBe('queued');
  await expect(service.create('bob')).rejects.toMatchObject({
    reason: 'EXPORT_NOT_READY',
  });
  await expect(service.file('bob', queued.id)).rejects.toMatchObject({
    reason: 'EXPORT_NOT_READY',
  });
  const ctx = context();
  await jobs[0]!.execute(ctx);
  expect(ctx.reportProgress).toHaveBeenCalledWith(100);
  expect(await service.list('bob')).toEqual([
    expect.objectContaining({ status: 'completed', processed: 1, total: 1 }),
  ]);
  expect(await service.list('charlie')).toEqual([]);
  expect(
    topic.publishFor.mock.calls.every(([userId]) => userId === 'bob'),
  ).toBe(true);
  const file = await service.file('bob', queued.id);
  expect(file.content).toContain(taskId);
  expect(file.content).toContain('"\'=HYPERLINK(""unsafe"")"');
  expect(file.content).toContain('"Line one,\nLine ""two"""');
  expect(file.content).not.toContain('Private');
  const denied = await router.request(
    `/api/realtimeExample/exports/${queued.id}/file`,
    { headers: { 'x-test-user': 'alice' } },
  );
  expect(denied.status).toBe(404);
  const afterReload = new TaskExportService(
    db.database,
    { addJob: vi.fn() } as unknown as JobExecutor,
    topic,
  );
  expect(await afterReload.file('bob', queued.id)).toEqual(file);
  await service.create('bob');
});
it('recovers interrupted work and handles fast execution without losing the owner', async () => {
  const { db, jobs, service, topic, addJob, context } = await fixture();
  const row = await service.create('alice');
  const controller = new AbortController();
  controller.abort();
  await expect(jobs[0]!.execute(context(controller.signal))).rejects.toThrow();
  expect(await service.list('alice')).toEqual([
    expect.objectContaining({ status: 'queued' }),
  ]);
  const recovered = new TaskExportService(
    db.database,
    { addJob } as unknown as JobExecutor,
    topic,
  );
  await recovered.recover();
  await jobs[1]!.execute(context());
  expect((await recovered.file('alice', row.id)).content).toContain('id,title');
  addJob.mockImplementationOnce(async (job) => {
    await job.execute(context());
    return {
      jobId: 'fast',
      jobName: 'realtime-example-task-export',
      enqueuedAt: new Date(),
    };
  });
  expect((await recovered.create('alice')).status).toBe('completed');
});
it('records enqueue failure, releases the active slot, and tolerates announcement failure', async () => {
  const { service, addJob, topic } = await fixture();
  addJob.mockRejectedValueOnce(new Error('Queue unavailable'));
  await expect(service.create('alice')).rejects.toThrow('Queue unavailable');
  expect(await service.list('alice')).toEqual([
    expect.objectContaining({ status: 'failed', reason: 'queue' }),
  ]);
  topic.publishFor.mockRejectedValue(new Error('Transport unavailable'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect((await service.create('alice')).status).toBe('queued');
});
describe('spreadsheet cells', () => {
  it('escapes delimiters and formula prefixes, including leading whitespace', () => {
    for (const value of ['=1+1', '+SUM(A1)', '-1+2', '@A1', '\t=1', ' \r=1'])
      expect(csvCell(value)).toBe(`"'${value}"`);
    expect(csvCell('Review, "release"')).toBe('"Review, ""release"""');
  });
});

it('fails explicitly above the export row limit and retains only the latest 20 results', async () => {
  const { db, service, jobs, context } = await fixture();
  for (let offset = 0; offset < 5001; offset += 100) {
    const rows = Array.from(
      { length: Math.min(100, 5001 - offset) },
      (_, index) => ({
        id: crypto.randomUUID(),
        title: `Task ${offset + index}`,
        description: 'Export limit fixture',
        status: 'open',
        creatorId: 'large',
        assigneeId: 'large',
        createdAt: '2026-10-18T00:00:00',
        updatedAt: '2026-10-18T00:00:00',
      }),
    );
    await db.database
      .connection()
      .query.insertInto('notificationExampleTasks')
      .values(rows)
      .execute();
  }
  const limited = await service.create('large');
  await jobs[0]!.execute(context());
  expect(await service.list('large')).toEqual([
    expect.objectContaining({ status: 'failed', reason: 'limit' }),
  ]);
  await expect(service.file('large', limited.id)).rejects.toMatchObject({
    reason: 'EXPORT_NOT_READY',
  });
  for (let index = 0; index < 22; index++) {
    await service.create('small');
    await jobs.at(-1)!.execute(context());
  }
  expect(await service.list('small')).toHaveLength(20);
  const stored = await db.database
    .connection()
    .query.selectFrom('realtimeExampleExports')
    .select('id')
    .where('userId', '=', 'small')
    .execute();
  expect(stored).toHaveLength(20);
});

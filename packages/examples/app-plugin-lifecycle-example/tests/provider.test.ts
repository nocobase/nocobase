// The real Provider against the test database and the memory jobs service:
// effects run as jobs, and a restart picks up what the previous start left
// queued.
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createAppPaths } from '@nocobase/app-server/config';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import { createJobExecutorService } from '@nocobase/jobs';
import { CREATE_TRANSITION } from '@nocobase/lifecycle';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { LifecycleExampleProvider } from '../server/providers/lifecycle-example.js';
import { lifecycleExampleServiceToken } from '../server/tokens.js';
import { test } from './fixtures.js';

let directory: string;

const logger = { info: () => {}, warn: () => {}, error: () => {} };

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'lifecycle-example-'));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

async function start(database: DatabaseManager): Promise<{
  provider: LifecycleExampleProvider;
  stop: () => Promise<void>;
  container: ServiceContainer;
}> {
  const jobs = createJobExecutorService(undefined, {
    appName: 'main',
    storagePath: path.join(directory, 'jobs'),
  });
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  container.instance(jobExecutorServiceToken, jobs);
  container.instance(loggingToken, { getLogger: () => logger } as never);
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: {} as never,
    paths: createAppPaths({ rootDir: directory }),
    router: new Hono(),
    container,
  };
  const provider = new LifecycleExampleProvider(app);
  provider.register();
  await provider.start();
  return {
    provider,
    container,
    stop: async () => {
      await provider.shutdown();
      await jobs.shutdown();
    },
  };
}

async function eventually<T>(
  read: () => Promise<T>,
  done: (value: T) => boolean,
): Promise<T> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = await read();
    if (done(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('The condition never held.');
}

describe('lifecycle example provider', () => {
  test('runs an approval end to end, paying the expense on the jobs service', async ({
    database,
  }) => {
    const { container, stop } = await start(database);
    try {
      const service = container.resolve(lifecycleExampleServiceToken);
      const expense = await service.createExpense(
        {
          title: '上海客户拜访',
          purpose: '季度回访',
          items: [
            {
              date: '2026-09-28',
              category: 'transport',
              description: '机票',
              amountCents: 800_000,
            },
          ],
          failPayments: 0,
        },
        'lin',
      );
      const id = String(expense.id);
      await service.runtime.fire('expenses', id, 'submit', {
        actor: { id: 'lin' },
        input: {},
      });
      const waiting = await service.listExpenses('chen', 'approvals', {
        page: 1,
        pageSize: 20,
      });
      expect(waiting.records.map((record) => record.id)).toEqual([expense.id]);
      expect(waiting.total).toBe(1);
      await service.runtime.fire('expenses', id, 'requestInfo', {
        actor: { id: 'chen' },
        input: { reason: '请补充行程单' },
      });
      // Sent back, it is with the applicant and leaves the approver's queue.
      expect(
        await service.listExpenses('chen', 'approvals', {
          page: 1,
          pageSize: 20,
        }),
      ).toEqual({ records: [], total: 0 });
      await service.runtime.fire('expenses', id, 'resubmit', {
        actor: { id: 'lin' },
        input: {},
      });
      await service.runtime.fire('expenses', id, 'approve', {
        actor: { id: 'chen' },
        input: { comment: '同意' },
      });
      const detail = await eventually(
        () => service.runtime.view('expenses', id, { id: 'lin' }),
        // Reaching paid does not wait for independently dispatched notices.
        // Observe the whole workflow before asserting every effect settled.
        (value) =>
          value.record.status === 'paid' &&
          value.history.effectRuns.every((run) => run.status === 'succeeded'),
      );
      expect(
        detail.history.transitions.map((entry) => entry.transition),
      ).toEqual([
        CREATE_TRANSITION,
        'submit',
        'requestInfo',
        'resubmit',
        'approve',
        'paid',
      ]);
      expect(
        detail.history.effectRuns.every((run) => run.status === 'succeeded'),
      ).toBe(true);
      // The payment effect's reference reached the record through the 'paid' transition.
      expect(detail.record.paymentRef).toMatch(/^PAY\d{12}$/);
    } finally {
      await stop();
    }
  });

  test('edits only the fields an edit names, and keeps the rest of the draft', async ({
    database,
  }) => {
    const { container, stop } = await start(database);
    try {
      const service = container.resolve(lifecycleExampleServiceToken);
      const line = {
        date: '2026-09-28',
        category: 'transport',
        description: '机票',
        amountCents: 800_000,
      };
      const expense = await service.createExpense(
        {
          title: '上海客户拜访',
          purpose: '季度回访',
          items: [line],
          failPayments: 1,
        },
        'lin',
      );
      const id = String(expense.id);
      const retitled = await service.updateExpense(
        id,
        { title: '上海客户回访' },
        'lin',
      );
      expect(retitled).toMatchObject({
        title: '上海客户回访',
        purpose: '季度回访',
        items: [line],
        failPayments: 1,
      });
      // A bigint column may read back as text, depending on the dialect.
      expect(Number(retitled.amountCents)).toBe(800_000);
      // New lines move the total with them; the title just set stays.
      const relined = await service.updateExpense(
        id,
        { items: [{ ...line, amountCents: 120_000 }] },
        'lin',
      );
      expect(relined).toMatchObject({
        title: '上海客户回访',
        purpose: '季度回访',
        failPayments: 1,
      });
      expect(Number(relined.amountCents)).toBe(120_000);
      // An edit that names nothing still checks who asks.
      await expect(service.updateExpense(id, {}, 'wang')).rejects.toMatchObject(
        { reason: 'OWN_EXPENSE_ONLY' },
      );
    } finally {
      await stop();
    }
  });

  test('closes an idle ticket when the triggers are swept', async ({
    database,
  }) => {
    const { container, stop } = await start(database);
    try {
      const service = container.resolve(lifecycleExampleServiceToken);
      const ticket = await service.createTicket(
        {
          subject: '无法登录后台',
          category: 'account',
          priority: 'high',
          description: '提示会话过期',
          failNotifications: 0,
        },
        'customer-li',
      );
      const id = String(ticket.id);
      await service.runtime.fire('tickets', id, 'reply', {
        actor: { id: 'agent-zhou' },
        input: { message: '请清除缓存后重试' },
      });
      // Pretend the wait has passed instead of waiting two minutes.
      await database.repository('lifecycleExampleTickets').updateMany({
        filter: { id: Number(id) },
        values: { statusChangedAt: '2000-01-01T00:00:00.000Z' },
      });
      expect(await service.runTriggers()).toBe(1);
      const detail = await service.runtime.view('tickets', id, {
        id: 'agent-zhou',
      });
      expect(detail.record).toMatchObject({
        status: 'closed',
        closedReason: 'timeout',
      });
    } finally {
      await stop();
    }
  });
});

import { randomUUID } from 'node:crypto';

import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import {
  createJobExecutorService,
  type ManagedJobExecutorService,
} from '@nocobase/jobs';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SchedulerProvider } from '../../server/providers/scheduler.js';
import { schedulerServiceToken } from '../../server/services/scheduler.js';
import { scheduleId } from '../../server/store.js';
import { createSchedulerDatabase } from '../support/scheduler.js';

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6379),
};
const SCHEDULE = scheduleId('main', 'every-second');

describe('Scheduler on the redis adapter', { timeout: 60_000 }, () => {
  let database: DatabaseManager;
  let namespace: string;
  const services: ManagedJobExecutorService[] = [];
  const providers: SchedulerProvider[] = [];

  beforeEach(async () => {
    database = await createSchedulerDatabase();
    namespace = `scheduler-test-${randomUUID()}`;
  });

  afterEach(async () => {
    await Promise.allSettled(
      providers.splice(0).map((each) => each.shutdown()),
    );
    await Promise.allSettled(services.splice(0).map((each) => each.shutdown()));
    await database.destroy();
  });

  /** One application instance: its own container, schedule service and worker, one shared database. */
  async function instance(started: string[]) {
    const service = createJobExecutorService(
      {
        default: 'redis',
        redis: { adapter: 'redis', connection, namespace },
      },
      { appName: 'main', storagePath: '/nonexistent' },
    );
    services.push(service);
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    container.instance(jobExecutorServiceToken, service);
    const provider = new SchedulerProvider({
      appName: 'main',
      publicBasePath: '',
      config: { get: () => undefined } as never,
      paths: {} as never,
      router: new Hono(),
      container,
    } satisfies AppPluginApplication);
    providers.push(provider);
    provider.register();
    const scheduler = container.resolve(schedulerServiceToken);
    scheduler.registerTarget({
      type: 'report',
      title: 'Report',
      validate: () => ({ valid: true }),
      start: async (_config, context) => {
        started.push(context.occurrenceId);
        return { state: 'completed', outcome: 'succeeded' };
      },
    });
    scheduler.defineSchedule({
      key: 'every-second',
      title: 'Every second',
      schedule: { cron: '* * * * * *', timezone: 'UTC' },
      target: { type: 'report', config: {} },
    });
    await provider.start();
    return { provider, scheduler };
  }

  it('runs each firing once across instances and counts it once', async () => {
    const started: string[] = [];
    const first = await instance(started);
    await instance(started);

    await vi.waitFor(() => expect(started.length).toBeGreaterThanOrEqual(4), {
      timeout: 15_000,
      interval: 100,
    });
    await Promise.all(providers.map((each) => each.shutdown()));

    expect(new Set(started).size).toBe(started.length);
    const occurrences = await first.scheduler.listOccurrences(SCHEDULE);
    expect(occurrences.map((each) => each.id).sort()).toEqual(
      [...started].sort(),
    );
    const [item] = await first.scheduler.list();
    expect(item).toMatchObject({
      runCount: started.length,
      completedCount: started.length,
    });
  });

  it('continues on the next instance after every instance stopped', async () => {
    const before: string[] = [];
    await instance(before);
    await vi.waitFor(() => expect(before.length).toBeGreaterThanOrEqual(2), {
      timeout: 15_000,
      interval: 100,
    });
    await Promise.all(providers.map((each) => each.shutdown()));
    const counted = before.length;

    const after: string[] = [];
    const next = await instance(after);
    await vi.waitFor(() => expect(after.length).toBeGreaterThanOrEqual(2), {
      timeout: 15_000,
      interval: 100,
    });
    await next.provider.shutdown();

    expect(after.some((id) => before.includes(id))).toBe(false);
    const [item] = await next.scheduler.list();
    expect(item?.runCount).toBe(counted + after.length);
  });
});

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { Application } from '@nocobase/app-server/application';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import { expect, it, vi } from 'vitest';

import { SchedulerProvider } from '../server/providers/scheduler.js';
import { schedulerServiceToken } from '../server/tokens.js';
import {
  createMemoryScheduleService,
  createSchedulerDatabase,
} from './support/scheduler.js';

it.each([false, true])(
  'keeps dependencies alive with held reconciliation=%s',
  async (holdInspection) => {
    const db = await createSchedulerDatabase();
    const jobs = await createMemoryScheduleService({
      default: 'test',
      test: { adapter: 'memory', concurrency: 2, attempts: 1 },
    });
    const config = new AppConfig();
    await config.loadAll();
    config.mergeDefaults({ app: { name: 'main', publicBasePath: '' } });
    const app = new Application({
      config,
      paths: createAppPaths({ rootDir: jobs.directory }),
      websocket: () => ({}) as never,
      strictStartup: true,
    });
    app.container.instance(databaseManagerToken, db.database);
    app.container.instance(jobExecutorServiceToken, jobs.service);
    const inspectionStarted = Promise.withResolvers<void>();
    const releaseInspection = Promise.withResolvers<void>();
    const inspectionDone = Promise.withResolvers<void>();
    const targetStarted = Promise.withResolvers<void>();
    const releaseTarget = Promise.withResolvers<void>();
    const waitingCreated = Promise.withResolvers<void>();
    const drainStarted = Promise.withResolvers<void>();
    const trace: string[] = [];
    let inspecting = false;
    let armInspection = false;
    let dependencyClosed = false;
    let unsafeCleanup = false;
    class Dependency extends ServiceProvider<Application<AppConfig>> {
      name = 'test/dependency';
      async shutdown(): Promise<void> {
        unsafeCleanup = inspecting;
        dependencyClosed = true;
        trace.push('dependency.cleanup');
      }
    }
    class EarlyDrain extends ServiceProvider<Application<AppConfig>> {
      name = 'test/drain';
      async shutdown(): Promise<void> {
        trace.push('drain.begin');
        drainStarted.resolve();
        await this.app.container.resolve(schedulerServiceToken).drain();
        trace.push('drain.done');
      }
    }
    app.addServiceProvider(SchedulerProvider);
    app.addServiceProvider(Dependency);
    app.addServiceProvider(EarlyDrain);
    app.registerProviders();
    const scheduler = app.container.resolve(schedulerServiceToken);
    scheduler.registerTarget({
      type: 'waiting',
      title: 'Waiting',
      validate: () => ({ valid: true }),
      start: async () => ({
        state: 'accepted',
        reference: { type: 'test', id: 'one' },
      }),
      inspect: async () => {
        if (!armInspection) return { state: 'running' };
        inspecting = true;
        trace.push('inspect.begin');
        inspectionStarted.resolve();
        try {
          await releaseInspection.promise;
          expect(dependencyClosed).toBe(false);
          await db.database
            .query()
            .selectFrom('schedule_definitions')
            .select('id')
            .execute();
          return { state: 'running' };
        } finally {
          inspecting = false;
          trace.push('inspect.end');
          inspectionDone.resolve();
        }
      },
    });
    scheduler.registerTarget({
      type: 'running',
      title: 'Running',
      validate: () => ({ valid: true }),
      start: async () => {
        targetStarted.resolve();
        await releaseTarget.promise;
        expect(dependencyClosed).toBe(false);
        trace.push('target.end');
        return { state: 'completed', outcome: 'succeeded' };
      },
    });
    for (const type of ['waiting', 'running']) {
      scheduler.defineSchedule({
        key: type,
        title: type,
        schedule: { cron: '* * * * * *', timezone: 'UTC', limit: 1 },
        target: { type, config: {} },
      });
    }
    const off = jobs.executor().subscribe(async (event) => {
      if (event.name === 'ScheduleEnd') waitingCreated.resolve();
    });
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    let closing: Promise<void> | undefined;
    try {
      await app.start();
      await Promise.all([targetStarted.promise, waitingCreated.promise]);
      armInspection = true;
      await vi.advanceTimersByTimeAsync(60_000);
      await inspectionStarted.promise;
      if (!holdInspection) {
        releaseInspection.resolve();
        await inspectionDone.promise;
      }
      const queries: string[] = [];
      const client = await db.database.connection().client<{
        on(event: string, listener: (query: { sql: string }) => void): void;
        off(event: string, listener: (query: { sql: string }) => void): void;
      }>();
      const observe = (query: { sql: string }) => queries.push(query.sql);
      client.on('query', observe);
      closing = app.shutdown();
      await drainStarted.promise;
      releaseTarget.resolve();
      await new Promise<void>((resolve) => setImmediate(resolve));
      if (holdInspection) expect(dependencyClosed).toBe(false);
      releaseInspection.resolve();
      await closing;
      trace.push('application.shutdown.done');
      client.off('query', observe);
      const files = await readdir(jobs.directory, { recursive: true });
      const snapshots = files.filter((file) => file.endsWith('.json'));
      expect(snapshots).toHaveLength(1);
      const snapshot: { jobs: Record<string, { fired: number }> } = JSON.parse(
        await readFile(path.join(jobs.directory, snapshots[0]!), 'utf8'),
      );
      expect(
        Object.values(snapshot.jobs).map((job: { fired: number }) => job.fired),
      ).toEqual([1, 1]);
      if (process.env.SCHEDULER_DRAIN_EVIDENCE === '1') {
        process.stdout.write(
          JSON.stringify({
            holdInspection,
            trace,
            reads: queries.filter((sql) => /^select/iu.test(sql)).length,
            writes: queries.filter((sql) =>
              /^(update|insert|delete)/iu.test(sql),
            ).length,
            statements: queries.length,
            stateFiles: snapshots.length,
          }) + '\n',
        );
      }
      expect(unsafeCleanup).toBe(false);
      expect(trace.indexOf('inspect.end')).toBeLessThan(
        trace.indexOf('drain.done'),
      );
      expect(trace.indexOf('target.end')).toBeLessThan(
        trace.indexOf('drain.done'),
      );
      expect(trace.indexOf('drain.done')).toBeLessThan(
        trace.indexOf('dependency.cleanup'),
      );
      const rows = await db.database
        .query()
        .selectFrom('schedule_occurrences')
        .selectAll()
        .execute();
      expect(rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            status: 'waiting',
            lastObservedAt: expect.anything(),
          }),
          expect.objectContaining({ status: 'succeeded' }),
        ]),
      );
      // Waiting business work does not keep this process alive.
      expect(rows).toHaveLength(2);
    } finally {
      releaseTarget.resolve();
      releaseInspection.resolve();
      await closing;
      off();
      await app.shutdown();
      await jobs.dispose();
      vi.useRealTimers();
      await db.destroy();
    }
  },
  30_000,
);

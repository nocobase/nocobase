import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import type { TestDatabase } from '@nocobase/db-testing';
import {
  createJobExecutorService,
  type ScheduleEvent,
  type JobExecutorService,
  type ScheduleExecutor,
  type Subscriber,
} from '@nocobase/jobs';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  SCHEDULER_SCOPE,
  SchedulerProvider,
  schedulerStartupModeToken,
} from '../server/providers/scheduler.js';
import {
  DefaultSchedulerService,
  schedulerServiceToken,
} from '../server/services/scheduler.js';
import { scheduleId } from '../server/store.js';
import {
  createMemoryScheduleService,
  createSchedulerDatabase,
  type ScheduleServiceHarness,
} from './support/scheduler.js';

function application(
  container: ServiceContainer,
  sections: Readonly<Record<string, unknown>> = {},
): AppPluginApplication {
  return {
    appName: 'main',
    publicBasePath: '',
    config: { get: (key: string) => sections[key] } as never,
    paths: {} as never,
    router: new Hono(),
    container,
  };
}

/** A provider whose executor and service are recording doubles. */
function lifecycleProvider(events: string[] = []) {
  const container = new ServiceContainer();
  let subscriber: Subscriber | undefined;
  const executor = {
    subscribe: vi.fn((next: Subscriber) => {
      events.push('executor:subscribe');
      subscriber = next;
      return () => {
        events.push('executor:unsubscribe');
      };
    }),
    setup: vi.fn(async (options?: { consume?: boolean }) => {
      events.push(`executor:setup:${options?.consume}`);
    }),
    shutdown: vi.fn(async () => {
      events.push('executor:shutdown');
    }),
  } as unknown as ScheduleExecutor;
  const getScheduleExecutor = vi.fn(() => executor);
  container.instance(jobExecutorServiceToken, {
    getScheduleExecutor,
  } as JobExecutorService);
  container.instance(databaseManagerToken, {} as DatabaseManager);
  const provider = new SchedulerProvider(application(container));
  provider.register();
  const service = container.resolve(schedulerServiceToken);
  vi.spyOn(service, 'sync').mockImplementation(async (finalize = false) => {
    events.push(`scheduler:sync:${finalize}`);
  });
  vi.spyOn(service, 'activate').mockImplementation(async () => {
    events.push('scheduler:activate');
  });
  const recordEvent = vi
    .spyOn(service, 'recordEvent')
    .mockImplementation(async () => undefined);
  return {
    provider,
    container,
    executor,
    getScheduleExecutor,
    recordEvent,
    subscriber: () => subscriber,
  };
}

describe('SchedulerProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers exactly one service, as a lazy singleton', () => {
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, {} as DatabaseManager);
    const getScheduleExecutor = vi.fn(() => ({}) as ScheduleExecutor);
    container.instance(jobExecutorServiceToken, {
      getScheduleExecutor,
    } as JobExecutorService);
    const provider = new SchedulerProvider(application(container));

    expect(provider.name).toBe('@nocobase/app-plugin-scheduler');
    provider.register();
    expect(container.resolveIfCreated(schedulerServiceToken)).toBeUndefined();

    const service = container.resolve(schedulerServiceToken);
    expect(service).toBeInstanceOf(DefaultSchedulerService);
    expect(container.resolve(schedulerServiceToken)).toBe(service);
    // On the plugin's own scope, with the settings of the configuration.
    expect(getScheduleExecutor).toHaveBeenCalledWith(
      SCHEDULER_SCOPE,
      undefined,
    );
    expect(schedulerTokenNames(container)).toEqual([
      '@nocobase/app-plugin-scheduler/service',
    ]);
  });

  it.each([
    ['names no jobs configuration', {}, undefined],
    [
      'names the jobs configuration scheduler.jobs selects',
      {
        scheduler: { jobs: 'redis-scheduler' },
        jobs: { default: 'redis', 'redis-scheduler': { adapter: 'redis' } },
      },
      'redis-scheduler',
    ],
  ])('%s', (_label, sections, name) => {
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, {} as DatabaseManager);
    const getScheduleExecutor = vi.fn(() => ({}) as ScheduleExecutor);
    container.instance(jobExecutorServiceToken, {
      getScheduleExecutor,
    } as JobExecutorService);
    const provider = new SchedulerProvider(application(container, sections));
    provider.register();

    container.resolve(schedulerServiceToken);

    expect(getScheduleExecutor).toHaveBeenCalledWith(SCHEDULER_SCOPE, name);
  });

  it('refuses a scheduler.jobs naming no jobs configuration', () => {
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, {} as DatabaseManager);
    container.instance(jobExecutorServiceToken, {
      getScheduleExecutor: vi.fn(),
    } as unknown as JobExecutorService);
    const provider = new SchedulerProvider(
      application(container, {
        scheduler: { jobs: 'redis-typo' },
        jobs: { default: 'redis', redis: { adapter: 'redis' } },
      }),
    );
    provider.register();

    expect(() => container.resolve(schedulerServiceToken)).toThrow(
      /scheduler\.jobs names "redis-typo", which is not a jobs configuration/u,
    );
  });

  it('syncs, subscribes and sets the executor up before reconciling', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const events: string[] = [];
    const { provider, container } = lifecycleProvider(events);
    const service = container.resolve(schedulerServiceToken);
    const reconcile = vi
      .spyOn(service, 'reconcileOccurrences')
      .mockResolvedValue(0);

    await provider.start();
    vi.advanceTimersByTime(60_000);

    expect(events).toEqual([
      'scheduler:sync:false',
      'executor:subscribe',
      'executor:setup:true',
      'scheduler:activate',
    ]);
    expect(reconcile).toHaveBeenCalledTimes(1);
    await provider.shutdown();
  });

  it('writes rules without consuming, subscribing or reconciling in sync-only mode', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const events: string[] = [];
    const { provider, container } = lifecycleProvider(events);
    container.instance(schedulerStartupModeToken, {
      kind: 'sync-only',
      finalize: true,
    });
    const reconcile = vi
      .spyOn(container.resolve(schedulerServiceToken), 'reconcileOccurrences')
      .mockResolvedValue(0);

    await provider.start();
    vi.advanceTimersByTime(120_000);

    expect(events).toEqual([
      'scheduler:sync:true',
      'executor:setup:false',
      'scheduler:activate',
    ]);
    expect(reconcile).not.toHaveBeenCalled();
  });

  it('passes executor events to the run state', async () => {
    const { provider, recordEvent, subscriber } = lifecycleProvider();
    await provider.start();
    const event: ScheduleEvent = {
      name: 'ScheduleStart',
      jobId: 'occurrence-1',
      jobName: 'schedule-1',
      scheduledAt: new Date(),
      runAt: new Date(),
    };

    await subscriber()!(event);

    expect(recordEvent).toHaveBeenCalledWith(event);
    await provider.shutdown();
  });

  it('warns about a firing no definition on this instance can run', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { provider, recordEvent, subscriber } = lifecycleProvider();
    await provider.start();

    await subscriber()!({
      name: 'ScheduleError',
      jobId: 'occurrence-1',
      jobName: 'removed-schedule',
      scheduledAt: new Date(),
      runAt: new Date(),
      reason: 'handler-not-registered',
    });

    expect(warn).toHaveBeenCalledWith(
      'A schedule fired that this instance has no definition for',
      { scheduleId: 'removed-schedule', occurrenceId: 'occurrence-1' },
    );
    expect(recordEvent).toHaveBeenCalled();
    warn.mockRestore();
    await provider.shutdown();
  });

  it('stops reconciling and listening before it shuts the executor down', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const events: string[] = [];
    const { provider, container } = lifecycleProvider(events);
    const reconcile = vi
      .spyOn(container.resolve(schedulerServiceToken), 'reconcileOccurrences')
      .mockResolvedValue(0);
    await provider.start();
    events.length = 0;

    await provider.shutdown();
    vi.advanceTimersByTime(120_000);

    expect(events).toEqual(['executor:unsubscribe', 'executor:shutdown']);
    expect(reconcile).not.toHaveBeenCalled();
    await provider.shutdown();
    expect(events).toEqual(['executor:unsubscribe', 'executor:shutdown']);
  });
});

describe('SchedulerProvider on the memory adapter', () => {
  let testDatabase: TestDatabase | undefined;
  let harness: ScheduleServiceHarness | undefined;

  afterEach(async () => {
    await harness?.dispose();
    await testDatabase?.destroy();
    harness = undefined;
    testDatabase = undefined;
  });

  async function startApplication(
    options: { syncOnly?: boolean; schedule?: JobExecutorService } = {},
  ) {
    testDatabase ??= await createSchedulerDatabase();
    const { database } = testDatabase;
    harness ??= await createMemoryScheduleService();
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    container.instance(
      jobExecutorServiceToken,
      options.schedule ?? harness.service,
    );
    if (options.syncOnly) {
      container.instance(schedulerStartupModeToken, {
        kind: 'sync-only',
        finalize: false,
      });
    }
    const provider = new SchedulerProvider(application(container));
    provider.register();
    const service = container.resolve(schedulerServiceToken);
    const started: string[] = [];
    service.registerTarget({
      type: 'report',
      title: 'Report',
      validate: () => ({ valid: true }),
      start: async (_config, context) => {
        started.push(context.occurrenceId);
        return { state: 'completed', outcome: 'succeeded' };
      },
    });
    service.defineSchedule({
      key: 'every-second',
      title: 'Every second',
      schedule: { cron: '* * * * * *', timezone: 'UTC' },
      target: { type: 'report', config: {} },
    });
    return { provider, service, started };
  }

  it('runs a schedule, records each occurrence and counts each start once', async () => {
    const { provider, service, started } = await startApplication();

    await provider.start();
    await vi.waitFor(
      async () => {
        const [item] = await service.list();
        expect(item?.runCount).toBeGreaterThanOrEqual(2);
      },
      { timeout: 5000, interval: 100 },
    );
    await provider.shutdown();

    const id = scheduleId('main', 'every-second');
    const occurrences = await service.listOccurrences(id);
    const [item] = await service.list();
    expect(new Set(started).size).toBe(started.length);
    expect(occurrences.map((each) => each.id).sort()).toEqual(
      [...started].sort(),
    );
    expect(occurrences.every((each) => each.status === 'succeeded')).toBe(true);
    expect(item).toMatchObject({
      runCount: started.length,
      completedCount: started.length,
      lastRunAt: expect.any(String),
      scheduleStatus: 'active',
    });
  });

  it('only writes rules in sync-only mode and runs them on the next start', async () => {
    const first = await startApplication({ syncOnly: true });

    await first.provider.start();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await first.provider.shutdown();

    expect(first.started).toEqual([]);
    const [synced] = await first.service.list();
    expect(synced).toMatchObject({
      runCount: 0,
      nextRunAt: expect.any(String),
    });

    // The next process reads the rules the sync left in the state directory.
    const next = createJobExecutorService(undefined, {
      appName: 'main',
      storagePath: harness!.directory,
    });
    const second = await startApplication({ schedule: next });
    try {
      await second.provider.start();
      await vi.waitFor(() => expect(second.started.length).toBeGreaterThan(0), {
        timeout: 5000,
        interval: 100,
      });
    } finally {
      await second.provider.shutdown();
      await next.shutdown();
    }
  });
});

function schedulerTokenNames(container: ServiceContainer): string[] {
  // ServiceContainer keys its bindings by the token object itself, so what the
  // provider registered is read back from that map rather than probed token by
  // token: the assertion is about what is *not* there.
  const bindings = (
    container as unknown as { bindings: Map<{ name: string }, unknown> }
  ).bindings;
  return [...bindings.keys()]
    .map((token) => token.name)
    .filter((name) => name.startsWith('@nocobase/app-plugin-scheduler/'))
    .sort();
}

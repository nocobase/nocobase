import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ScheduleJob } from '@nocobase/jobs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RunnersProvider } from '../server/providers/runners.js';
import { agentsToken } from '../server/tokens.js';
import { ACCESS_NAMESPACE } from '../shared/access.js';

describe('run process data maintenance scheduling', () => {
  afterEach(() => vi.useRealTimers());

  function fixture(withJobs: boolean, agents?: unknown) {
    const services = {
      events: { on: () => () => undefined },
      signal: { notify: vi.fn() },
      skills: { collectGarbage: vi.fn(async () => undefined) },
      sweeper: { sweep: vi.fn(async () => undefined) },
      purgeRunData: vi.fn(async () => 0),
      conversations: { purgeArchived: vi.fn(async () => 0) },
    };
    const jobs: ScheduleJob[] = [];
    const executor = {
      addJob: vi.fn(async (job: ScheduleJob) => {
        jobs.push(job);
      }),
      setup: vi.fn(async () => undefined),
      shutdown: vi.fn(async () => undefined),
    };
    const getScheduleExecutor = vi.fn(() => executor);
    const app = {
      config: { get: (key: string) => (key === 'agents' ? agents : undefined) },
      container: {
        has: (token: unknown) => withJobs && token === jobExecutorServiceToken,
        resolve: (token: unknown) =>
          token === agentsToken ? services : { getScheduleExecutor },
      },
    } as unknown as AppPluginApplication;
    return {
      provider: new RunnersProvider(app),
      services,
      jobs,
      executor,
      getScheduleExecutor,
    };
  }

  it('registers an independent hourly job in the existing plugin scope', async () => {
    const f = fixture(true);
    await f.provider.boot();
    expect(f.getScheduleExecutor).toHaveBeenCalledWith(ACCESS_NAMESPACE);
    expect(f.jobs.map((j) => j.name)).toEqual([
      'RunnersSweep',
      'SkillBlobsCollect',
      'RunDataPurge',
      'ArchivedConversationPurge',
    ]);
    const purge = f.jobs[2]!;
    expect(purge.options).toEqual({ every: 3600000 });
    await purge.execute({} as Parameters<typeof purge.execute>[0]);
    expect(f.services.purgeRunData).toHaveBeenCalledOnce();
    // Archived conversations, after the default 30 days, once a day.
    const archived = f.jobs[3]!;
    expect(archived.options).toEqual({ every: 86_400_000 });
    await archived.execute({} as Parameters<typeof archived.execute>[0]);
    expect(f.services.conversations.purgeArchived).toHaveBeenCalledWith(30);
    expect(f.services.sweeper.sweep).not.toHaveBeenCalled();
    await f.provider.shutdown();
    expect(f.executor.shutdown).toHaveBeenCalledOnce();
  });

  it('uses an hourly timer without jobs and releases it on shutdown', async () => {
    vi.useFakeTimers();
    const f = fixture(false);
    await f.provider.boot();
    await vi.advanceTimersByTimeAsync(3599999);
    expect(f.services.purgeRunData).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(f.services.purgeRunData).toHaveBeenCalledOnce();
    await f.provider.shutdown();
    await vi.advanceTimersByTimeAsync(3600000);
    expect(f.services.purgeRunData).toHaveBeenCalledOnce();
  });

  it('sweeps at the configured interval', async () => {
    const f = fixture(true, { runners: { sweepIntervalMs: 1_000 } });
    await f.provider.boot();
    expect(f.jobs[0]).toMatchObject({
      name: 'RunnersSweep',
      options: { every: 1_000 },
    });
    await f.provider.shutdown();
  });

  it('sweeps on a timer at the configured interval without jobs', async () => {
    vi.useFakeTimers();
    const f = fixture(false, { runners: { sweepIntervalMs: 1_000 } });
    await f.provider.boot();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(f.services.sweeper.sweep).toHaveBeenCalledOnce();
    await f.provider.shutdown();
  });
});

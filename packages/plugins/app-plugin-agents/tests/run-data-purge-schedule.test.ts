import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ScheduleJob } from '@nocobase/jobs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RunnersProvider } from '../server/providers/runners.js';
import { agentsToken } from '../server/tokens.js';
import { ACCESS_NAMESPACE } from '../shared/access.js';

describe('run process data maintenance scheduling', () => {
  afterEach(() => vi.useRealTimers());

  function fixture(withJobs: boolean) {
    const services = {
      events: { on: () => () => undefined },
      signal: { notify: vi.fn() },
      skills: { collectGarbage: vi.fn(async () => undefined) },
      sweeper: { sweep: vi.fn(async () => undefined) },
      purgeRunData: vi.fn(async () => 0),
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
    ]);
    const purge = f.jobs[2]!;
    expect(purge.options).toEqual({ every: 3600000 });
    await purge.execute({} as Parameters<typeof purge.execute>[0]);
    expect(f.services.purgeRunData).toHaveBeenCalledOnce();
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
});

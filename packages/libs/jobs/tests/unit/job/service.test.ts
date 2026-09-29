import { describe, expect, it, vi } from 'vitest';
import type { ResolvedJobsConfig, JobsConfig } from '../../../src/config.js';
import type { JobExecutor } from '../../../src/job/types.js';
import type { ScheduleExecutor } from '../../../src/schedule/types.js';
import { createJobExecutorServiceWith } from '../../../src/service.js';

function ordinary(): JobExecutor {
  return {
    registerJob: vi.fn(),
    addJob: vi.fn(),
    setup: vi.fn(async () => undefined),
    subscribe: vi.fn(() => () => undefined),
    shutdown: vi.fn(async () => undefined),
  };
}
function schedule(): ScheduleExecutor {
  return {
    addJob: vi.fn(),
    removeJob: vi.fn(),
    countJob: vi.fn(),
    listJob: vi.fn(),
    getJob: vi.fn(),
    setup: vi.fn(async () => undefined),
    subscribe: vi.fn(() => () => undefined),
    shutdown: vi.fn(async () => undefined),
  };
}
function harness(config?: JobsConfig) {
  const configs: ResolvedJobsConfig[] = [];
  const jobs: JobExecutor[] = [];
  const schedules: ScheduleExecutor[] = [];
  const create = (resolved: ResolvedJobsConfig): JobExecutor => {
    configs.push(resolved);
    const executor = ordinary();
    jobs.push(executor);
    return executor;
  };
  const createSchedule = (): ScheduleExecutor => {
    const executor = schedule();
    schedules.push(executor);
    return executor;
  };
  const onFallback = vi.fn();
  const service = createJobExecutorServiceWith(
    config,
    { appName: 'app', storagePath: '/tmp/jobs', onFallback },
    { memory: createSchedule, redis: createSchedule },
    { memory: create, redis: create },
  );
  return { service, configs, jobs, schedules, onFallback };
}

describe('ordinary service selection', () => {
  it('caches Redis executors by selected key; equal identities share a physical queue', () => {
    const redis = {
      adapter: 'redis' as const,
      connection: { host: 'localhost' },
      namespace: 'app',
      attempts: 4,
      concurrency: 3,
      removeOnComplete: true,
      removeOnFail: 7,
    };
    const { service, configs } = harness({ default: 'a', a: redis, b: redis });
    const a = service.getJobExecutor('scope');
    expect(service.getJobExecutor('scope', 'default')).toBe(a);
    expect(service.getJobExecutor('scope', 'unknown')).toBe(a);
    expect(service.getJobExecutor('scope', 'a')).toBe(a);
    expect(service.getJobExecutor('scope', 'b')).not.toBe(a);
    expect(configs.map((config) => config.key)).toEqual(['a', 'b']);
    expect(configs[0]).toMatchObject({
      attempts: 4,
      concurrency: 3,
      removeOnComplete: true,
      removeOnFail: 7,
    });
  });

  it('reports builtin fallback once per cached executor of each type', () => {
    const { service, configs, onFallback } = harness();
    const job = service.getJobExecutor('scope', 'missing');
    expect(service.getJobExecutor('scope')).toBe(job);
    service.getScheduleExecutor('scope');
    expect(onFallback.mock.calls).toEqual([
      [{ scope: 'scope', name: 'missing' }],
      [{ scope: 'scope' }],
    ]);
    expect(configs[0]).toMatchObject({
      builtIn: true,
      adapter: 'memory',
      concurrency: 1,
      attempts: 1,
      namespace: 'app',
      persistencePath: '/tmp/jobs',
    });
  });

  it('selects named memory without a default and preserves string alias fallback behavior', () => {
    const { service, configs } = harness({
      default: 'm',
      m: { adapter: 'memory', attempts: 5, concurrency: 2 },
      alias: 'other',
      other: { adapter: 'memory', attempts: 7 },
    });
    const executor = service.getJobExecutor('scope', 'alias');
    expect(service.getJobExecutor('scope', 'm')).toBe(executor);
    expect(configs[0]).toMatchObject({ key: 'm', attempts: 5, concurrency: 2 });
    const named = harness({ custom: { adapter: 'memory' } });
    named.service.getJobExecutor('scope', 'custom');
    expect(named.configs[0]).toMatchObject({ key: 'custom', builtIn: false });
  });

  it('rejects bad scopes and invalid configuration without creating executors', () => {
    expect(() => harness().service.getJobExecutor('jobs/invalid')).toThrow(
      /scope/u,
    );
    expect(() =>
      harness({ default: 'missing' }).service.getJobExecutor('scope'),
    ).toThrow(/jobs.default/u);
    for (const settings of [
      { concurrency: 0 },
      { attempts: 0 },
      { concurrency: 1.5 },
    ]) {
      const { service, configs } = harness({
        default: 'm',
        m: { adapter: 'memory', ...settings },
      });
      expect(() => service.getJobExecutor('scope')).toThrow(
        /positive integer/u,
      );
      expect(configs).toEqual([]);
    }
  });

  it('closes both executor families even when some shutdowns throw synchronously', async () => {
    const { service, jobs, schedules } = harness();
    service.getScheduleExecutor('s');
    service.getJobExecutor('a');
    service.getJobExecutor('b');
    vi.mocked(schedules[0]!.shutdown).mockImplementation(() => {
      throw new Error('schedule failure');
    });
    vi.mocked(jobs[0]!.shutdown).mockRejectedValue(new Error('job failure'));
    const first = service.shutdown();
    expect(service.shutdown()).toBe(first);
    await expect(first).rejects.toMatchObject({
      errors: [
        expect.objectContaining({ message: 'schedule failure' }),
        expect.objectContaining({ message: 'job failure' }),
      ],
    });
    for (const executor of [...schedules, ...jobs])
      expect(executor.shutdown).toHaveBeenCalledTimes(1);
    expect(() => service.getJobExecutor('a')).toThrow(/shut down/u);
    expect(() => service.getScheduleExecutor('s')).toThrow(/shut down/u);
  });
});

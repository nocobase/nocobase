import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  createJobExecutorService,
  type JobsConfig,
  type JobExecutorServiceDependencies,
} from '../../src/index.js';
import {
  createJobExecutorServiceWith,
  type ScheduleExecutorFactory,
} from '../../src/service.js';
import type { ResolvedJobsConfig } from '../../src/config.js';
import type { ScheduleExecutor } from '../../src/schedule/types.js';

function fakeExecutor(): ScheduleExecutor {
  return {
    addJob: vi.fn(),
    removeJob: vi.fn(),
    countJob: vi.fn(),
    listJob: vi.fn(),
    getJob: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
    setup: vi.fn(async () => undefined),
    shutdown: vi.fn(async () => undefined),
  };
}

function harness(
  config: JobsConfig | undefined,
  dependencies: Partial<JobExecutorServiceDependencies> = {},
) {
  const created: ResolvedJobsConfig[] = [];
  const factory: ScheduleExecutorFactory = (resolved) => {
    created.push(resolved);
    return fakeExecutor();
  };
  const onFallback = vi.fn();
  const service = createJobExecutorServiceWith(
    config,
    {
      appName: 'crm',
      storagePath: '/app/storage/jobs',
      onFallback,
      ...dependencies,
    },
    { memory: factory, redis: factory },
  );
  return { service, created, onFallback };
}

const redis = {
  adapter: 'redis',
  connection: { host: '127.0.0.1', port: 6379 },
} as const;

describe('configuration fallback', () => {
  it('uses the named configuration when it exists', () => {
    const { service, created, onFallback } = harness({
      default: 'memory',
      memory: { adapter: 'memory' },
      'redis-1': redis,
    });

    service.getScheduleExecutor('scope-a', 'redis-1');

    expect(created).toEqual([
      expect.objectContaining({
        key: 'redis-1',
        adapter: 'redis',
        builtIn: false,
        scope: 'scope-a',
        namespace: 'crm',
        concurrency: 1,
        attempts: 1,
        connection: { host: '127.0.0.1', port: 6379 },
      }),
    ]);
    expect(onFallback).not.toHaveBeenCalled();
  });

  it('falls back to jobs.default when no name is given or the name is unknown', () => {
    const { service, created, onFallback } = harness({
      default: 'redis-1',
      'redis-1': { ...redis, namespace: '{crm}' },
    });

    const unnamed = service.getScheduleExecutor('scope-a');
    const unknown = service.getScheduleExecutor('scope-a', 'missing');

    expect(unknown).toBe(unnamed);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ key: 'redis-1', namespace: '{crm}' });
    expect(onFallback).not.toHaveBeenCalled();
  });

  it.each([
    ['no jobs configuration', undefined],
    ['a configuration without default', { memory: { adapter: 'memory' } }],
  ] as const)(
    'falls back to the built-in memory configuration with %s',
    (_label, config) => {
      const { service, created, onFallback } = harness(
        config as JobsConfig | undefined,
      );

      service.getScheduleExecutor('scope-a');

      expect(created).toEqual([
        expect.objectContaining({
          adapter: 'memory',
          builtIn: true,
          namespace: 'crm',
          persistencePath: '/app/storage/jobs',
          concurrency: 1,
          attempts: 1,
        }),
      ]);
      expect(onFallback).toHaveBeenCalledTimes(1);
      expect(onFallback).toHaveBeenCalledWith({ scope: 'scope-a' });
    },
  );

  it('rejects a default that names no configuration', () => {
    const { service } = harness({ default: 'redis-2', 'redis-1': redis });

    expect(() => service.getScheduleExecutor('scope-a')).toThrow(
      /jobs\.default names "redis-2"/u,
    );
  });

  it('fills a memory configuration without a persistence path from storage', () => {
    const { service, created } = harness({
      default: 'memory',
      memory: { adapter: 'memory', concurrency: 2 },
      disk: { adapter: 'memory', persistence: { path: './state' } },
    });

    service.getScheduleExecutor('scope-a');
    service.getScheduleExecutor('scope-a', 'disk');

    expect(created[0]).toMatchObject({
      persistencePath: '/app/storage/jobs',
      concurrency: 2,
    });
    expect(created[1]).toMatchObject({
      persistencePath: path.resolve('./state'),
    });
  });

  it('applies bounded retention defaults to redis', () => {
    const { service, created } = harness({ default: 'r', r: redis });

    service.getScheduleExecutor('scope-a');

    expect(created[0]).toMatchObject({
      removeOnComplete: { count: 1000 },
      removeOnFail: { age: 604_800 },
    });
  });

  it('rejects an unknown adapter', () => {
    const { service } = harness({
      default: 'x',
      x: { adapter: 'kafka' } as never,
    });

    expect(() => service.getScheduleExecutor('scope-a')).toThrow(
      /adapter "kafka"/u,
    );
  });
});

describe('executor identity', () => {
  it('returns one executor per scope and configuration', () => {
    const { service, created } = harness({
      default: 'r',
      r: redis,
      m: { adapter: 'memory' },
    });

    const first = service.getScheduleExecutor('scope-a');
    expect(service.getScheduleExecutor('scope-a')).toBe(first);
    expect(service.getScheduleExecutor('scope-a', 'r')).toBe(first);
    expect(service.getScheduleExecutor('scope-b')).not.toBe(first);
    expect(service.getScheduleExecutor('scope-a', 'm')).not.toBe(first);
    expect(created).toHaveLength(3);
  });

  it('takes concurrency and attempts from the selected configuration', () => {
    const { service, created } = harness({
      default: 'r',
      r: { ...redis, concurrency: 5, attempts: 3 },
    });

    service.getScheduleExecutor('scope-a');

    expect(created[0]).toMatchObject({ concurrency: 5, attempts: 3 });
  });

  it.each([[{ concurrency: 0 }], [{ concurrency: 1.5 }], [{ attempts: -1 }]])(
    'rejects a configuration with %o',
    (settings) => {
      const { service } = harness({
        default: 'r',
        r: { ...redis, ...settings },
      });

      expect(() => service.getScheduleExecutor('scope-a')).toThrow(
        /positive integer/u,
      );
    },
  );
});

describe('scope validation', () => {
  it.each([
    '@nocobase/app-plugin-scheduler',
    'app-plugin-scheduler',
    'crm_reports.v2',
  ])('accepts %s', (scope) => {
    const { service } = harness(undefined);

    expect(() => service.getScheduleExecutor(scope)).not.toThrow();
  });

  it.each([
    '',
    'a:b',
    'a b',
    'a\tb',
    'a\\b',
    'a/b',
    '@scope/a/b',
    '@scope/../b',
    '../escape',
    '..',
    '@/name',
  ])('rejects %j', (scope) => {
    const { service } = harness(undefined);

    expect(() => service.getScheduleExecutor(scope)).toThrow(
      /Invalid jobs scope/u,
    );
  });
});

describe('createJobExecutorService', () => {
  it('shuts every executor it created down once', async () => {
    const executors: ScheduleExecutor[] = [];
    const factory: ScheduleExecutorFactory = () => {
      const executor = fakeExecutor();
      executors.push(executor);
      return executor;
    };
    const service = createJobExecutorServiceWith(
      undefined,
      { appName: 'crm', storagePath: '/tmp/s' },
      { memory: factory, redis: factory },
    );
    service.getScheduleExecutor('a');
    service.getScheduleExecutor('b');

    await service.shutdown();
    await service.shutdown();

    for (const executor of executors) {
      expect(executor.shutdown).toHaveBeenCalledTimes(1);
    }
    expect(() => service.getScheduleExecutor('c')).toThrow(/shut down/u);
  });

  it('is exported as the package entry point', () => {
    expect(createJobExecutorService).toBeTypeOf('function');
  });
});

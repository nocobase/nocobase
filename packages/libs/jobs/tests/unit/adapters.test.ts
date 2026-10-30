import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  createJobExecutorService,
  type JobsConfig,
  JobsBackendNotRegisteredError,
} from '../../src/index.js';
import type {
  JobsAdapterConfig,
  JobsImplementation,
  ResolvedJobsConfig,
} from '../../src/index.js';

const dependencies = { appName: 'test', storagePath: '/tmp/jobs-registry' };
function implementation(): JobsImplementation<ResolvedJobsConfig> {
  const memory = createJobExecutorService(undefined, dependencies);
  return {
    resolve: vi.fn((raw, base) => ({ ...raw, ...base })),
    createJobExecutor: vi.fn((config) => memory.getJobExecutor(config.scope)),
    createScheduleExecutor: vi.fn((config) =>
      memory.getScheduleExecutor(config.scope),
    ),
  };
}

const externalConfig = {
  default: 'x',
  x: { adapter: 'external', custom: { value: 42 } },
};

describe('application-local Jobs implementation registration', () => {
  it('registers lazily and permits new implementations after executor startup', async () => {
    const storagePath = await mkdtemp(
      path.join(os.tmpdir(), 'jobs-registration-'),
    );
    const dependencies = { appName: 'test', storagePath };
    const service = createJobExecutorService(
      { ...externalConfig, memory: { adapter: 'memory' } },
      dependencies,
    );
    try {
      expect('setup' in service).toBe(false);
      const memory = service.getJobExecutor('scope', 'memory');
      await memory.setup({ consume: false });
      expect(() => service.getJobExecutor('scope')).toThrow(
        JobsBackendNotRegisteredError,
      );
      expect(() => service.getScheduleExecutor('scope')).toThrow(
        JobsBackendNotRegisteredError,
      );
      const extension = implementation();
      service.registerImplementation('external', extension);
      expect(extension.resolve).not.toHaveBeenCalled();
      expect(extension.createJobExecutor).not.toHaveBeenCalled();
      expect(extension.createScheduleExecutor).not.toHaveBeenCalled();
      const ordinary = service.getJobExecutor('scope');
      const schedule = service.getScheduleExecutor('scope');
      expect(service.getJobExecutor('scope')).toBe(ordinary);
      expect(service.getScheduleExecutor('scope')).toBe(schedule);
      expect(service.getJobExecutor('scope', 'memory')).toBe(memory);
      expect(extension.resolve).toHaveBeenCalledWith(
        externalConfig.x,
        expect.objectContaining({
          key: 'x',
          adapter: 'external',
          scope: 'scope',
        }),
        dependencies,
      );
      expect(extension.createJobExecutor).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ key: 'x', custom: { value: 42 } }),
        dependencies,
      );
      expect(extension.createScheduleExecutor).toHaveBeenCalledTimes(1);
      service.registerImplementation('later', implementation());
      expect(() =>
        service.registerImplementation('external', implementation()),
      ).toThrow(/already registered/u);
    } finally {
      await service.shutdown();
      await rm(storagePath, { recursive: true, force: true });
    }
  });

  it('preserves prototype methods and implementation instance state', async () => {
    class StatefulImplementation implements JobsImplementation<ResolvedJobsConfig> {
      private readonly memory = createJobExecutorService(
        undefined,
        dependencies,
      );
      public readonly calls: string[] = [];

      public resolve(raw: JobsAdapterConfig, base: ResolvedJobsConfig) {
        this.calls.push('resolve');
        return { ...raw, ...base };
      }

      public createJobExecutor(config: ResolvedJobsConfig) {
        this.calls.push('ordinary');
        return this.memory.getJobExecutor(config.scope);
      }

      public createScheduleExecutor(config: ResolvedJobsConfig) {
        this.calls.push('schedule');
        return this.memory.getScheduleExecutor(config.scope);
      }
    }
    const service = createJobExecutorService(externalConfig, dependencies);
    const extension = new StatefulImplementation();
    service.registerImplementation('external', extension);
    service.getJobExecutor('scope');
    service.getScheduleExecutor('scope');
    expect(extension.calls).toEqual([
      'resolve',
      'ordinary',
      'resolve',
      'schedule',
    ]);
    await service.shutdown();
  });

  it('rejects duplicate and built-in names without replacing the first implementation', async () => {
    const service = createJobExecutorService(externalConfig, dependencies);
    const first = implementation();
    const duplicate = implementation();
    service.registerImplementation('external', first);
    expect(() => service.registerImplementation('external', duplicate)).toThrow(
      /already registered/u,
    );
    expect(() => service.registerImplementation('memory', duplicate)).toThrow(
      /already registered/u,
    );
    service.getJobExecutor('scope');
    service.getScheduleExecutor('scope');
    expect(first.createJobExecutor).toHaveBeenCalledTimes(1);
    expect(first.createScheduleExecutor).toHaveBeenCalledTimes(1);
    expect(duplicate.resolve).not.toHaveBeenCalled();
    await service.shutdown();
  });

  it.each(['', '   ', 42, null, false])(
    'rejects invalid registration name %j',
    async (name) => {
      const service = createJobExecutorService(undefined, dependencies);
      expect(() =>
        service.registerImplementation(
          JSON.parse(JSON.stringify(name)),
          implementation(),
        ),
      ).toThrow(/non-empty string/u);
      await service.shutdown();
    },
  );

  it.each(['resolve', 'createJobExecutor', 'createScheduleExecutor'])(
    'rejects a missing %s atomically',
    async (method) => {
      const service = createJobExecutorService(externalConfig, dependencies);
      const incomplete = implementation();
      Reflect.deleteProperty(incomplete, method);
      expect(() =>
        service.registerImplementation('external', incomplete),
      ).toThrow(/resolver and both executor factories/u);
      service.registerImplementation('external', implementation());
      service.getJobExecutor('scope');
      service.getScheduleExecutor('scope');
      await service.shutdown();
    },
  );

  it.each(['null', '42', 'false'])(
    'rejects an invalid implementation %s without reserving its name',
    async (value) => {
      const service = createJobExecutorService(externalConfig, dependencies);
      expect(() =>
        service.registerImplementation('external', JSON.parse(value)),
      ).toThrow(/resolver and both executor factories/u);
      service.registerImplementation('external', implementation());
      await service.shutdown();
    },
  );

  it('closes registration when the service shuts down', async () => {
    const service = createJobExecutorService(undefined, dependencies);
    await service.shutdown();
    expect(() =>
      service.registerImplementation('external', implementation()),
    ).toThrow(/closed/u);
  });

  it('does not scan unused invalid configuration or fall back for a selected missing implementation', async () => {
    const config: JobsConfig = JSON.parse(
      '{"default":"m","m":{"adapter":"memory"},"unused":null,"r":{"adapter":"redis","connection":{"password":"not-logged"}}}',
    );
    const service = createJobExecutorService(config, dependencies);
    service.getJobExecutor('scope');
    service.getScheduleExecutor('scope');
    expect(() => service.getJobExecutor('scope', 'r')).toThrow(
      JobsBackendNotRegisteredError,
    );
    expect(() => service.getScheduleExecutor('scope', 'r')).toThrow(
      JobsBackendNotRegisteredError,
    );
    expect(() => service.getJobExecutor('scope', 'unused')).toThrow(
      /must declare a non-empty string adapter/u,
    );
    await service.shutdown();
  });

  it.each([
    ['missing adapter', '{"connection":{"host":"127.0.0.1"}}'],
    ['null adapter', '{"adapter":null}'],
    ['empty adapter', '{"adapter":""}'],
    ['numeric adapter', '{"adapter":42}'],
    ['boolean adapter', '{"adapter":false}'],
    ['null configuration', 'null'],
  ])(
    'rejects selected %s without falling back to Memory',
    async (_label, entry) => {
      const config: JobsConfig = JSON.parse(
        '{"default":"invalid","memory":{"adapter":"memory"},"invalid":' +
          entry +
          '}',
      );
      const service = createJobExecutorService(config, dependencies);
      try {
        service.getJobExecutor('scope', 'memory');
        service.getScheduleExecutor('scope', 'memory');
        for (const name of [undefined, 'invalid']) {
          expect(() => service.getJobExecutor('scope', name)).toThrow(
            /must declare a non-empty string adapter/u,
          );
          expect(() => service.getScheduleExecutor('scope', name)).toThrow(
            /must declare a non-empty string adapter/u,
          );
        }
      } finally {
        await service.shutdown();
      }
    },
  );

  it('does not share registered implementations across services', async () => {
    const first = createJobExecutorService(externalConfig, dependencies);
    const second = createJobExecutorService(externalConfig, dependencies);
    first.registerImplementation('external', implementation());
    first.getJobExecutor('scope');
    first.getScheduleExecutor('scope');
    expect(() => second.getJobExecutor('scope')).toThrow(
      JobsBackendNotRegisteredError,
    );
    await first.shutdown();
    await second.shutdown();
  });
});

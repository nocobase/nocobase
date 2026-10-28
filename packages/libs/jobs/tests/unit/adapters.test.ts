import { describe, expect, it, vi } from 'vitest';
import {
  createJobExecutorService,
  type JobsConfig,
  JobsBackendRegistry,
  JobsBackendNotRegisteredError,
} from '../../src/index.js';
import type {
  JobsBackendAdapter,
  ResolvedJobsConfig,
} from '../../src/backend.js';

const dependencies = { appName: 'test', storagePath: '/tmp/jobs-registry' };
function adapter(): JobsBackendAdapter<ResolvedJobsConfig> {
  const memory = createJobExecutorService(undefined, dependencies);
  return {
    name: 'external',
    resolve: (raw, base) => ({ ...raw, ...base }),
    createJobExecutor: vi.fn((config) => memory.getJobExecutor(config.scope)),
    createScheduleExecutor: vi.fn((config) =>
      memory.getScheduleExecutor(config.scope),
    ),
  };
}

describe('application-local backend registry', () => {
  it('holds the live registry when the service is resolved before backend registration', async () => {
    const registry = new JobsBackendRegistry(true);
    const service = createJobExecutorService(
      { default: 'x', x: { adapter: 'external', custom: { value: 42 } } },
      dependencies,
      registry,
    );
    const extension = adapter();
    expect(() => service.getJobExecutor('scope')).toThrow(
      /during provider registration/u,
    );
    registry.register(extension);
    expect(extension.createJobExecutor).not.toHaveBeenCalled();
    expect(extension.createScheduleExecutor).not.toHaveBeenCalled();
    registry.freeze();
    service.getJobExecutor('scope');
    service.getScheduleExecutor('scope');
    expect(extension.createJobExecutor).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'x', custom: { value: 42 } }),
      dependencies,
    );
    expect(extension.createScheduleExecutor).toHaveBeenCalledTimes(1);
    await service.shutdown();
  });

  it('rejects duplicate and late registration without altering the first backend', () => {
    const registry = new JobsBackendRegistry();
    registry.register(adapter());
    expect(() => registry.register(adapter())).toThrow(/already registered/u);
    registry.freeze();
    expect(() => registry.register(adapter())).toThrow(/closed/u);
  });

  it('allows unselected external configuration and never falls back for a selected missing backend', async () => {
    const service = createJobExecutorService(
      {
        default: 'm',
        m: { adapter: 'memory' },
        r: { adapter: 'redis', connection: { password: 'not-logged' } },
      },
      dependencies,
    );
    service.getJobExecutor('scope');
    service.getScheduleExecutor('scope');
    expect(() => service.getJobExecutor('scope', 'r')).toThrow(
      JobsBackendNotRegisteredError,
    );
    expect(() => service.getScheduleExecutor('scope', 'r')).toThrow(
      JobsBackendNotRegisteredError,
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

  it('does not share registered capabilities across services', async () => {
    const registered = new JobsBackendRegistry();
    registered.register(adapter());
    const config = { default: 'x', x: { adapter: 'external' } };
    const first = createJobExecutorService(config, dependencies, registered);
    const second = createJobExecutorService(config, dependencies);
    first.getJobExecutor('scope');
    expect(() => second.getJobExecutor('scope')).toThrow(
      JobsBackendNotRegisteredError,
    );
    await first.shutdown();
    await second.shutdown();
  });
});

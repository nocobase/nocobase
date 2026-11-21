import { describe, expect, it, vi } from 'vitest';
import {
  createJobExecutorService,
  type JobsImplementation,
  type ResolvedJobsConfig,
} from '../../src/index.js';

const dependencies = { appName: 'test', storagePath: '/tmp/jobs-describe' };

function implementation(
  sharing?: 'local' | 'shared',
): JobsImplementation<ResolvedJobsConfig> {
  const memory = createJobExecutorService(undefined, dependencies);
  return {
    ...(sharing ? { sharing } : {}),
    resolve: vi.fn((raw, base) => ({ ...raw, ...base })),
    createJobExecutor: vi.fn((config) => memory.getJobExecutor(config.scope)),
    createScheduleExecutor: vi.fn((config) =>
      memory.getScheduleExecutor(config.scope),
    ),
  };
}

describe('JobExecutorService.describe()', () => {
  it('reports the built-in memory backend when jobs.default is unset', () => {
    const service = createJobExecutorService(undefined, dependencies);
    expect(service.describe()).toEqual({
      default: null,
      adapter: 'memory',
      sharing: 'local',
      registered: true,
      backends: [],
      selections: [],
    });
  });

  it('reports configured backends by name and adapter, and consumers that named another backend', () => {
    const service = createJobExecutorService(
      {
        default: 'redis',
        backends: {
          redis: {
            adapter: 'redis',
            connection: { url: 'redis://:hunter2@jobs.internal:6379' },
          },
          memory: { adapter: 'memory' },
          custom: { adapter: 'custom' },
          missing: { adapter: 'absent', token: 'secret-token' },
        },
      },
      dependencies,
    );
    service.registerImplementation('redis', implementation('shared'));
    service.registerImplementation('custom', implementation());
    service.getJobExecutor('@nocobase/app-plugin-mail');
    service.getScheduleExecutor('@nocobase/app-plugin-scheduler', 'memory');
    service.getJobExecutor('@nocobase/app-plugin-scheduler', 'memory');

    const description = service.describe();

    expect(description).toEqual({
      default: 'redis',
      adapter: 'redis',
      sharing: 'shared',
      registered: true,
      backends: [
        {
          name: 'redis',
          adapter: 'redis',
          sharing: 'shared',
          registered: true,
        },
        {
          name: 'memory',
          adapter: 'memory',
          sharing: 'local',
          registered: true,
        },
        {
          name: 'custom',
          adapter: 'custom',
          sharing: 'unknown',
          registered: true,
        },
        {
          name: 'missing',
          adapter: 'absent',
          sharing: 'unknown',
          registered: false,
        },
      ],
      selections: [
        { consumer: '@nocobase/app-plugin-scheduler', backend: 'memory' },
      ],
    });
    const json = JSON.stringify(description);
    for (const secret of ['jobs.internal', 'hunter2', 'secret-token'])
      expect(json).not.toContain(secret);
  });

  it('reports an unregistered default adapter without selecting it', () => {
    const service = createJobExecutorService(
      { default: 'redis', backends: { redis: { adapter: 'redis' } } },
      dependencies,
    );
    expect(service.describe()).toMatchObject({
      default: 'redis',
      adapter: 'redis',
      sharing: 'unknown',
      registered: false,
    });
  });

  it('rejects an undeclared sharing value', () => {
    const service = createJobExecutorService(undefined, dependencies);
    expect(() =>
      service.registerImplementation('odd', {
        ...implementation(),
        sharing: 'everywhere' as 'shared',
      }),
    ).toThrow('unknown sharing');
  });
});

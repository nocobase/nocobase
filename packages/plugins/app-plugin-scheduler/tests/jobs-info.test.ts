import type { AppConfigAccessor } from '@nocobase/app-server/config';
import { describe, expect, it } from 'vitest';

import { describeSchedulerJobs } from '../server/jobs-info.js';

type Map = Record<string, unknown>;

function accessor(defaults: Map, overrides: Map): AppConfigAccessor {
  const merged = { ...defaults, ...overrides };
  return {
    get: (key: string) => merged[key],
    layers: () => ({ defaults, overrides }),
    environmentVariableMappings: () => ({
      SCHEDULER_JOBS: { path: 'scheduler.jobs' },
    }),
  } as unknown as AppConfigAccessor;
}

const options = {
  appName: 'main',
  rootDir: '/srv/app',
  storagePath: '/srv/app/storage/jobs',
};

describe('describeSchedulerJobs', () => {
  it('describes the built-in memory configuration when nothing selects one', () => {
    expect(
      describeSchedulerJobs({
        ...options,
        config: accessor({}, {}),
        environment: {},
      }),
    ).toEqual({
      configuration: null,
      selectedBy: 'built-in',
      adapter: 'memory',
      pluginRegistered: true,
      multiInstance: false,
      persistencePath: 'storage/jobs',
      concurrency: 1,
      attempts: 1,
      sources: {
        configuration: 'default',
        adapter: 'default',
        concurrency: 'default',
        attempts: 'default',
      },
    });
  });

  it('follows jobs.default when scheduler.jobs is unset', () => {
    const jobs = {
      default: 'memory',
      backends: { memory: { adapter: 'memory', concurrency: 2 } },
    };
    expect(
      describeSchedulerJobs({
        ...options,
        config: accessor({ jobs }, {}),
        environment: {},
      }),
    ).toMatchObject({
      configuration: 'memory',
      selectedBy: 'jobs.default',
      concurrency: 2,
      sources: { configuration: 'default', concurrency: 'default' },
    });
  });

  it('describes a Redis configuration scheduler.jobs selects, without its password', () => {
    const jobs = {
      default: 'memory',
      backends: {
        memory: { adapter: 'memory' },
        schedules: {
          adapter: 'redis',
          connection: {
            host: 'redis.internal',
            port: 6379,
            username: 'scheduler',
            password: 'top-secret',
          },
          namespace: 'acme-production',
          concurrency: 4,
          attempts: 2,
        },
      },
    };
    const described = describeSchedulerJobs({
      ...options,
      config: accessor({}, { jobs, scheduler: { jobs: 'schedules' } }),
      environment: { SCHEDULER_JOBS: 'schedules' },
    });
    expect(described).toEqual({
      configuration: 'schedules',
      selectedBy: 'scheduler.jobs',
      adapter: 'redis',
      pluginRegistered: true,
      multiInstance: true,
      concurrency: 4,
      attempts: 2,
      namespace: 'acme-production',
      connection: 'redis.internal:6379',
      sources: {
        configuration: 'environment',
        adapter: 'config',
        concurrency: 'config',
        attempts: 'config',
        namespace: 'config',
        connection: 'config',
      },
    });
    expect(JSON.stringify(described)).not.toMatch(/top-secret|scheduler@/u);
  });

  it('strips the credentials of a connection URL', () => {
    const described = describeSchedulerJobs({
      ...options,
      config: accessor(
        {},
        {
          jobs: {
            default: 'redis',
            backends: {
              redis: {
                adapter: 'redis',
                connection: { url: 'redis://user:top-secret@cache:6380/2' },
              },
            },
          },
        },
      ),
      environment: {},
    });
    expect(described).toMatchObject({
      connection: 'redis://cache:6380/2',
      namespace: 'main',
      sources: { configuration: 'config', namespace: 'default' },
    });
    expect(JSON.stringify(described)).not.toContain('top-secret');
  });
});

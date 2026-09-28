import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Logging } from '@nocobase/logging';
import { ServiceContainer } from '@nocobase/service-provider';

import { AppConfig, createAppPaths } from '../src/config/index.js';
import { loggingToken } from '../src/logging/index.js';
import type { AppPluginApplication } from '../src/plugins/index.js';
import {
  JobExecutorServiceProvider,
  jobExecutorServiceToken,
  type AppJobsConfig,
} from '../src/jobs/index.js';

const SCOPE = '@nocobase/app-plugin-scheduler';

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-schedule-app-'));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

async function application(schedule?: AppJobsConfig) {
  const config = new AppConfig();
  await config.loadAll();
  if (schedule) config.mergeDefaults({ jobs: schedule });
  const container = new ServiceContainer();
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
  logger.child.mockReturnValue(logger);
  container.instance(loggingToken, {
    getLogger: vi.fn(() => logger),
  } as unknown as Logging);
  const app: AppPluginApplication = {
    appName: 'crm',
    publicBasePath: '',
    config,
    paths: createAppPaths({ rootDir }),
    router: new Hono(),
    container,
  };
  return { app, container, logger };
}

async function job(executorScope = SCOPE) {
  return {
    scope: executorScope,
    job: {
      name: 'job-1',
      options: { cron: '0 0 1 1 *' },
      payload: {},
      execute: async () => undefined,
    },
  };
}

describe('JobExecutorServiceProvider', () => {
  it('registers the service lazily under its token', async () => {
    const { app, container } = await application();
    const provider = new JobExecutorServiceProvider(app);

    expect(provider.name).toBe('@nocobase/app-server/jobs');
    provider.register();
    expect(container.resolveIfCreated(jobExecutorServiceToken)).toBeUndefined();

    const service = container.resolve(jobExecutorServiceToken);
    expect(container.resolve(jobExecutorServiceToken)).toBe(service);
    expect(service.getScheduleExecutor(SCOPE)).toBe(
      service.getScheduleExecutor(SCOPE),
    );
  });

  it('falls back to memory under the application name and storage directory', async () => {
    const { app, container, logger } = await application();
    const provider = new JobExecutorServiceProvider(app, {
      nodeEnv: 'production',
    });
    provider.register();
    const { scope, job: definition } = await job();

    const executor = container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor(scope);
    await executor.addJob(definition);
    await executor.setup({ consume: false });

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      { scope: SCOPE },
      expect.stringMatching(/built-in memory jobs configuration/u),
    );

    // The memory adapter writes its state when it shuts down.
    await provider.shutdown();
    expect(await readdir(path.join(rootDir, 'storage', 'jobs'))).toEqual([
      'crm.%40nocobase%2Fapp-plugin-scheduler.json',
    ]);
  });

  it.each(['develop', 'development'])(
    'does not warn about the fallback when NODE_ENV is %s',
    async (nodeEnv) => {
      const { app, container, logger } = await application();
      const provider = new JobExecutorServiceProvider(app, { nodeEnv });
      provider.register();

      container.resolve(jobExecutorServiceToken).getScheduleExecutor(SCOPE);

      expect(logger.warn).not.toHaveBeenCalled();
    },
  );

  it('uses the configured default and namespace without warning', async () => {
    const { app, container, logger } = await application({
      default: 'memory',
      memory: {
        adapter: 'memory',
        namespace: 'crm-legacy',
        persistence: { path: path.join(rootDir, 'custom') },
      },
    });
    const provider = new JobExecutorServiceProvider(app, {
      nodeEnv: 'production',
    });
    provider.register();

    const executor = container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor(SCOPE);
    await executor.setup({ consume: false });
    await executor.addJob((await job()).job);
    await provider.shutdown();

    expect(await readdir(path.join(rootDir, 'custom'))).toEqual([
      'crm-legacy.%40nocobase%2Fapp-plugin-scheduler.json',
    ]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('starts nothing and shuts down safely when nothing was used', async () => {
    const { app } = await application();
    const provider = new JobExecutorServiceProvider(app);
    provider.register();

    await provider.start();
    await provider.shutdown();
    await provider.shutdown();

    await expect(readdir(path.join(rootDir, 'storage'))).rejects.toThrow();
  });

  it('shuts executors down that their owners left running', async () => {
    const { app, container } = await application();
    const provider = new JobExecutorServiceProvider(app);
    provider.register();
    const executor = container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor(SCOPE);
    await executor.setup({ consume: false });

    await executor.shutdown();
    await provider.shutdown();

    await expect(executor.countJob()).rejects.toThrow(/shut down/u);
  });
});

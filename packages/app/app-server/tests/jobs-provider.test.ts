import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Job } from '@nocobase/jobs';
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

class PendingJob extends Job<{ value: string }> {
  static readonly jobName = 'app.pending';

  async execute(): Promise<void> {}
}

function ordinaryStateFile(namespace: string, scope: string): string {
  const identity = Buffer.from(JSON.stringify([namespace, scope])).toString(
    'base64url',
  );
  return `jobs.${identity}.state.json`;
}

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
  it('runs ordinary jobs through the existing provider and service token', async () => {
    const { app, container } = await application();
    const provider = new JobExecutorServiceProvider(app);
    provider.register();
    const service = container.resolve(jobExecutorServiceToken);
    const handled = vi.fn();

    class SendReport extends Job<{ reportId: string }> {
      static readonly jobName = 'app.send-report';

      async execute(): Promise<void> {
        handled(this.payload.reportId);
      }
    }

    const executor = service.getJobExecutor(SCOPE);
    expect(service.getJobExecutor(SCOPE)).toBe(executor);
    expect(container.resolve(jobExecutorServiceToken)).toBe(service);
    executor.registerJob(SendReport);

    try {
      await executor.setup();
      const receipt = await executor.addJob(
        new SendReport({ reportId: 'report-1' }),
      );

      expect(receipt).toMatchObject({
        jobId: expect.any(String),
        jobName: SendReport.jobName,
        enqueuedAt: expect.any(Date),
      });
      await vi.waitFor(() => {
        expect(handled).toHaveBeenCalledExactlyOnceWith('report-1');
      });
    } finally {
      await provider.shutdown();
    }
  });

  it('shares the selected default for omitted, default, and unknown configuration names', async () => {
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
    const service = container.resolve(jobExecutorServiceToken);
    const executor = service.getJobExecutor(SCOPE);

    expect(service.getJobExecutor(SCOPE, 'memory')).toBe(executor);
    expect(service.getJobExecutor(SCOPE, 'default')).toBe(executor);
    expect(service.getJobExecutor(SCOPE, 'missing')).toBe(executor);
    expect(service.getScheduleExecutor(SCOPE)).not.toBe(executor);

    try {
      await executor.setup({ consume: false });
      await executor.addJob(new PendingJob({ value: 'pending' }));
    } finally {
      await provider.shutdown();
    }

    expect(await readdir(path.join(rootDir, 'custom'))).toEqual([
      ordinaryStateFile('crm-legacy', SCOPE),
    ]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('shares one ordinary memory executor between keys naming the same file', async () => {
    const { app, container } = await application({
      default: 'first',
      first: { adapter: 'memory' },
      second: { adapter: 'memory' },
    });
    const provider = new JobExecutorServiceProvider(app);
    provider.register();
    const service = container.resolve(jobExecutorServiceToken);
    const first = service.getJobExecutor(SCOPE, 'first');
    expect(service.getJobExecutor(SCOPE, 'second')).toBe(first);

    try {
      await first.setup({ consume: false });
      await first.addJob(new PendingJob({ value: 'first' }));
    } finally {
      await provider.shutdown();
    }

    expect(await readdir(path.join(rootDir, 'storage', 'jobs'))).toEqual([
      ordinaryStateFile('crm', SCOPE),
    ]);
  });

  it('uses one built-in ordinary fallback and warns once for the selected executor', async () => {
    const { app, container, logger } = await application();
    const provider = new JobExecutorServiceProvider(app, {
      nodeEnv: 'production',
    });
    provider.register();
    const service = container.resolve(jobExecutorServiceToken);
    const executor = service.getJobExecutor(SCOPE, 'missing');

    expect(service.getJobExecutor(SCOPE)).toBe(executor);
    expect(service.getJobExecutor(SCOPE, 'default')).toBe(executor);
    expect(service.getJobExecutor(SCOPE, 'another-missing')).toBe(executor);
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      { scope: SCOPE },
      expect.stringMatching(/built-in memory jobs configuration/u),
    );

    try {
      await executor.setup({ consume: false });
      await executor.addJob(new PendingJob({ value: 'fallback' }));
    } finally {
      await provider.shutdown();
    }

    expect(await readdir(path.join(rootDir, 'storage', 'jobs'))).toEqual([
      ordinaryStateFile('crm', SCOPE),
    ]);
  });

  it.each(['develop', 'development'])(
    'does not warn about ordinary fallback when NODE_ENV is %s',
    async (nodeEnv) => {
      const { app, container, logger } = await application();
      const provider = new JobExecutorServiceProvider(app, { nodeEnv });
      provider.register();

      container.resolve(jobExecutorServiceToken).getJobExecutor(SCOPE);
      await provider.shutdown();

      expect(logger.warn).not.toHaveBeenCalled();
    },
  );

  it('rejects an invalid configured default for ordinary jobs', async () => {
    const { app, container } = await application({ default: 'missing' });
    const provider = new JobExecutorServiceProvider(app);
    provider.register();
    const service = container.resolve(jobExecutorServiceToken);

    expect(() => service.getJobExecutor(SCOPE)).toThrow(/jobs.default/u);
    await provider.shutdown();
  });

  it('shuts down every ordinary and schedule executor through the same provider', async () => {
    const { app, container } = await application({
      default: 'memory',
      memory: { adapter: 'memory' },
    });
    const provider = new JobExecutorServiceProvider(app);
    provider.register();
    const service = container.resolve(jobExecutorServiceToken);
    const ordinary = service.getJobExecutor(SCOPE);
    const otherScope = '@acme/other';
    const other = service.getJobExecutor(otherScope);
    const schedule = service.getScheduleExecutor(SCOPE);

    try {
      await Promise.all([
        ordinary.setup({ consume: false }),
        other.setup({ consume: false }),
        schedule.setup({ consume: false }),
      ]);
      await ordinary.addJob(new PendingJob({ value: 'first' }));
      await other.addJob(new PendingJob({ value: 'second' }));
      await schedule.addJob((await job()).job);

      // An owner may stop its executor before the application stops all of them.
      await other.shutdown();
      await Promise.all([provider.shutdown(), provider.shutdown()]);

      await expect(
        ordinary.addJob(new PendingJob({ value: 'closed' })),
      ).rejects.toThrow(/shut down/u);
      await expect(
        other.addJob(new PendingJob({ value: 'closed' })),
      ).rejects.toThrow(/shut down/u);
      await expect(schedule.countJob()).rejects.toThrow(/shut down/u);
      expect(() => service.getJobExecutor(SCOPE)).toThrow(/shut down/u);
      expect(() => service.getScheduleExecutor(SCOPE)).toThrow(/shut down/u);
    } finally {
      await provider.shutdown();
    }

    expect(
      (await readdir(path.join(rootDir, 'storage', 'jobs'))).sort(),
    ).toEqual(
      [
        'crm.%40nocobase%2Fapp-plugin-scheduler.json',
        ordinaryStateFile('crm', SCOPE),
        ordinaryStateFile('crm', otherScope),
      ].sort(),
    );
  });

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

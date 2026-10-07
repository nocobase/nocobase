import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import {
  createJobExecutorService,
  type ManagedJobExecutorService,
} from '@nocobase/jobs';
import { createLogging } from '@nocobase/logging';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CheckpointCleaner } from '../server/agent/checkpoint/index.js';
import { RepositoryFactory } from '../server/factory/repository-factory.js';
import {
  CHECKPOINT_CLEANUP_JOB,
  CHECKPOINT_CLEANUP_SCOPE,
  CheckpointCleanupProvider,
} from '../server/provider/checkpoint-cleanup.js';
import { repositoryFactoryToken } from '../server/tokens.js';

const cleanups: (() => Promise<void>)[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

/**
 * A provider over a jobs service on the memory adapter in a directory of its
 * own. Nothing here reaches the database: the cleaner it builds is only run
 * through a spy.
 */
async function createProvider(
  values: Record<string, unknown>,
  options: { jobs?: boolean; storage?: string } = {},
) {
  const storage =
    options.storage ??
    (await mkdtemp(path.join(tmpdir(), 'ai-checkpoint-cleanup-')));
  if (!options.storage)
    cleanups.push(() => rm(storage, { recursive: true, force: true }));
  const config = new AppConfig();
  config.load({
    name: 'test-config',
    read: async () => ({ kind: 'map', value: values }),
  });
  await config.loadAll();
  config.mergeDefaults({ ai: { llmServices: {} } });
  const logging = createLogging({ level: 'silent' });
  const logger = logging.getLogger('ai-employee');
  const warn = vi.fn();
  vi.spyOn(logging, 'getLogger').mockReturnValue(
    Object.assign(Object.create(logger), {
      child: () => Object.assign(Object.create(logger), { warn }),
    }),
  );
  const container = new ServiceContainer();
  container.instance(loggingToken, logging);
  container.instance(databaseManagerToken, {
    connection: () => ({}),
  } as never);
  container.instance(
    repositoryFactoryToken,
    new RepositoryFactory({ connection: {} as never }),
  );
  let jobs: ManagedJobExecutorService | undefined;
  if (options.jobs !== false) {
    jobs = createJobExecutorService(undefined, {
      appName: 'test',
      storagePath: storage,
    });
    container.instance(jobExecutorServiceToken, jobs);
  }
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config,
    paths: createAppPaths({ rootDir: process.cwd() }),
    router: new Hono(),
    container,
  };
  const provider = new CheckpointCleanupProvider(app);
  cleanups.push(async () => {
    await provider.shutdown();
    await jobs?.shutdown();
  });
  return { provider, jobs, storage, warn };
}

describe('CheckpointCleanupProvider', () => {
  it('schedules the cleanup every day at 03:00 UTC by default', async () => {
    const { provider, jobs } = await createProvider({});
    await provider.start();

    const rule = await jobs!
      .getScheduleExecutor(CHECKPOINT_CLEANUP_SCOPE)
      .getJob(CHECKPOINT_CLEANUP_JOB);
    expect(rule?.options).toMatchObject({ cron: '0 3 * * *', tz: 'UTC' });
  });

  it('releases conversations unused for the configured days, in batches', async () => {
    const cleanOutdated = vi
      .spyOn(CheckpointCleaner.prototype, 'cleanOutdated')
      .mockResolvedValue(3);
    const { provider, jobs } = await createProvider({
      ai: {
        checkpointCleanup: {
          cron: '*/5 * * * *',
          tz: 'Asia/Shanghai',
          retentionDays: 2,
          batchSize: 20,
        },
      },
    });
    const executor = jobs!.getScheduleExecutor(CHECKPOINT_CLEANUP_SCOPE);
    const addJob = vi.spyOn(executor, 'addJob');
    await provider.start();

    const [job, handlerOnly] = addJob.mock.calls[0]!;
    expect(handlerOnly).toBe(false);
    expect(job.options).toEqual({ cron: '*/5 * * * *', tz: 'Asia/Shanghai' });
    const signal = new AbortController().signal;
    const before = Date.now();
    await job.execute({
      jobId: 'firing-1',
      scheduledAt: new Date(),
      runAt: new Date(),
      signal,
    });
    const [expiredAt, options] = cleanOutdated.mock.calls[0]!;
    const twoDays = 2 * 24 * 60 * 60 * 1000;
    expect(expiredAt.getTime()).toBeGreaterThanOrEqual(before - twoDays);
    expect(expiredAt.getTime()).toBeLessThanOrEqual(Date.now() - twoDays);
    expect(options).toEqual({ batchSize: 20, signal });
  });

  it('removes the rule once disabled, and keeps the handler for a firing another instance sends', async () => {
    const first = await createProvider({});
    await first.provider.start();
    await first.provider.shutdown();
    await first.jobs!.shutdown();

    const second = await createProvider(
      { ai: { checkpointCleanup: { enabled: false } } },
      { storage: first.storage },
    );
    const executor = second.jobs!.getScheduleExecutor(CHECKPOINT_CLEANUP_SCOPE);
    const addJob = vi.spyOn(executor, 'addJob');
    await second.provider.start();

    expect(addJob.mock.calls[0]?.[1]).toBe(true);
    await expect(executor.getJob(CHECKPOINT_CLEANUP_JOB)).resolves.toBe(
      undefined,
    );
  });

  it('removes a rule an earlier version left under its scope', async () => {
    const first = await createProvider({});
    const executor = first.jobs!.getScheduleExecutor(CHECKPOINT_CLEANUP_SCOPE);
    await executor.addJob({
      name: 'retired-job',
      options: { every: 60_000 },
      payload: {},
      execute: async () => {},
    });
    await executor.setup();
    await first.jobs!.shutdown();

    const second = await createProvider({}, { storage: first.storage });
    await second.provider.start();

    const names = (
      await second
        .jobs!.getScheduleExecutor(CHECKPOINT_CLEANUP_SCOPE)
        .listJob(0, -1)
    ).map((rule) => rule.jobName);
    expect(names).toEqual([CHECKPOINT_CLEANUP_JOB]);
  });

  it('starts without the cleanup, and says so, in an application without a jobs service', async () => {
    const { provider, warn } = await createProvider({}, { jobs: false });

    await expect(provider.start()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('refuses to start on a jobs configuration that does not exist', async () => {
    const { provider } = await createProvider({
      ai: { checkpointCleanup: { jobs: 'missing' } },
    });

    await expect(provider.start()).rejects.toThrow(
      'ai.checkpointCleanup.jobs names "missing"',
    );
  });

  it('refuses to start on an invalid configuration', async () => {
    const { provider } = await createProvider({
      ai: { checkpointCleanup: { retentionDays: 0 } },
    });

    await expect(provider.start()).rejects.toThrow(
      'ai.checkpointCleanup.retentionDays',
    );
  });
});

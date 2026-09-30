import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { createJobExecutorService } from '@nocobase/jobs';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { __NOCOBASE_SYMBOL_NAME__Job } from '../server/jobs/__NOCOBASE_SHORT_NAME__.js';
import { __NOCOBASE_SYMBOL_NAME__JobsProvider } from '../server/jobs/provider.js';

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'plugin-jobs-'));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(directory, { recursive: true, force: true });
});

describe(__NOCOBASE_PACKAGE_NAME_LITERAL__, () => {
  it('declares a stable job name', () => {
    expect(__NOCOBASE_SYMBOL_NAME__Job.jobName).toBe(
      __NOCOBASE_JOB_NAME_LITERAL__,
    );
  });

  it('runs its job on the executor its provider owns', async () => {
    // The built-in memory configuration, with its state file in a temporary directory.
    const jobs = createJobExecutorService(undefined, {
      appName: 'test',
      storagePath: directory,
    });
    const container = new ServiceContainer();
    container.instance(jobExecutorServiceToken, jobs);
    const provider = new __NOCOBASE_SYMBOL_NAME__JobsProvider({ container });
    const execute = vi.spyOn(__NOCOBASE_SYMBOL_NAME__Job.prototype, 'execute');

    try {
      await provider.start();
      // The service hands out one executor per scope, so this is the provider's.
      await jobs.getJobExecutor(__NOCOBASE_PACKAGE_NAME_LITERAL__).addJob(
        new __NOCOBASE_SYMBOL_NAME__Job({
          requestedAt: new Date().toISOString(),
        }),
      );
      await vi.waitFor(() => {
        expect(execute).toHaveBeenCalledOnce();
      });
    } finally {
      await provider.shutdown();
      await jobs.shutdown();
    }
  });
});

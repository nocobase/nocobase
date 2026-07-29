/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import type { LightExtensionCreateJobRecord } from '../../shared/types';
import { LightExtensionCreateJobExecutor } from '../services/LightExtensionCreateJobExecutor';
import { LightExtensionCreateJobRunner } from '../services/LightExtensionCreateJobRunner';
import type { LightExtensionCreateJobStore } from '../services/LightExtensionCreateJobStore';

describe('LightExtensionCreateJobRunner', () => {
  it('retries a queued job when SQLite is briefly locked', async () => {
    const job = createJob();
    const store = {
      start: vi
        .fn()
        .mockRejectedValueOnce({ original: { code: 'SQLITE_BUSY' } })
        .mockResolvedValueOnce(job),
      complete: vi.fn(async () => true),
      fail: vi.fn(),
    } as unknown as LightExtensionCreateJobStore;
    const executor = {
      execute: vi.fn(async () => job.targetRepoId),
      cleanup: vi.fn(),
    } as unknown as LightExtensionCreateJobExecutor;
    const runner = new LightExtensionCreateJobRunner(store, executor, runnerOptions());

    await runner.run(job.id);

    expect(store.start).toHaveBeenCalledTimes(2);
    expect(executor.execute).toHaveBeenCalledWith(job);
  });

  it('executes a queued job once when the same message is delivered twice', async () => {
    const job = createJob();
    const store = {
      start: vi.fn().mockResolvedValueOnce(job).mockResolvedValueOnce(null),
      complete: vi.fn(async () => true),
      fail: vi.fn(),
    } as unknown as LightExtensionCreateJobStore;
    const executor = {
      execute: vi.fn(async () => job.targetRepoId),
      cleanup: vi.fn(),
    } as unknown as LightExtensionCreateJobExecutor;
    const runner = new LightExtensionCreateJobRunner(store, executor, runnerOptions());

    await Promise.all([runner.run(job.id), runner.run(job.id)]);

    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(store.complete).toHaveBeenCalledWith(job.id, 'main');
    expect(executor.cleanup).not.toHaveBeenCalled();
  });

  it('stores a safe failure and cleans a partially created repository without retrying', async () => {
    const job = createJob();
    const store = {
      start: vi.fn(async () => job),
      complete: vi.fn(),
      fail: vi.fn(async () => ({ ...job, status: 'failed' })),
    } as unknown as LightExtensionCreateJobStore;
    const executor = {
      execute: vi.fn(async () => {
        throw new Error('credential=https://secret.example/token');
      }),
      cleanup: vi.fn(async () => undefined),
    } as unknown as LightExtensionCreateJobExecutor;
    const runner = new LightExtensionCreateJobRunner(store, executor, runnerOptions());

    await runner.run(job.id);

    expect(store.fail).toHaveBeenCalledWith(
      job.id,
      'main',
      'LIGHT_EXTENSION_CREATE_FAILED',
      'Light extension creation failed',
    );
    expect(executor.cleanup).toHaveBeenCalledWith(job);
    expect(store.complete).not.toHaveBeenCalled();
  });

  it('fails and cleans stale jobs without executing them', async () => {
    const job = createJob({
      status: 'failed',
      payload: null,
      reservationKey: null,
      errorCode: 'LIGHT_EXTENSION_CREATE_TIMED_OUT',
      errorMessage: 'Light extension creation timed out',
    });
    const store = {
      failStale: vi.fn(async () => [job]),
    } as unknown as LightExtensionCreateJobStore;
    const executor = {
      execute: vi.fn(),
      cleanup: vi.fn(async () => undefined),
    } as unknown as LightExtensionCreateJobExecutor;
    const options = runnerOptions();
    const runner = new LightExtensionCreateJobRunner(store, executor, options);

    await runner.start();
    await runner.stop();

    expect(store.failStale).toHaveBeenCalledWith('main', {
      pendingTimeoutMs: 300_000,
      runningTimeoutMs: 600_000,
    });
    expect(executor.cleanup).toHaveBeenCalledWith(job);
    expect(executor.execute).not.toHaveBeenCalled();
  });
});

function runnerOptions() {
  return {
    applicationName: 'main',
    eventQueue: {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      publish: vi.fn(async () => undefined),
    },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    cleanupIntervalMs: 60_000,
  };
}

function createJob(overrides: Partial<LightExtensionCreateJobRecord> = {}): LightExtensionCreateJobRecord {
  return {
    id: 'lecj_demo',
    applicationName: 'main',
    targetRepoId: 'ler_demo',
    name: 'demo',
    normalizedName: 'demo',
    title: 'Demo',
    description: null,
    sourceType: 'template',
    status: 'running',
    payload: { sourceType: 'template', message: 'Initial light extension source' },
    errorCode: null,
    errorMessage: null,
    reservationKey: 'sha256:demo',
    actorUserId: '7',
    requestId: 'request-demo',
    startedAt: '2026-07-27T00:00:00.000Z',
    finishedAt: null,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    ...overrides,
  };
}

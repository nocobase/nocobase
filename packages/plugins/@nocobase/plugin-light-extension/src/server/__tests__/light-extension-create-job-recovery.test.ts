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
import type { LightExtensionCreateFromRemoteService } from '../services/LightExtensionCreateFromRemoteService';
import type { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import type { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';

describe('LightExtensionCreateJobRunner recovery', () => {
  it('claims and executes a durable pending job without an EventQueue message', async () => {
    const job = runningJob();
    const store = {
      cleanupSucceeded: vi.fn(async () => 0),
      claimPendingOrExpired: vi.fn().mockResolvedValueOnce(job).mockResolvedValueOnce(null),
      get: vi.fn(async () => job),
      heartbeat: vi.fn(async () => job),
      succeed: vi.fn(async () => ({ ...job, status: 'succeeded' })),
      fail: vi.fn(),
    } as unknown as LightExtensionCreateJobStore;
    const executor = {
      execute: vi.fn(async () => job.targetRepoId),
    } as unknown as LightExtensionCreateJobExecutor;
    const runner = new LightExtensionCreateJobRunner(store, executor, runnerOptions());

    await runner.runOnce();

    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(store.succeed).toHaveBeenCalledWith(job.id, job.claimToken, job.targetRepoId);
    expect(store.fail).not.toHaveBeenCalled();
  });

  it('lets two runners share a store while only the successful claimant executes', async () => {
    const job = runningJob();
    let claimed = false;
    const store = {
      cleanupSucceeded: vi.fn(async () => 0),
      claimPendingOrExpired: vi.fn(async () => {
        if (claimed) {
          return null;
        }
        claimed = true;
        return job;
      }),
      get: vi.fn(async () => job),
      heartbeat: vi.fn(async () => job),
      succeed: vi.fn(async () => ({ ...job, status: 'succeeded' })),
      fail: vi.fn(),
    } as unknown as LightExtensionCreateJobStore;
    const executor = {
      execute: vi.fn(async () => job.targetRepoId),
    } as unknown as LightExtensionCreateJobExecutor;
    const first = new LightExtensionCreateJobRunner(store, executor, runnerOptions('worker-1'));
    const second = new LightExtensionCreateJobRunner(store, executor, runnerOptions('worker-2'));

    await Promise.all([first.runOnce(), second.runOnce()]);

    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(store.succeed).toHaveBeenCalledTimes(1);
  });

  it('recovers a ready target repository without rerunning creation or compilation', async () => {
    const job = runningJob();
    const repoService = {
      findInternalRepoById: vi.fn(async () => ({ id: job.targetRepoId, healthStatus: 'ready' })),
      createRepo: vi.fn(),
    } as unknown as LightExtensionRepoService;
    const runtimeCompileService = {
      compileCurrentRuntime: vi.fn(),
    } as unknown as LightExtensionRuntimeCompileService;
    const createFromRemoteService = {
      create: vi.fn(),
    } as unknown as LightExtensionCreateFromRemoteService;
    const executor = new LightExtensionCreateJobExecutor(
      {} as never,
      repoService,
      runtimeCompileService,
      createFromRemoteService,
    );

    await expect(executor.execute(job)).resolves.toBe(job.targetRepoId);
    expect(repoService.createRepo).not.toHaveBeenCalled();
    expect(runtimeCompileService.compileCurrentRuntime).not.toHaveBeenCalled();
    expect(createFromRemoteService.create).not.toHaveBeenCalled();
  });
});

function runnerOptions(leaseOwner = 'worker') {
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
    leaseOwner,
    leaseDurationMs: 30_000,
    scanIntervalMs: 60_000,
  };
}

function runningJob(): LightExtensionCreateJobRecord {
  return {
    id: 'lecj_recover',
    applicationName: 'main',
    targetRepoId: 'ler_recover',
    name: 'Recover',
    normalizedName: 'recover',
    title: null,
    description: null,
    sourceType: 'template',
    status: 'running',
    payload: { sourceType: 'template', message: 'Initial light extension source' },
    resultRepoId: null,
    errorCode: null,
    errorMessage: null,
    reservationKey: 'sha256:recover',
    claimToken: 'claim-recover',
    leaseOwner: 'worker',
    leaseExpiresAt: '2026-07-27T00:01:00.000Z',
    heartbeatAt: '2026-07-27T00:00:00.000Z',
    attempt: 1,
    maxAttempts: 3,
    actorUserId: '7',
    requestId: 'request-recover',
    startedAt: '2026-07-27T00:00:00.000Z',
    finishedAt: null,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
  };
}

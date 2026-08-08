/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import type { JsTemplateCreateJob } from '../../shared/types';
import { RemoteSyncError } from '../vsc-file/remotes';
import type { JsTemplateAuditService, JsTemplateCreateJobAuditInput } from '../services/JsTemplateAuditService';
import { JsTemplateCreateJobExecutor } from '../services/JsTemplateCreateJobExecutor';
import { JsTemplateCreateJobRunner } from '../services/JsTemplateCreateJobRunner';
import type { JsTemplateCreateJobStore } from '../services/JsTemplateCreateJobStore';

describe('JsTemplateCreateJobRunner', () => {
  it('retries a queued job when SQLite is briefly locked', async () => {
    const job = createJob();
    const store = {
      start: vi
        .fn()
        .mockRejectedValueOnce({ original: { code: 'SQLITE_BUSY' } })
        .mockResolvedValueOnce(job),
      complete: vi.fn(async () => true),
      fail: vi.fn(),
    } as unknown as JsTemplateCreateJobStore;
    const executor = {
      execute: vi.fn(async () => job.targetProjectId),
      cleanup: vi.fn(),
    } as unknown as JsTemplateCreateJobExecutor;
    const recordCreateJobEvent = vi.fn(async (_event: JsTemplateCreateJobAuditInput) => undefined);
    const runner = new JsTemplateCreateJobRunner(store, executor, runnerOptions(), {
      recordCreateJobEvent,
    } as unknown as JsTemplateAuditService);

    await runner.run(job.id);

    expect(store.start).toHaveBeenCalledTimes(2);
    expect(executor.execute).toHaveBeenCalledWith(job);
    expect(recordCreateJobEvent.mock.calls.map(([event]) => event.action)).toEqual([
      'createJobStart',
      'createJobSucceed',
    ]);
  });

  it('executes a queued job once when the same message is delivered twice', async () => {
    const job = createJob();
    const store = {
      start: vi.fn().mockResolvedValueOnce(job).mockResolvedValueOnce(null),
      complete: vi.fn(async () => true),
      fail: vi.fn(),
    } as unknown as JsTemplateCreateJobStore;
    const executor = {
      execute: vi.fn(async () => job.targetProjectId),
      cleanup: vi.fn(),
    } as unknown as JsTemplateCreateJobExecutor;
    const runner = new JsTemplateCreateJobRunner(store, executor, runnerOptions());

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
    } as unknown as JsTemplateCreateJobStore;
    const executor = {
      execute: vi.fn(async () => {
        throw new Error('credential=https://secret.example/token');
      }),
      cleanup: vi.fn(async () => undefined),
    } as unknown as JsTemplateCreateJobExecutor;
    const recordCreateJobEvent = vi.fn(async (_event: JsTemplateCreateJobAuditInput) => undefined);
    const runner = new JsTemplateCreateJobRunner(store, executor, runnerOptions(), {
      recordCreateJobEvent,
    } as unknown as JsTemplateAuditService);

    await runner.run(job.id);

    expect(store.fail).toHaveBeenCalledWith(
      job.id,
      'main',
      'JS_TEMPLATE_CREATE_FAILED',
      'JS Template creation failed',
      null,
    );
    expect(executor.cleanup).toHaveBeenCalledWith(job);
    expect(store.complete).not.toHaveBeenCalled();
    expect(recordCreateJobEvent.mock.calls.map(([event]) => event.action)).toEqual(['createJobStart', 'createJobFail']);
    expect(recordCreateJobEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        jobId: job.id,
        reasonCode: 'JS_TEMPLATE_CREATE_FAILED',
        result: 'blocked',
      }),
    );
  });

  it('preserves only the safe default-branch reason for an asynchronous Git creation failure', async () => {
    const job = createJob({ sourceType: 'git' });
    const store = {
      start: vi.fn(async () => job),
      complete: vi.fn(),
      fail: vi.fn(async () => ({ ...job, status: 'failed' })),
    } as unknown as JsTemplateCreateJobStore;
    const executor = {
      execute: vi.fn(async () => {
        throw new RemoteSyncError('CONFIG_INVALID', 'Git default branch is unavailable', {
          details: { provider: 'git', reasonCode: 'default-branch-unavailable' },
        });
      }),
      cleanup: vi.fn(async () => undefined),
    } as unknown as JsTemplateCreateJobExecutor;
    const recordCreateJobEvent = vi.fn(async (_event: JsTemplateCreateJobAuditInput) => undefined);
    const runner = new JsTemplateCreateJobRunner(store, executor, runnerOptions(), {
      recordCreateJobEvent,
    } as unknown as JsTemplateAuditService);

    await runner.run(job.id);

    expect(store.fail).toHaveBeenCalledWith(
      job.id,
      'main',
      'JS_TEMPLATE_SYNC_CONFIG_INVALID',
      'JS_TEMPLATE_SYNC_CONFIG_INVALID',
      'default-branch-unavailable',
    );
    expect(recordCreateJobEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({ reasonCode: 'default-branch-unavailable', result: 'blocked' }),
    );
  });

  it('fails and cleans stale jobs without executing them', async () => {
    const job = createJob({
      status: 'failed',
      payload: null,
      reservationKey: null,
      errorCode: 'JS_TEMPLATE_CREATE_TIMED_OUT',
      errorMessage: 'JS Template creation timed out',
    });
    const store = {
      failStale: vi.fn(async () => [job]),
    } as unknown as JsTemplateCreateJobStore;
    const executor = {
      execute: vi.fn(),
      cleanup: vi.fn(async () => undefined),
    } as unknown as JsTemplateCreateJobExecutor;
    const options = runnerOptions();
    const runner = new JsTemplateCreateJobRunner(store, executor, options);

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

function createJob(overrides: Partial<JsTemplateCreateJob> = {}): JsTemplateCreateJob {
  return {
    id: 'jtcj_demo',
    applicationName: 'main',
    targetProjectId: 'jtp_demo',
    name: 'demo',
    normalizedName: 'demo',
    title: 'Demo',
    description: null,
    sourceType: 'starter',
    status: 'running',
    payload: { sourceType: 'starter', message: 'Initial JS Template source' },
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

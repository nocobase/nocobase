/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import type { Database } from '@nocobase/database';

import type { JsTemplateCreateJob } from '../../shared/types';
import { RemoteSyncError } from '../vsc-file/remotes';
import type { JsTemplateAuditService, JsTemplateCreateJobAuditInput } from '../services/JsTemplateAuditService';
import { JsTemplateCreateJobExecutor } from '../services/JsTemplateCreateJobExecutor';
import { JsTemplateCreateJobRunner } from '../services/JsTemplateCreateJobRunner';
import type { JsTemplateCreateJobStore } from '../services/JsTemplateCreateJobStore';
import type { JsTemplateCreateFromRemoteService } from '../services/JsTemplateCreateFromRemoteService';
import type { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import type { JsTemplateCompileService } from '../services/JsTemplateCompileService';

describe('JsTemplateCreateJobRunner', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries a claim when SQLite is briefly locked', async () => {
    const job = createJob();
    const store = createStore({
      claim: vi
        .fn()
        .mockRejectedValueOnce({ original: { code: 'SQLITE_BUSY' } })
        .mockResolvedValueOnce(job),
    });
    const executor = createExecutor();
    const recordCreateJobEvent = vi.fn(async (_event: JsTemplateCreateJobAuditInput) => undefined);
    const runner = new JsTemplateCreateJobRunner(store, executor, runnerOptions(), {
      recordCreateJobEvent,
    } as unknown as JsTemplateAuditService);

    await runner.run(job.id);

    expect(store.claim).toHaveBeenCalledTimes(2);
    expect(executor.execute).toHaveBeenCalledWith(job, job.claimToken);
    expect(recordCreateJobEvent.mock.calls.map(([event]) => event.action)).toEqual([
      'createJobStart',
      'createJobSucceed',
    ]);
  });

  it('executes a queued job once when the same message is delivered twice', async () => {
    const job = createJob();
    const store = createStore({ claim: vi.fn().mockResolvedValueOnce(job).mockResolvedValueOnce(null) });
    const executor = createExecutor();
    const runner = new JsTemplateCreateJobRunner(store, executor, runnerOptions());

    await Promise.all([runner.run(job.id), runner.run(job.id)]);

    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(store.succeed).toHaveBeenCalledWith(job.id, 'main', job.claimToken, job.targetProjectId);
    expect(executor.cleanup).not.toHaveBeenCalled();
  });

  it('stores a safe failure and cleans only while the claim is current', async () => {
    const job = createJob();
    const store = createStore();
    const executor = createExecutor({
      execute: vi.fn(async () => {
        throw new Error('credential=https://secret.example/token');
      }),
    });
    const recordCreateJobEvent = vi.fn(async (_event: JsTemplateCreateJobAuditInput) => undefined);
    const runner = new JsTemplateCreateJobRunner(store, executor, runnerOptions(), {
      recordCreateJobEvent,
    } as unknown as JsTemplateAuditService);

    await runner.run(job.id);

    expect(executor.cleanup).toHaveBeenCalledWith(job, job.claimToken);
    expect(store.fail).toHaveBeenCalledWith(
      job.id,
      'main',
      job.claimToken,
      'JS_TEMPLATE_CREATE_FAILED',
      'JS Template creation failed',
      null,
    );
    expect(recordCreateJobEvent.mock.calls.map(([event]) => event.action)).toEqual(['createJobStart', 'createJobFail']);
  });

  it('preserves only the safe default-branch reason for an asynchronous Git failure', async () => {
    const job = createJob({ sourceType: 'git' });
    const store = createStore();
    const executor = createExecutor({
      execute: vi.fn(async () => {
        throw new RemoteSyncError('CONFIG_INVALID', 'Git default branch is unavailable', {
          details: { provider: 'git', reasonCode: 'default-branch-unavailable' },
        });
      }),
    });
    const runner = new JsTemplateCreateJobRunner(store, executor, runnerOptions());

    await runner.run(job.id);

    expect(store.fail).toHaveBeenCalledWith(
      job.id,
      'main',
      job.claimToken,
      'JS_TEMPLATE_SYNC_CONFIG_INVALID',
      'JS_TEMPLATE_SYNC_CONFIG_INVALID',
      'default-branch-unavailable',
    );
  });

  it('recovers a pending database job at startup without a queue message', async () => {
    const job = createJob();
    const store = createStore({
      findClaimableIds: vi.fn().mockResolvedValueOnce([job.id]).mockResolvedValueOnce([]),
    });
    const executor = createExecutor();
    const options = runnerOptions();
    const runner = new JsTemplateCreateJobRunner(store, executor, options);

    await runner.start();
    await vi.waitFor(() => expect(executor.execute).toHaveBeenCalledTimes(1));
    await runner.stop();

    expect(options.eventQueue.subscribe).toHaveBeenCalledTimes(1);
    expect(store.findClaimableIds).toHaveBeenCalledWith('main', 100);
    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(store.succeed).toHaveBeenCalledTimes(1);
  });

  it('heartbeats a long-running executor before the lease expires', async () => {
    vi.useFakeTimers();
    const job = createJob();
    let finishExecution: ((projectId: string) => void) | undefined;
    const store = createStore();
    const executor = createExecutor({
      execute: vi.fn(
        () =>
          new Promise<string>((resolve) => {
            finishExecution = resolve;
          }),
      ),
    });
    const runner = new JsTemplateCreateJobRunner(store, executor, runnerOptions({ heartbeatIntervalMs: 10 }));

    const running = runner.run(job.id);
    await vi.advanceTimersByTimeAsync(10);
    expect(store.heartbeat).toHaveBeenCalledWith(job.id, 'main', job.claimToken, 600_000);
    finishExecution?.(job.targetProjectId);
    await running;
  });

  it('never fails or cleans up a ready Project when success persistence throws across 100 restarts', async () => {
    const job = createJob();
    const store = createStore({ succeed: vi.fn(async () => Promise.reject(new Error('injected persistence loss'))) });
    const deleteProject = vi.fn();
    const findInternalProjectById = vi.fn(async () => ({
      id: job.targetProjectId,
      creationJobId: job.id,
      healthStatus: 'ready',
      headCommitId: 'vscc_ready',
    }));
    const executor = new JsTemplateCreateJobExecutor(
      {} as Database,
      {
        getCurrentApplicationName: vi.fn(() => 'main'),
        findInternalProjectById,
        deleteProject,
      } as unknown as JsTemplateProjectService,
      {} as JsTemplateCompileService,
      {} as JsTemplateCreateFromRemoteService,
      store,
    );
    const runner = new JsTemplateCreateJobRunner(store, executor, runnerOptions());

    for (let restart = 0; restart < 100; restart += 1) {
      await runner.run(job.id);
    }

    expect(findInternalProjectById).toHaveBeenCalledTimes(100);
    expect(store.succeed).toHaveBeenCalledTimes(100);
    expect(store.fail).not.toHaveBeenCalled();
    expect(deleteProject).not.toHaveBeenCalled();
  });

  it('deletes only an owned non-ready temporary Project while the claim is current', async () => {
    const job = createJob();
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    const assertCurrentClaim = vi.fn(async () => undefined);
    const store = { assertCurrentClaim } as unknown as JsTemplateCreateJobStore;
    const deleteProject = vi.fn(async () => undefined);
    const findInternalProjectById = vi
      .fn()
      .mockResolvedValueOnce({ id: job.targetProjectId, creationJobId: job.id, healthStatus: 'ready' })
      .mockResolvedValueOnce({ id: job.targetProjectId, creationJobId: 'another-job', healthStatus: 'pending' })
      .mockResolvedValueOnce({ id: job.targetProjectId, creationJobId: job.id, healthStatus: 'pending' })
      .mockResolvedValueOnce({ id: job.targetProjectId, creationJobId: job.id, healthStatus: 'pending' });
    const lockInternalProjectForUpdate = vi
      .fn()
      .mockResolvedValueOnce({ id: job.targetProjectId, creationJobId: job.id, healthStatus: 'ready' })
      .mockResolvedValueOnce({ id: job.targetProjectId, creationJobId: job.id, healthStatus: 'pending' });
    const executor = new JsTemplateCreateJobExecutor(
      {
        sequelize: { transaction: vi.fn(async (run: (current: object) => Promise<unknown>) => run(transaction)) },
      } as unknown as Database,
      { findInternalProjectById, lockInternalProjectForUpdate, deleteProject } as unknown as JsTemplateProjectService,
      {} as JsTemplateCompileService,
      {} as JsTemplateCreateFromRemoteService,
      store,
    );

    await expect(executor.cleanup(job, job.claimToken || '')).resolves.toBe(false);
    await expect(executor.cleanup(job, job.claimToken || '')).resolves.toBe(false);
    await expect(executor.cleanup(job, job.claimToken || '')).resolves.toBe(false);
    await expect(executor.cleanup(job, job.claimToken || '')).resolves.toBe(true);

    expect(assertCurrentClaim).toHaveBeenCalledTimes(4);
    expect(lockInternalProjectForUpdate).toHaveBeenCalledTimes(2);
    expect(deleteProject).toHaveBeenCalledTimes(1);
    expect(deleteProject).toHaveBeenCalledWith(
      { projectId: job.targetProjectId },
      expect.objectContaining({ transaction }),
    );
  });

  it('retains recovery context after cleanup failure and lets a new worker write the only terminal result', async () => {
    let persistedJob = createJob({
      status: 'pending',
      claimToken: null,
      claimOwner: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
      attempt: 0,
      startedAt: null,
    });
    let leaseExpired = false;
    let claimSequence = 0;
    const terminalResults: JsTemplateCreateJob[] = [];
    const claim = vi.fn(
      async (_jobId: string, _applicationName: string, claimOwner: string): Promise<JsTemplateCreateJob | null> => {
        const claimable = persistedJob.status === 'pending' || (persistedJob.status === 'running' && leaseExpired);
        if (!claimable) {
          return null;
        }
        claimSequence += 1;
        leaseExpired = false;
        persistedJob = {
          ...persistedJob,
          status: 'running',
          claimToken: `claim-${claimSequence}`,
          claimOwner,
          leaseExpiresAt: `2030-07-27T00:${claimSequence === 1 ? '10' : '20'}:00.000Z`,
          heartbeatAt: `2030-07-27T00:${claimSequence === 1 ? '00' : '10'}:00.000Z`,
          attempt: claimSequence,
          startedAt: persistedJob.startedAt || '2026-07-27T00:00:00.000Z',
        };
        return { ...persistedJob };
      },
    );
    const fail = vi.fn(
      async (
        _jobId: string,
        _applicationName: string,
        claimToken: string,
        errorCode: string,
        errorMessage: string,
      ): Promise<JsTemplateCreateJob | null> => {
        if (persistedJob.status !== 'running' || persistedJob.claimToken !== claimToken) {
          return null;
        }
        persistedJob = {
          ...persistedJob,
          status: 'failed',
          payload: null,
          reservationKey: null,
          errorCode,
          errorMessage,
          claimToken: null,
          claimOwner: null,
          leaseExpiresAt: null,
          heartbeatAt: null,
          finishedAt: '2026-07-27T00:20:00.000Z',
        };
        terminalResults.push({ ...persistedJob });
        return { ...persistedJob };
      },
    );
    const store = createStore({ claim, fail });
    const firstExecutor = createExecutor({
      execute: vi.fn(async () => Promise.reject(new Error('first execution failed'))),
      cleanup: vi.fn(async () => Promise.reject(new Error('cleanup unavailable'))),
    });
    const secondExecutor = createExecutor({
      execute: vi.fn(async () => Promise.reject(new Error('recovered execution failed'))),
      cleanup: vi.fn(async () => true),
    });
    const recordCreateJobEvent = vi.fn(async (_event: JsTemplateCreateJobAuditInput) => undefined);
    const auditService = { recordCreateJobEvent } as unknown as JsTemplateAuditService;
    const firstRunner = new JsTemplateCreateJobRunner(
      store,
      firstExecutor,
      runnerOptions({ claimOwner: 'worker-one' }),
      auditService,
    );
    const secondRunner = new JsTemplateCreateJobRunner(
      store,
      secondExecutor,
      runnerOptions({ claimOwner: 'worker-two' }),
      auditService,
    );

    await firstRunner.run(persistedJob.id);

    expect(firstExecutor.cleanup).toHaveBeenCalledWith(expect.objectContaining({ claimToken: 'claim-1' }), 'claim-1');
    expect(store.fail).not.toHaveBeenCalled();
    expect(persistedJob).toMatchObject({
      status: 'running',
      payload: { sourceType: 'starter', message: 'Initial JS Template source' },
      reservationKey: 'sha256:demo',
      claimToken: 'claim-1',
      claimOwner: 'worker-one',
      leaseExpiresAt: '2030-07-27T00:10:00.000Z',
      heartbeatAt: '2030-07-27T00:00:00.000Z',
    });

    leaseExpired = true;
    await secondRunner.run(persistedJob.id);
    await firstRunner.run(persistedJob.id);

    expect(secondExecutor.execute).toHaveBeenCalledWith(expect.objectContaining({ claimToken: 'claim-2' }), 'claim-2');
    expect(secondExecutor.cleanup).toHaveBeenCalledWith(expect.objectContaining({ claimToken: 'claim-2' }), 'claim-2');
    expect(store.fail).toHaveBeenCalledTimes(1);
    expect(store.fail).toHaveBeenCalledWith(
      persistedJob.id,
      'main',
      'claim-2',
      'JS_TEMPLATE_CREATE_FAILED',
      'JS Template creation failed',
      null,
    );
    expect(terminalResults).toHaveLength(1);
    expect(persistedJob).toMatchObject({
      status: 'failed',
      payload: null,
      reservationKey: null,
      claimToken: null,
      claimOwner: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
    });
    expect(recordCreateJobEvent.mock.calls.map(([event]) => event.action)).toEqual([
      'createJobStart',
      'createJobStart',
      'createJobFail',
    ]);
  });

  it('prevents a stale worker from recording a second failure or audit after losing its claim', async () => {
    const job = createJob();
    const store = createStore({ fail: vi.fn(async () => null) });
    const executor = createExecutor({
      execute: vi.fn(async () => Promise.reject(new Error('late worker failure'))),
      cleanup: vi.fn(async () => false),
    });
    const recordCreateJobEvent = vi.fn(async (_event: JsTemplateCreateJobAuditInput) => undefined);
    const runner = new JsTemplateCreateJobRunner(store, executor, runnerOptions(), {
      recordCreateJobEvent,
    } as unknown as JsTemplateAuditService);

    await runner.run(job.id);

    expect(executor.cleanup).toHaveBeenCalledWith(job, job.claimToken);
    expect(store.fail).toHaveBeenCalledWith(
      job.id,
      'main',
      job.claimToken,
      'JS_TEMPLATE_CREATE_FAILED',
      'JS Template creation failed',
      null,
    );
    expect(recordCreateJobEvent.mock.calls.map(([event]) => event.action)).toEqual(['createJobStart']);
  });
});

function runnerOptions(overrides: Partial<ReturnType<typeof runnerOptionsBase>> = {}) {
  return { ...runnerOptionsBase(), ...overrides };
}

function runnerOptionsBase() {
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
    scanIntervalMs: 60_000,
    runningTimeoutMs: 600_000,
    claimOwner: 'runner-test',
  };
}

function createStore(
  overrides: Partial<Record<keyof JsTemplateCreateJobStore, ReturnType<typeof vi.fn>>> = {},
): JsTemplateCreateJobStore {
  const job = createJob();
  return {
    claim: vi.fn(async () => job),
    succeed: vi.fn(async () => ({ ...job, status: 'succeeded', resultProjectId: job.targetProjectId })),
    fail: vi.fn(async () => ({ ...job, status: 'failed' })),
    heartbeat: vi.fn(async () => true),
    findClaimableIds: vi.fn(async () => []),
    ...overrides,
  } as unknown as JsTemplateCreateJobStore;
}

function createExecutor(
  overrides: Partial<Record<keyof JsTemplateCreateJobExecutor, ReturnType<typeof vi.fn>>> = {},
): JsTemplateCreateJobExecutor {
  const job = createJob();
  return {
    execute: vi.fn(async () => job.targetProjectId),
    cleanup: vi.fn(async () => false),
    ...overrides,
  } as unknown as JsTemplateCreateJobExecutor;
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
    resultProjectId: null,
    payload: { sourceType: 'starter', message: 'Initial JS Template source' },
    errorCode: null,
    errorMessage: null,
    reservationKey: 'sha256:demo',
    actorUserId: '7',
    requestId: 'request-demo',
    claimToken: 'claim-demo',
    claimOwner: 'runner-test',
    leaseExpiresAt: '2030-07-27T00:10:00.000Z',
    heartbeatAt: '2030-07-27T00:00:00.000Z',
    attempt: 1,
    startedAt: '2026-07-27T00:00:00.000Z',
    finishedAt: null,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    ...overrides,
  };
}

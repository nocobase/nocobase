/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType } from '@nocobase/resourcer';
import type { Database } from '@nocobase/database';
import { UniqueConstraintError } from '@nocobase/database';
import { vi } from 'vitest';

import { JsTemplateError } from '../../shared/errors';
import type { JsTemplateCreateJob } from '../../shared/types';
import { createJsTemplateProjectsResource } from '../resources/jsTemplateProjects';
import { JsTemplateCreateJobRunner } from '../services/JsTemplateCreateJobRunner';
import type { JsTemplateCreateJobExecutor } from '../services/JsTemplateCreateJobExecutor';
import { JsTemplateCreateJobStore, toCreateJobSummary } from '../services/JsTemplateCreateJobStore';
import type { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import type { JsTemplateCompileService } from '../services/JsTemplateCompileService';

describe('JS Template durable creation jobs', () => {
  it('returns 202 after reservation persistence without compiling in the request', async () => {
    const job = createJobRecord();
    let durableStatus: JsTemplateCreateJob['status'] | 'empty' = 'empty';
    const claimedJob = createJobRecord({
      status: 'running',
      claimToken: 'claim-scanner',
      claimOwner: 'scanner-test',
      leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      heartbeatAt: new Date().toISOString(),
      attempt: 1,
      startedAt: new Date().toISOString(),
    });
    const store = {
      enqueue: vi.fn(async () => {
        durableStatus = 'pending';
        return job;
      }),
      findClaimableIds: vi.fn(async () => (durableStatus === 'pending' ? [job.id] : [])),
      claim: vi.fn(async () => {
        if (durableStatus !== 'pending') {
          return null;
        }
        durableStatus = 'running';
        return claimedJob;
      }),
      succeed: vi.fn(async () => {
        durableStatus = 'succeeded';
        return createJobRecord({ status: 'succeeded', resultProjectId: job.targetProjectId });
      }),
      heartbeat: vi.fn(async () => true),
    } as unknown as JsTemplateCreateJobStore;
    const publish = vi.fn(async () => Promise.reject(new Error('injected queue outage')));
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const executor = {
      execute: vi.fn(async () => job.targetProjectId),
      cleanup: vi.fn(async () => false),
    } as unknown as JsTemplateCreateJobExecutor;
    const runner = new JsTemplateCreateJobRunner(store, executor, {
      applicationName: 'main',
      eventQueue: { subscribe: vi.fn(), unsubscribe: vi.fn(), publish },
      logger,
    });
    const projectService = {
      normalizeCreateMetadata: vi.fn(() => ({
        name: 'Demo',
        normalizedName: 'demo',
        title: null,
        description: null,
      })),
      assertCreateNameAvailable: vi.fn(async () => undefined),
    } as unknown as JsTemplateProjectService;
    const runtimeCompileService = {
      compileCurrentRuntime: vi.fn(),
    } as unknown as JsTemplateCompileService;
    const db = {
      sequelize: {
        transaction: vi.fn(async (run: (transaction: object) => Promise<unknown>) => run({})),
      },
    };
    const resource = createJsTemplateProjectsResource(
      db as never,
      projectService,
      runtimeCompileService,
      store,
      runner,
      'main',
      { recordCreateJobEvent: vi.fn(async () => undefined) } as never,
    );
    const handler = resource.actions?.create as HandlerType;
    const ctx = {
      action: {
        params: {
          resourceName: 'jsTemplateProjects',
          actionName: 'create',
          values: { name: 'Demo' },
        },
      },
      auth: { user: { id: 7 } },
      request: { headers: { 'x-request-id': 'request-1' } },
    };

    await handler(
      ctx as never,
      vi.fn(async () => undefined),
    );

    expect((ctx as { status?: number }).status).toBe(202);
    expect((ctx as { body?: unknown }).body).toEqual(toCreateJobSummary(job));
    expect(store.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationName: 'main',
        actorUserId: '7',
        requestId: 'request-1',
        sourceType: 'starter',
      }),
      expect.anything(),
    );
    expect(publish).toHaveBeenCalledWith('js-template.create-jobs', { jobId: job.id });
    expect(logger.warn).toHaveBeenCalledWith(
      'JS Template create-job wake-up publish failed',
      expect.objectContaining({ jobId: job.id, errorCode: 'Error' }),
    );
    expect(runtimeCompileService.compileCurrentRuntime).not.toHaveBeenCalled();

    await runner.start();
    await vi.waitFor(() => expect(executor.execute).toHaveBeenCalledTimes(1));
    await runner.stop();

    expect(executor.execute).toHaveBeenCalledWith(claimedJob, 'claim-scanner');
    expect(durableStatus).toBe('succeeded');
    await expect(store.findClaimableIds('main')).resolves.toEqual([]);
  });

  it('rejects caller-supplied target repository identifiers before persistence', async () => {
    const store = { enqueue: vi.fn() } as unknown as JsTemplateCreateJobStore;
    const resource = createJsTemplateProjectsResource(
      { sequelize: { transaction: vi.fn() } } as never,
      {
        normalizeCreateMetadata: vi.fn(),
      } as unknown as JsTemplateProjectService,
      {} as JsTemplateCompileService,
      store,
      { publish: vi.fn() } as unknown as JsTemplateCreateJobRunner,
      'main',
      { recordCreateJobEvent: vi.fn(async () => undefined) } as never,
    );
    const ctx = {
      action: { params: { values: { name: 'Demo', targetProjectId: 'jtp_supplied' } } },
    };

    await (resource.actions?.create as HandlerType)(
      ctx as never,
      vi.fn(async () => undefined),
    );

    expect((ctx as { status?: number }).status).toBe(400);
    expect(store.enqueue).not.toHaveBeenCalled();
  });

  it('builds succeeded summaries with result identity and without internal execution fields', () => {
    const summary = toCreateJobSummary(
      createJobRecord({
        status: 'succeeded',
        resultProjectId: 'jtp_target',
        errorReasonCode: 'default-branch-unavailable',
        payload: {
          sourceType: 'git',
          provider: 'git',
          config: { url: 'https://example.test/repo.git' },
          authRef: '{{ $env.SECRET_TOKEN }}',
        },
      }),
    );
    const serialized = JSON.stringify(summary);

    expect(serialized).not.toContain('SECRET_TOKEN');
    expect(summary.resultProjectId).toBe('jtp_target');
    expect(summary.errorReasonCode).toBe('default-branch-unavailable');
    expect(summary).not.toHaveProperty('payload');
    expect(summary).not.toHaveProperty('actorUserId');
    expect(summary).not.toHaveProperty('requestId');
    expect(summary).not.toHaveProperty('claimToken');
    expect(summary).not.toHaveProperty('claimOwner');
    expect(summary).not.toHaveProperty('leaseExpiresAt');
    expect(summary).not.toHaveProperty('heartbeatAt');
  });

  it('maps only the application reservation constraint to a project-name conflict', async () => {
    const create = vi.fn();
    const store = new JsTemplateCreateJobStore({
      getRepository: vi.fn(() => ({ create })),
    } as unknown as Database);
    const input = {
      applicationName: 'main',
      targetProjectId: 'jtp_target',
      name: 'Demo',
      normalizedName: 'demo',
      sourceType: 'starter' as const,
      payload: { sourceType: 'starter' as const, message: 'Initial source' },
    };

    create.mockRejectedValueOnce(
      new UniqueConstraintError({ fields: { jst_create_job_reservation_uq: 'sha256:reservation' } }),
    );
    await expect(store.enqueue(input)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PROJECT_CONFLICT',
      status: 409,
    });

    create.mockRejectedValueOnce(
      new UniqueConstraintError({ fields: { applicationName: 'main', reservationKey: 'sha256:reservation' } }),
    );
    await expect(store.enqueue(input)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PROJECT_CONFLICT',
      status: 409,
    });

    const targetProjectConflict = new UniqueConstraintError({ fields: { targetProjectId: 'jtp_target' } });
    create.mockRejectedValueOnce(targetProjectConflict);
    let caught: unknown;
    try {
      await store.enqueue(input);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBe(targetProjectConflict);
    expect(caught).not.toBeInstanceOf(JsTemplateError);
  });
});

function createJobRecord(overrides: Partial<JsTemplateCreateJob> = {}): JsTemplateCreateJob {
  return {
    id: 'jtcj_demo',
    applicationName: 'main',
    targetProjectId: 'jtp_target',
    name: 'Demo',
    normalizedName: 'demo',
    title: null,
    description: null,
    sourceType: 'starter',
    status: 'pending',
    resultProjectId: null,
    payload: { sourceType: 'starter', message: 'Initial JS Template source' },
    errorCode: null,
    errorMessage: null,
    reservationKey: 'sha256:reservation',
    actorUserId: '7',
    requestId: 'request-1',
    claimToken: null,
    claimOwner: null,
    leaseExpiresAt: null,
    heartbeatAt: null,
    attempt: 0,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    ...overrides,
  };
}

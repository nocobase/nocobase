/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType } from '@nocobase/resourcer';
import type { Database, Model } from '@nocobase/database';
import { UniqueConstraintError } from '@nocobase/database';
import { vi } from 'vitest';

import { JsTemplateError } from '../../shared/errors';
import type { JsTemplateCreateJob } from '../../shared/types';
import { createJsTemplateProjectsResource } from '../resources/jsTemplateProjects';
import type { JsTemplateCreateFromRemoteService } from '../services/JsTemplateCreateFromRemoteService';
import { JsTemplateCreateJobExecutor } from '../services/JsTemplateCreateJobExecutor';
import { JsTemplateCreateJobRunner } from '../services/JsTemplateCreateJobRunner';
import { requireCreateJobAuthorizationContext } from '../resources/resourceAction';
import { JsTemplateCreateJobStore, toCreateJobSummary } from '../services/JsTemplateCreateJobStore';
import type { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import type { JsTemplateCompileService } from '../services/JsTemplateCompileService';

describe('JS Template durable creation jobs', () => {
  it('canonicalizes the persisted union-role set before request hashing', () => {
    expect(
      requireCreateJobAuthorizationContext({
        currentRole: '__union__',
        currentRoles: ['member', 'editor', 'member'],
      }),
    ).toEqual({ authorizationRole: '__union__', authorizationRoles: ['editor', 'member'] });
  });

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
      finalizeSucceededResult: vi.fn(async () => {
        durableStatus = 'succeeded';
        return createJobRecord({ status: 'succeeded', resultProjectId: job.targetProjectId });
      }),
      cleanup: vi.fn(async () => false),
    } as unknown as JsTemplateCreateJobExecutor;
    const runner = new JsTemplateCreateJobRunner(store, executor, {
      applicationName: 'main',
      eventQueue: { subscribe: vi.fn(), unsubscribe: vi.fn(), publish },
      logger,
      authorize: vi.fn(async () => undefined),
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
          values: { idempotencyKey: 'create-demo-1', name: 'Demo' },
        },
      },
      auth: { user: { id: 7 } },
      getBearerToken: () => createUnsignedSessionToken('session-request-1'),
      request: { headers: { 'x-request-id': 'request-1' } },
      state: { currentRole: 'member', currentRoles: ['member'] },
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

    expect(executor.execute).toHaveBeenCalledWith(claimedJob, 'claim-scanner', expect.any(AbortSignal));
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

  it('rejects a caller-supplied application identity for ZIP creation before persistence', async () => {
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
      action: {
        params: {
          values: {
            name: 'Foreign ZIP',
            applicationName: 'support',
            zipBase64: 'UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
          },
        },
      },
    };

    await (resource.actions?.create as HandlerType)(
      ctx as never,
      vi.fn(async () => undefined),
    );

    expect((ctx as { status?: number }).status).toBe(400);
    expect((ctx as { body?: unknown }).body).toMatchObject({
      errors: [{ code: 'JS_TEMPLATE_INVALID_INPUT', status: 400 }],
    });
    expect(store.enqueue).not.toHaveBeenCalled();
  });

  it.each([
    {
      sourceType: 'starter' as const,
      payload: { sourceType: 'starter' as const, message: 'Initial source' },
    },
    {
      sourceType: 'zip' as const,
      payload: {
        sourceType: 'zip' as const,
        message: 'Import source',
        files: [{ path: 'src/client/js-blocks/example/index.tsx', content: 'ctx.render(null);\n' }],
      },
    },
    {
      sourceType: 'git' as const,
      payload: {
        sourceType: 'git' as const,
        provider: 'git' as const,
        config: { url: 'https://support.example.test/secret.git' },
        authRef: null,
      },
    },
  ])(
    'rejects a foreign-application $sourceType job before reading or persisting source',
    async ({ sourceType, payload }) => {
      const findInternalProjectById = vi.fn();
      const projectService = {
        getCurrentApplicationName: vi.fn(() => 'main'),
        findInternalProjectById,
      } as unknown as JsTemplateProjectService;
      const runtimeCompileService = {
        compileCurrentRuntime: vi.fn(),
      } as unknown as JsTemplateCompileService;
      const createFromRemote = vi.fn();
      const createFromRemoteService = {
        create: createFromRemote,
      } as unknown as JsTemplateCreateFromRemoteService;
      const store = {
        assertCurrentClaim: vi.fn(),
      } as unknown as JsTemplateCreateJobStore;
      const executor = new JsTemplateCreateJobExecutor(
        {} as Database,
        projectService,
        runtimeCompileService,
        createFromRemoteService,
        store,
        vi.fn(async () => undefined),
      );
      const job = createJobRecord({
        id: `jtcj_foreign_${sourceType}`,
        applicationName: 'support',
        sourceType,
        payload,
        status: 'running',
      });

      await expect(executor.execute(job, 'claim-foreign')).rejects.toMatchObject({
        code: 'JS_TEMPLATE_CREATE_JOB_NOT_FOUND',
        status: 404,
        message: `JS Template creation job "${job.id}" was not found`,
      });
      expect(findInternalProjectById).not.toHaveBeenCalled();
      expect(runtimeCompileService.compileCurrentRuntime).not.toHaveBeenCalled();
      expect(createFromRemote).not.toHaveBeenCalled();
      expect(store.assertCurrentClaim).not.toHaveBeenCalled();
    },
  );

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
    const findOrCreate = vi.fn();
    const store = new JsTemplateCreateJobStore({
      getRepository: vi.fn(() => ({
        model: { findOrCreate },
        findOne: vi.fn(async () => null),
      })),
    } as unknown as Database);
    const input = {
      applicationName: 'main',
      targetProjectId: 'jtp_target',
      name: 'Demo',
      normalizedName: 'demo',
      sourceType: 'starter' as const,
      payload: { sourceType: 'starter' as const, message: 'Initial source' },
      idempotencyKey: 'create-demo-1',
      requestHash: 'request-hash-demo',
      actorUserId: '7',
      sessionId: 'session-request-1',
      authorizationRole: 'member',
      authorizationRoles: ['member'],
    };

    findOrCreate.mockRejectedValueOnce(
      new UniqueConstraintError({ fields: { jst_create_job_reservation_uq: 'sha256:reservation' } }),
    );
    await expect(store.enqueue(input)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PROJECT_CONFLICT',
      status: 409,
    });

    findOrCreate.mockRejectedValueOnce(
      new UniqueConstraintError({ fields: { applicationName: 'main', reservationKey: 'sha256:reservation' } }),
    );
    await expect(store.enqueue(input)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PROJECT_CONFLICT',
      status: 409,
    });

    const targetProjectConflict = new UniqueConstraintError({ fields: { targetProjectId: 'jtp_target' } });
    findOrCreate.mockRejectedValueOnce(targetProjectConflict);
    let caught: unknown;
    try {
      await store.enqueue(input);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBe(targetProjectConflict);
    expect(caught).not.toBeInstanceOf(JsTemplateError);
  });

  it('replays the same request only inside its actor session and revives soft-hidden history', async () => {
    const repository = createInMemoryCreateJobRepository();
    const store = new JsTemplateCreateJobStore({
      getRepository: vi.fn(() => repository),
    } as unknown as Database);
    const input = createStoreInput();

    const [first, replay] = await Promise.all([store.enqueue(input), store.enqueue(input)]);
    expect(replay.id).toBe(first.id);
    expect(repository.model.findOrCreate).toHaveBeenCalledTimes(2);

    await repository.records.get(createIdempotencyScope(input))?.update({ dismissed: true });
    const revived = await store.enqueue(input);
    expect(revived.id).toBe(first.id);
    expect(revived.dismissed).toBe(false);

    const nextSession = await store.enqueue({
      ...input,
      targetProjectId: 'jtp_target_session_2',
      name: 'Demo Session Two',
      normalizedName: 'demo-session-two',
      requestHash: 'request-hash-demo-session-two',
      sessionId: 'session-request-2',
    });
    expect(nextSession.id).not.toBe(first.id);
    expect(repository.records).toHaveLength(2);
  });

  it('rejects a reused session idempotency key when the request hash changes', async () => {
    const repository = createInMemoryCreateJobRepository();
    const store = new JsTemplateCreateJobStore({
      getRepository: vi.fn(() => repository),
    } as unknown as Database);
    const input = createStoreInput();
    await store.enqueue(input);

    await expect(store.enqueue({ ...input, requestHash: 'different-request-hash' })).rejects.toMatchObject({
      code: 'JS_TEMPLATE_IDEMPOTENCY_CONFLICT',
      status: 409,
    });
    expect(repository.records).toHaveLength(1);
  });

  it('lets only one concurrent name reservation win across different idempotency keys', async () => {
    const repository = createInMemoryCreateJobRepository();
    const store = new JsTemplateCreateJobStore({
      getRepository: vi.fn(() => repository),
    } as unknown as Database);
    const first = createStoreInput();
    const second = {
      ...first,
      targetProjectId: 'jtp_target_second_key',
      idempotencyKey: 'create-demo-2',
      requestHash: 'request-hash-demo-2',
    };

    const results = await Promise.allSettled([store.enqueue(first), store.enqueue(second)]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toEqual([
      expect.objectContaining({
        reason: expect.objectContaining({ code: 'JS_TEMPLATE_PROJECT_CONFLICT', status: 409 }),
      }),
    ]);
    expect(repository.records).toHaveLength(1);
  });
});

function createStoreInput() {
  return {
    applicationName: 'main',
    targetProjectId: 'jtp_target',
    name: 'Demo',
    normalizedName: 'demo',
    sourceType: 'starter' as const,
    payload: { sourceType: 'starter' as const, message: 'Initial source' },
    idempotencyKey: 'create-demo-1',
    requestHash: 'request-hash-demo',
    actorUserId: '7',
    sessionId: 'session-request-1',
    authorizationRole: 'member',
    authorizationRoles: ['member'],
  };
}

function createIdempotencyScope(input: ReturnType<typeof createStoreInput>): string {
  return [input.applicationName, input.actorUserId, input.sessionId, input.idempotencyKey].join('\0');
}

function createInMemoryCreateJobRepository() {
  const records = new Map<string, Model>();
  const reservationScopes = new Set<string>();
  let sequence = 0;
  const findOne = vi.fn(async ({ filter }: { filter: Record<string, unknown> }) => {
    const scope = [filter.applicationName, filter.actorUserId, filter.sessionId, filter.idempotencyKey].join('\0');
    return records.get(scope) || null;
  });
  const findOrCreate = vi.fn(
    async ({ where, defaults }: { where: Record<string, unknown>; defaults: Record<string, unknown> }) => {
      const scope = [where.applicationName, where.actorUserId, where.sessionId, where.idempotencyKey].join('\0');
      const existing = records.get(scope);
      if (existing) {
        return [existing, false] as const;
      }
      const reservationScope = [defaults.applicationName, defaults.normalizedName].join('\0');
      if (reservationScopes.has(reservationScope)) {
        throw new UniqueConstraintError({
          fields: { applicationName: defaults.applicationName, reservationKey: defaults.reservationKey },
        });
      }
      sequence += 1;
      const record = createStoreModel({
        id: `jtcj_memory_${sequence}`,
        ...defaults,
        createdAt: new Date(`2026-08-13T00:00:0${sequence}.000Z`),
        updatedAt: new Date(`2026-08-13T00:00:0${sequence}.000Z`),
      });
      records.set(scope, record);
      reservationScopes.add(reservationScope);
      return [record, true] as const;
    },
  );
  return {
    records,
    findOne,
    model: { findOrCreate },
  };
}

function createStoreModel(initialValues: Record<string, unknown>): Model {
  const values = { ...initialValues };
  return {
    get: (key: string) => values[key],
    update: vi.fn(async (nextValues: Record<string, unknown>) => {
      Object.assign(values, nextValues, { updatedAt: new Date('2026-08-13T00:01:00.000Z') });
      return undefined;
    }),
  } as unknown as Model;
}

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
    idempotencyKey: 'create-demo-1',
    requestHash: 'request-hash-demo',
    status: 'pending',
    resultProjectId: null,
    payload: { sourceType: 'starter', message: 'Initial JS Template source' },
    errorCode: null,
    errorMessage: null,
    reservationKey: 'sha256:reservation',
    actorUserId: '7',
    sessionId: 'session-request-1',
    authorizationRole: 'member',
    authorizationRoles: ['member'],
    dismissed: false,
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

function createUnsignedSessionToken(jti: string): string {
  const payload = Buffer.from(JSON.stringify({ jti })).toString('base64url');
  return `header.${payload}.signature`;
}

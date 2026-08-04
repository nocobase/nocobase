/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType } from '@nocobase/resourcer';
import { vi } from 'vitest';

import type { JsTemplateCreateJob } from '../../shared/types';
import { createJsTemplateProjectsResource } from '../resources/jsTemplateProjects';
import type { JsTemplateCreateJobRunner } from '../services/JsTemplateCreateJobRunner';
import type { JsTemplateCreateJobStore } from '../services/JsTemplateCreateJobStore';
import { toCreateJobSummary } from '../services/JsTemplateCreateJobStore';
import type { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import type { JsTemplateCompileService } from '../services/JsTemplateCompileService';

describe('JS Template durable creation jobs', () => {
  it('returns 202 after reservation persistence without compiling in the request', async () => {
    const job = createJobRecord();
    const store = {
      enqueue: vi.fn(async () => job),
    } as unknown as JsTemplateCreateJobStore;
    const runner = {
      publish: vi.fn(async () => undefined),
    } as unknown as JsTemplateCreateJobRunner;
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
    expect(runner.publish).toHaveBeenCalledWith(job.id);
    expect(runtimeCompileService.compileCurrentRuntime).not.toHaveBeenCalled();
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

  it('builds summaries without payload, auth, or actor fields', () => {
    const summary = toCreateJobSummary(
      createJobRecord({
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
    expect(summary.errorReasonCode).toBe('default-branch-unavailable');
    expect(summary).not.toHaveProperty('payload');
    expect(summary).not.toHaveProperty('actorUserId');
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
    payload: { sourceType: 'starter', message: 'Initial JS Template source' },
    errorCode: null,
    errorMessage: null,
    reservationKey: 'sha256:reservation',
    actorUserId: '7',
    requestId: 'request-1',
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    ...overrides,
  };
}

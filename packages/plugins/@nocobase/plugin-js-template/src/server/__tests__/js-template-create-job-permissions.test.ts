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

import { JsTemplateError } from '../../shared/errors';
import { createJsTemplateCreateJobsResource } from '../resources/jsTemplateCreateJobs';
import type { JsTemplateCreateJobStore } from '../services/JsTemplateCreateJobStore';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';

describe('JS Template create-job permissions', () => {
  it('lists jobs when the resourcer includes routing metadata in action params', async () => {
    const store = {
      listOwnVisibleJobs: vi.fn(async () => []),
    } as unknown as JsTemplateCreateJobStore;
    const resource = createJsTemplateCreateJobsResource({
      store,
      permissionService: new JsTemplatePermissionService({} as never),
      applicationName: 'main',
      auditService: { recordCreateJobEvent: vi.fn(async () => undefined) } as never,
    });
    const ctx = {
      action: {
        params: {
          resourceName: 'jsTemplateCreateJobs',
          actionName: 'list',
          values: {},
        },
      },
      auth: { user: { id: 7 } },
      getBearerToken: () => createUnsignedSessionToken('session-7'),
    };

    await (resource.actions?.list as HandlerType)(
      ctx as never,
      vi.fn(async () => undefined),
    );

    expect(store.listOwnVisibleJobs).toHaveBeenCalledWith('main', '7', 'session-7');
    expect((ctx as { body?: unknown }).body).toEqual({ jobs: [] });
  });

  it.each(['create', 'manageSyncSource', 'pullFromSyncSource'] as const)(
    'denies dismissing a Git failure when %s permission is missing',
    async (missingPermission) => {
      const job = {
        id: 'jtcj_git',
        applicationName: 'main',
        actorUserId: '7',
        sourceType: 'git',
      };
      const store = {
        getOwn: vi.fn(async () => job),
        dismiss: vi.fn(),
      } as unknown as JsTemplateCreateJobStore;
      const permissionService = new JsTemplatePermissionService({} as never);
      const resource = createJsTemplateCreateJobsResource({
        store,
        permissionService,
        applicationName: 'main',
        auditService: { recordCreateJobEvent: vi.fn(async () => undefined) } as never,
      });
      const allowed = ['create', 'manageSyncSource', 'pullFromSyncSource'].filter(
        (action) => action !== missingPermission,
      );
      const ctx = {
        action: { params: { values: { jobId: job.id } } },
        auth: { user: { id: 7 } },
        getBearerToken: () => createUnsignedSessionToken('session-7'),
        can: ({ action }: { action: string }) => (allowed.includes(action) ? {} : null),
      };

      await (resource.actions?.dismiss as HandlerType)(
        ctx as never,
        vi.fn(async () => undefined),
      );

      expect((ctx as { status?: number }).status).toBe(403);
      expect(store.dismiss).not.toHaveBeenCalled();
    },
  );

  it.each(['missing', 'pruned', 'owned by another actor', 'owned by another application'])(
    'returns the same public 404 for a creation job that is %s',
    async () => {
      const jobId = 'jtcj_hidden';
      const store = {
        getOwn: vi.fn(async () => {
          throw new JsTemplateError(
            'JS_TEMPLATE_CREATE_JOB_NOT_FOUND',
            `JS Template creation job "${jobId}" was not found`,
          );
        }),
        dismiss: vi.fn(),
      } as unknown as JsTemplateCreateJobStore;
      const audit = { recordCreateJobEvent: vi.fn(async () => undefined) };
      const resource = createJsTemplateCreateJobsResource({
        store,
        permissionService: new JsTemplatePermissionService({} as never),
        applicationName: 'main',
        auditService: audit as never,
      });
      const can = vi.fn(() => ({}));
      const ctx = {
        action: {
          params: {
            resourceName: 'jsTemplateCreateJobs',
            actionName: 'dismiss',
            values: { jobId },
          },
        },
        auth: { user: { id: 7 } },
        getBearerToken: () => createUnsignedSessionToken('session-7'),
        can,
      };
      const next = vi.fn(async () => undefined);

      await (resource.actions?.dismiss as HandlerType)(ctx as never, next);

      expect((ctx as { status?: number }).status).toBe(404);
      expect((ctx as { withoutDataWrapping?: boolean }).withoutDataWrapping).toBe(true);
      expect((ctx as { body?: unknown }).body).toMatchObject({
        errors: [
          {
            code: 'JS_TEMPLATE_CREATE_JOB_NOT_FOUND',
            message: `JS Template creation job "${jobId}" was not found`,
            status: 404,
          },
        ],
      });
      expect(JSON.stringify((ctx as { body?: unknown }).body)).not.toMatch(
        /actorUserId|applicationName|targetProjectId|sourceType|payload|errorMessage/u,
      );
      expect(store.getOwn).toHaveBeenCalledWith(jobId, 'main', '7', 'session-7');
      expect(store.dismiss).not.toHaveBeenCalled();
      expect(can).not.toHaveBeenCalled();
      expect(audit.recordCreateJobEvent).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    },
  );
});

function createUnsignedSessionToken(jti: string): string {
  const payload = Buffer.from(JSON.stringify({ jti })).toString('base64url');
  return `header.${payload}.signature`;
}

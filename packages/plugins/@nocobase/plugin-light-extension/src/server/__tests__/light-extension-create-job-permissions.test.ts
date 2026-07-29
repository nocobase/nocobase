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

import { createLightExtensionCreateJobsResource } from '../resources/lightExtensionCreateJobs';
import type { LightExtensionCreateJobStore } from '../services/LightExtensionCreateJobStore';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';

describe('light extension create-job permissions', () => {
  it('lists jobs when the resourcer includes routing metadata in action params', async () => {
    const store = {
      listOwnVisibleJobs: vi.fn(async () => []),
    } as unknown as LightExtensionCreateJobStore;
    const resource = createLightExtensionCreateJobsResource({
      store,
      permissionService: new LightExtensionPermissionService({} as never),
      applicationName: 'main',
      auditService: { recordCreateJobEvent: vi.fn(async () => undefined) } as never,
    });
    const ctx = {
      action: {
        params: {
          resourceName: 'lightExtensionCreateJobs',
          actionName: 'list',
          values: {},
        },
      },
      auth: { user: { id: 7 } },
    };

    await (resource.actions?.list as HandlerType)(
      ctx as never,
      vi.fn(async () => undefined),
    );

    expect(store.listOwnVisibleJobs).toHaveBeenCalledWith('main', '7');
    expect((ctx as { body?: unknown }).body).toEqual({ jobs: [] });
  });

  it.each(['create', 'manageSyncSource', 'pullFromSyncSource'] as const)(
    'denies dismissing a Git failure when %s permission is missing',
    async (missingPermission) => {
      const job = {
        id: 'lecj_git',
        applicationName: 'main',
        actorUserId: '7',
        sourceType: 'git',
      };
      const store = {
        getOwn: vi.fn(async () => job),
        dismiss: vi.fn(),
      } as unknown as LightExtensionCreateJobStore;
      const permissionService = new LightExtensionPermissionService({} as never);
      const resource = createLightExtensionCreateJobsResource({
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

  it('does not reveal whether another actor owns a requested job', async () => {
    const store = {
      getOwn: vi.fn(async () => {
        throw new Error('lookup should stay scoped');
      }),
      dismiss: vi.fn(),
    } as unknown as LightExtensionCreateJobStore;
    const resource = createLightExtensionCreateJobsResource({
      store,
      permissionService: new LightExtensionPermissionService({} as never),
      applicationName: 'main',
      auditService: { recordCreateJobEvent: vi.fn(async () => undefined) } as never,
    });
    const ctx = {
      action: {
        params: {
          resourceName: 'lightExtensionCreateJobs',
          actionName: 'dismiss',
          values: { jobId: 'lecj_other_actor' },
        },
      },
      auth: { user: { id: 7 } },
      can: vi.fn(() => ({})),
    };

    await expect(
      (resource.actions?.dismiss as HandlerType)(
        ctx as never,
        vi.fn(async () => undefined),
      ),
    ).rejects.toThrow('lookup should stay scoped');
    expect(store.getOwn).toHaveBeenCalledWith('lecj_other_actor', 'main', '7');
    expect(store.dismiss).not.toHaveBeenCalled();
  });
});

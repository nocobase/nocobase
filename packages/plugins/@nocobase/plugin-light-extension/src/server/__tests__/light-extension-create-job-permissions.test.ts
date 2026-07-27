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
import type { LightExtensionCreateJobRunner } from '../services/LightExtensionCreateJobRunner';
import type { LightExtensionCreateJobStore } from '../services/LightExtensionCreateJobStore';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';

describe('light extension create-job permissions', () => {
  it.each(['create', 'manageSyncSource', 'pullFromSyncSource'] as const)(
    'denies Git retry when %s permission is missing before queueing work',
    async (missingPermission) => {
      const job = {
        id: 'lecj_git',
        applicationName: 'main',
        actorUserId: '7',
        sourceType: 'git',
      };
      const store = {
        getOwn: vi.fn(async () => job),
        retry: vi.fn(),
      } as unknown as LightExtensionCreateJobStore;
      const runner = { scheduleWake: vi.fn() } as unknown as LightExtensionCreateJobRunner;
      const permissionService = new LightExtensionPermissionService({} as never);
      const resource = createLightExtensionCreateJobsResource({
        store,
        runner,
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

      await (resource.actions?.retry as HandlerType)(
        ctx as never,
        vi.fn(async () => undefined),
      );

      expect((ctx as { status?: number }).status).toBe(403);
      expect(store.retry).not.toHaveBeenCalled();
      expect(runner.scheduleWake).not.toHaveBeenCalled();
    },
  );

  it('does not reveal whether another actor owns a requested job', async () => {
    const store = {
      getOwn: vi.fn(async () => {
        throw new Error('lookup should stay scoped');
      }),
      retry: vi.fn(),
    } as unknown as LightExtensionCreateJobStore;
    const resource = createLightExtensionCreateJobsResource({
      store,
      runner: { scheduleWake: vi.fn() } as unknown as LightExtensionCreateJobRunner,
      permissionService: new LightExtensionPermissionService({} as never),
      applicationName: 'main',
      auditService: { recordCreateJobEvent: vi.fn(async () => undefined) } as never,
    });
    const ctx = {
      action: { params: { values: { jobId: 'lecj_other_actor' } } },
      auth: { user: { id: 7 } },
      can: vi.fn(() => ({})),
    };

    await expect(
      (resource.actions?.retry as HandlerType)(
        ctx as never,
        vi.fn(async () => undefined),
      ),
    ).rejects.toThrow('lookup should stay scoped');
    expect(store.getOwn).toHaveBeenCalledWith('lecj_other_actor', 'main', '7');
    expect(store.retry).not.toHaveBeenCalled();
  });
});

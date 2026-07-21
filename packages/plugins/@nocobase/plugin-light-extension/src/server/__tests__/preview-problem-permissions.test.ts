/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType } from '@nocobase/resourcer';
import { describe, expect, it, vi } from 'vitest';

import { createLightExtensionPreviewProblemsResource } from '../resources/lightExtensionPreviewProblems';
import type { LightExtensionPreviewProblemService } from '../services/LightExtensionPreviewProblemService';

describe('lightExtensionPreviewProblems resource permissions', () => {
  it('derives user and role identity from the request context and ignores forged transport identity', async () => {
    const open = vi.fn(async () => ({ schemaVersion: 1 }));
    const resource = createLightExtensionPreviewProblemsResource({
      open,
    } as unknown as LightExtensionPreviewProblemService);
    const action = resource.actions?.open as HandlerType;
    const ctx = {
      action: {
        params: {
          values: {
            repoId: 'repo_1',
            entryId: 'entry_1',
            ownerLocator: {
              kind: 'flowModel.pageSettings',
              modelUid: 'page_1',
              use: 'JSPageModel',
              stepPath: ['stepParams', 'jsSettings', 'runJs'],
            },
            snapshotId: 'snapshot_1',
            artifactHash: 'a'.repeat(64),
            actorUserId: 'forged-user',
            roleNames: ['forged-role'],
          },
        },
      },
      auth: { user: { id: 7 } },
      state: { currentRoles: ['member', 'auditor'] },
    };

    await action(ctx as never, async () => undefined);

    expect(open).toHaveBeenCalledWith(expect.objectContaining({ repoId: 'repo_1', entryId: 'entry_1' }), {
      actorUserId: '7',
      roleNames: ['member', 'auditor'],
    });
    expect(open.mock.calls[0][0]).not.toHaveProperty('actorUserId');
    expect(open.mock.calls[0][0]).not.toHaveProperty('roleNames');
  });

  it('normalizes cursor polling and close states while rejecting invalid close states', async () => {
    const list = vi.fn(async () => ({ schemaVersion: 1 }));
    const close = vi.fn(async () => ({ schemaVersion: 1 }));
    const resource = createLightExtensionPreviewProblemsResource({
      list,
      close,
    } as unknown as LightExtensionPreviewProblemService);
    const baseValues = {
      sessionId: 'preview:1',
      repoId: 'repo_1',
      entryId: 'entry_1',
      ownerLocator: {
        kind: 'flowModel.pageSettings',
        modelUid: 'page_1',
        use: 'JSPageModel',
        stepPath: ['stepParams', 'jsSettings', 'runJs'],
      },
      snapshotId: 'snapshot_1',
      artifactHash: 'a'.repeat(64),
      executionId: 'execution:1',
    };
    const createContext = (values: Record<string, unknown>) =>
      ({
        action: { params: { values } },
        auth: { user: { id: 'user_1' } },
        state: { currentRole: 'member' },
      }) as never;

    await (resource.actions?.list as HandlerType)(createContext({ ...baseValues, cursor: 12 }), async () => undefined);
    await (resource.actions?.close as HandlerType)(
      createContext({ ...baseValues, state: 'stale' }),
      async () => undefined,
    );

    expect(list).toHaveBeenCalledWith(expect.objectContaining({ cursor: 12 }), {
      actorUserId: 'user_1',
      roleNames: ['member'],
    });
    expect(close).toHaveBeenCalledWith(expect.objectContaining({ state: 'stale' }), {
      actorUserId: 'user_1',
      roleNames: ['member'],
    });

    const invalidContext = createContext({ ...baseValues, state: 'active' }) as {
      status?: number;
      body?: unknown;
    };
    await (resource.actions?.close as HandlerType)(invalidContext as never, async () => undefined);
    expect(invalidContext).toMatchObject({
      status: 400,
      body: { errors: [{ code: 'LIGHT_EXTENSION_INVALID_INPUT' }] },
    });
  });
});

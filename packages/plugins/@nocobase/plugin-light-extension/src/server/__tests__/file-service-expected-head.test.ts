/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import { VscPermissionHookRegistry } from '@nocobase/plugin-vsc-file';
import { describe, expect, it, vi } from 'vitest';

import { LightExtensionFileService } from '../services/LightExtensionFileService';

describe('LightExtensionFileService expected Head', () => {
  it('rejects a stale Head after locking and before reading or writing source', async () => {
    const transaction = { id: 'tx_stale' } as unknown as Transaction;
    const repo = {
      id: 'ler_sales',
      vscRepoId: 'vsc_sales',
      name: 'sales',
      normalizedName: 'sales',
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: 'commit_2',
    };
    const lockInternalRepoForUpdate = vi.fn(async () => repo);
    const recordFileWrite = vi.fn(async () => undefined);
    const db = {
      getRepository: vi.fn(() => ({ findOne: vi.fn(async () => ({ id: repo.id })) })),
    } as unknown as Database;
    const repoService = {
      lockInternalRepoForUpdate,
      useVscPermissionHookRegistry: vi.fn(),
    };
    const service = new LightExtensionFileService(
      db,
      { recordFileWrite } as never,
      {} as never,
      repoService as never,
      new VscPermissionHookRegistry(),
    );
    const pullInternal = vi.fn();
    Object.assign(service, { pullInternal });

    await expect(
      service.push(
        {
          repoId: repo.id,
          expectedHeadCommitId: 'commit_1',
          message: 'stale save',
          files: [{ path: 'README.md', content: '# stale\n' }],
        },
        { transaction, requestId: 'req_stale' },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_OUTDATED',
      status: 409,
      details: {
        repoId: repo.id,
        expectedHeadCommitId: 'commit_1',
        currentHeadCommitId: 'commit_2',
      },
    });

    expect(lockInternalRepoForUpdate).toHaveBeenCalledWith(repo.id, expect.objectContaining({ transaction }));
    expect(pullInternal).not.toHaveBeenCalled();
    expect(recordFileWrite).toHaveBeenCalledWith(
      expect.objectContaining({ result: 'blocked', reasonCode: 'LIGHT_EXTENSION_SOURCE_OUTDATED' }),
    );
  });
});

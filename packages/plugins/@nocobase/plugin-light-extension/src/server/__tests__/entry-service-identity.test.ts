/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import { describe, expect, it, vi } from 'vitest';

import type { LightExtensionRepoRecord } from '../../shared/types';
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';

describe('LightExtensionEntryService stable source identity', () => {
  it('reuses the existing entryId when a keyed entry moves to another directory', async () => {
    const values = new Map<string, unknown>([
      ['id', 'lee_stable_sales'],
      ['repoId', 'ler_sales'],
      ['target', 'client'],
      ['kind', 'js-block'],
      ['entryName', 'stable-sales'],
      ['entryPath', 'src/client/js-blocks/old-directory/index.tsx'],
      ['descriptorPath', 'src/client/js-blocks/old-directory/entry.json'],
      ['healthStatus', 'ready'],
    ]);
    const entryModel = {
      get: (key: string) => values.get(key),
      update: vi.fn(async (nextValues: Record<string, unknown>) => {
        Object.entries(nextValues).forEach(([key, value]) => values.set(key, value));
      }),
    };
    const create = vi.fn();
    const entriesRepository = {
      findOne: vi.fn(async (options: { filter?: Record<string, unknown> }) =>
        options.filter?.entryName === 'stable-sales' ? entryModel : null,
      ),
      find: vi.fn(async () => [entryModel]),
      create,
    };
    const transaction = { id: 'tx_entry_identity' } as unknown as Transaction;
    const db = {
      sequelize: {
        transaction: (run: (transaction: Transaction) => Promise<unknown>) => run(transaction),
      },
      getRepository: (name: string) => {
        if (name !== 'lightExtensionEntries') {
          throw new Error(`Unexpected repository: ${name}`);
        }
        return entriesRepository;
      },
    } as unknown as Database;
    const repo: LightExtensionRepoRecord = {
      id: 'ler_sales',
      name: 'sales',
      normalizedName: 'sales',
      title: 'Sales',
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: 'commit_2',
    };
    const service = new LightExtensionEntryService(
      db,
      {
        pull: vi.fn(async () => ({
          repo,
          commit: { id: 'commit_2' },
          tree: null,
          unchanged: false,
          files: [
            {
              path: 'src/client/js-blocks/new-directory/index.tsx',
              content: 'ctx.render(<div>Sales</div>);\n',
            },
            {
              path: 'src/client/js-blocks/new-directory/entry.json',
              content: '{"schemaVersion":1,"key":"stable-sales","title":"Sales"}',
            },
          ],
        })),
      } as never,
      {
        lockInternalRepoForUpdate: vi.fn(),
        getRepo: vi.fn(async () => repo),
      } as never,
    );

    const result = await service.prepareEntries(repo.id);

    expect(create).not.toHaveBeenCalled();
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({
      id: 'lee_stable_sales',
      entryName: 'stable-sales',
      entryPath: 'src/client/js-blocks/new-directory/index.tsx',
      descriptorPath: 'src/client/js-blocks/new-directory/entry.json',
      healthStatus: 'ready',
    });
    expect(entryModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        entryPath: 'src/client/js-blocks/new-directory/index.tsx',
        descriptorPath: 'src/client/js-blocks/new-directory/entry.json',
      }),
      expect.objectContaining({ transaction }),
    );
    expect(entryModel.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        entryName: 'stable-sales',
        healthStatus: 'ready',
      }),
      expect.anything(),
    );
  });
});

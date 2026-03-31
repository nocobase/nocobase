/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getTreePath } from '../commands/sync-path';

describe('getTreePath - missing node due to partial cache', () => {
  it('should not lose the current node when hitting partial cache', async () => {
    // Tree structure: 1 > 2 > 3 > 4
    const models = {
      1: { id: 1, parentId: null },
      2: { id: 2, parentId: 1 },
      3: { id: 3, parentId: 2 },
      4: { id: 4, parentId: 3 },
    };

    // Mock path cache (simulate DB path table): only 1 and 2 cached
    const pathCache = {
      1: '/1',
      2: '/1/2',
      // 3 is not cached
    };

    const getRepositoryMock = vi.fn((collection) => {
      return {
        findOne: vi.fn(async ({ filter }) => {
          const id = filter.id || filter.nodePk;
          const model = models[id];
          if (!model) return null;

          if (collection === 'tree') {
            return {
              get: (field) => model[field],
            };
          }

          if (collection === 'tree_path') {
            if (pathCache[id]) {
              return { path: pathCache[id] };
            }
            return null;
          }

          return null;
        }),
        chunk: vi.fn(),
        destroy: vi.fn(),
      };
    });

    const mockDb: any = {
      getRepository: getRepositoryMock,
      getCollection: vi.fn(() => ({
        getField: vi.fn(() => ({
          columnName: () => 'nodePk',
        })),
      })),
    };

    const result = await getTreePath(mockDb, { get: (field) => models[4][field] } as any, '/4', 'tree', 'tree_path');

    // ❌ broken version would return '/1/2/3'
    // ✅ fixed version should return '/1/2/3/4'
    expect(result).toBe('/1/2/3/4');
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parseVariables } from '../../middlewares/parse-variables';

describe('parse variables middleware', () => {
  it('should resolve field from rest-api collection manager when ctx.database is missing', async () => {
    const getField = vi.fn(() => undefined);
    const getCollection = vi.fn(() => ({
      getField,
    }));

    const ctx: any = {
      action: {
        resourceName: 'tasks',
        params: {
          filter: {
            start_date: {
              $dateOn: {
                type: 'today',
              },
            },
          },
        },
      },
      state: {},
      get: (key: string) => (key === 'x-timezone' ? '+08:00' : ''),
      dataSource: {
        collectionManager: {
          getCollection,
        },
      },
      db: {
        getFieldByPath: vi.fn(() => {
          throw new Error('should not fallback to ctx.db for rest-api data source');
        }),
      },
    };

    const next = vi.fn(async () => {});
    await parseVariables(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(getCollection).toHaveBeenCalledWith('tasks');
    expect(getField).toHaveBeenCalledWith('start_date');
    const parsed = ctx.action.params.filter.start_date.$dateOn;
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(4);
    expect(typeof parsed[0]).toBe('string');
    expect(typeof parsed[1]).toBe('string');
    expect(['[]', '[)']).toContain(parsed[2]);
    expect(parsed[3]).toBe('+08:00');
  });
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { AIContextDatasourceManager } from '../manager/ai-context-datasource-manager';

describe('AIContextDatasourceManager', () => {
  it('should serialize datetime-like values before returning query records', async () => {
    const repository = {
      find: vi.fn().mockResolvedValue([
        {
          order_time: new Date('2026-04-10T12:35:11.627Z'),
        },
      ]),
      count: vi.fn().mockResolvedValue(1),
    };
    const collection = {
      repository,
      getField: vi.fn().mockReturnValue({
        options: {
          name: 'order_time',
          type: 'datetimeTz',
        },
      }),
    };
    const ds = {
      acl: {
        allowManager: {
          isAllowed: vi.fn().mockResolvedValue(true),
        },
      },
      collectionManager: {
        getCollection: vi.fn().mockReturnValue(collection),
      },
    };
    const plugin = {
      app: {
        dataSourceManager: {
          get: vi.fn().mockReturnValue(ds),
        },
      },
      log: {
        warn: vi.fn(),
      },
    };

    const manager = new AIContextDatasourceManager(plugin as any);
    const result = await manager.query(
      {} as any,
      {
        datasource: 'service_en',
        collectionName: 'orders',
        fields: ['order_time'],
        filter: {},
        sort: [],
        limit: 10,
        offset: 0,
      } as any,
    );

    expect(result?.records).toEqual([
      [
        {
          name: 'order_time',
          type: 'datetimeTz',
          value: '2026-04-10T12:35:11.627Z',
        },
      ],
    ]);
  });
});

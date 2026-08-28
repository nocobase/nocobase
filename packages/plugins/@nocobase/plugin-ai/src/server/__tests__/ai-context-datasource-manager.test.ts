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

  it('should query appended associations and serialize dotted relation fields', async () => {
    const repository = {
      find: vi.fn().mockResolvedValue([
        {
          title: 'Open task',
          due_date: '2026-07-20',
          related_item: {
            display_name: 'Related item',
          },
          assigned_user: {
            nickname: 'User Alpha',
          },
        },
      ]),
      count: vi.fn().mockResolvedValue(1),
    };
    const relatedItemCollection = {
      getField: vi.fn().mockReturnValue({
        options: {
          name: 'display_name',
          type: 'string',
        },
      }),
    };
    const assignedUserCollection = {
      getField: vi.fn().mockReturnValue({
        options: {
          name: 'nickname',
          type: 'string',
        },
      }),
    };
    const collection = {
      repository,
      getField: vi.fn((name: string) => {
        const fields = {
          title: {
            options: {
              name: 'title',
              type: 'string',
            },
          },
          due_date: {
            options: {
              name: 'due_date',
              type: 'dateOnly',
            },
          },
          related_item: {
            options: {
              name: 'related_item',
              type: 'belongsTo',
            },
            isRelationField: () => true,
            targetCollection: () => relatedItemCollection,
          },
          assigned_user: {
            options: {
              name: 'assigned_user',
              type: 'belongsTo',
            },
            isRelationField: () => true,
            targetCollection: () => assignedUserCollection,
          },
        };
        return fields[name];
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
        datasource: 'main',
        collectionName: 'task_items',
        fields: ['title', 'due_date', 'related_item.display_name', 'assigned_user.nickname'],
        appends: ['related_item', 'assigned_user'],
        filter: {
          status: {
            $eq: 'open',
          },
        },
        sort: ['due_date'],
        limit: 1,
        offset: 0,
      } as any,
    );

    expect(repository.find).toHaveBeenCalledWith({
      fields: ['title', 'due_date', 'related_item.display_name', 'assigned_user.nickname'],
      appends: ['related_item', 'assigned_user'],
      filter: {
        status: {
          $eq: 'open',
        },
      },
      sort: ['due_date'],
      offset: 0,
      limit: 1,
    });
    expect(result?.records).toEqual([
      [
        {
          name: 'title',
          type: 'string',
          value: 'Open task',
        },
        {
          name: 'due_date',
          type: 'dateOnly',
          value: '2026-07-20',
        },
        {
          name: 'related_item.display_name',
          type: 'string',
          value: 'Related item',
        },
        {
          name: 'assigned_user.nickname',
          type: 'string',
          value: 'User Alpha',
        },
      ],
    ]);
  });
});

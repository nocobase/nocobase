/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { NoPermissionError } from '@nocobase/acl';
import { applyQueryPermission } from '@nocobase/plugin-acl';
import dataQueryTool from '../../ai/skills/data-query/tools/dataQuery';

vi.mock('@nocobase/plugin-acl', () => ({
  applyQueryPermission: vi.fn(),
}));

describe('dataQuery tool', () => {
  const invokeTool = dataQueryTool.invoke as any;
  const repositoryQuery = vi.fn();
  const getCollection = vi.fn();
  const getDataSource = vi.fn();

  const ctx: any = {
    app: {
      acl: { name: 'app-acl' },
      dataSourceManager: {
        get: getDataSource,
      },
    },
    state: {
      currentRole: 'admin',
      currentRoles: ['admin'],
      currentUser: { id: 1 },
    },
    get: vi.fn(() => 'Asia/Shanghai'),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    repositoryQuery.mockResolvedValue([{ status: 'paid', count: 2 }]);
    getCollection.mockReturnValue({ name: 'orders' });
    getDataSource.mockReturnValue({
      acl: { name: 'ds-acl' },
      collectionManager: {
        getCollection,
        db: {
          getRepository: () => ({
            query: repositoryQuery,
          }),
        },
      },
    });

    vi.mocked(applyQueryPermission).mockResolvedValue({
      permission: {} as any,
      query: {
        measures: [{ field: ['id'], aggregation: 'count', alias: 'count' }],
        dimensions: [{ field: ['status'], alias: 'status' }],
        filter: { status: { $eq: 'paid' } },
        limit: 50,
        offset: 0,
      },
    });
  });

  it('should run repository query after ACL pruning', async () => {
    const result = await invokeTool(
      ctx,
      {
        datasource: 'analytics',
        collectionName: 'orders',
        measures: [{ field: ['id'], aggregation: 'count', alias: 'count' }],
        dimensions: [{ field: ['status'], alias: 'status' }],
        filter: { status: { $eq: 'paid' } },
      },
      { toolCallId: 'tool-call-1', writer: vi.fn() },
    );

    expect(getDataSource).toHaveBeenCalledWith('analytics');
    expect(applyQueryPermission).toHaveBeenCalledWith(
      expect.objectContaining({
        acl: { name: 'ds-acl' },
        resourceName: 'orders',
        timezone: 'Asia/Shanghai',
      }),
    );
    expect(repositoryQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        context: ctx,
        timezone: 'Asia/Shanghai',
        limit: 50,
        offset: 0,
      }),
    );
    expect(result).toEqual({
      status: 'success',
      content: JSON.stringify([{ status: 'paid', count: 2 }]),
    });
  });

  it('should return permission errors without throwing', async () => {
    vi.mocked(applyQueryPermission).mockRejectedValue(new NoPermissionError('forbidden'));

    const result = await invokeTool(
      ctx,
      {
        dataSource: 'main',
        collectionName: 'orders',
        measures: [{ field: ['id'], aggregation: 'count', alias: 'count' }],
      },
      { toolCallId: 'tool-call-2', writer: vi.fn() },
    );

    expect(result).toEqual({
      status: 'error',
      content: 'No permissions',
    });
  });

  it('should clamp the query limit before calling ACL and repository query', async () => {
    await invokeTool(
      ctx,
      {
        dataSource: 'main',
        collectionName: 'orders',
        measures: [{ field: ['id'], aggregation: 'count', alias: 'count' }],
        limit: 9999,
      },
      { toolCallId: 'tool-call-3', writer: vi.fn() },
    );

    expect(applyQueryPermission).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          limit: 100,
          offset: 0,
        }),
      }),
    );
  });

  it('should not inherit request timezone unless explicitly provided', async () => {
    await invokeTool(
      ctx,
      {
        dataSource: 'main',
        collectionName: 'orders',
        measures: [{ field: ['id'], aggregation: 'count', alias: 'count' }],
      },
      { toolCallId: 'tool-call-4', writer: vi.fn() },
    );

    expect(applyQueryPermission).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: 'Asia/Shanghai',
      }),
    );
    expect(repositoryQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: 'Asia/Shanghai',
      }),
    );
  });
});

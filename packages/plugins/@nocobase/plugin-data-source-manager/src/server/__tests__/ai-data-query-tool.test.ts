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
import { ArgSchema } from '../../ai/common/common';

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

  it('should describe frontend-compatible calendar filter rules in aggregate query schema', () => {
    const sharedFilterDescription = ArgSchema.shape.filter.description;
    const schema: any = dataQueryTool.definition.schema;
    const filterDescription = schema.properties.filter.description;
    const havingDescription = schema.properties.having.description;

    expect(sharedFilterDescription).toContain('$dateOn');
    expect(sharedFilterDescription).toContain('$dateBetween');
    expect(sharedFilterDescription).toContain('must be a structured object');
    expect(sharedFilterDescription).toContain(
      'Do not expand calendar queries into UTC month-start or day-start boundary expressions.',
    );
    expect(sharedFilterDescription).toContain('datetimeNoTz');

    expect(filterDescription).toContain('$dateOn');
    expect(filterDescription).toContain('$dateBetween');
    expect(filterDescription).toContain('not a JSON string');
    expect(filterDescription).toContain('do not expand month/day queries into UTC boundary timestamps');
    expect(havingDescription).toContain('selected measure aliases');
  });

  it('should reject stringified filter objects', async () => {
    const result = await invokeTool(
      ctx,
      {
        dataSource: 'main',
        collectionName: 'orders',
        measures: [{ field: ['id'], aggregation: 'count', alias: 'count' }],
        filter: '{"status":{"$eq":"paid"}}' as any,
      },
      { toolCallId: 'tool-call-5', writer: vi.fn() },
    );

    expect(result).toEqual({
      status: 'error',
      content:
        '"filter" must be an object, not a JSON string. Pass structured JSON like { "createdAt": { "$dateOn": "2025-11" } }.',
    });
  });

  it('should reject stringified having objects', async () => {
    const result = await invokeTool(
      ctx,
      {
        dataSource: 'main',
        collectionName: 'orders',
        measures: [{ field: ['id'], aggregation: 'count', alias: 'count' }],
        having: '{"count":{"$gt":10}}' as any,
      },
      { toolCallId: 'tool-call-6', writer: vi.fn() },
    );

    expect(result).toEqual({
      status: 'error',
      content: '"having" must be an object, not a JSON string. Pass structured JSON like { "count": { "$gt": 10 } }.',
    });
  });
});

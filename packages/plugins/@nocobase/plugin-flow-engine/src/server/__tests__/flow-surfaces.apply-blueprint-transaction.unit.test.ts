/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowSurfacesService } from '../flow-surfaces/service';

describe('flowSurfaces applyBlueprint transaction boundary', () => {
  const createBlueprint = {
    mode: 'create',
    tabs: [
      {
        key: 'main',
        blocks: [
          {
            key: 'intro',
            type: 'markdown',
          },
        ],
      },
    ],
  };
  const replaceBlueprint = {
    mode: 'replace',
    target: {
      pageSchemaUid: 'existing-page-schema',
    },
    tabs: [
      {
        key: 'main',
        blocks: [
          {
            key: 'intro',
            type: 'markdown',
          },
        ],
      },
    ],
  };

  it('should read create-mode mutations back outside the mutation transaction', async () => {
    const service = new FlowSurfacesService({} as any);
    const events: string[] = [];
    const transactionContext = { id: 'tx-apply-blueprint-create' };
    const readbackError = new Error('readback failed after commit');

    const transaction = vi.spyOn(service as any, 'transaction').mockImplementation(async (callback) => {
      events.push('transaction:start');
      const result = await callback(transactionContext);
      events.push('transaction:committed');
      return result;
    });
    vi.spyOn(service as any, 'applyBlueprintWithTransaction').mockImplementation(
      async (_values, options, _createdKanbanSortFields, resultOptions) => {
        events.push('mutate');
        expect(options.transaction).toBe(transactionContext);
        expect(resultOptions).toEqual({ readSurface: false });
        return {
          version: '1',
          mode: 'create',
          pageLocator: {
            pageSchemaUid: 'page-schema-1',
          },
        };
      },
    );
    vi.spyOn(service as any, 'get').mockImplementation(async (target, options) => {
      events.push('readback');
      expect(target).toEqual({ pageSchemaUid: 'page-schema-1' });
      expect(options).toEqual({ currentRoles: ['root'] });
      throw readbackError;
    });
    const cleanup = vi.spyOn(service as any, 'cleanupApplyBlueprintKanbanSortFields').mockResolvedValue([]);

    await expect(service.applyBlueprint(createBlueprint, { currentRoles: ['root'] })).rejects.toThrow(readbackError);

    expect(events).toEqual(['transaction:start', 'mutate', 'transaction:committed', 'readback']);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('should reject invalid create-mode chart SQL before mutating', async () => {
    const service = new FlowSurfacesService({} as any);
    const sqlError = new Error('chart query.sql is invalid: missing table');
    const mutate = vi
      .spyOn(service as any, 'applyBlueprintWithTransaction')
      .mockRejectedValue(new Error('create mode should not mutate before chart SQL prevalidation passes'));
    vi.spyOn(service as any, 'resolveSqlChartPreview').mockRejectedValue(sqlError);

    await expect(
      service.applyBlueprint(
        {
          mode: 'create',
          assets: {
            charts: {
              brokenTrend: {
                query: {
                  mode: 'sql',
                  sql: 'select * from missing_flow_surfaces_chart_table',
                  sqlDatasource: 'main',
                },
                visual: {
                  mode: 'basic',
                  type: 'bar',
                  mappings: {
                    x: 'name',
                    y: 'total',
                  },
                },
              },
            },
          },
          tabs: [
            {
              key: 'main',
              blocks: [
                {
                  key: 'trend',
                  type: 'chart',
                  chart: 'brokenTrend',
                },
              ],
            },
          ],
        },
        { currentRoles: ['root'] },
      ),
    ).rejects.toThrow(sqlError);

    expect(mutate).not.toHaveBeenCalled();
  });

  it('should reject unsupported create-mode chart asset keys before mutating', async () => {
    const service = new FlowSurfacesService({} as any);
    const mutate = vi
      .spyOn(service as any, 'applyBlueprintWithTransaction')
      .mockRejectedValue(new Error('create mode should not mutate before chart asset key prevalidation passes'));

    await expect(
      service.applyBlueprint({
        mode: 'create',
        assets: {
          charts: {
            categoryChart: {
              type: 'doughnut',
              query: {
                mode: 'builder',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'claims',
                },
                measures: [{ field: 'id', aggregation: 'count', alias: 'claimCount' }],
                dimensions: [{ field: 'claim_category' }],
              },
              visual: {
                mode: 'basic',
                type: 'doughnut',
                mappings: {
                  category: 'claim_category',
                  value: 'claimCount',
                },
              },
            },
          },
        },
        tabs: [
          {
            key: 'main',
            blocks: [
              {
                key: 'categoryChart',
                type: 'chart',
                chart: 'categoryChart',
              },
            ],
          },
        ],
      }),
    ).rejects.toThrow('flowSurfaces configure chart does not support: type');

    expect(mutate).not.toHaveBeenCalled();
  });

  it('should read replace-mode mutations back outside the mutation transaction', async () => {
    const service = new FlowSurfacesService({} as any);
    const events: string[] = [];
    const transaction = { id: 'tx-apply-blueprint' };

    vi.spyOn(service as any, 'transaction').mockImplementation(async (callback) => {
      events.push('transaction:start');
      const result = await callback(transaction);
      events.push('transaction:committed');
      return result;
    });
    vi.spyOn(service as any, 'applyBlueprintWithTransaction').mockImplementation(
      async (_values, options, _createdKanbanSortFields, resultOptions) => {
        events.push('mutate');
        expect(options.transaction).toBe(transaction);
        expect(resultOptions).toEqual({ readSurface: false });
        return {
          version: '1',
          mode: 'replace',
          pageLocator: {
            pageSchemaUid: 'existing-page-schema',
          },
        };
      },
    );
    vi.spyOn(service as any, 'get').mockImplementation(async (target, options) => {
      events.push('readback');
      expect(target).toEqual({ pageSchemaUid: 'existing-page-schema' });
      expect(options).toEqual({ currentRoles: ['root'] });
      return {
        target: {
          uid: 'page-1',
        },
      };
    });

    await expect(service.applyBlueprint(replaceBlueprint, { currentRoles: ['root'] })).resolves.toMatchObject({
      mode: 'replace',
      target: {
        pageSchemaUid: 'existing-page-schema',
        pageUid: 'page-1',
      },
    });

    expect(events).toEqual(['transaction:start', 'mutate', 'transaction:committed', 'readback']);
  });

  it('should cleanup created kanban sort fields when create-mode mutation fails', async () => {
    const service = new FlowSurfacesService({} as any);
    const mutationError = new Error('mutation failed');
    const transactionContext = { id: 'tx-apply-blueprint-create-fail' };
    const createdKanbanSortFields = [
      {
        collectionName: 'tasks',
        fieldName: 'sort',
      },
    ];

    vi.spyOn(service as any, 'transaction').mockImplementation(async (callback) => callback(transactionContext));
    vi.spyOn(service as any, 'applyBlueprintWithTransaction').mockImplementation(async (_values, options) => {
      expect(options.transaction).toBe(transactionContext);
      throw mutationError;
    });
    const cleanup = vi.spyOn(service as any, 'cleanupApplyBlueprintKanbanSortFields').mockResolvedValue([]);

    await expect(
      (service as any).applyBlueprintMutationWithoutExternalTransaction(
        createBlueprint,
        { currentRoles: ['root'] },
        createdKanbanSortFields,
      ),
    ).rejects.toThrow(mutationError);

    expect(cleanup).toHaveBeenCalledWith(createdKanbanSortFields);
  });
});

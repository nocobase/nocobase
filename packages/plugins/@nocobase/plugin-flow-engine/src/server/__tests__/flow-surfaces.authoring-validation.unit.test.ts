/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowSurfaceBadRequestError } from '../flow-surfaces/errors';
import { FlowSurfacesService } from '../flow-surfaces/service';
import { collectFlowSurfaceAuthoringErrors } from '../flow-surfaces/authoring-validation';

describe('flowSurfaces authoring validation unit', () => {
  it('should preserve chart filter operator repair details on applyBlueprint authoring writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Invalid chart filter operator page',
        },
      },
      assets: {
        charts: {
          pipelineChart: {
            query: {
              mode: 'builder',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              measures: [
                {
                  field: 'id',
                  aggregation: 'count',
                  alias: 'employeeCount',
                },
              ],
              dimensions: [{ field: 'status' }],
              filter: {
                logic: '$and',
                items: [
                  {
                    path: 'status',
                    operator: 'notIn',
                    value: ['inactive', 'archived'],
                  },
                ],
              },
            },
            visual: {
              mode: 'basic',
              type: 'bar',
              mappings: {
                x: 'status',
                y: 'employeeCount',
              },
            },
          },
        },
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'pipelineChart',
              type: 'chart',
              chart: 'pipelineChart',
            },
          ],
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.pipelineChart.query.filter.items[0].operator',
          ruleId: 'filter-group-operator-missing-dollar',
          details: expect.objectContaining({
            invalidOperator: 'notIn',
            suggestedOperator: '$notIn',
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should preserve chart filter operator repair details on configure authoring writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'chart-target' },
        changes: {
          query: {
            mode: 'builder',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            measures: [
              {
                field: 'id',
                aggregation: 'count',
                alias: 'employeeCount',
              },
            ],
            dimensions: [{ field: 'status' }],
            filter: {
              status: { notIn: ['inactive', 'archived'] },
            },
          },
          visual: {
            mode: 'basic',
            type: 'bar',
            mappings: {
              x: 'status',
              y: 'employeeCount',
            },
          },
        },
      },
      {
        hostBlockType: 'ChartBlockModel',
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.query.filter.status.notIn',
          ruleId: 'filter-group-operator-missing-dollar',
          details: expect.objectContaining({
            invalidOperator: 'notIn',
            suggestedOperator: '$notIn',
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should reject invalid chart relative date shorthand on applyBlueprint authoring writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Invalid chart date value page',
        },
      },
      assets: {
        charts: {
          staleChart: {
            query: {
              mode: 'builder',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              measures: [
                {
                  field: 'id',
                  aggregation: 'count',
                  alias: 'employeeCount',
                },
              ],
              dimensions: [{ field: 'status' }],
              filter: {
                logic: '$and',
                items: [
                  {
                    path: 'lastFollowupAt',
                    operator: '$dateBefore',
                    value: '-14x',
                  },
                ],
              },
            },
            visual: {
              mode: 'basic',
              type: 'bar',
              mappings: {
                x: 'status',
                y: 'employeeCount',
              },
            },
          },
        },
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'staleChart',
              type: 'chart',
              chart: 'staleChart',
            },
          ],
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.staleChart.query.filter.items[0].value',
          ruleId: 'filter-group-date-value-invalid',
          details: expect.objectContaining({
            invalidValue: '-14x',
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should reject invalid chart date descriptor objects on applyBlueprint authoring writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Invalid chart date descriptor page',
        },
      },
      assets: {
        charts: {
          staleChart: {
            query: {
              mode: 'builder',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              measures: [
                {
                  field: 'id',
                  aggregation: 'count',
                  alias: 'employeeCount',
                },
              ],
              dimensions: [{ field: 'status' }],
              filter: {
                logic: '$and',
                items: [
                  {
                    path: 'lastFollowupAt',
                    operator: '$dateOn',
                    value: { $toNow: 'd', $gt: -7 },
                  },
                ],
              },
            },
            visual: {
              mode: 'basic',
              type: 'bar',
              mappings: {
                x: 'status',
                y: 'employeeCount',
              },
            },
          },
        },
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'staleChart',
              type: 'chart',
              chart: 'staleChart',
            },
          ],
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.staleChart.query.filter.items[0].value',
          ruleId: 'filter-group-date-value-invalid',
          details: expect.objectContaining({
            invalidValue: { $toNow: 'd', $gt: -7 },
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should reject invalid chart date filter values on configure authoring writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'chart-target' },
        changes: {
          query: {
            mode: 'builder',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            measures: [
              {
                field: 'id',
                aggregation: 'count',
                alias: 'employeeCount',
              },
            ],
            dimensions: [{ field: 'status' }],
            filter: {
              lastFollowupAt: { $dateBefore: '-14x' },
            },
          },
          visual: {
            mode: 'basic',
            type: 'bar',
            mappings: {
              x: 'status',
              y: 'employeeCount',
            },
          },
        },
      },
      {
        hostBlockType: 'ChartBlockModel',
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.query.filter.lastFollowupAt.$dateBefore',
          ruleId: 'filter-group-date-value-invalid',
          details: expect.objectContaining({
            invalidValue: '-14x',
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should reject invalid static date values inside templated chart date ranges on configure writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'chart-target' },
        changes: {
          query: {
            mode: 'builder',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            measures: [
              {
                field: 'id',
                aggregation: 'count',
                alias: 'employeeCount',
              },
            ],
            dimensions: [{ field: 'status' }],
            filter: {
              lastFollowupAt: { $dateBetween: ['{{ $vars.start }}', '-14x'] },
            },
          },
          visual: {
            mode: 'basic',
            type: 'bar',
            mappings: {
              x: 'status',
              y: 'employeeCount',
            },
          },
        },
      },
      {
        hostBlockType: 'ChartBlockModel',
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.query.filter.lastFollowupAt.$dateBetween[1]',
          ruleId: 'filter-group-date-value-invalid',
          details: expect.objectContaining({
            invalidValue: '-14x',
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should reject invalid extra date range array slots on configure writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'chart-target' },
        changes: {
          query: {
            mode: 'builder',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            measures: [
              {
                field: 'id',
                aggregation: 'count',
                alias: 'employeeCount',
              },
            ],
            dimensions: [{ field: 'status' }],
            filter: {
              lastFollowupAt: { $dateBetween: ['{{ $vars.start }}', '2026-01-02', 'junk'] },
            },
          },
          visual: {
            mode: 'basic',
            type: 'bar',
            mappings: {
              x: 'status',
              y: 'employeeCount',
            },
          },
        },
      },
      {
        hostBlockType: 'ChartBlockModel',
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.query.filter.lastFollowupAt.$dateBetween',
          ruleId: 'filter-group-date-value-invalid',
          details: expect.objectContaining({
            invalidValue: ['{{ $vars.start }}', '2026-01-02', 'junk'],
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });
});

describe('flowSurfaces chart repair wrapping unit', () => {
  it('should preserve chart filter repair options when chart configure repair wrapper rethrows', async () => {
    const service = new FlowSurfacesService({} as any);
    const resolve = vi.fn().mockResolvedValue({ kind: 'block', uid: 'chart-block' });
    const updateSettings = vi.spyOn(service as any, 'updateSettings').mockResolvedValue({});
    vi.spyOn(service as any, 'locator', 'get').mockReturnValue({ resolve });
    vi.spyOn(service as any, 'loadResolvedNode').mockResolvedValue({
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {},
        },
      },
    });

    let error: FlowSurfaceBadRequestError | undefined;
    try {
      await (service as any).configureChartBlock(
        { uid: 'chart-block' },
        {
          query: {
            mode: 'builder',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            measures: [
              {
                field: 'id',
                aggregation: 'count',
                alias: 'employeeCount',
              },
            ],
            dimensions: [{ field: 'status' }],
            filter: {
              logic: '$and',
              items: [
                {
                  path: 'lastFollowupAt',
                  operator: 'dateBefore',
                  value: '2026-05-16',
                },
              ],
            },
          },
          visual: {
            mode: 'basic',
            type: 'bar',
            mappings: {
              x: 'status',
              y: 'employeeCount',
            },
          },
        },
        {},
      );
    } catch (caught) {
      error = caught as FlowSurfaceBadRequestError;
    }

    expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect(error?.options).toMatchObject({
      path: 'chart query.filter.items[0].operator',
      ruleId: 'filter-group-operator-missing-dollar',
      details: {
        invalidOperator: 'dateBefore',
        suggestedOperator: '$dateBefore',
        requiredBlockType: 'chart',
      },
    });
    expect(updateSettings).not.toHaveBeenCalled();
  });
});

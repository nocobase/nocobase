/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowSurfaceBadRequestError } from '../flow-surfaces/errors';
import {
  buildChartConfigureFromSemanticChanges,
  canonicalizeChartConfigure,
  deriveChartSemanticState,
  getChartBuilderQueryOutputs,
  getChartBuilderResourceInit,
  getChartSupportedMappingsByType,
  getChartSupportedVisualTypes,
} from '../flow-surfaces/chart-config';

describe('chart-config semantic helpers', () => {
  const baseConfigure = {
    query: {
      mode: 'builder',
      collectionPath: ['main', 'demo_orders'],
      measures: [{ field: 'amount', aggregation: 'sum', alias: 'totalAmount' }],
      dimensions: [{ field: 'customerName' }],
      orders: [{ field: 'customerName', order: 'ASC' }],
      filter: {
        logic: '$and',
        items: [
          {
            path: 'status',
            operator: '$eq',
            value: 'paid',
          },
        ],
      },
      limit: 10,
      offset: 5,
    },
    chart: {
      option: {
        mode: 'basic',
        builder: {
          type: 'bar',
          xField: 'customerName',
          yField: 'totalAmount',
          legend: true,
        },
      },
    },
  };

  it('should derive sorting.direction from persisted orders.order', () => {
    expect(deriveChartSemanticState(baseConfigure)).toMatchObject({
      query: {
        sorting: [{ field: 'customerName', direction: 'asc' }],
      },
    });
  });

  it('should persist sorting as query.orders[].order', () => {
    const next = buildChartConfigureFromSemanticChanges(baseConfigure, {
      query: {
        sorting: [{ field: 'customerName', direction: 'desc' }],
      },
    });

    expect(next).toMatchObject({
      query: {
        mode: 'builder',
        collectionPath: ['main', 'demo_orders'],
        orders: [{ field: 'customerName', order: 'DESC' }],
      },
    });
    expect(next.query.orders[0].direction).toBeUndefined();
  });

  it('should reject sorting by aggregated measure outputs in builder mode', () => {
    expect(() =>
      buildChartConfigureFromSemanticChanges(baseConfigure, {
        query: {
          sorting: [{ field: 'totalAmount', direction: 'desc' }],
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);

    expect(() =>
      buildChartConfigureFromSemanticChanges(
        {
          query: {
            mode: 'builder',
            collectionPath: ['main', 'demo_orders'],
            measures: [{ field: 'amount', aggregation: 'sum' }],
          },
        },
        {
          query: {
            sorting: [{ field: 'amount', direction: 'desc' }],
          },
        },
      ),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should allow limit = 0 and keep offset >= 0', () => {
    const next = buildChartConfigureFromSemanticChanges(baseConfigure, {
      query: {
        limit: 0,
        offset: 0,
      },
    });

    expect(next.query.limit).toBe(0);
    expect(next.query.offset).toBe(0);
  });

  it('should canonicalize backend query-object filters to filter groups', () => {
    const next = canonicalizeChartConfigure({
      ...baseConfigure,
      query: {
        ...baseConfigure.query,
        filter: {
          lastFollowupAt: { $lt: '2026-05-16T00:00:00.000Z' },
          stage: { $notIn: ['won', 'lost'] },
        },
      },
    });

    expect(next.query.filter).toEqual({
      logic: '$and',
      items: [
        {
          path: 'lastFollowupAt',
          operator: '$lt',
          value: '2026-05-16T00:00:00.000Z',
        },
        {
          path: 'stage',
          operator: '$notIn',
          value: ['won', 'lost'],
        },
      ],
    });
  });

  it('should allow backend query-object filters on fields named logic and items', () => {
    const next = canonicalizeChartConfigure({
      ...baseConfigure,
      query: {
        ...baseConfigure.query,
        filter: {
          logic: { $eq: 'manual' },
          items: { $gt: 0 },
        },
      },
    });

    expect(next.query.filter).toEqual({
      logic: '$and',
      items: [
        {
          path: 'logic',
          operator: '$eq',
          value: 'manual',
        },
        {
          path: 'items',
          operator: '$gt',
          value: 0,
        },
      ],
    });
  });

  it('should preserve valid filter groups while canonicalizing chart configure', () => {
    const next = canonicalizeChartConfigure(baseConfigure);

    expect(next.query.filter).toEqual(baseConfigure.query.filter);
    expect(next.query.filter).not.toBe(baseConfigure.query.filter);
  });

  it('should reject relative date shorthand in chart filter groups', () => {
    expect(() =>
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            logic: '$and',
            items: [
              {
                path: 'lastFollowupAt',
                operator: '$dateBefore',
                value: '-14d',
              },
            ],
          },
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should preserve UI relative date descriptors in chart filter groups', () => {
    const relativeDate = { type: 'past', number: 14, unit: 'day' };
    const next = canonicalizeChartConfigure({
      ...baseConfigure,
      query: {
        ...baseConfigure.query,
        filter: {
          logic: '$and',
          items: [
            {
              path: 'lastFollowupAt',
              operator: '$dateBefore',
              value: relativeDate,
            },
          ],
        },
      },
    });

    expect(next.query.filter.items[0].value).toEqual(relativeDate);
    expect(next.query.filter.items[0].value).not.toBe(relativeDate);
  });

  it('should reject incomplete relative date descriptors in chart filter groups', () => {
    expect(() =>
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            logic: '$and',
            items: [
              {
                path: 'lastFollowupAt',
                operator: '$dateBefore',
                value: { type: 'past' },
              },
            ],
          },
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should reject zero-day relative date shorthand in chart filter groups', () => {
    expect(() =>
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            logic: '$and',
            items: [
              {
                path: 'lastFollowupAt',
                operator: '$dateBefore',
                value: '-0d',
              },
            ],
          },
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should reject unsupported relative date units in chart filter groups', () => {
    expect(() =>
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            logic: '$and',
            items: [
              {
                path: 'lastFollowupAt',
                operator: '$dateBefore',
                value: { type: 'past', number: 1, unit: 'quarter' },
              },
            ],
          },
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should reject invalid static date values inside templated chart date ranges', () => {
    expect(() =>
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            logic: '$and',
            items: [
              {
                path: 'lastFollowupAt',
                operator: '$dateBetween',
                value: ['{{ $vars.start }}', '-14x'],
              },
            ],
          },
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should reject invalid extra date range array slots in chart filter groups', () => {
    expect(() =>
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            logic: '$and',
            items: [
              {
                path: 'lastFollowupAt',
                operator: '$dateBetween',
                value: ['{{ $vars.start }}', '2026-01-02', 'junk'],
              },
            ],
          },
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should reject invalid date filter values with repair details', () => {
    let error: FlowSurfaceBadRequestError | undefined;

    try {
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
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
      });
    } catch (caught) {
      error = caught as FlowSurfaceBadRequestError;
    }

    expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect(error?.options).toMatchObject({
      path: 'chart query.filter.items[0].value',
      ruleId: 'filter-group-date-value-invalid',
      details: {
        invalidValue: '-14x',
      },
    });
  });

  it('should reject filter group operators missing the dollar prefix with repair details', () => {
    let error: FlowSurfaceBadRequestError | undefined;

    try {
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            logic: '$and',
            items: [
              {
                path: 'lastFollowupAt',
                operator: 'dateBefore',
                value: '2026-05-16',
              },
              {
                path: 'stage',
                operator: 'notIn',
                value: ['won', 'lost'],
              },
            ],
          },
        },
      });
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
      },
    });
  });

  it('should reject backend query-object operators missing the dollar prefix with repair details', () => {
    let error: FlowSurfaceBadRequestError | undefined;

    try {
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            stage: { notIn: ['won', 'lost'] },
          },
        },
      });
    } catch (caught) {
      error = caught as FlowSurfaceBadRequestError;
    }

    expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect(error?.options).toMatchObject({
      path: 'chart query.filter.stage.notIn',
      ruleId: 'filter-group-operator-missing-dollar',
      details: {
        invalidOperator: 'notIn',
        suggestedOperator: '$notIn',
      },
    });
  });

  it('should suggest dollar-prefixed Sequelize operators from backend query-object filters', () => {
    let error: FlowSurfaceBadRequestError | undefined;

    try {
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            amount: { gt: 100 },
            customerName: { like: '%Acme%' },
          },
        },
      });
    } catch (caught) {
      error = caught as FlowSurfaceBadRequestError;
    }

    expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect(error?.options).toMatchObject({
      path: 'chart query.filter.amount.gt',
      ruleId: 'filter-group-operator-missing-dollar',
      details: {
        invalidOperator: 'gt',
        suggestedOperator: '$gt',
      },
    });
  });

  it('should suggest dollar-prefixed Sequelize operators from filter group items', () => {
    let error: FlowSurfaceBadRequestError | undefined;

    try {
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            logic: '$and',
            items: [
              {
                path: 'customerName',
                operator: 'like',
                value: '%Acme%',
              },
            ],
          },
        },
      });
    } catch (caught) {
      error = caught as FlowSurfaceBadRequestError;
    }

    expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect(error?.options).toMatchObject({
      path: 'chart query.filter.items[0].operator',
      ruleId: 'filter-group-operator-missing-dollar',
      details: {
        invalidOperator: 'like',
        suggestedOperator: '$like',
      },
    });
  });

  it('should reject missing-dollar operators on incomplete legacy chart query filters', () => {
    let error: FlowSurfaceBadRequestError | undefined;

    try {
      canonicalizeChartConfigure({
        query: {
          mode: 'builder',
          filter: {
            stage: { notIn: ['won', 'lost'] },
          },
        },
      });
    } catch (caught) {
      error = caught as FlowSurfaceBadRequestError;
    }

    expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect(error?.options).toMatchObject({
      path: 'chart query.filter.stage.notIn',
      ruleId: 'filter-group-operator-missing-dollar',
      details: {
        invalidOperator: 'notIn',
        suggestedOperator: '$notIn',
      },
    });
  });

  it('should persist semantic backend query-object filters as filter groups', () => {
    const next = buildChartConfigureFromSemanticChanges(undefined, {
      query: {
        mode: 'builder',
        resource: {
          dataSourceKey: 'main',
          collectionName: 'sales_leads',
        },
        measures: [{ field: 'expectedRevenue', aggregation: 'sum', alias: 'totalRevenue' }],
        dimensions: [{ field: 'stage' }],
        filter: {
          stage: { $notIn: ['won', 'lost'] },
        },
      },
      visual: {
        type: 'bar',
        mappings: {
          x: 'stage',
          y: 'totalRevenue',
        },
      },
    });

    expect(next.query.filter).toEqual({
      logic: '$and',
      items: [
        {
          path: 'stage',
          operator: '$notIn',
          value: ['won', 'lost'],
        },
      ],
    });
  });

  it('should replace existing filters when semantic changes provide a backend query-object filter', () => {
    const next = buildChartConfigureFromSemanticChanges(baseConfigure, {
      query: {
        filter: {
          stage: { $notIn: ['won', 'lost'] },
        },
      },
    });

    expect(next.query.filter).toEqual({
      logic: '$and',
      items: [
        {
          path: 'stage',
          operator: '$notIn',
          value: ['won', 'lost'],
        },
      ],
    });
  });

  it('should clear existing filters when semantic changes provide an empty filter object', () => {
    const next = buildChartConfigureFromSemanticChanges(baseConfigure, {
      query: {
        filter: {},
      },
    });

    expect(next.query.filter).toEqual({
      logic: '$and',
      items: [],
    });
  });

  it('should convert nested backend logical filters to nested filter groups', () => {
    const next = canonicalizeChartConfigure({
      ...baseConfigure,
      query: {
        ...baseConfigure.query,
        filter: {
          $or: [
            { status: { $eq: 'paid' } },
            {
              $and: [{ amount: { $gt: 100 } }, { customerName: { $includes: 'Acme' } }],
            },
          ],
        },
      },
    });

    expect(next.query.filter).toEqual({
      logic: '$or',
      items: [
        {
          path: 'status',
          operator: '$eq',
          value: 'paid',
        },
        {
          logic: '$and',
          items: [
            {
              path: 'amount',
              operator: '$gt',
              value: 100,
            },
            {
              path: 'customerName',
              operator: '$includes',
              value: 'Acme',
            },
          ],
        },
      ],
    });
  });

  it('should reject unconvertible backend query-object filters', () => {
    expect(() =>
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            stage: 'paid',
          },
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should reject mixed filter-group and backend query-object filters', () => {
    expect(() =>
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            ...baseConfigure.query.filter,
            stage: { $eq: 'paid' },
          },
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should reject backend logical filters containing filter-group operands', () => {
    expect(() =>
      canonicalizeChartConfigure({
        ...baseConfigure,
        query: {
          ...baseConfigure.query,
          filter: {
            $or: [baseConfigure.query.filter, { stage: { $eq: 'paid' } }],
          },
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should reset stale builder state when resource changes unless explicitly replaced', () => {
    const next = buildChartConfigureFromSemanticChanges(baseConfigure, {
      query: {
        resource: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
        dimensions: [{ field: 'department.title' }],
      },
      visual: {
        mappings: {
          x: 'department.title',
          y: 'employeeCount',
        },
      },
    });

    expect(next).toMatchObject({
      query: {
        collectionPath: ['main', 'employees'],
        measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
        dimensions: [{ field: ['department', 'title'], alias: 'department.title' }],
        orders: [],
        filter: {
          logic: '$and',
          items: [],
        },
        limit: 10,
        offset: 5,
      },
    });
  });

  it('should normalize count(id) to the grouping dimension for builder chart runtime data', () => {
    const next = canonicalizeChartConfigure({
      query: {
        mode: 'builder',
        collectionPath: ['main', 'claims'],
        measures: [{ field: 'id', aggregation: 'count', alias: 'count' }],
        dimensions: [{ field: 'claim_category' }],
      },
      chart: {
        option: {
          mode: 'basic',
          builder: {
            type: 'doughnut',
            doughnutCategory: 'claim_category',
            doughnutValue: 'count',
          },
        },
      },
    });

    expect(next).toMatchObject({
      query: {
        collectionPath: ['main', 'claims'],
        measures: [{ field: 'claim_category', aggregation: 'count', alias: 'count' }],
        dimensions: [{ field: 'claim_category' }],
      },
      chart: {
        option: {
          mode: 'basic',
          builder: {
            type: 'doughnut',
            doughnutCategory: 'claim_category',
            doughnutValue: 'count',
          },
        },
      },
    });
  });

  it('should keep count(id) and alias relation dimensions for builder chart runtime data', () => {
    const next = canonicalizeChartConfigure({
      query: {
        mode: 'builder',
        collectionPath: ['main', 'employees'],
        measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
        dimensions: [{ field: 'department.title' }],
        sorting: [{ field: 'department.title', direction: 'desc' }],
      },
      chart: {
        option: {
          mode: 'basic',
          builder: {
            type: 'bar',
            xField: 'department.title',
            yField: 'employeeCount',
          },
        },
      },
    });

    expect(next).toMatchObject({
      query: {
        collectionPath: ['main', 'employees'],
        measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
        dimensions: [{ field: ['department', 'title'], alias: 'department.title' }],
        orders: [{ field: ['department', 'title'], order: 'DESC' }],
      },
      chart: {
        option: {
          mode: 'basic',
          builder: {
            type: 'bar',
            xField: 'department.title',
            yField: 'employeeCount',
          },
        },
      },
    });
  });

  it('should drop old visual-only fields when chart type changes', () => {
    const pieConfigure = {
      ...baseConfigure,
      chart: {
        option: {
          mode: 'basic',
          builder: {
            type: 'pie',
            pieCategory: 'customerName',
            pieValue: 'totalAmount',
            pieRadiusInner: 20,
            pieRadiusOuter: 80,
            label: true,
          },
        },
      },
    };

    const next = buildChartConfigureFromSemanticChanges(pieConfigure, {
      visual: {
        type: 'bar',
        mappings: {
          x: 'customerName',
          y: 'totalAmount',
        },
      },
    });

    expect(next.chart.option.builder).toMatchObject({
      type: 'bar',
      xField: 'customerName',
      yField: 'totalAmount',
      label: true,
    });
    expect(next.chart.option.builder.pieRadiusInner).toBeUndefined();
    expect(next.chart.option.builder.pieRadiusOuter).toBeUndefined();
    expect(next.chart.option.builder.pieCategory).toBeUndefined();
    expect(next.chart.option.builder.pieValue).toBeUndefined();
  });

  it('should validate basic visual mappings against builder query outputs', () => {
    expect(() =>
      buildChartConfigureFromSemanticChanges(baseConfigure, {
        visual: {
          type: 'bar',
          mappings: {
            x: 'customerName',
            y: 'missingMetric',
          },
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should clear stale visual mappings when only builder query outputs change', () => {
    const next = buildChartConfigureFromSemanticChanges(baseConfigure, {
      query: {
        resource: {
          dataSourceKey: 'main',
          collectionName: 'departments',
        },
        measures: [{ field: 'title', aggregation: 'count', alias: 'departmentCount' }],
        dimensions: [{ field: 'location' }],
      },
    });

    expect(next).toMatchObject({
      query: {
        collectionPath: ['main', 'departments'],
        measures: [{ field: 'title', aggregation: 'count', alias: 'departmentCount' }],
        dimensions: [{ field: 'location' }],
      },
      chart: {
        option: {
          mode: 'basic',
          builder: {
            type: 'bar',
            legend: true,
          },
        },
      },
    });
    expect(next.chart.option.builder.xField).toBeUndefined();
    expect(next.chart.option.builder.yField).toBeUndefined();
  });

  it('should treat an empty visual patch like an omitted visual patch when builder query outputs change', () => {
    const next = buildChartConfigureFromSemanticChanges(baseConfigure, {
      query: {
        resource: {
          dataSourceKey: 'main',
          collectionName: 'departments',
        },
        measures: [{ field: 'title', aggregation: 'count', alias: 'departmentCount' }],
        dimensions: [{ field: 'location' }],
      },
      visual: {},
    });

    expect(next).toMatchObject({
      query: {
        collectionPath: ['main', 'departments'],
        measures: [{ field: 'title', aggregation: 'count', alias: 'departmentCount' }],
        dimensions: [{ field: 'location' }],
      },
      chart: {
        option: {
          mode: 'basic',
          builder: {
            type: 'bar',
            legend: true,
          },
        },
      },
    });
    expect(next.chart.option.builder.xField).toBeUndefined();
    expect(next.chart.option.builder.yField).toBeUndefined();
  });

  it('should allow sql visual mappings without builder output validation', () => {
    const next = buildChartConfigureFromSemanticChanges(
      {
        query: {
          mode: 'sql',
          sql: 'select department, count(*) as total from employees group by department',
          sqlDatasource: 'main',
        },
      },
      {
        visual: {
          type: 'bar',
          mappings: {
            x: 'department',
            y: 'total',
          },
        },
      },
    );

    expect(next.chart.option.builder).toMatchObject({
      type: 'bar',
      xField: 'department',
      yField: 'total',
    });
  });

  it('should clear stale basic visual mappings when query mode switches to sql without an explicit visual patch', () => {
    const next = buildChartConfigureFromSemanticChanges(baseConfigure, {
      query: {
        mode: 'sql',
        sql: 'select 1 as total',
        sqlDatasource: 'main',
      },
    });

    expect(next.query).toMatchObject({
      mode: 'sql',
      sql: 'select 1 as total',
      sqlDatasource: 'main',
    });
    expect(next.chart.option.builder).toMatchObject({
      type: 'bar',
      legend: true,
    });
    expect(next.chart.option.builder.xField).toBeUndefined();
    expect(next.chart.option.builder.yField).toBeUndefined();
  });

  it('should reject mixing legacy configure with semantic changes', () => {
    expect(() =>
      buildChartConfigureFromSemanticChanges(baseConfigure, {
        configure: {
          query: {
            mode: 'sql',
            sql: 'select 1',
          },
        },
        query: {
          mode: 'builder',
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should canonicalize legacy configure.resource to query.collectionPath', () => {
    const next = canonicalizeChartConfigure({
      query: {
        mode: 'builder',
        resource: {
          dataSourceKey: 'analytics',
          collectionName: 'sales_report',
        },
        measures: [{ field: 'amount', aggregation: 'sum', alias: 'totalAmount' }],
        dimensions: [{ field: 'region' }],
        orders: [{ field: 'region', order: 'DESC' }],
      },
      chart: {
        option: {
          mode: 'basic',
          builder: {
            type: 'bar',
            xField: 'region',
            yField: 'totalAmount',
          },
        },
      },
    });

    expect(next).toMatchObject({
      query: {
        mode: 'builder',
        collectionPath: ['analytics', 'sales_report'],
        measures: [{ field: 'amount', aggregation: 'sum', alias: 'totalAmount' }],
        dimensions: [{ field: 'region' }],
        orders: [{ field: 'region', order: 'DESC' }],
      },
      chart: {
        option: {
          mode: 'basic',
          builder: {
            type: 'bar',
            xField: 'region',
            yField: 'totalAmount',
          },
        },
      },
    });
    expect(next.query.resource).toBeUndefined();
  });

  it('should keep incomplete legacy configure sections instead of forcing semantic normalization', () => {
    const next = canonicalizeChartConfigure({
      query: {
        mode: 'builder',
      },
      chart: {
        option: {
          legend: {
            show: true,
          },
        },
      },
    });

    expect(next).toEqual({
      query: {
        mode: 'builder',
      },
      chart: {
        option: {
          legend: {
            show: true,
          },
        },
      },
    });
  });

  it('should allow semantic reconfiguration on top of incomplete legacy configure state', () => {
    const next = buildChartConfigureFromSemanticChanges(
      {
        query: {
          mode: 'builder',
        },
        chart: {
          option: {
            legend: {
              show: true,
            },
          },
        },
      },
      {
        query: {
          mode: 'builder',
          resource: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.title' }],
        },
        visual: {
          type: 'bar',
          mappings: {
            x: 'department.title',
            y: 'employeeCount',
          },
        },
      },
    );

    expect(next).toMatchObject({
      query: {
        mode: 'builder',
        collectionPath: ['main', 'employees'],
        measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
        dimensions: [{ field: ['department', 'title'], alias: 'department.title' }],
      },
      chart: {
        option: {
          mode: 'basic',
          builder: {
            type: 'bar',
            xField: 'department.title',
            yField: 'employeeCount',
          },
        },
      },
    });
  });

  it('should reject conflicting builder resource and collectionPath in the same query', () => {
    expect(() =>
      buildChartConfigureFromSemanticChanges(baseConfigure, {
        query: {
          resource: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
          collectionPath: ['main', 'departments'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
        },
      }),
    ).toThrowError(FlowSurfaceBadRequestError);
  });

  it('should infer builder resource from either collectionPath or legacy resource object', () => {
    expect(getChartBuilderResourceInit(baseConfigure)).toEqual({
      dataSourceKey: 'main',
      collectionName: 'demo_orders',
    });

    expect(
      getChartBuilderResourceInit({
        query: {
          mode: 'builder',
          resource: {
            dataSourceKey: 'analytics',
            collectionName: 'sales_report',
          },
        },
      }),
    ).toEqual({
      dataSourceKey: 'analytics',
      collectionName: 'sales_report',
    });
  });

  it('should expose builder query outputs and supported chart capability metadata', () => {
    expect(getChartBuilderQueryOutputs(baseConfigure)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ alias: 'customerName', kind: 'dimension' }),
        expect.objectContaining({ alias: 'totalAmount', kind: 'measure', aggregation: 'sum' }),
      ]),
    );
    expect(getChartSupportedVisualTypes()).toEqual(expect.arrayContaining(['line', 'bar', 'pie', 'scatter', 'funnel']));
    expect(getChartSupportedMappingsByType()).toMatchObject({
      bar: {
        allowed: expect.arrayContaining(['x', 'y', 'series']),
        required: expect.arrayContaining(['x', 'y']),
      },
      pie: {
        allowed: expect.arrayContaining(['category', 'value']),
        required: expect.arrayContaining(['category', 'value']),
      },
    });
  });
});

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
        dimensions: [{ field: 'department.title' }],
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
        dimensions: [{ field: 'department.title' }],
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

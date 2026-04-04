/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildFlowSurfaceContextResponse } from '../flow-surfaces/context';

describe('chart context response helpers', () => {
  const departments = {
    name: 'departments',
    dataSourceKey: 'main',
    fields: [{ name: 'title', type: 'string', interface: 'input' }],
  };
  const employees = {
    name: 'employees',
    dataSourceKey: 'main',
    fields: [
      { name: 'nickname', type: 'string', interface: 'input' },
      {
        name: 'department',
        type: 'belongsTo',
        interface: 'm2o',
        targetCollection: () => departments,
      },
    ],
  };

  it('should materialize chart builder helper metadata alongside collection context', () => {
    const response = buildFlowSurfaceContextResponse({
      semantic: {
        collection: employees,
        chart: {
          queryOutputs: [
            {
              alias: 'employeeCount',
              type: 'number',
              kind: 'measure',
              field: 'id',
              aggregation: 'count',
            },
            {
              alias: 'department.title',
              type: 'string',
              kind: 'dimension',
              field: 'department.title',
            },
          ],
          aliases: ['employeeCount'],
          supportedMappings: {
            bar: {
              allowed: ['x', 'y', 'series'],
              required: ['x', 'y'],
            },
            pie: {
              allowed: ['category', 'value'],
              required: ['category', 'value'],
            },
          },
          supportedVisualTypes: ['bar', 'pie', 'scatter'],
        },
      },
      maxDepth: 4,
    });

    expect(response.vars.collection.properties.nickname).toBeTruthy();
    expect(response.vars.collection.properties.department.properties.title).toBeTruthy();

    expect(response.vars.chart.properties.queryOutputs.properties.employeeCount).toMatchObject({
      type: 'number',
    });
    expect(response.vars.chart.properties.queryOutputs.properties.employeeCount.description).toContain(
      'aggregation=count',
    );
    expect(response.vars.chart.properties.queryOutputs.properties['department.title']).toMatchObject({
      type: 'string',
    });

    expect(response.vars.chart.properties.aliases.properties.employeeCount.description).toContain('visual.mappings');
    expect(response.vars.chart.properties.supportedMappings.properties.bar.properties.x.description).toContain(
      'Required',
    );
    expect(response.vars.chart.properties.supportedMappings.properties.bar.properties.series.description).toContain(
      'Optional',
    );
    expect(response.vars.chart.properties.supportedVisualTypes.properties.scatter).toBeTruthy();
  });

  it('should keep sql-style chart helper metadata without query outputs', () => {
    const response = buildFlowSurfaceContextResponse({
      semantic: {
        chart: {
          supportedMappings: {
            bar: {
              allowed: ['x', 'y'],
              required: ['x', 'y'],
            },
          },
          supportedVisualTypes: ['bar', 'line'],
        },
      },
      path: 'chart',
      maxDepth: 4,
    });

    expect(response.vars.chart.properties.supportedMappings.properties.bar.properties.x).toBeTruthy();
    expect(response.vars.chart.properties.supportedVisualTypes.properties.line).toBeTruthy();
    expect(response.vars.chart.properties.queryOutputs).toBeUndefined();
    expect(response.vars.chart.properties.aliases).toBeUndefined();
  });
});

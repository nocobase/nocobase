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
          supportedStyles: {
            bar: {
              boundaryGap: {
                type: 'boolean',
                description: 'Whether the category axis keeps boundary gap',
              },
              xAxisLabelRotate: {
                type: 'number',
                min: 0,
                max: 90,
                description: 'Rotate x-axis labels in degrees',
              },
            },
            pie: {
              labelType: {
                type: 'string',
                enumValues: ['value', 'percent'],
              },
            },
          },
          supportedVisualTypes: ['bar', 'pie', 'scatter'],
          safeDefaults: [
            {
              key: 'builder_basic_minimal',
              title: 'Use builder + basic first',
              description: 'Prefer builder/basic for the first attempt.',
            },
          ],
          riskyPatterns: [
            {
              key: 'custom_visual_raw',
              title: 'Custom visual raw option',
              description: 'Raw custom chart options should be browser-verified.',
            },
          ],
          unsupportedPatterns: [
            {
              key: 'builder_measure_sorting',
              title: 'Builder sorting on derived measure outputs',
              description: 'Aggregated measure sorting is rejected.',
            },
          ],
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
    expect(response.vars.chart.properties.aliases.properties.employeeCount.description).toContain('Do not assume');
    expect(response.vars.chart.properties.supportedMappings.properties.bar.properties.x.description).toContain(
      'Required',
    );
    expect(response.vars.chart.properties.supportedMappings.properties.bar.properties.series.description).toContain(
      'Optional',
    );
    expect(response.vars.chart.properties.supportedStyles.properties.bar.properties.boundaryGap.type).toBe('boolean');
    expect(response.vars.chart.properties.supportedStyles.properties.bar.properties.boundaryGap.description).toContain(
      'boundary gap',
    );
    expect(response.vars.chart.properties.supportedStyles.properties.bar.properties.xAxisLabelRotate).toMatchObject({
      type: 'number',
      min: 0,
      max: 90,
    });
    expect(response.vars.chart.properties.supportedStyles.properties.bar.properties.radiusInner).toBeUndefined();
    expect(response.vars.chart.properties.supportedStyles.properties.pie.properties.labelType.enumValues).toEqual([
      'value',
      'percent',
    ]);
    expect(response.vars.chart.properties.supportedVisualTypes.properties.scatter).toBeTruthy();
    expect(response.vars.chart.properties.safeDefaults.properties.builder_basic_minimal.description).toContain(
      'builder/basic',
    );
    expect(response.vars.chart.properties.riskyPatterns.properties.custom_visual_raw).toBeTruthy();
    expect(response.vars.chart.properties.unsupportedPatterns.properties.builder_measure_sorting).toBeTruthy();
  });

  it('should keep sql-style chart helper metadata and support sql preview outputs', () => {
    const response = buildFlowSurfaceContextResponse({
      semantic: {
        chart: {
          queryOutputs: [
            {
              alias: 'total',
              source: 'sql',
              type: 'number',
            },
          ],
          supportedMappings: {
            bar: {
              allowed: ['x', 'y'],
              required: ['x', 'y'],
            },
          },
          supportedStyles: {
            bar: {
              boundaryGap: {
                type: 'boolean',
              },
            },
          },
          supportedVisualTypes: ['bar', 'line'],
          safeDefaults: [
            {
              key: 'block_outer_props_only',
              title: 'Keep outer props minimal',
              description: 'Only expose block-level card props by default.',
            },
          ],
        },
      },
      path: 'chart',
      maxDepth: 4,
    });

    expect(response.vars.chart.properties.supportedMappings.properties.bar.properties.x).toBeTruthy();
    expect(response.vars.chart.properties.supportedStyles.properties.bar.properties.boundaryGap.type).toBe('boolean');
    expect(response.vars.chart.properties.supportedVisualTypes.properties.line).toBeTruthy();
    expect(response.vars.chart.properties.queryOutputs.properties.total.description).toContain('SQL preview output');
    expect(response.vars.chart.properties.aliases).toBeUndefined();
    expect(response.vars.chart.properties.safeDefaults.properties.block_outer_props_only).toBeTruthy();
  });

  it('should expose risky sql hints without queryOutputs when preview is unavailable', () => {
    const response = buildFlowSurfaceContextResponse({
      semantic: {
        chart: {
          supportedMappings: {
            bar: {
              allowed: ['x', 'y'],
              required: ['x', 'y'],
            },
          },
          supportedStyles: {
            bar: {
              boundaryGap: {
                type: 'boolean',
              },
            },
          },
          supportedVisualTypes: ['bar'],
          riskyPatterns: [
            {
              key: 'sql_runtime_context',
              title: 'SQL depends on runtime context',
              description: 'Preview is unavailable before runtime.',
            },
          ],
        },
      },
      path: 'chart',
      maxDepth: 4,
    });

    expect(response.vars.chart.properties.queryOutputs).toBeUndefined();
    expect(response.vars.chart.properties.riskyPatterns.properties.sql_runtime_context.description).toContain(
      'runtime',
    );
    expect(response.vars.chart.properties.supportedStyles.properties.bar.properties.boundaryGap.type).toBe('boolean');
  });
});

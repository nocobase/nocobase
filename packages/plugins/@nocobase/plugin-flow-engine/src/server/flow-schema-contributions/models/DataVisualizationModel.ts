/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution, FlowSchemaContribution } from '../../flow-schema-registry';

const chartBlockModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'ChartBlockModel',
  title: 'Chart block',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      chartSettings: {
        type: 'object',
        properties: {
          configure: {
            type: 'object',
            properties: {
              query: {
                type: 'object',
                properties: {
                  mode: {
                    type: 'string',
                    enum: ['builder', 'sql'],
                  },
                  collectionPath: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 2,
                    maxItems: 2,
                  },
                  measures: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        aggregation: { type: 'string' },
                        alias: { type: 'string' },
                      },
                      additionalProperties: true,
                    },
                  },
                  dimensions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        alias: { type: 'string' },
                        format: { type: 'string' },
                      },
                      additionalProperties: true,
                    },
                  },
                  sqlDatasource: { type: 'string' },
                  sql: { type: 'string' },
                },
                additionalProperties: true,
              },
              chart: {
                type: 'object',
                properties: {
                  option: {
                    type: 'object',
                    properties: {
                      mode: {
                        type: 'string',
                        enum: ['basic', 'custom'],
                      },
                      builder: {
                        type: 'object',
                        additionalProperties: true,
                      },
                      raw: { type: 'string' },
                    },
                    additionalProperties: true,
                  },
                  events: {
                    type: 'object',
                    properties: {
                      raw: { type: 'string' },
                    },
                    additionalProperties: true,
                  },
                },
                additionalProperties: true,
              },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-chart-block-uid',
    use: 'ChartBlockModel',
    stepParams: {
      chartSettings: {
        configure: {
          query: {
            mode: 'builder',
            collectionPath: ['main', 'orders'],
            measures: [
              {
                field: 'id',
                aggregation: 'count',
                alias: 'count_id',
              },
            ],
            dimensions: [
              {
                field: 'createdAt',
              },
            ],
          },
          chart: {
            option: {
              mode: 'basic',
              builder: {
                type: 'line',
                xField: 'createdAt',
                yField: 'count_id',
              },
            },
          },
        },
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'chart-users',
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {
            query: {
              mode: 'builder',
              collectionPath: ['main', 'orders'],
              measures: [
                {
                  field: 'id',
                  aggregation: 'count',
                  alias: 'count_id',
                },
              ],
              dimensions: [
                {
                  field: 'createdAt',
                },
              ],
            },
            chart: {
              option: {
                mode: 'basic',
                builder: {
                  type: 'line',
                  xField: 'createdAt',
                  yField: 'count_id',
                },
              },
            },
          },
        },
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'ChartBlockModel.stepParams.chartSettings.configure.query',
        message:
          'Chart query configuration depends on runtime collections and query builders. Builder charts are renderable only when collectionPath includes datasource+collection and measures are present.',
        'x-flow': {
          contextRequirements: ['collection metadata', 'query builder', 'optional SQL resource'],
          unresolvedReason: 'runtime-chart-query-config',
          recommendedFallback: {
            mode: 'builder',
          },
        },
      },
      {
        kind: 'dynamic-ui-schema',
        path: 'ChartBlockModel.stepParams.chartSettings.configure.chart',
        message:
          'Chart option builders and event scripts depend on runtime chart builders and RunJS execution. Basic mode still needs option.builder; custom mode does not bypass query/dataSource requirements.',
        'x-flow': {
          contextRequirements: ['chart builder', 'RunJS'],
          unresolvedReason: 'runtime-chart-option-builder',
          recommendedFallback: {
            option: {
              mode: 'basic',
            },
          },
        },
      },
    ],
  },
};

export const flowSchemaContribution: FlowSchemaContribution = {
  inventory: {
    publicTreeRoots: ['ChartBlockModel'],
  },
  models: [chartBlockModelSchemaContribution],
  defaults: {
    source: 'plugin',
  },
};

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowJsonSchema, FlowModelSchemaContribution, FlowSchemaContribution } from '../../flow-schema-registry';

const genericFilterSchemaId = 'urn:nocobase:schema:plugin-map:generic-filter';

const genericFilterSchema: FlowJsonSchema = {
  $id: genericFilterSchemaId,
  definitions: {
    filterCondition: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
        },
        operator: {
          type: 'string',
        },
        value: {},
        noValue: {
          type: 'boolean',
        },
      },
      required: ['path'],
      additionalProperties: true,
      allOf: [
        {
          not: {
            required: ['logic'],
          },
        },
        {
          not: {
            required: ['items'],
          },
        },
      ],
    },
    filterGroup: {
      type: 'object',
      properties: {
        logic: {
          type: 'string',
          enum: ['$and', '$or'],
        },
        items: {
          type: 'array',
          items: {
            oneOf: [
              { $ref: `${genericFilterSchemaId}#/definitions/filterCondition` },
              { $ref: `${genericFilterSchemaId}#/definitions/filterGroup` },
            ],
          },
        },
      },
      required: ['logic', 'items'],
      additionalProperties: true,
      allOf: [
        {
          not: {
            required: ['path'],
          },
        },
        {
          not: {
            required: ['operator'],
          },
        },
        {
          not: {
            required: ['value'],
          },
        },
        {
          not: {
            required: ['noValue'],
          },
        },
      ],
    },
  },
  type: 'object',
  properties: {
    logic: {
      type: 'string',
      enum: ['$and', '$or'],
    },
    items: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: `${genericFilterSchemaId}#/definitions/filterCondition` },
          { $ref: `${genericFilterSchemaId}#/definitions/filterGroup` },
        ],
      },
    },
  },
  required: ['logic', 'items'],
  additionalProperties: true,
  allOf: [
    {
      not: {
        required: ['path'],
      },
    },
    {
      not: {
        required: ['operator'],
      },
    },
    {
      not: {
        required: ['value'],
      },
    },
    {
      not: {
        required: ['noValue'],
      },
    },
  ],
};

const sortingRuleParamsSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    sort: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          direction: { type: 'string', enum: ['asc', 'desc'] },
        },
        required: ['field', 'direction'],
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

const genericModelNodeSchema: FlowJsonSchema = {
  type: 'object',
  required: ['uid', 'use'],
  properties: {
    uid: { type: 'string' },
    use: { type: 'string' },
  },
  additionalProperties: true,
};

const mapBlockModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'MapBlockModel',
  title: 'Map block',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      createMapBlock: {
        type: 'object',
        properties: {
          init: {
            type: 'object',
            properties: {
              mapField: {
                type: 'array',
                items: { type: 'string' },
              },
              marker: { type: 'string' },
            },
            additionalProperties: false,
          },
          addAppends: {
            type: 'object',
            additionalProperties: true,
          },
          dataScope: {
            type: 'object',
            properties: {
              filter: genericFilterSchema,
            },
            additionalProperties: false,
          },
          lineSort: sortingRuleParamsSchema,
          mapZoom: {
            type: 'object',
            properties: {
              zoom: { type: 'number' },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  flowRegistrySchema: {
    type: 'object',
    properties: {
      popupSettings: {
        type: 'object',
        properties: {
          key: { const: 'popupSettings' },
          steps: {
            type: 'object',
            properties: {
              openView: {
                type: 'object',
                properties: {
                  use: { const: 'openView' },
                },
                additionalProperties: true,
              },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  subModelSlots: {
    actions: {
      type: 'array',
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Map actions depend on runtime action registries.',
    },
  },
  skeleton: {
    uid: 'todo-uid',
    use: 'MapBlockModel',
    stepParams: {
      createMapBlock: {
        init: {
          mapField: [],
        },
        mapZoom: {
          zoom: 13,
        },
      },
    },
    subModels: {
      actions: [],
    },
  },
  docs: {
    minimalExample: {
      uid: 'map-users',
      use: 'MapBlockModel',
      stepParams: {
        createMapBlock: {
          init: {
            mapField: [],
          },
          mapZoom: {
            zoom: 13,
          },
        },
      },
      subModels: {
        actions: [],
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'MapBlockModel.stepParams.createMapBlock.init.mapField',
        message: 'Map field and marker options depend on collection field interfaces and association traversal.',
        'x-flow': {
          contextRequirements: ['collection fields', 'association traversal'],
          unresolvedReason: 'runtime-map-field-options',
          recommendedFallback: {
            mapField: [],
          },
        },
      },
      {
        kind: 'dynamic-children',
        path: 'MapBlockModel.subModels.actions',
        message: 'Map actions depend on runtime action registries.',
        'x-flow': {
          slotRules: {
            slotKey: 'actions',
            type: 'array',
          },
          contextRequirements: ['collection action registry'],
          unresolvedReason: 'runtime-map-actions',
        },
      },
    ],
  },
};

function createFieldContribution(use: string, title: string): FlowModelSchemaContribution {
  return {
    use,
    title,
    source: 'plugin',
    strict: false,
    exposure: 'internal',
    stepParamsSchema: {
      type: 'object',
      properties: {
        fieldSettings: {
          type: 'object',
          properties: {
            init: {
              type: 'object',
              properties: {
                dataSourceKey: { type: 'string' },
                collectionName: { type: 'string' },
                fieldPath: { type: 'string' },
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
      uid: `todo-${use}`.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase(),
      use,
    },
  };
}

export const flowSchemaContribution: FlowSchemaContribution = {
  inventory: {
    publicTreeRoots: ['MapBlockModel'],
  },
  models: [
    mapBlockModelSchemaContribution,
    createFieldContribution('PointFieldModel', 'Point'),
    createFieldContribution('CircleFieldModel', 'Circle'),
    createFieldContribution('PolygonFieldModel', 'Polygon'),
    createFieldContribution('LineStringFieldModel', 'Line string'),
    createFieldContribution('DisplayPointFieldModel', 'Display point'),
    createFieldContribution('DisplayCircleFieldModel', 'Display circle'),
    createFieldContribution('DisplayPolygonFieldModel', 'Display polygon'),
    createFieldContribution('DisplayLineStringFieldModel', 'Display line string'),
  ],
  fieldBindings: [
    {
      context: 'editable-field',
      use: 'PointFieldModel',
      interfaces: ['point'],
      isDefault: true,
    },
    {
      context: 'editable-field',
      use: 'CircleFieldModel',
      interfaces: ['circle'],
      isDefault: true,
    },
    {
      context: 'editable-field',
      use: 'PolygonFieldModel',
      interfaces: ['polygon'],
      isDefault: true,
    },
    {
      context: 'editable-field',
      use: 'LineStringFieldModel',
      interfaces: ['lineString'],
      isDefault: true,
    },
    {
      context: 'display-field',
      use: 'DisplayPointFieldModel',
      interfaces: ['point'],
      isDefault: true,
    },
    {
      context: 'display-field',
      use: 'DisplayCircleFieldModel',
      interfaces: ['circle'],
      isDefault: true,
    },
    {
      context: 'display-field',
      use: 'DisplayPolygonFieldModel',
      interfaces: ['polygon'],
      isDefault: true,
    },
    {
      context: 'display-field',
      use: 'DisplayLineStringFieldModel',
      interfaces: ['lineString'],
      isDefault: true,
    },
  ],
  defaults: {
    source: 'plugin',
  },
};

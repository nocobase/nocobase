/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowJsonSchema, FlowModelSchemaManifest, FlowSchemaManifestContribution } from '@nocobase/flow-engine';

const genericFilterSchema: FlowJsonSchema = {
  type: 'object',
  properties: {
    logic: {
      type: 'string',
      enum: ['$and', '$or'],
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
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

const mapBlockModelSchemaManifest: FlowModelSchemaManifest = {
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

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  inventory: {
    publicModels: ['MapBlockModel'],
  },
  models: [mapBlockModelSchemaManifest],
  defaults: {
    source: 'plugin',
  },
};

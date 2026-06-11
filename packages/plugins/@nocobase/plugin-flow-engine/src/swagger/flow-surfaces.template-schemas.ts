/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type FlowSurfaceSchemaRef = (name: string) => { $ref: string };

export function createFlowSurfaceTemplateSchemas(options: {
  ref: FlowSurfaceSchemaRef;
  stringOrIntegerSchema: Record<string, any>;
  actionTypeEnum: string[];
}) {
  const { ref, stringOrIntegerSchema, actionTypeEnum } = options;

  return {
    FlowSurfaceTemplateRow: {
      type: 'object',
      required: ['uid', 'name', 'description', 'type', 'targetUid'],
      properties: {
        uid: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        type: {
          type: 'string',
          enum: ['block', 'popup'],
        },
        targetUid: {
          type: 'string',
        },
        useModel: {
          type: 'string',
        },
        dataSourceKey: {
          type: 'string',
        },
        collectionName: {
          type: 'string',
        },
        associationName: {
          type: 'string',
        },
        filterByTk: stringOrIntegerSchema,
        sourceId: stringOrIntegerSchema,
        usageCount: {
          type: 'integer',
        },
        available: {
          type: 'boolean',
        },
        disabledReason: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
    FlowSurfaceListTemplatesRequest: {
      type: 'object',
      properties: {
        target: ref('FlowSurfaceWriteTarget'),
        type: {
          type: 'string',
          enum: ['block', 'popup'],
        },
        usage: {
          type: 'string',
          enum: ['block', 'fields'],
        },
        actionType: {
          type: 'string',
          enum: actionTypeEnum,
        },
        actionScope: {
          type: 'string',
          enum: ['block', 'record'],
        },
        search: {
          type: 'string',
        },
        filter: {
          type: 'object',
          additionalProperties: true,
        },
        sort: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          ],
        },
        page: {
          type: 'integer',
          minimum: 1,
        },
        pageSize: {
          type: 'integer',
          minimum: 1,
        },
      },
      additionalProperties: false,
    },
    FlowSurfaceListTemplatesResult: {
      type: 'object',
      required: ['rows', 'count', 'page', 'pageSize', 'totalPage'],
      properties: {
        rows: {
          type: 'array',
          items: ref('FlowSurfaceTemplateRow'),
        },
        count: {
          type: 'integer',
        },
        page: {
          type: 'integer',
        },
        pageSize: {
          type: 'integer',
        },
        totalPage: {
          type: 'integer',
        },
      },
      additionalProperties: false,
    },
    FlowSurfaceGetTemplateRequest: {
      type: 'object',
      required: ['uid'],
      properties: {
        uid: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
    FlowSurfaceSaveTemplateRequest: {
      type: 'object',
      required: ['target', 'name', 'description'],
      properties: {
        target: ref('FlowSurfaceWriteTarget'),
        uid: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        saveMode: {
          type: 'string',
          enum: ['duplicate', 'convert'],
          default: 'duplicate',
        },
      },
      additionalProperties: false,
    },
    FlowSurfaceUpdateTemplateRequest: {
      type: 'object',
      required: ['uid', 'name', 'description'],
      properties: {
        uid: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
    FlowSurfaceDestroyTemplateRequest: {
      type: 'object',
      required: ['uid'],
      properties: {
        uid: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
    FlowSurfaceDestroyTemplateResult: {
      type: 'object',
      properties: {
        uid: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
    FlowSurfaceConvertTemplateToCopyRequest: {
      type: 'object',
      required: ['target'],
      properties: {
        target: ref('FlowSurfaceWriteTarget'),
      },
      additionalProperties: false,
    },
    FlowSurfaceConvertTemplateToCopyResult: {
      type: 'object',
      required: ['uid', 'type'],
      properties: {
        uid: {
          type: 'string',
        },
        type: {
          type: 'string',
          enum: ['block', 'fields', 'popup'],
        },
        gridUid: {
          type: 'string',
        },
        popupUid: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
  };
}

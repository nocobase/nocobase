/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { genericModelNodeSchema, layoutParamsSchema } from '../shared';

const filterFormDefaultValuesParamsSchema = {
  type: 'object',
  properties: {
    value: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  additionalProperties: false,
};

export const filterFormBlockModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'FilterFormBlockModel',
  title: 'Filter form block',
  source: 'official',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      formFilterBlockModelSettings: {
        type: 'object',
        properties: {
          layout: layoutParamsSchema,
          defaultValues: filterFormDefaultValuesParamsSchema,
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  subModelSlots: {
    grid: {
      type: 'object',
      use: 'FilterFormGridModel',
      description: 'Primary filter field grid.',
    },
    actions: {
      type: 'array',
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Filter form actions depend on runtime filter-form action registries.',
    },
  },
  skeleton: {
    uid: 'todo-uid',
    use: 'FilterFormBlockModel',
    stepParams: {
      formFilterBlockModelSettings: {
        layout: {
          layout: 'horizontal',
          colon: false,
        },
        defaultValues: {
          value: [],
        },
      },
    },
    subModels: {
      grid: {
        uid: 'todo-filter-grid-uid',
        use: 'FilterFormGridModel',
      },
      actions: [],
    },
  },
  docs: {
    minimalExample: {
      uid: 'filter-form-users',
      use: 'FilterFormBlockModel',
      stepParams: {
        formFilterBlockModelSettings: {
          layout: {
            layout: 'horizontal',
            colon: false,
          },
          defaultValues: {
            value: [],
          },
        },
      },
      subModels: {
        grid: {
          uid: 'filter-grid-users',
          use: 'FilterFormGridModel',
        },
        actions: [],
      },
    },
    commonPatterns: [
      {
        title: 'Filter form with submit/reset actions',
        snippet: {
          subModels: {
            actions: [],
          },
        },
      },
    ],
    dynamicHints: [
      {
        kind: 'dynamic-children',
        path: 'FilterFormBlockModel.subModels.actions',
        message: 'Filter form actions depend on runtime filter-form action registries.',
        'x-flow': {
          slotRules: {
            slotKey: 'actions',
            type: 'array',
          },
          contextRequirements: ['filter form action registry'],
          unresolvedReason: 'runtime-filter-form-actions',
        },
      },
    ],
  },
};

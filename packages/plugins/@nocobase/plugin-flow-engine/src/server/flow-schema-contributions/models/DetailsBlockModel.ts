/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '../../flow-schema-registry';
import {
  collectionResourceSettingsStepParamsSchema,
  createCollectionResourceStepParams,
  createCurrentRecordCollectionPattern,
  genericModelNodeSchema,
  recordActionUses,
  dataScopeParamsSchema,
  layoutParamsSchema,
  linkageRuleValueSchema,
  linkageRulesRefreshParamsSchema,
  sortingRuleParamsSchema,
} from '../shared';

export const detailsBlockModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'DetailsBlockModel',
  title: 'Details block',
  source: 'official',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      ...(((collectionResourceSettingsStepParamsSchema as any).properties || {}) as Record<string, any>),
      detailsSettings: {
        type: 'object',
        properties: {
          layout: layoutParamsSchema,
          dataScope: dataScopeParamsSchema,
          defaultSorting: sortingRuleParamsSchema,
          linkageRules: linkageRuleValueSchema,
        },
        additionalProperties: true,
      },
      paginationChange: {
        type: 'object',
        properties: {
          blockLinkageRulesRefresh: linkageRulesRefreshParamsSchema,
          fieldslinkageRulesRefresh: linkageRulesRefreshParamsSchema,
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  subModelSlots: {
    grid: {
      type: 'object',
      use: 'DetailsGridModel',
      description: 'Primary details field grid.',
    },
    actions: {
      type: 'array',
      uses: recordActionUses,
      dynamic: true,
      schema: genericModelNodeSchema,
      description: 'Details actions depend on runtime record-action registries.',
    },
  },
  skeleton: {
    uid: 'todo-uid',
    use: 'DetailsBlockModel',
    stepParams: createCollectionResourceStepParams(
      {},
      {
        detailsSettings: {
          layout: {
            layout: 'vertical',
            colon: true,
          },
          dataScope: {
            filter: {
              logic: '$and',
              items: [],
            },
          },
          linkageRules: {
            value: [],
          },
        },
      },
    ),
    subModels: {
      grid: {
        uid: 'todo-details-grid-uid',
        use: 'DetailsGridModel',
      },
      actions: [],
    },
  },
  docs: {
    minimalExample: {
      uid: 'details-users',
      use: 'DetailsBlockModel',
      stepParams: createCollectionResourceStepParams(
        {},
        {
          detailsSettings: {
            layout: {
              layout: 'vertical',
              colon: true,
            },
            dataScope: {
              filter: {
                logic: '$and',
                items: [],
              },
            },
            linkageRules: {
              value: [],
            },
          },
        },
      ),
      subModels: {
        grid: {
          uid: 'details-grid-users',
          use: 'DetailsGridModel',
        },
        actions: [],
      },
    },
    commonPatterns: [
      createCurrentRecordCollectionPattern('DetailsBlockModel', {
        detailsSettings: {
          layout: {
            layout: 'vertical',
            colon: true,
          },
        },
      }),
      {
        title: 'Details block with record actions',
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
        path: 'DetailsBlockModel.subModels.actions',
        message: 'Details actions depend on runtime record-action registries and collection context.',
        'x-flow': {
          slotRules: {
            slotKey: 'actions',
            type: 'array',
            allowedUses: recordActionUses,
          },
          contextRequirements: ['record action registry', 'collection metadata'],
          unresolvedReason: 'runtime-details-actions',
        },
      },
    ],
  },
};

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
  aclCheckRefreshParamsSchema,
  emptyObjectSchema,
  linkageRuleValueSchema,
  linkageRulesRefreshParamsSchema,
} from '../shared';

export const actionModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'ActionModel',
  title: 'Action',
  source: 'official',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      buttonSettings: {
        type: 'object',
        properties: {
          general: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              tooltip: { type: 'string' },
              type: {
                type: 'string',
                enum: ['default', 'primary', 'dashed', 'link', 'text'],
              },
              danger: { type: 'boolean' },
              icon: { type: ['string', 'null'] },
              color: { type: 'string' },
            },
            additionalProperties: false,
          },
          linkageRules: linkageRuleValueSchema,
        },
        additionalProperties: true,
      },
      buttonAclSettings: {
        type: 'object',
        properties: {
          aclCheck: emptyObjectSchema,
        },
        additionalProperties: true,
      },
      paginationChange: {
        type: 'object',
        properties: {
          aclCheckRefresh: aclCheckRefreshParamsSchema,
          linkageRulesRefresh: linkageRulesRefreshParamsSchema,
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  flowRegistrySchema: {
    type: 'object',
    properties: {
      buttonSettings: {
        type: 'object',
        properties: {
          key: { const: 'buttonSettings' },
          steps: {
            type: 'object',
            properties: {
              general: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                },
                additionalProperties: true,
              },
              linkageRules: {
                type: 'object',
                properties: {
                  use: { const: 'actionLinkageRules' },
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
  skeleton: {
    uid: 'todo-uid',
    use: 'ActionModel',
    stepParams: {
      buttonSettings: {
        general: {
          title: 'Action',
          type: 'default',
          danger: false,
        },
        linkageRules: {
          value: [],
        },
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'action-primary-save',
      use: 'ActionModel',
      stepParams: {
        buttonSettings: {
          general: {
            title: 'Save',
            type: 'primary',
            danger: false,
          },
          linkageRules: {
            value: [],
          },
        },
      },
    },
    commonPatterns: [
      {
        title: 'Primary submit action',
        snippet: {
          stepParams: {
            buttonSettings: {
              general: {
                title: 'Save',
                type: 'primary',
              },
            },
          },
        },
      },
      {
        title: 'Danger action',
        snippet: {
          stepParams: {
            buttonSettings: {
              general: {
                title: 'Delete',
                danger: true,
              },
            },
          },
        },
      },
    ],
    antiPatterns: [
      {
        title: 'Do not depend on hidden dynamic fields',
        description: 'buttonSettings.general fields are gated by model flags such as enableEditIcon / enableEditColor.',
      },
    ],
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'ActionModel.stepParams.buttonSettings.general',
        message: 'Editable fields depend on ActionModel runtime flags such as enableEditTitle and enableEditIcon.',
        'x-flow': {
          contextRequirements: ['enableEditTitle', 'enableEditTooltip', 'enableEditIcon', 'enableEditColor'],
          unresolvedReason: 'runtime-action-editability-flags',
          recommendedFallback: {
            title: 'Action',
            type: 'default',
            danger: false,
          },
        },
      },
    ],
  },
};

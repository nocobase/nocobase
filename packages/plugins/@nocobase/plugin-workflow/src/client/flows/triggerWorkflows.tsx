/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppendsTreeSelect, CollectionBlockModel, FormSubmitActionModel, joinCollectionName } from '@nocobase/client';
import { TriggerWorkflowSelect } from '@nocobase/plugin-workflow/client';
import { NAMESPACE } from '../locale';

type SchemaOptions = {
  optionFilter?: (option: { key: string; type: string; config: any }) => boolean;
  usingContext?: boolean;
  filter?: Record<string, any>;
};

export function createTriggerWorkflowsSchema({ optionFilter, usingContext = true, filter }: SchemaOptions = {}) {
  return (ctx) => {
    const { collection: collectionModel } = ctx.blockModel as CollectionBlockModel;
    const workflowCollection = collectionModel
      ? joinCollectionName(collectionModel.dataSource.name, collectionModel.name)
      : null;
    return {
      group: {
        type: 'array',
        'x-decorator': 'FormItem',
        'x-component': 'ArrayTable',
        items: {
          type: 'object',
          properties: {
            sort: {
              type: 'void',
              'x-component': 'ArrayTable.Column',
              'x-component-props': { width: 50, title: '', align: 'center' },
              properties: {
                sort: {
                  type: 'void',
                  'x-component': 'ArrayTable.SortHandle',
                },
              },
            },
            ...(usingContext
              ? {
                  context: {
                    type: 'void',
                    'x-component': 'ArrayTable.Column',
                    'x-component-props': {
                      title: `{{t('Trigger data context', { ns: 'workflow' })}}`,
                      width: 200,
                    },
                    properties: {
                      context: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': AppendsTreeSelect,
                        'x-component-props': {
                          placeholder: `{{t('Select context', { ns: 'workflow' })}}`,
                          popupMatchSelectWidth: false,
                          collection: workflowCollection,
                          filter(field) {
                            return ['belongsTo', 'hasOne'].includes(field.type);
                          },
                          rootOption: {
                            label: `{{t('Full form data', { ns: 'workflow' })}}`,
                            value: '',
                          },
                          allowClear: false,
                          // loadData: buttonAction === 'destroy' ? null : undefined,
                        },
                        default: '',
                      },
                    },
                  },
                }
              : {}),
            workflowKey: {
              type: 'void',
              'x-component': 'ArrayTable.Column',
              'x-component-props': {
                title: `{{t('Workflow', { ns: 'workflow' })}}`,
              },
              properties: {
                workflowKey: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': TriggerWorkflowSelect,
                  'x-component-props': {
                    filter,
                    ...(usingContext
                      ? {
                          collection: collectionModel,
                        }
                      : {}),
                    scope: 'form',
                    placeholder: `{{t('Select workflow', { ns: 'workflow' })}}`,
                    optionFilter: optionFilter?.bind(ctx),
                  },
                  required: true,
                },
              },
            },
            operations: {
              type: 'void',
              'x-component': 'ArrayTable.Column',
              'x-component-props': {
                width: 32,
              },
              properties: {
                remove: {
                  type: 'void',
                  'x-component': 'ArrayTable.Remove',
                },
              },
            },
          },
        },
        properties: {
          add: {
            type: 'void',
            title: `{{t('Add workflow', { ns: 'workflow' })}}`,
            'x-component': 'ArrayTable.Addition',
          },
        },
      },
    };
  };
}

FormSubmitActionModel.registerFlow({
  key: 'formTriggerWorkflowsActionSettings',
  title: `{{t('Bind workflows', { ns: 'workflow' })}}`,
  steps: {
    setTriggerWorkflows: {
      title: `{{t('Bind workflows', { ns: "${NAMESPACE}" })}}`,
      uiSchema: createTriggerWorkflowsSchema(),
      handler(ctx, params) {
        const triggerWorkflows = params.group?.length
          ? params.group.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
          : undefined;
        ctx.model.setSaveRequestConfig({
          params: {
            triggerWorkflows,
          },
        });
      },
    },
  },
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import { flowModelTemplatesCollection } from '../collections/flowModelTemplates';
import { tStr } from '../locale';

export const flowModelTemplateEditActionSchema: ISchema = {
  type: 'void',
  title: tStr('Edit'),
  'x-component': 'Action.Link',
  'x-component-props': {
    openMode: 'drawer',
  },
  properties: {
    drawer: {
      type: 'void',
      title: tStr('Edit template'),
      'x-component': 'Action.Drawer',
      'x-decorator': 'FormV2',
      'x-use-decorator-props': 'useFlowModelTemplateEditFormProps',
      properties: {
        name: {
          type: 'string',
          title: tStr('Template name'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        description: {
          type: 'string',
          title: tStr('Template description'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
          'x-component-props': {
            rows: 4,
          },
        },
        footer: {
          type: 'void',
          'x-component': 'Action.Drawer.Footer',
          properties: {
            cancel: {
              title: '{{t("Cancel")}}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ cm.useCancelAction }}',
              },
            },
            submit: {
              title: '{{t("Submit")}}',
              'x-component': 'Action',
              'x-use-component-props': 'useFlowModelTemplateEditActionProps',
              'x-component-props': {
                type: 'primary',
              },
            },
          },
        },
      },
    },
  },
};

export const createFlowModelTemplatesSchema = (filter?: Record<string, any>): ISchema => ({
  type: 'void',
  name: uid(),
  'x-component': 'CardItem',
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: flowModelTemplatesCollection.name,
    action: 'list',
    params: {
      sort: '-createdAt',
      pageSize: 50,
      ...(filter ? { filter } : {}),
    },
    showIndex: true,
    rowKey: flowModelTemplatesCollection.filterTargetKey,
  },
  properties: {
    actions: {
      type: 'void',
      'x-component': 'ActionBar',
      'x-component-props': {
        style: {
          marginBottom: 16,
        },
      },
      properties: {
        filter: {
          type: 'void',
          title: '{{ t("Filter") }}',
          default: {
            $and: [{ name: { $includes: '' } }],
          },
          'x-action': 'filter',
          'x-component': 'Filter.Action',
          'x-use-component-props': 'useFilterActionProps',
          'x-component-props': {
            icon: 'FilterOutlined',
          },
          'x-align': 'left',
        },
        search: {
          type: 'void',
          'x-component': 'Input.Search',
          'x-component-props': {
            allowClear: true,
          },
          'x-use-component-props': 'useFlowModelTemplateSearchProps',
          'x-align': 'left',
        },
        refresh: {
          type: 'void',
          title: '{{ t("Refresh") }}',
          'x-component': 'Action',
          'x-use-component-props': 'useRefreshActionProps',
          'x-component-props': {
            icon: 'ReloadOutlined',
          },
          'x-align': 'right',
        },
      },
    },
    table: {
      type: 'array',
      'x-component': 'TableV2',
      'x-use-component-props': 'useTableBlockProps',
      'x-component-props': {
        rowKey: flowModelTemplatesCollection.filterTargetKey,
        pagination: {
          pageSize: 50,
        },
      },
      properties: {
        name: {
          type: 'void',
          title: tStr('Template name'),
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 200,
          },
          properties: {
            name: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        description: {
          type: 'void',
          title: tStr('Template description'),
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 240,
          },
          properties: {
            description: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        dataSourceKey: {
          type: 'void',
          title: 'Data source',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 140,
          },
          properties: {
            dataSourceKey: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        collectionName: {
          type: 'void',
          title: 'Collection',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 160,
          },
          properties: {
            collectionName: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        usageCount: {
          type: 'void',
          title: tStr('Usage count'),
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 120,
          },
          properties: {
            usageCount: {
              type: 'number',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        actions: {
          type: 'void',
          title: tStr('Actions'),
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 160,
            align: 'left',
          },
          properties: {
            actions: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                split: '|',
              },
              properties: {
                edit: flowModelTemplateEditActionSchema,
                delete: {
                  type: 'void',
                  title: tStr('Delete'),
                  'x-component': 'Action.Link',
                  'x-use-component-props': 'useFlowModelTemplateDeleteActionProps',
                  'x-component-props': {
                    danger: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { ISchema } from '@nocobase/client';
import { publicFormsCollection } from '../collections';
import { ConfigureLink } from '../components/ConfigureLink';
import { createActionSchema } from './createActionSchema';
import { editActionSchema } from './editActionSchema';
import { NAMESPACE } from '../locale';

export const publicFormsSchema: ISchema = {
  type: 'void',
  name: uid(),
  'x-component': 'CardItem',
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: publicFormsCollection.name,
    action: 'list',
    params: {
      sort: '-createdAt',
      appends: ['createdBy', 'updatedBy'],
    },
    showIndex: true,
    dragSort: false,
    rowKey: 'key',
  },
  properties: {
    actions: {
      type: 'void',
      'x-component': 'ActionBar',
      'x-component-props': {
        style: {
          marginBottom: 20,
        },
      },
      properties: {
        filter: {
          type: 'void',
          title: '{{ t("Filter") }}',
          default: {
            $and: [{ title: { $includes: '' } }],
          },
          'x-action': 'filter',
          'x-component': 'Filter.Action',
          'x-use-component-props': 'useFilterActionProps',
          'x-component-props': {
            icon: 'FilterOutlined',
          },
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
        },
        destroy: {
          title: '{{ t("Delete") }}',
          'x-action': 'destroy',
          'x-component': 'Action',
          'x-use-component-props': 'useBulkDestroyActionProps',
          'x-component-props': {
            icon: 'DeleteOutlined',
            confirm: {
              title: "{{t('Delete record')}}",
              content: "{{t('Are you sure you want to delete it?')}}",
            },
          },
        },
        createActionSchema,
      },
    },
    table: {
      type: 'array',
      'x-component': 'TableV2',
      'x-use-component-props': 'useTableBlockProps',
      'x-component-props': {
        rowKey: publicFormsCollection.filterTargetKey,
        rowSelection: {
          type: 'checkbox',
        },
      },
      properties: {
        title: {
          type: 'void',
          title: '{{ t("Title") }}',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 170,
          },
          properties: {
            title: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        collection: {
          type: 'void',
          title: '{{ t("Collection") }}',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 160,
          },
          properties: {
            collection: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        column2: {
          type: 'void',
          title: `{{t("Type", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 100,
          },
          properties: {
            type: {
              type: 'string',
              'x-component': 'Radio.Group',
              'x-pattern': 'readPretty',
              enum: '{{ formTypes }}',
            },
          },
        },
        column3: {
          type: 'void',
          title: '{{ t("Enabled") }}',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 80,
          },
          properties: {
            enabled: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        description: {
          type: 'void',
          title: '{{ t("Description") }}',
          'x-component': 'TableV2.Column',
          properties: {
            description: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        // column4: {
        //   type: 'void',
        //   'x-component': 'TableV2.Column',
        //   title: "{{t('Created at')}}",
        //   properties: {
        //     createdAt: {
        //       type: 'date',
        //       'x-component': 'CollectionField',
        //       'x-pattern': 'readPretty',
        //     },
        //   },
        // },
        // column5: {
        //   type: 'void',
        //   'x-component': 'TableV2.Column',
        //   title: '{{t("Created by")}}',
        //   'x-component-props': {
        //     width: 110,
        //   },
        //   properties: {
        //     createdBy: {
        //       type: 'object',
        //       'x-component': 'CollectionField',
        //       'x-pattern': 'readPretty',
        //     },
        //   },
        // },
        // column6: {
        //   type: 'void',
        //   'x-component': 'TableV2.Column',
        //   title: "{{t('Updated at')}}",
        //   properties: {
        //     updatedAt: {
        //       type: 'string',
        //       'x-component': 'CollectionField',
        //       'x-pattern': 'readPretty',
        //     },
        //   },
        // },
        // column7: {
        //   type: 'void',
        //   'x-component': 'TableV2.Column',
        //   title: '{{t("Last updated by")}}',
        //   'x-component-props': {
        //     width: 110,
        //   },
        //   properties: {
        //     updatedBy: {
        //       type: 'date',
        //       'x-component': 'CollectionField',
        //       'x-pattern': 'readPretty',
        //     },
        //   },
        // },
        actions: {
          type: 'void',
          title: '{{ t("Actions") }}',
          'x-component': 'TableV2.Column',
          properties: {
            actions: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                split: '|',
              },
              properties: {
                configure: {
                  type: 'void',
                  title: 'Configure',
                  'x-component': ConfigureLink,
                },
                editActionSchema,
                delete: {
                  type: 'void',
                  title: "{{t('Delete')}}",
                  'x-component': 'Action.Link',
                  'x-use-component-props': 'useDeleteActionProps',
                },
              },
            },
          },
        },
      },
    },
  },
};

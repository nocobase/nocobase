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
import { blocksTemplatesCollection } from '../collections/blocksTemplates';
import { NAMESPACE } from '../constants';
import { createActionSchema } from './createActionSchema';
import { ConfigureLink } from '../components/ConfigureLink';
import { editActionSchema } from './editActionSchema';

export const blocksTemplatesSchema: ISchema = {
  type: 'void',
  name: uid(),
  'x-component': 'CardItem',
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: blocksTemplatesCollection.name,
    action: 'list',
    params: {
      sort: '-createdAt',
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
        rowKey: blocksTemplatesCollection.filterTargetKey,
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
                duplicate: {
                  type: 'void',
                  title: 'Duplicate',
                  'x-component': 'Action.Link',
                  'x-use-component-props': 'useDuplicateActionProps',
                },
                configure: {
                  type: 'void',
                  title: 'Configure',
                  'x-component': ConfigureLink,
                },
                editActionSchema,
                delete: {
                  type: 'void',
                  title: 'Delete',
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

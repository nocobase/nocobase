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
    },
    showIndex: true,
    dragSort: false,
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
          title: 'Title',
          'x-component': 'TableV2.Column',
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
          title: 'Collection',
          'x-component': 'TableV2.Column',
          properties: {
            collection: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        description: {
          type: 'void',
          title: 'Description',
          'x-component': 'TableV2.Column',
          properties: {
            description: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        column5: {
          type: 'void',
          title: 'Type',
          'x-component': 'TableV2.Column',
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
          title: 'Enabled',
          'x-component': 'TableV2.Column',
          properties: {
            enabled: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        actions: {
          type: 'void',
          title: 'Actions',
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

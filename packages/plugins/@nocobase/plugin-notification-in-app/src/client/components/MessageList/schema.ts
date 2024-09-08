/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { InAppMessagesDefinition } from '../../../types';
import { uid } from '@formily/shared';

export const messagelistSchema: ISchema = {
  type: 'void',
  name: uid(),
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: InAppMessagesDefinition.name,
    action: 'list',
    params: {
      sort: ['-createdAt'],
    },
    showIndex: true,
    dragSort: false,
  },
  'x-component': 'CardItem',
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
        refresh: {
          title: "{{t('Refresh')}}",
          'x-action': 'refresh',
          'x-component': 'Action',
          'x-use-component-props': 'useRefreshActionProps',
          'x-component-props': {
            icon: 'ReloadOutlined',
          },
        },
        filter: {
          'x-action': 'filter',
          'x-component': 'Filter.Action',
          title: "{{t('Filter')}}",
          'x-use-component-props': 'useFilterActionProps',
          'x-component-props': {
            icon: 'FilterOutlined',
          },
          'x-align': 'left',
        },
      },
    },
    table: {
      type: 'array',
      'x-component': 'TableV2',
      'x-use-component-props': 'useTableBlockProps',
      'x-component-props': {
        rowKey: 'id',
      },
      properties: {
        id: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: '{{t("ID")}}',
          properties: {
            id: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        title: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: '{{t("Title")}}',
          properties: {
            title: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        status: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: '{{t("Status")}}',
          properties: {
            status: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        createdAt: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: '{{t("Created at")}}',
          properties: {
            createdAt: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
              'x-component-props': {
                dateFormat: 'YYYY-MM-DD',
                showTime: true,
                timeFormat: 'HH:mm:ss',
              },
            },
          },
        },
        actions: {
          type: 'void',
          title: '{{t("Actions")}}',
          'x-component': 'TableV2.Column',
          properties: {
            view: {
              type: 'void',
              'x-uid': 'message-detail',
              title: '{{ t("View") }}',
              // 'x-action': 'view',
              'x-settings': 'actionSettings:view',
              'x-component': 'Action.Link',
              // 'x-action-context': {
              //   dataSource: 'main',
              //   collection: InAppMessagesDefinition.name,
              // },
              // 'x-component-props': {
              //   openMode: 'drawer',
              // },
              'x-decorator': 'ACLActionProvider',
              properties: {
                drawer: {
                  type: 'void',
                  title: 'View',
                  'x-component': 'Action.Drawer',
                  // 'x-component-props': {
                  //   className: 'nb-action-popup',
                  // },
                  properties: {
                    card: {
                      type: 'void',
                      'x-component': 'Details',
                      'x-use-component-props': 'useDetailsProps',
                      'x-decorator': 'DetailsBlockProvider',
                      'x-use-decorator-props': 'useDetailsDecoratorProps',
                      'x-decorator-props': {
                        dataSource: 'main',
                        collection: InAppMessagesDefinition.name,
                        readPretty: true,
                        action: 'get',
                      },
                      properties: {
                        id: {
                          type: 'string',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-read-pretty': true,
                        },
                        createdAt: {
                          type: 'string',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-component-props': {
                            dateFormat: 'YYYY-MM-DD',
                            showTime: true,
                            timeFormat: 'HH:mm:ss',
                            'x-read-pretty': true,
                          },
                        },
                        title: {
                          type: 'string',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-read-pretty': true,
                        },
                        content: {
                          type: 'string',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-read-pretty': true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

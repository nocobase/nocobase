/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import collection from '../../../../collections/messageLog';
import { COLLECTION_NAME } from '../../../../constant';

export const detailFromProperties = {
  id: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-disabled': true,
    'x-read-pretty': true,
  },
  channelName: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-read-pretty': true,
  },
  channelTitle: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-read-pretty': true,
  },
  notificationType: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-read-pretty': true,
  },
  triggerFrom: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-read-pretty': true,
  },
  status: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-read-pretty': true,
  },
  message: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-read-pretty': true,
  },
  reason: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-read-pretty': true,
    'x-reactions': [
      {
        dependencies: ['status'],
        fulfill: {
          state: {
            visible: '{{$deps[0] === "failure"}}',
          },
        },
      },
    ],
  },
  createdAt: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
    'x-read-pretty': true,
    'x-component-props': {
      dateFormat: 'YYYY-MM-DD',
      showTime: true,
      timeFormat: 'HH:mm:ss',
    },
  },
};

export const messageLogsManagerSchema: ISchema = {
  type: 'void',
  'x-uid': 't8tkmt2b9dd',
  name: COLLECTION_NAME.logs,
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: collection.name,
    action: 'list',
    params: {
      sort: ['-createdAt'],
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
            nonfilterable: ['receiver', 'reason'],
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
        createdAt: {
          type: 'void',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 100,
          },
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
        triggerFrom: {
          type: 'void',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 100,
          },
          title: '{{t("Trigger from")}}',
          properties: {
            triggerFrom: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        // channelName: {
        //   type: 'void',
        //   'x-component': 'TableV2.Column',
        //   'x-component-props': {
        //     width: 100,
        //   },
        //   title: '{{t("Channel name")}}',
        //   properties: {
        //     channelName: {
        //       type: 'string',
        //       'x-component': 'CollectionField',
        //       'x-read-pretty': true,
        //       'x-component-props': {
        //         ellipsis: true,
        //       },
        //     },
        //   },
        // },
        channelTitle: {
          type: 'void',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 100,
          },
          title: '{{t("Channel display name")}}',
          properties: {
            channelTitle: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
            },
          },
        },
        notificationType: {
          title: '{{t("Notification type")}}',
          type: 'void',
          'x-component': 'TableV2.Column',
          properties: {
            notificationType: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        status: {
          type: 'void',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 100,
          },
          title: '{{t("Status")}}',
          properties: {
            status: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        reason: {
          type: 'void',
          'x-component': 'TableV2.Column',
          'x-component-props': {
            width: 200,
          },
          title: '{{t("Failed reason")}}',
          properties: {
            reason: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
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
              title: '{{t("View")}}',
              'x-component': 'Action.Link',
              'x-component-props': {
                openMode: 'drawer',
              },
              properties: {
                drawer: {
                  type: 'void',
                  title: '{{t("Log detail")}}',
                  'x-component': 'Action.Drawer',
                  properties: {
                    detail: {
                      type: 'void',
                      'x-component': 'FormV2',
                      'x-use-component-props': 'useEditFormProps',
                      'x-decorator': 'BlockItemCard',
                      properties: {
                        ...detailFromProperties,
                        footer: {
                          type: 'void',
                          'x-component': 'Action.Drawer.Footer',
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

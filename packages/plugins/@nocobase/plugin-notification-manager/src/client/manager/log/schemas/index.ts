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

export const messageLogsManagerSchema: ISchema = {
  type: 'void',
  'x-uid': 't8tkmt2b9dd',
  name: COLLECTION_NAME.logs,
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: collection.name,
    action: 'list',
    params: {
      appends: 'channel',
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
        triggerFrom: {
          type: 'void',
          'x-component': 'TableV2.Column',
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
        // channel: {
        //   type: 'void',
        //   'x-decorator': 'TableV2.Column.Decorator',
        //   'x-component': 'TableV2.Column',
        //   title: '{{t("Channel title")}}',
        //   properties: {
        //     'channel.title': {
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
          title: '{{t("Channel title")}}',
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
        receiver: {
          type: 'void',
          'x-decorator': 'TableV2.Column.Decorator',
          'x-component': 'TableV2.Column',
          title: '{{t("Receiver")}}',
          properties: {
            receiver: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
              'x-component-props': {
                ellipsis: true,
              },
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
      },
    },
  },
};

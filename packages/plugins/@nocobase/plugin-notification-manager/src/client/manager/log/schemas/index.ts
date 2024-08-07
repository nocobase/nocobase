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
import { useTranslation } from 'react-i18next';

export const messageLogsManagerSchema: ISchema = {
  type: 'void',
  'x-uid': 't8tkmt2b9dd',
  name: COLLECTION_NAME.messageLogs,
  'x-decorator': 'TableBlockProvider',
  'x-decorator-props': {
    collection: collection.name,
    action: 'list',
    showIndex: true,
    dragSort: false,
  },
  properties: {
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
          title: 'id',
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
          title: 'triggerFrom',
          properties: {
            triggerFrom: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        status: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: 'status',
          properties: {
            status: {
              type: 'string',
              'x-component': 'CollectionField',
              'x-pattern': 'readPretty',
            },
          },
        },
        // channel: {
        //   type: 'void',
        //   'x-component': 'TableV2.Column',
        //   title: 'channelId',
        //   properties: {
        //     channelId: {
        //       type: 'number',
        //       'x-component': 'CollectionField',
        //       'x-collection-field': 'messageLogs.channelId',
        //       'x-pattern': 'readPretty',
        //     },
        //   },
        // },
        createdAt: {
          type: 'void',
          'x-component': 'TableV2.Column',
          title: 'createdAt',
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

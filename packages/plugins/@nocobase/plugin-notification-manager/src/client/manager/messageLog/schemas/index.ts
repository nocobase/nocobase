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
  'x-use-decorator-props': 'useTableBlockDecoratorProps',
  'x-acl-action': `${COLLECTION_NAME.messageLogs}:list`,
  'x-decorator-props': {
    collection,
    action: 'list',
    params: {
      pageSize: 10,
      filter: {
        $and: [
          {
            messageId: {
              $eq: '{{$nPopupRecord.id}}',
            },
          },
        ],
      },
    },
  },
  properties: {
    table: {
      type: 'array',
      'x-uid': 'COLLECTION_NAME.messageLogs',
      'x-component': 'TableV2',
      'x-use-component-props': 'useTableBlockProps',
      'x-component-props': {
        rowKey: 'id',
      },
      properties: {
        id: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            id: {
              type: 'number',
              'x-component': 'CollectionField',
              'x-collection-field': `${COLLECTION_NAME.messageLogs}.id`,
              'x-read-pretty': true,
            },
          },
        },
        messageId: {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-component': 'Table.Column',
          properties: {
            messageId: {
              'x-component': 'CollectionField',
              'x-collection-field': `${COLLECTION_NAME.messageLogs}.messageId`,
              'x-component-props': {},
              'x-read-pretty': true,
              'x-decorator': null,
              'x-decorator-props': {
                labelStyle: {
                  display: 'none',
                },
              },
            },
          },
        },
      },
    },
  },
};

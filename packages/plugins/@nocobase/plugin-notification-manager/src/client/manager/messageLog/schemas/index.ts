/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import collection from '../../../../collections/message';
import { COLLECTION_NAME } from '../../../../constant';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { MessageScopeNames } from '../types';

export const messageLogsManagerSchema: ISchema = {
  type: 'void',
  name: COLLECTION_NAME.messageLogs,
  'x-decorator': 'ResourceActionProvider',
  'x-decorator-props': {
    collection,
    resourceName: COLLECTION_NAME.messageLogs,
    dragSort: false,
    request: {
      resource: COLLECTION_NAME.messageLogs,
      action: 'list',
      params: {
        pageSize: 10,
        appends: [],
      },
    },
  },
  properties: {
    table: {
      type: 'void',
      'x-uid': 'COLLECTION_NAME.messageLogs',
      'x-component': 'Table.Void',
      'x-component-props': {
        rowKey: 'id',
        useDataSource: '{{ cm.useDataSourceFromRAC }}',
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
              type: 'number',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
      },
    },
  },
};

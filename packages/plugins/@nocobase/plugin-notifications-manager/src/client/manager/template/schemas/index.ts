/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, SchemaProperties } from '@formily/react';
import collection from '../../../../collections/template';
import { COLLECTION_NAME } from '../../../../constant';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { tableSchema } from './table';

export const templateSchema: ISchema = {
  type: 'void',
  name: COLLECTION_NAME.templates,
  'x-decorator': 'ResourceActionProvider',
  'x-decorator-props': {
    collection,
    resourceName: COLLECTION_NAME.templates,
    dragSort: true,
    request: {
      resource: COLLECTION_NAME.templates,
      action: 'list',
      params: {
        pageSize: 50,
        sort: 'sort',
        appends: [],
      },
    },
  },
  'x-component': 'CollectionProvider_deprecated',
  'x-component-props': {
    collection,
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
        delete: {
          type: 'void',
          title: '{{t("Delete")}}',
          'x-component': 'Action',
          'x-component-props': {
            icon: 'DeleteOutlined',
            useAction: '{{ cm.useBulkDestroyAction }}',
            confirm: {
              title: "{{t('Delete')}}",
              content: "{{t('Are you sure you want to delete it?')}}",
            },
          },
        },
        create: {
          type: 'void',
          title: '{{t("Add new")}}',
          'x-component': 'AddNew',
          'x-component-props': {
            type: 'primary',
          },
        },
      },
    },
    table: tableSchema,
  },
};

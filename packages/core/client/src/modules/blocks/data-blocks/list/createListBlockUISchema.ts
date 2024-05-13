/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';

export const createListBlockUISchema = (options: {
  dataSource: string;
  collectionName?: string;
  association?: string;
  templateSchema?: ISchema;
  rowKey?: string;
}): ISchema => {
  const { collectionName, dataSource, association, templateSchema, rowKey } = options;
  const resourceName = association || collectionName;

  return {
    type: 'void',
    'x-acl-action': `${resourceName}:view`,
    'x-decorator': 'List.Decorator',
    'x-use-decorator-props': 'useListBlockDecoratorProps',
    'x-decorator-props': {
      collection: collectionName,
      dataSource,
      association,
      readPretty: true,
      action: 'list',
      params: {
        pageSize: 10,
      },
      runWhenParamsChanged: true,
      rowKey,
    },
    'x-component': 'CardItem',
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:list',
    properties: {
      actionBar: {
        type: 'void',
        'x-initializer': 'list:configureActions',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 'var(--nb-spacing)',
          },
        },
      },
      list: {
        type: 'array',
        'x-component': 'List',
        'x-use-component-props': 'useListBlockProps',
        properties: {
          item: {
            type: 'object',
            'x-component': 'List.Item',
            'x-read-pretty': true,
            'x-use-component-props': 'useListItemProps',
            properties: {
              grid: templateSchema || {
                type: 'void',
                'x-component': 'Grid',
                'x-initializer': 'details:configureFields',
              },
              actionBar: {
                type: 'void',
                'x-align': 'left',
                'x-initializer': 'list:configureItemActions',
                'x-component': 'ActionBar',
                'x-use-component-props': 'useListActionBarProps',
                'x-component-props': {
                  layout: 'one-column',
                },
              },
            },
          },
        },
      },
    },
  };
};

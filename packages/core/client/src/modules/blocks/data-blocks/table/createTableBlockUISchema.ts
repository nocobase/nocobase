/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export const createTableBlockUISchema = (options: {
  dataSource: string;
  collectionName?: string;
  association?: string;
}): ISchema => {
  const { collectionName, dataSource, association } = options;

  if (!dataSource) {
    throw new Error('dataSource is required');
  }

  return {
    type: 'void',
    'x-decorator': 'TableBlockProvider',
    'x-acl-action': `${association || collectionName}:list`,
    'x-use-decorator-props': 'useTableBlockDecoratorProps',
    'x-decorator-props': {
      collection: collectionName,
      association,
      dataSource,
      action: 'list',
      params: {
        pageSize: 20,
      },
      showIndex: true,
      dragSort: false,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:table',
    'x-component': 'CardItem',
    'x-filter-targets': [],
    properties: {
      actions: {
        type: 'void',
        'x-initializer': 'table:configureActions',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 'var(--nb-spacing)',
          },
        },
        properties: {},
      },
      [uid()]: {
        type: 'array',
        'x-initializer': 'table:configureColumns',
        'x-component': 'TableV2',
        'x-use-component-props': 'useTableBlockProps',
        'x-component-props': {
          rowKey: 'id',
          rowSelection: {
            type: 'checkbox',
          },
        },
        properties: {
          actions: {
            type: 'void',
            title: '{{ t("Actions") }}',
            'x-action-column': 'actions',
            'x-decorator': 'TableV2.Column.ActionBar',
            'x-component': 'TableV2.Column',
            'x-toolbar': 'TableColumnSchemaToolbar',
            'x-initializer': 'table:configureItemActions',
            'x-settings': 'fieldSettings:TableColumn',
            'x-toolbar-props': {
              initializer: 'table:configureItemActions',
            },
            properties: {
              [uid()]: {
                type: 'void',
                'x-decorator': 'DndContext',
                'x-component': 'Space',
                'x-component-props': {
                  split: '|',
                },
              },
            },
          },
        },
      },
    },
  };
};

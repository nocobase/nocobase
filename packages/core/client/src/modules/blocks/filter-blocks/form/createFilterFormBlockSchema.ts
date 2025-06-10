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

export const createFilterFormBlockSchema = (options: {
  collectionName: string;
  dataSource: string;
  templateSchema?: ISchema;
}) => {
  const { collectionName, dataSource, templateSchema } = options;

  if (!collectionName || !dataSource) {
    throw new Error('collectionName and dataSource are required');
  }

  const schema: ISchema = {
    type: 'void',
    'x-decorator': 'FilterFormBlockProvider',
    'x-use-decorator-props': 'useFilterFormBlockDecoratorProps',
    'x-decorator-props': {
      dataSource,
      collection: collectionName,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:filterForm',
    'x-component': 'CardItem',
    // 保存当前筛选区块所能过滤的数据区块
    'x-filter-targets': [],
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-use-component-props': 'useFilterFormBlockProps',
        properties: {
          grid: templateSchema || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'filterForm:configureFields',
          },
          [uid()]: {
            type: 'void',
            'x-initializer': 'filterForm:configureActions',
            'x-component': 'ActionBar',
            'x-component-props': {
              layout: 'one-column',
              style: {
                float: 'right',
                overflow: 'hidden',
              },
            },
          },
        },
      },
    },
  };
  return schema;
};

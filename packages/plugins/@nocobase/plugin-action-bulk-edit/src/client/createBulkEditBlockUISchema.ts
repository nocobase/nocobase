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

/**
 * 创建批量编辑表单的 UI Schema
 * @returns
 */
export function createBulkEditBlockUISchema(options: {
  collectionName: string;
  dataSource: string;
  association?: string;
}): ISchema {
  const { collectionName, association, dataSource } = options;
  const resourceName = association || collectionName;

  if (!collectionName || !dataSource) {
    throw new Error('collectionName and dataSource are required');
  }

  const schema: ISchema = {
    type: 'void',
    'x-acl-action-props': {
      skipScopeCheck: true,
    },
    'x-acl-action': `${resourceName}:update`,
    'x-decorator': 'FormBlockProvider',
    'x-decorator-props': {
      dataSource,
      collection: collectionName,
      association,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:bulkEditForm',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-use-component-props': 'useCreateFormBlockProps',
        properties: {
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'bulkEditForm:configureFields',
            properties: {},
          },
          [uid()]: {
            type: 'void',
            'x-initializer': 'bulkEditForm:configureActions',
            'x-component': 'ActionBar',
            'x-component-props': {
              layout: 'one-column',
              style: {
                marginTop: 24,
              },
            },
          },
        },
      },
    },
  };
  return schema;
}

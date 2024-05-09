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

export function createDetailsUISchema(options: {
  dataSource: string;
  collectionName?: string;
  association?: string;
  templateSchema?: ISchema;
  /**
   * 如果为 true，则表示当前创建的区块 record 就是 useRecord 返回的 record
   */
  isCurrent?: boolean;
}): ISchema {
  const { collectionName, dataSource, association, templateSchema } = options;
  const resourceName = association || collectionName;
  const isCurrentObj = options.isCurrent ? { 'x-is-current': true } : {};

  if (!dataSource) {
    throw new Error('dataSource are required');
  }

  return {
    type: 'void',
    'x-acl-action': `${resourceName}:get`,
    'x-decorator': 'DetailsBlockProvider',
    'x-use-decorator-props': 'useDetailsDecoratorProps',
    'x-decorator-props': {
      dataSource,
      collection: collectionName,
      association,
      readPretty: true,
      action: 'get',
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:details',
    'x-component': 'CardItem',
    ...isCurrentObj,
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Details',
        'x-read-pretty': true,
        'x-use-component-props': 'useDetailsProps',
        properties: {
          [uid()]: {
            type: 'void',
            'x-initializer': 'details:configureActions',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            properties: {},
          },
          grid: templateSchema || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'details:configureFields',
            properties: {},
          },
        },
      },
    },
  };
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { ISchema } from '@formily/react';

export const createCommentBlockUISchema = (options: {
  dataSource: string;
  collectionName?: string;
  association?: string;
  rowKey?: string;
}): ISchema => {
  const { collectionName, dataSource, association, rowKey } = options;

  return {
    type: 'void',
    'x-acl-action': `${association || collectionName}:view`,
    'x-decorator': 'Comment.Decorator',
    'x-use-decorator-props': 'useCommentBlockDecoratorProps',
    'x-decorator-props': {
      collection: collectionName,
      dataSource,
      association,
      readPretty: true,
      action: 'list',
      runWhenParamsChanged: true,
    },
    'x-component': 'CardItem',
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:comment',
    properties: {
      // actionBar: {
      //   type: 'void',
      //   'x-initializer': 'comment:configureActions',
      //   'x-component': 'ActionBar',
      //   'x-component-props': {
      //     style: {
      //       marginBottom: 'var(--nb-spacing)',
      //     },
      //   },
      // },
      list: {
        type: 'array',
        'x-component': 'Comment.List',
        properties: {
          item: {
            type: 'object',
            'x-component': 'Comment.Item',
            'x-read-pretty': true,
            properties: {
              actionBar: {
                type: 'void',
                'x-align': 'left',
                'x-initializer': 'comment:configureItemActions',
                'x-component': 'ActionBar',
                'x-component-props': {
                  layout: 'one-column',
                },
              },
            },
          },
        },
      },
      submit: {
        type: 'string',
        'x-component': 'Comment.Submit',
        'x-acl-action': `${association || collectionName}:create`,
        'x-decorator': 'ACLCollectionProvider',
        'x-decorator-props': {
          collection: collectionName,
          dataSource,
          association,
        },
      },
    },
  };
};

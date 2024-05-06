/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSchemaComponentPlugin } from '@nocobase/client';
import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  designable: true,
  enableUserListDataBlock: true,
  schema: {
    type: 'void',
    'x-decorator': 'FormBlockProvider',
    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
    'x-decorator-props': {
      dataSource: 'main',
      collection: 'users',
    },
    'x-component': 'div',
    properties: {
      '45i9guirvtz': {
        type: 'void',
        'x-component': 'FormV2',
        'x-use-component-props': 'useCreateFormBlockProps',
        properties: {
          roles: {
            type: 'string',
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
            'x-collection-field': 'users.roles',
            'x-component-props': {
              fieldNames: {
                label: 'name',
                value: 'name',
              },
              addMode: 'modalAdd',
              mode: 'SubTable',
            },
            default: null,
            properties: {
              e2l1f5wo2st: {
                type: 'void',
                'x-component': 'AssociationField.SubTable',
                properties: {
                  '9x9jysv3hka': {
                    type: 'void',
                    'x-decorator': 'TableV2.Column.Decorator',
                    'x-component': 'TableV2.Column',
                    properties: {
                      'long-text': {
                        default: 'aaa',
                        'x-collection-field': 'roles.long-text',
                        'x-component': 'CollectionField',
                        'x-component-props': {
                          ellipsis: true,
                        },
                        'x-decorator': 'QuickEdit',
                        'x-decorator-props': {
                          labelStyle: {
                            display: 'none',
                          },
                        },
                        'x-disabled': false,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  appOptions: {
    plugins: [BlockSchemaComponentPlugin],
  },
});

export default App;

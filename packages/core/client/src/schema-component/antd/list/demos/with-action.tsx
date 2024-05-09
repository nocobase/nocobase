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
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'List.Decorator',
    'x-use-decorator-props': 'useListBlockDecoratorProps',
    'x-decorator-props': {
      collection: 'roles',
      dataSource: 'main',
      action: 'list',
      params: {
        pageSize: 10,
      },
    },
    'x-component': 'CardItem',
    properties: {
      actions: {
        type: 'void',
        'x-component': 'ActionBar',
        'x-pattern': 'editable',
        'x-component-props': {
          style: {
            marginBottom: 20,
          },
        },
        properties: {
          filter: {
            'x-component': 'Filter.Action',
            'x-use-component-props': 'useFilterActionProps',
            'x-component-props': {
              icon: 'FilterOutlined',
            },
            'x-align': 'left',
          },
          refresh: {
            title: 'Refresh',
            'x-component': 'Action',
            'x-align': 'left',
            'x-use-component-props': 'useRefreshActionProps',
          },
          add: {
            type: 'void',
            'x-component': 'Action',
            title: 'Add New',
            'x-align': 'right',
            'x-component-props': {
              type: 'primary',
            },
            properties: {
              drawer: {
                type: 'void',
                'x-component': 'Action.Drawer',
                title: 'Drawer Title',
                properties: {
                  tip: {
                    type: 'void',
                    'x-component': 'Markdown.Void',
                    'x-editable': false,
                    'x-component-props': {
                      content: '请查看 [Action.Drawer](/components/action) 组件的文档',
                    },
                  },
                },
              },
            },
          },
        },
      },
      list: {
        type: 'array',
        'x-component': 'List',
        properties: {
          item: {
            type: 'object',
            'x-component': 'List.Item',
            'x-read-pretty': true,
            'x-use-component-props': 'useListItemProps',
            properties: {
              name: {
                type: 'string',
                'x-component': 'CollectionField',
                'x-decorator': 'FormItem',
                'x-index': 1,
              },
              title: {
                type: 'string',
                'x-component': 'CollectionField',
                'x-decorator': 'FormItem',
                'x-index': 2,
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

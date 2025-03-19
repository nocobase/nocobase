/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  BlockSchemaComponentPlugin,
  SchemaInitializerPlugin,
  TableBlockProvider,
  tableActionColumnInitializers,
  tableActionInitializers,
  tableColumnInitializers,
  useTableBlockDecoratorProps,
} from '@nocobase/client';

export const tableOptions = {
  designable: true,
  enableUserListDataBlock: true,
  schema: {
    type: 'void',
    'x-component': 'FixedBlock',
    properties: {
      table: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-decorator': 'TableBlockProvider',
        'x-use-decorator-props': 'useTableBlockDecoratorProps',
        'x-decorator-props': {
          collection: 'users',
          dataSource: 'main',
          action: 'list',
          rowKey: 'id',
          showIndex: true,
          dragSort: false,
        },
        'x-toolbar': 'BlockSchemaToolbar',
        'x-settings': 'blockSettings:table',
        'x-component': 'CardItem',
        'x-app-version': '0.21.0-alpha.11',
        properties: {
          actions: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-initializer': 'table:configureActions',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 'var(--nb-spacing)',
              },
            },
            'x-app-version': '0.21.0-alpha.11',
            'x-async': false,
            'x-index': 1,
          },
          qmew562ea9w: {
            _isJSONSchemaObject: true,
            version: '2.0',
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
            'x-app-version': '0.21.0-alpha.11',
            properties: {
              actions: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                title: '{{ t("Actions") }}',
                'x-action-column': 'actions',
                'x-decorator': 'TableV2.Column.ActionBar',
                'x-component': 'TableV2.Column',
                'x-designer': 'TableV2.ActionColumnDesigner',
                'x-initializer': 'table:configureItemActions',
                'x-app-version': '0.21.0-alpha.11',
                properties: {
                  glmtz7t8dm4: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'DndContext',
                    'x-component': 'Space',
                    'x-component-props': {
                      split: '|',
                    },
                    'x-app-version': '0.21.0-alpha.11',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-async': false,
        'x-index': 1,
      },
    },
  },
  appOptions: {
    components: {
      TableBlockProvider,
    },
    plugins: [BlockSchemaComponentPlugin, SchemaInitializerPlugin],
    schemaInitializers: [tableActionInitializers, tableColumnInitializers, tableActionColumnInitializers],
    scopes: {
      useTableBlockDecoratorProps,
    },
  },
};

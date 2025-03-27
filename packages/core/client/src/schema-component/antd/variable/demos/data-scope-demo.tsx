import {
  Filter,
  ISchema,
  Plugin,
  SchemaComponent,
  SchemaSettings,
  SchemaSettingsDataScope,
  SchemaSettingsModalItem,
  TableBlockProvider,
  useTableBlockProps,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { property } from 'lodash';
import React from 'react';

const DataScopeEditor = (props) => {
  // const { getFields } = useCollectionFilterOptionsV2('roles');
  const getSchema = () => ({
    type: 'object',
    title: 'Set the data scope',
    properties: {
      // enum: getFields(),
      filter: {
        'x-component': 'Filter',
        'x-component-props': {
          collectionName: 'users',
        },
      },
    },
  });
  return <SchemaSettingsModalItem title="Data Scope" width={800} onSubmit={(v) => null} schema={getSchema} />;
};

const dataScopeSettings = new SchemaSettings({
  name: 'dataScopeSettings',
  items: [
    {
      name: 'data scope',
      Component: SchemaSettingsDataScope,
      componentProps: {
        collectionName: 'users',
      },
    },
  ],
});
const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-decorator': 'TableBlockProvider',
      'x-settings': 'dataScopeSettings',
      'x-component': 'CardItem',
      'x-decorator-props': {
        collection: 'roles', // roles 表
        action: 'list', // 获取 roles 的列表
        params: {
          pageSize: 2,
        },
        showIndex: true,
        dragSort: false,
      },
      properties: {
        table: {
          type: 'array',
          'x-component': 'TableV2',
          'x-use-component-props': 'useTableBlockProps', // 自动注入 Table 所需的 props
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
          },
          properties: {
            column1: {
              type: 'void',
              title: 'Role UID',
              'x-component': 'TableV2.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty', // 这里要设置为 true
                },
              },
            },
            column2: {
              type: 'void',
              title: 'Role name',
              'x-component': 'TableV2.Column',
              properties: {
                title: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-pattern': 'readPretty',
                },
              },
            },
          },
        },
      },
    },
  },
};
const Demo = () => {
  return <SchemaComponent schema={schema} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  components: {
    TableBlockProvider,
  },
  designable: true,
  scopes: {
    useTableBlockProps,
  },
  schemaSettings: [dataScopeSettings],
});

export default app.getRootComponent();

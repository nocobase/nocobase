import { Table } from 'antd';
import React, { useEffect, useMemo } from 'react';
import {
  CardItem,
  CollectionField,
  ColorFieldInterface,
  ColorPicker,
  DataBlockProvider,
  EmailFieldInterface,
  FormItem,
  IdFieldInterface,
  Input,
  InputFieldInterface,
  InputNumber,
  NumberFieldInterface,
  Plugin,
  SchemaComponent,
  SchemaInitializer,
  SchemaInitializerItem,
  useCollection,
  useDataBlockRequest,
  useDataSourceManager,
  useSchemaInitializer,
  useSchemaInitializerRender,
} from '@nocobase/client';
import { Application } from '@nocobase/client';
import { uid } from '@formily/shared';
import { ISchema, RecursionField, observer, useField, useFieldSchema } from '@formily/react';
import { mainCollections, TestDBCollections } from './collections';
import { mock } from './mockData';

const TableColumn = observer(() => {
  const field = useField<any>();
  return <div>{field.title}</div>;
});

const MyTable = () => {
  const { data, loading } = useDataBlockRequest<any[]>();
  const dataSource = useMemo(() => data?.data || [], [data]);
  const collection = useCollection();
  const field = useField<any>();

  useEffect(() => {
    field.value = dataSource;
  }, [dataSource]);

  const columns = useMemo(() => {
    return collection.getFields().map((collectionField) => {
      const tableFieldSchema = {
        name: collectionField.name,
        type: 'void',
        title: collectionField.uiSchema?.title || collectionField.name,
        'x-component': 'TableColumn',
        properties: {
          [collectionField.name]: {
            'x-component': 'CollectionField',
            'x-read-pretty': true,
            'x-decorator-props': {
              labelStyle: {
                display: 'none',
              },
            },
          },
        },
      };

      return {
        title: <RecursionField name={collectionField.name} schema={tableFieldSchema} onlyRenderSelf />,
        dataIndex: collectionField.name,
        render(value, record, index) {
          return (
            <RecursionField basePath={field.address.concat(index)} onlyRenderProperties schema={tableFieldSchema} />
          );
        },
      };
    });
  }, [collection]);

  return <Table loading={loading} dataSource={dataSource} columns={columns} />;
};

const AddBlockButton = observer(() => {
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaInitializerRender(fieldSchema['x-initializer']);
  return render();
});

const Page = observer(
  (props) => {
    return (
      <div>
        {props.children}
        <AddBlockButton />
      </div>
    );
  },
  { displayName: 'Page' },
);

function useCollectionMenuItems() {
  const dataSourceManager = useDataSourceManager();
  const allCollections = dataSourceManager.getAllCollections();
  const menus = useMemo(
    () =>
      allCollections.map((item) => {
        const { key, displayName, collections } = item;
        return {
          name: key,
          label: displayName,
          type: 'subMenu',
          children: collections.map((collection) => {
            return {
              name: collection.name,
              label: collection.title,
              collection: collection.name,
              dataSource: key,
            };
          }),
        };
      }),
    [allCollections],
  );

  return menus;
}

const TableDataBlockInitializer = () => {
  const { insert, setVisible } = useSchemaInitializer();

  const handleClick = ({ item }) => {
    const tableSchema = {
      type: 'void',
      'x-component': 'CardItem',
      'x-decorator': 'DataBlockProvider',
      'x-decorator-props': {
        collection: item.collection,
        dataSource: item.dataSource,
        action: 'list',
      },
      properties: {
        [uid()]: {
          type: 'array',
          'x-component': 'MyTable',
        },
      },
    };
    insert(tableSchema);
    setVisible(false);
  };

  const menuItems = useCollectionMenuItems();

  return <SchemaInitializerItem title={'Table'} items={menuItems} onClick={handleClick} />;
};

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  title: 'Add Block',
  insertPosition: 'beforeEnd',
  items: [
    {
      name: 'table',
      Component: TableDataBlockInitializer,
    },
  ],
});

const rootSchema: ISchema = {
  type: 'void',
  name: 'root',
  'x-component': 'Page',
  'x-initializer': 'myInitializer',
};

class MyPlugin extends Plugin {
  async load() {
    this.app.addComponents({ MyTable, TableColumn });
    this.app.schemaInitializerManager.add(myInitializer);
  }
}

const Root = () => {
  return <SchemaComponent schema={rootSchema}></SchemaComponent>;
};

const app = new Application({
  plugins: [MyPlugin],
  components: {
    Page,
    AddBlockButton,
    CardItem,
    DataBlockProvider,
    InputNumber,
    Input,
    CollectionField,
    ColorPicker,
    FormItem,
  },
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  designable: true,
  dataSourceManager: {
    collections: mainCollections,
    dataSources: [
      {
        key: 'test-db',
        displayName: 'TestDB',
        collections: TestDBCollections,
      },
    ],
    fieldInterfaces: [
      IdFieldInterface,
      InputFieldInterface,
      EmailFieldInterface,
      ColorFieldInterface,
      NumberFieldInterface,
    ],
  },
  apiClient: {
    baseURL: 'http://localhost:8000',
  },
});

app.router.add('home', {
  path: '/',
  Component: Root,
});

mock(app);

export default app.getRootComponent();

import { Button, Drawer, Space, Table, TableProps } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AntdSchemaComponentPlugin,
  CardItem,
  CollectionField,
  ColorPicker,
  DataBlockProvider,
  FormItem,
  Input,
  InputNumber,
  Plugin,
  SchemaComponent,
  SchemaInitializer,
  SchemaInitializerItem,
  SchemaSettings,
  SchemaToolbar,
  allBuiltInFieldInterfaces,
  useCollection,
  useCompile,
  useDataBlock,
  useDataBlockProps,
  useDataBlockRequest,
  useDataSourceManager,
  useSchemaInitializer,
  useSchemaInitializerRender,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { Application } from '@nocobase/client';
import { uid } from '@formily/shared';
import { ISchema, RecursionField, observer, useField, useFieldSchema } from '@formily/react';

import tableCollection from './tableCollection.json';
import tableData from './tableData.json';
import MockAdapter from 'axios-mock-adapter';
import MapPlugin from '@nocobase/plugin-map/client';
import FormulaFieldPlugin from '@nocobase/plugin-formula-field/client';

const MyTable = withDynamicSchemaProps(Table, { displayName: 'MyTable' });

const TableColumn = observer(() => {
  const field = useField<any>();
  return <div>{field.title}</div>;
});

function useTableProps(): TableProps<any> {
  const { tableProps } = useDataBlockProps();
  const { data, loading } = useDataBlockRequest<any[]>();
  const dataSource = useMemo(() => data?.data || [], [data]);
  const collection = useCollection();
  const field = useField<any>();

  useEffect(() => {
    field.value = dataSource;
  }, [dataSource]);

  const columns = useMemo(() => {
    return collection?.getFields().map((collectionField) => {
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

  return {
    ...tableProps,
    pagination: false,
    loading,
    dataSource,
    columns,
  };
}

const myTableSettings = new SchemaSettings({
  name: 'myTableSettings',
  items: [
    {
      name: 'bordered',
      type: 'switch',
      useComponentProps() {
        const { props: blockSettingsProps, dn } = useDataBlock();

        return {
          title: 'Bordered',
          checked: !!blockSettingsProps.tableProps?.bordered,
          onChange: (checked) => {
            // 修改 schema
            dn.deepMerge({ 'x-decorator-props': { tableProps: { bordered: checked } } });
          },
        };
      },
    },
    {
      type: 'remove',
      name: 'remove',
    },
  ],
});

const AddBlockButton = observer(
  () => {
    const fieldSchema = useFieldSchema();
    const { exists, render } = useSchemaInitializerRender(fieldSchema['x-initializer']);
    if (!exists) {
      console.log('exists', exists);
      return null;
    }
    return render();
  },
  { displayName: 'AddBlockButton' },
);

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

const CreateAction = () => {
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const compile = useCompile();
  const collection = useCollection();
  const title = compile(collection.title);

  return (
    <>
      <Button type="primary" onClick={showDrawer}>
        Add New
      </Button>
      <Drawer title={`${title} | Add New`} onClose={onClose} open={open}>
        <p>Some contents...</p>
      </Drawer>
    </>
  );
};

const RefreshAction = () => {
  const { refresh } = useDataBlockRequest();
  return <Button onClick={refresh}>Refresh</Button>;
};

const ActionBar = ({ children }) => {
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaInitializerRender(fieldSchema['x-initializer']);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 'var(--nb-spacing)',
      }}
    >
      <Space>
        {children}
        {render()}
      </Space>
    </div>
  );
};

const CreateActionInitializer = () => {
  const { insert } = useSchemaInitializer();
  const handleClick = () => {
    insert({
      type: 'void',
      'x-component': 'CreateAction',
    });
  };
  return <SchemaInitializerItem title={'Add New'} onClick={handleClick}></SchemaInitializerItem>;
};

const RefreshActionInitializer = () => {
  const { insert } = useSchemaInitializer();
  const handleClick = () => {
    insert({
      type: 'void',
      'x-component': 'RefreshAction',
    });
  };
  return <SchemaInitializerItem title={'Refresh'} onClick={handleClick}></SchemaInitializerItem>;
};

const tableActionInitializers = new SchemaInitializer({
  name: 'tableActionInitializers',
  title: 'Configure actions',
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'item',
      name: 'addNew',
      Component: CreateActionInitializer,
    },
    {
      type: 'item',
      name: 'refresh',
      Component: RefreshActionInitializer,
    },
  ],
});

const TableDataBlockInitializer = () => {
  const { insert, setVisible } = useSchemaInitializer();

  const handleClick = ({ item }) => {
    const tableSchema = {
      type: 'void',
      'x-component': 'CardItem',
      'x-settings': 'myTableSettings',
      'x-decorator': 'DataBlockProvider',
      'x-toolbar': 'MyToolbar',
      'x-decorator-props': {
        collection: item.collection,
        dataSource: item.dataSource,
        action: 'list',
        tableProps: {
          pagination: false,
          scroll: { x: 'max-content' },
          rowKey: 'id'
        },
      },
      properties: {
        actions: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-initializer': 'tableActionInitializers',
        },
        [uid()]: {
          type: 'array',
          'x-component': 'MyTable',
          'x-use-component-props': 'useTableProps',
        },
      },
    };
    insert(tableSchema);
    setVisible(false);
  };

  const menuItems = useCollectionMenuItems();

  return <SchemaInitializerItem title={'Table'} items={menuItems} onClick={handleClick} />;
};

const MyToolbar = (props) => {
  const collection = useCollection();
  const compile = useCompile();
  return <SchemaToolbar title={`${compile(collection.title)}`} {...props} />;
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
    this.app.addComponents({ MyTable, TableColumn, MyToolbar, ActionBar, CreateAction, RefreshAction });
    this.app.addComponents({
      Page,
      AddBlockButton,
      CardItem,
      DataBlockProvider,
      InputNumber,
      Input,
      CollectionField,
      ColorPicker,
      FormItem,
    })
    this.app.schemaInitializerManager.add(myInitializer);
    this.app.schemaSettingsManager.add(myTableSettings);
    this.app.addScopes({ useTableProps });
    this.app.schemaInitializerManager.add(tableActionInitializers);
  }
}

const Root = () => {
  return <SchemaComponent schema={rootSchema}></SchemaComponent>;
};

const app = new Application({
  plugins: [AntdSchemaComponentPlugin, MapPlugin, FormulaFieldPlugin, MyPlugin],
  components: {

  },
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  designable: true,
  dataSourceManager: {
    collections: [tableCollection as any],
    fieldInterfaces: allBuiltInFieldInterfaces,
  },
  apiClient: {
    baseURL: 'http://localhost:8000',
  },
});

app.router.add('home', {
  path: '/',
  Component: Root,
});

const mock = new MockAdapter(app.apiClient.axios);
mock.onGet('tt_pmt_staff:list').reply(200, tableData);

export default app.getRootComponent();

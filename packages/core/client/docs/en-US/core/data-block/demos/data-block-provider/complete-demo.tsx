import React, { useMemo } from 'react';
import {
  SchemaComponent,
  SchemaInitializer,
  SchemaInitializerItem,
  SchemaSettings,
  useDataBlockRequest,
  useCollectionManager,
  useCollection,
  useCompile,
  useDataBlockProps,
  useDataBlock,
  useSchemaInitializer,
  useSchemaInitializerRender,
  withDynamicSchemaProps,
} from '@nocobase/client';

import { createApp } from '../../../data-source/demos/createApp';
import { Table, TableProps } from 'antd';
import { ISchema } from '@formily/json-schema';
import { observer, useFieldSchema } from '@formily/react';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-component': 'Page',
  'x-initializer': 'MyInitializer',
};

const MyTable = withDynamicSchemaProps(Table);

function useTableProps(): TableProps<any> {
  const { tableProps } = useDataBlockProps();
  const { data, loading } = useDataBlockRequest<any[]>();
  const compile = useCompile();
  const collection = useCollection();
  const columns = useMemo(() => {
    return collection.getFields().map((field) => {
      return {
        title: compile(field.uiSchema?.title || field.name),
        dataIndex: field.name,
      };
    });
  }, [collection, compile]);
  return {
    ...tableProps,
    loading,
    dataSource: data?.data || [],
    columns,
  };
}

const MyTableSettings = new SchemaSettings({
  name: 'MyTableSettings',
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
  ],
});

const TableDataBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const handleClick = ({ item }) => {
    insert({
      type: 'void',
      'x-decorator': 'DataBlockProvider',
      'x-decorator-props': {
        collection: item.value,
        action: 'list',
        tableProps: {
          bordered: true, // 用于设置是否显示边框
        },
      },
      'x-settings': 'MyTableSettings',
      'x-component': 'CardItem',
      'x-toolbar-props': {
        draggable: false,
      },
      properties: {
        table: {
          type: 'array',
          'x-component': 'MyTable',
          'x-use-component-props': 'useTableProps', // 动态 table 属性
        },
      },
    });
  };
  const compile = useCompile();
  const collectionManager = useCollectionManager();
  const collectionMenuItems = useMemo(
    () =>
      collectionManager.getCollections().map((collection) => {
        return {
          label: compile(collection.getOption('title')),
          value: collection.getOption('name'),
        };
      }),
    [collectionManager, compile],
  );
  return <SchemaInitializerItem title={'Table'} items={collectionMenuItems} onClick={handleClick} />;
};

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Add Block',
  // 插入位置
  insertPosition: 'beforeEnd',
  items: [
    {
      name: 'table',
      Component: TableDataBlockInitializer,
    },
  ],
});

const AddBlockButton = observer(
  () => {
    const fieldSchema = useFieldSchema();
    const { render } = useSchemaInitializerRender(fieldSchema['x-initializer']);
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

const Root = () => {
  return <SchemaComponent schema={schema}></SchemaComponent>;
};

const App = createApp(Root, {
  components: { MyTable, Page },
  scopes: { useTableProps },
  schemaSettings: [MyTableSettings],
  schemaInitializers: [myInitializer],
});

export default App;

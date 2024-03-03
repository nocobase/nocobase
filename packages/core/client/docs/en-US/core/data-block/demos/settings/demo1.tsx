import React from 'react';
import {
  SchemaComponent,
  SchemaSettings,
  useDataBlockRequest,
  useDataBlock,
  withDynamicSchemaProps,
} from '@nocobase/client';

import { createApp } from '../../../data-source/demos/createApp';
import { Table, TableProps } from 'antd';
import { ISchema } from '@formily/json-schema';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    collection: 'users',
    action: 'list',
    bordered: true, // 用于设置是否显示边框
  },
  'x-settings': 'MyTableSettings',
  'x-component': 'CardItem',
  'x-toolbar-props': {
    draggable: false,
  },
  properties: {
    demo: {
      type: 'array',
      'x-component': 'MyTable',
      'x-use-component-props': 'useTableProps', // 动态 table 属性
    },
  },
};

const MyTable = withDynamicSchemaProps(Table);

function useTableProps(): TableProps<any> {
  // 获取
  const { props } = useDataBlock();
  const { bordered } = props;
  const { data, loading } = useDataBlockRequest<any[]>();
  return {
    bordered,
    loading,
    dataSource: data?.data || [],
    columns: [
      {
        title: 'Name',
        dataIndex: 'name',
      },
      {
        title: 'Age',
        dataIndex: 'age',
      },
      {
        title: 'Address',
        dataIndex: 'address',
      },
    ],
  };
}

const MyTableSettings = new SchemaSettings({
  name: 'MyTableSettings',
  items: [
    {
      name: 'bordered',
      type: 'switch',
      useComponentProps() {
        // 获取
        const { props: blockSettingsProps, dn } = useDataBlock();
        const { bordered } = blockSettingsProps;

        return {
          title: 'Bordered',
          checked: bordered,
          onChange: (checked) => {
            // 修改
            dn.deepMerge({ 'x-decorator-props': { bordered: checked } });
          },
        };
      },
    },
  ],
});

const Demo = () => {
  return <SchemaComponent schema={schema}></SchemaComponent>;
};

const Root = createApp(Demo, {
  components: { MyTable },
  scopes: { useTableProps },
  schemaSettings: [MyTableSettings],
});

export default Root;

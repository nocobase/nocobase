/**
 * defaultShowCode: true
 */
import React, { FC } from 'react';
import { Application, SchemaSettings, SchemaSettingsSelectItem, useDesignable } from '@nocobase/client';
import { appOptions } from './schema-settings-common';
import { observer, useField } from '@formily/react';
import { Table } from 'antd';

const PageSize = () => {
  const { patch } = useDesignable();
  const filed = useField();
  return (
    <SchemaSettingsSelectItem
      title={'Page Size'}
      options={[
        { label: '5', value: 5 },
        { label: '10', value: 10 },
        { label: '15', value: 15 },
      ]}
      value={filed.componentProps?.pageSize || 5}
      onChange={(v) => {
        patch({
          'x-component-props': {
            pageSize: v,
          },
        });
      }}
    />
  );
};

const mySettings = new SchemaSettings({
  name: 'mySettings',
  items: [
    {
      name: 'pageSize',
      Component: PageSize,
    },
  ],
});

const data = [];
for (let i = 0; i < 46; i++) {
  data.push({
    key: i,
    name: `Edward King ${i}`,
    age: 32,
    address: `London, Park Lane no. ${i}`,
  });
}
const Hello: FC<{ pageSize: number }> = observer((props) => {
  return (
    <Table
      columns={[
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
      ]}
      pagination={{ pageSize: props.pageSize || 5, total: data.length }}
      dataSource={data}
    />
  );
});

const app = new Application({
  ...appOptions,
  schemaSettings: [mySettings],
});

app.addComponents({ Hello });

export default app.getRootComponent();

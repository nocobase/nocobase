import { FormOutlined, TableOutlined } from '@ant-design/icons';
import { Field } from '@formily/core';
import { observer, useField } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider, SchemaInitializer } from '@nocobase/client';
import React from 'react';

const Hello = observer((props) => {
  const field = useField<Field>();
  return (
    <div style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}>
      {field.title}
    </div>
  );
});

const AddBlockButton = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      wrap={(schema) => schema}
      insertPosition={'beforeBegin'}
      items={[
        {
          type: 'itemGroup',
          title: 'Data blocks',
          children: [
            {
              type: 'item',
              title: 'Table',
              component: TableBlockInitializerItem,
            },
            {
              type: 'item',
              title: 'Form',
              component: FormBlockInitializerItem,
            },
          ],
        },
      ]}
    >
      Add block
    </SchemaInitializer.Button>
  );
});

const TableBlockInitializerItem = SchemaInitializer.itemWrap((props) => {
  const { insert } = props;
  const items: any = [
    {
      type: 'itemGroup',
      title: 'select a data source',
      children: [
        {
          type: 'item',
          title: 'Users',
        },
        {
          type: 'item',
          title: 'Posts',
        },
      ],
    },
  ];
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      items={items}
      onClick={({ item }) => {
        // 如果有 items 时，onClick 里会返回点击的 item
        // TODO: 实际情况，这里还需要补充更完整的初始化逻辑
        insert({
          type: 'void',
          title: item.title,
          'x-component': 'Hello',
        });
      }}
    />
  );
});

const FormBlockInitializerItem = SchemaInitializer.itemWrap((props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          title: 'Form',
          'x-component': 'Hello',
        });
      }}
    />
  );
});

export default function App() {
  return (
    <SchemaComponentProvider components={{ Hello, AddBlockButton }}>
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'div',
          properties: {
            hello1: {
              type: 'void',
              title: 'Test1',
              'x-component': 'Hello',
            },
            hello2: {
              type: 'void',
              title: 'Test2',
              'x-component': 'Hello',
            },
            initializer: {
              type: 'void',
              'x-component': 'AddBlockButton',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
}

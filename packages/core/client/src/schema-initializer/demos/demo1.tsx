import { TableOutlined } from '@ant-design/icons';
import { Field } from '@formily/core';
import { observer, useField } from '@formily/react';
import {
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  SchemaInitializerProvider,
  useSchemaInitializer,
} from '@nocobase/client';
import React from 'react';

const Hello = observer((props) => {
  const field = useField<Field>();
  return (
    <div style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}>
      {field.title}
    </div>
  );
});

const TableBlockInitializer = SchemaInitializer.itemWrap((props) => {
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

const initializers = {
  AddBlock: {
    title: 'Add block',
    insertPosition: 'beforeBegin',
    items: [
      {
        type: 'itemGroup',
        title: 'Data blocks',
        children: [
          {
            type: 'item',
            title: 'Table',
            component: 'TableBlockInitializer',
          },
          {
            type: 'item',
            title: 'Form',
            component: 'GeneralInitializer',
            schema: {
              type: 'void',
              title: 'Form',
              'x-component': 'Hello',
            },
          },
        ],
      },
    ],
  },
};

const AddBlockButton = observer((props: any) => {
  const { render } = useSchemaInitializer('AddBlock');
  return <>{render()}</>;
});

export default function App() {
  return (
    <SchemaComponentProvider designable>
      <SchemaInitializerProvider initializers={initializers}>
        <SchemaComponent
          components={{ TableBlockInitializer, Hello, AddBlockButton }}
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
      </SchemaInitializerProvider>
    </SchemaComponentProvider>
  );
}

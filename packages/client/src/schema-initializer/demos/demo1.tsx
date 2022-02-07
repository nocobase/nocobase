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

const InitializerButton = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      wrap={(schema) => schema}
      insertPosition={'beforeBegin'}
      items={[
        {
          title: 'Data blocks',
          children: [
            {
              title: 'Table',
              component: 'TableBlockInitializer',
            },
            {
              title: 'Form',
              component: 'FormBlockInitializer',
            },
          ],
        },
      ]}
    >
      Create block
    </SchemaInitializer.Button>
  );
});

const TableBlockInitializer = (props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      onClick={(info) => {
        console.log({ info });
        insert({
          type: 'void',
          title: info.key,
          'x-component': 'Hello',
        });
      }}
      items={[
        {
          type: 'itemGroup',
          title: 'select a data source',
          children: [
            {
              key: 'users',
              title: 'Users',
            },
            {
              key: 'posts',
              title: 'Posts',
            },
          ],
        },
      ]}
    >
      Table
    </SchemaInitializer.Item>
  );
};

const FormBlockInitializer = (props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      onClick={(info) => {
        insert({
          type: 'void',
          title: 'form',
          'x-component': 'Hello',
        });
      }}
    >
      Form
    </SchemaInitializer.Item>
  );
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ Hello, InitializerButton, TableBlockInitializer, FormBlockInitializer }}>
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
              'x-component': 'InitializerButton',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
}

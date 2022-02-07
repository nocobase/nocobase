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

const useFormItemInitializerFields = () => {
  return [
    {
      key: 'field1',
      title: 'Field1',
      component: 'FormItemInitializer',
    },
    {
      key: 'field2',
      title: 'Field2',
      component: 'FormItemInitializer',
    },
  ];
};

const InitializerButton = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      wrap={(schema) => schema}
      insertPosition={'beforeEnd'}
      items={[
        {
          title: 'Display fields',
          children: useFormItemInitializerFields(),
        },
        {
          type: 'divider',
        },
        {
          title: 'Add text',
          component: 'AddTextFormItemInitializer',
        },
      ]}
    >
      Configure fields
    </SchemaInitializer.Button>
  );
});

const FormItemInitializer = (props) => {
  const { title, insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={(info) => {
        insert({
          type: 'void',
          title: info.key,
          'x-component': 'Hello',
        });
      }}
    >
      {title}
    </SchemaInitializer.Item>
  );
};

const AddTextFormItemInitializer = (props) => {
  const { title, insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={(info) => {
        insert({
          type: 'void',
          title: 'Text',
          'x-component': 'Hello',
        });
      }}
    >
      {title}
    </SchemaInitializer.Item>
  );
};

const Page = (props) => {
  return (
    <div>
      {props.children}
      <InitializerButton />
    </div>
  );
};

export default function App() {
  return (
    <SchemaComponentProvider
      components={{ Page, Hello, InitializerButton, FormItemInitializer, AddTextFormItemInitializer }}
    >
      <SchemaComponent
        schema={{
          type: 'void',
          name: 'page',
          'x-component': 'Page',
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
          },
        }}
      />
    </SchemaComponentProvider>
  );
}

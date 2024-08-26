/**
 * defaultShowCode: true
 */
import { useFieldSchema } from '@formily/react';
import {
  Action,
  Application,
  CardItem,
  Form,
  FormItem,
  Grid,
  Input,
  SchemaInitializer,
  SchemaInitializerActionModal,
  useSchemaInitializer,
} from '@nocobase/client';
import React from 'react';
import { appOptions } from './schema-initializer-common';
import { MenuOutlined } from '@ant-design/icons';

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  title: 'Button Text',
  wrap: Grid.wrap,
  items: [
    {
      name: 'a',
      Component: () => {
        const { insert } = useSchemaInitializer();
        return (
          <SchemaInitializerActionModal
            title="Add Card"
            buttonText="Add Card"
            isItem
            icon={<MenuOutlined />}
            onSubmit={({ title }) => {
              insert({
                type: 'void',
                title,
                'x-decorator': 'CardItem',
                'x-component': 'Hello',
              });
            }}
            schema={{
              title: {
                type: 'string',
                title: 'Title',
                required: true,
                'x-component': 'Input',
                'x-decorator': 'FormItem',
              },
            }}
          ></SchemaInitializerActionModal>
        );
      },
    },
    {
      name: 'b',
      type: 'actionModal',
      useComponentProps() {
        const { insert } = useSchemaInitializer();
        return {
          isItem: true,
          icon: <MenuOutlined />,
          buttonText: 'Add Card 2',
          title: 'Add Card Form 2',
          schema: {
            title: {
              type: 'string',
              title: 'Title',
              required: true,
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
          },
          onSubmit({ title }) {
            insert({
              type: 'void',
              title,
              'x-decorator': 'CardItem',
              'x-component': 'Hello',
            });
          },
        };
      },
    },
  ],
});

const Hello = () => {
  const schema = useFieldSchema();
  return <h1>Hello, world! {schema.title}</h1>;
};

const app = new Application({
  ...appOptions,
  components: {
    FormItem,
    Action,
    Input,
    Form,
    Hello,
    CardItem,
  },
  schemaInitializers: [myInitializer],
});

export default app.getRootComponent();

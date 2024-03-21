import { ISchema, useField, useFieldSchema } from '@formily/react';
import {
  Application,
  CardItem,
  FormItem,
  Grid,
  Input,
  Plugin,
  SchemaComponent,
  SchemaSettings,
  SchemaSettingsModalItem,
  createDesignable,
  useAPIClient,
  useSchemaComponentContext,
  useSchemaSettings,
  useSchemaSettingsRender,
} from '@nocobase/client';
import React, { useMemo } from 'react';

class PluginHello extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/',
      Component: HelloPage,
    });
  }
}

export const SchemaSettingsBlockTitleItem = function BlockTitleItem() {
  const { dn } = useSchemaSettings();

  return (
    <SchemaSettingsModalItem
      title={'Edit block title'}
      schema={
        {
          type: 'object',
          title: 'Edit block title',
          properties: {
            title: {
              title: 'Block title',
              type: 'string',
              default: dn.getSchemaAttribute('x-decorator-props.title'),
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-compile-omitted': ['default'],
            },
          },
        } as ISchema
      }
      onSubmit={({ title }) => {
        dn.shallowMerge({
          'x-decorator-props': {
            title,
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
      name: 'blockTitle',
      Component: SchemaSettingsBlockTitleItem,
    },
  ],
});

const Hello = (props) => {
  return (
    <h1>
      Hello, world! <Demo />
      {props.children}
    </h1>
  );
};

const Demo = () => {
  const fieldSchema = useFieldSchema();
  const field = useField();
  const api = useAPIClient();
  const { refresh } = useSchemaComponentContext();
  const dn = useMemo(
    () =>
      createDesignable({
        current: fieldSchema.parent,
        model: field.parent,
        api,
        refresh,
      }),
    [],
  );
  const { render, exists } = useSchemaSettingsRender(fieldSchema['x-settings'], {
    fieldSchema: dn.current,
    field: dn.model,
    dn,
  });
  return (
    <div>
      <div>{render()}</div>
      <div>可以进行参数的二次覆盖：{render({ style: { color: 'red' } })}</div>
    </div>
  );
};

const HelloPage = () => {
  return (
    <div>
      <SchemaComponent
        schema={{
          name: 'root',
          type: 'void',
          'x-decorator': 'CardItem',
          'x-decorator-props': {
            title: 'aaa',
          },
          properties: {
            hello1: {
              type: 'void',
              'x-settings': 'mySettings',
              'x-decorator': 'CardItem',
              'x-component': 'Hello',
            },
            hello2: {
              type: 'void',
              'x-settings': 'mySettings',
              'x-decorator': 'CardItem',
              'x-component': 'Hello',
            },
          },
        }}
      />
    </div>
  );
};

const app = new Application({
  schemaSettings: [mySettings],
  router: {
    type: 'memory',
  },
  designable: true,
  components: { FormItem, Input, Grid, CardItem, Hello },
  plugins: [PluginHello],
});

export default app.getRootComponent();

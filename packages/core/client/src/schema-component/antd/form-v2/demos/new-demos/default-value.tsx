

import { createForm } from '@formily/core';
import { Plugin, ISchema, SchemaComponent } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';
import { useMemo } from 'react';

const useCustomFormProps = () => {
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          username: 'test',
          nickname: 'test',
        },
      }),
    [],
  );

  return {
    form,
  };
};

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      type: 'void',
      'x-component': 'FormV2',
      'x-use-component-props': 'useCustomFormProps',
      properties: {
        username: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'Username',
          required: true,
        },
        nickname: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'Nickname',
        },
      },
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} scope={{ useCustomFormProps }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
});

export default app.getRootComponent();

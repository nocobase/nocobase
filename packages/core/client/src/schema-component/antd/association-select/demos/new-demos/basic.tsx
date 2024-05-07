
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  properties: {
    test: {
      type: 'string',
      title: 'Test',
      'x-decorator': 'FormItem',
      'x-component': 'AssociationSelect',
      'x-component-props': {
        service: {
          resource: 'roles', // roles 表
          action: 'list', // 列表接口
        },
        fieldNames: {
          label: 'title', // 显示的字段
          value: 'name', // 值字段
        },
      },
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} />;
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

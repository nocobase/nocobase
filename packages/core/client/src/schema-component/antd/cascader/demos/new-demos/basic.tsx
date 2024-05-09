
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const options = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    children: [
      {
        value: 'hangzhou',
        label: 'Hangzhou',
        children: [
          {
            value: 'xihu',
            label: 'West Lake',
          },
        ],
      },
    ],
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    children: [
      {
        value: 'nanjing',
        label: 'Nanjing',
        children: [
          {
            value: 'zhonghuamen',
            label: 'Zhong Hua Men',
          },
        ],
      },
    ],
  },
];

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
      enum: options,
      'x-component': 'Cascader',
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

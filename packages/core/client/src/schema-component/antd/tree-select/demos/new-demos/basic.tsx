

import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const dataSource = [
  {
    label: '选项1',
    value: 1,
    children: [
      {
        label: 'Child Node1',
        value: '0-0-0',
      },
      {
        label: 'Child Node2',
        value: '0-0-1',
      },
      {
        label: 'Child Node3',
        value: '0-0-2',
      },
    ],
  },
  {
    label: '选项2',
    value: 2,
    children: [
      {
        label: 'Child Node1',
        value: '0-1-0',
      },
      {
        label: 'Child Node2',
        value: '0-1-1',
      },
      {
        label: 'Child Node3',
        value: '0-1-2',
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
      type: 'boolean',
      title: 'Test',
      'x-decorator': 'FormItem',
      'x-component': 'TreeSelect',
      'x-component-props': {
        treeData: dataSource,
      },
    },
  },
}
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



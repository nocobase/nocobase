
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const options = [
  {
    name: '福建',
    id: 'FuJian',
    children: [
      { name: '{{t("福州")}}', id: 'FZ' },
      { name: '莆田', id: 'PT' },
    ],
  },
  { name: '江苏', id: 'XZ' },
  { name: '浙江', id: 'ZX' },
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
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        fieldNames: {
          label: 'name',
          value: 'id',
          children: 'children',
        },
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


import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const options = [
  {
    label: '福建',
    value: 'FuJian',
    children: [
      { label: '{{t("福州")}}', value: 'FZ' },
      { label: '莆田', value: 'PT' },
    ],
  },
  { label: '江苏', value: 'XZ' },
  { label: '浙江', value: 'ZX' },
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

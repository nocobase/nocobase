
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin, ISchema } from '@nocobase/client';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  'x-pattern': 'readPretty',
  properties: {
    test1: {
      type: 'string',
      default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
      title: 'Test1',
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker.RangePicker',
    },
    test2: {
      type: 'string',
      default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
      title: 'Test(format)',
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker.RangePicker',
      'x-component-props': {
        format: 'YYYY/MM/DD',
      },
    },
    test3: {
      type: 'string',
      default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
      title: 'Test(dateFormat)',
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker.RangePicker',
      'x-component-props': {
        dateFormat: 'YYYY/MM/DD',
      },
    },
    test4: {
      type: 'string',
      default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
      title: 'Test(showTime)',
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker.RangePicker',
      'x-component-props': {
        showTime: true,
      },
    },
    test5: {
      type: 'string',
      default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
      title: 'Test(GMT)',
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker.RangePicker',
      'x-component-props': {
        showTime: true,
        gmt: true,
      },
    },
    test6: {
      type: 'string',
      default: ['2024-01-01 10:10:10', '2024-01-04 10:10:10'],
      title: 'Test(UTC)',
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker.RangePicker',
      'x-component-props': {
        showTime: true,
        utc: true,
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

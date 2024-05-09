
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';
import { ISchema, useField } from '@formily/react';

interface Option {
  value?: string | number | null;
  label: React.ReactNode;
  children?: Option[];
  isLeaf?: boolean;
}

const optionLists: Option[] = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    isLeaf: false,
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    isLeaf: false,
  },
];

const useCustomCascaderProps = () => {
  const field = useField<any>();
  field.dataSource = optionLists;
  const loadData = (selectedOptions: Option[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];

    // load options lazily
    setTimeout(() => {
      targetOption.children = [
        {
          label: `${targetOption.label} Dynamic 1`,
          value: 'dynamic1',
        },
        {
          label: `${targetOption.label} Dynamic 2`,
          value: 'dynamic2',
        },
      ];
      field.dataSource = [...field.dataSource];
    }, 1000);
  };

  return {
    changeOnSelect: true,
    loadData,
  };
};

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
      'x-component': 'Cascader',
      'x-use-component-props': 'useCustomCascaderProps',
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} scope={{ useCustomCascaderProps }} />;
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

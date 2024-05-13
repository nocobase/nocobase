

import { useField } from '@formily/react';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';
import { SchemaComponent, Plugin } from '@nocobase/client';


const mockVal = (str: string, repeat = 1) => ({
  value: str.repeat(repeat),
});
const getPanelValue = (searchText: string) =>
  !searchText ? [] : [mockVal(searchText), mockVal(searchText, 2), mockVal(searchText, 3)];

function useAutoCompleteProps() {
  const field = useField<any>();

  return {
    onSearch(text: string) {
      field.dataSource = getPanelValue(text);
    },
  };
}

const schema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  properties: {
    test: {
      type: 'boolean',
      title: 'Test',
      'x-decorator': 'FormItem',
      'x-component': 'AutoComplete',
      'x-use-component-props': 'useAutoCompleteProps',
    },
  },
}

const Demo = () => {
  return <SchemaComponent schema={schema} scope={{ useAutoCompleteProps }} />;
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



import React from 'react';
import { useField, observer, ISchema } from '@formily/react';
import { FilterActionProps, useRequest } from '@nocobase/client';

import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';

import { filterOptions } from './options';

const ShowFilterData = observer(({ children }) => {
  const field = useField<any>();
  return (
    <>
      <pre>{JSON.stringify(field.value, null, 2)}</pre>
      {children}
    </>
  );
});

const useFilterActionProps = (): FilterActionProps => {
  const field = useField<any>();
  const { run } = useRequest({ url: 'test' }, { manual: true });

  return {
    options: filterOptions,
    onSubmit: async (values) => {
      console.log('onSubmit', values);

      // request api
      run(values);

      field.setValue(values);
    },
    onReset: (values) => {
      console.log('onReset', values);
    },
  };
};

const schema: ISchema = {
  type: 'void',
  name: 'root',
  properties: {
    test: {
      name: 'filter',
      type: 'object',
      enum: filterOptions,
      title: 'Filter',
      'x-decorator': 'ShowFilterData',
      'x-component': 'Filter.Action',
      'x-use-component-props': 'useFilterActionProps',
    },
  },
}

const Demo = () => {
  return <SchemaComponent
    schema={schema}
    components={{ ShowFilterData }}
    scope={{ useFilterActionProps }}
  />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo })
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  apis: {
    test: { data: { data: 'ok' } },
  },
});

export default app.getRootComponent();

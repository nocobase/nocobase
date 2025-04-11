import React from 'react';
import { useField, observer } from '@formily/react';
import { FilterActionProps, ISchema, useDataBlockRequest } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';

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
  const { run } = useDataBlockRequest(); // replace `useRequest`

  return {
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
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    collection: 'users',
    action: 'list',
  },
  properties: {
    test: {
      name: 'filter',
      type: 'object',
      title: 'Filter',
      'x-decorator': 'ShowFilterData',
      'x-component': 'Filter.Action',
      'x-use-component-props': 'useFilterActionProps',
    },
  },
};

const Demo = () => {
  return (
    <SchemaComponent
      schema={schema}
      components={{ ShowFilterData }}
      scope={{
        useFilterActionProps,
      }}
    />
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  apis: {
    test: { data: { data: 'ok' } },
  },
});

export default app.getRootComponent();

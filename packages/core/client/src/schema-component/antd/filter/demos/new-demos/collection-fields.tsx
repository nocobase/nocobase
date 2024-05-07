

import {
  FilterActionProps,
  ISchema,
  useCollection,
  useDataBlockRequest,
  useFilterFieldOptions,
  useFilterFieldProps,
} from '@nocobase/client';
import React from 'react';
import { mockApp } from '@nocobase/client/demo-utils';
import { SchemaComponent, Plugin } from '@nocobase/client';

const useFilterActionProps = (): FilterActionProps => {
  const service = useDataBlockRequest();
  const collection = useCollection();
  const options = useFilterFieldOptions(collection.fields);
  return useFilterFieldProps({
    options,
    params: service.state?.params?.[0] || service.params,
    service,
  });
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
      'x-component': 'Filter.Action',
      'x-use-component-props': 'useFilterActionProps',
    },
  },
}

const Demo = () => {
  return <SchemaComponent
    schema={schema}
    scope={{
      useFilterActionProps
    }}
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

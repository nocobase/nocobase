import {
  ActionLogBlockInitializer,
  AntdSchemaComponentProvider,
  APIClient,
  APIClientProvider,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerContext,
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import React, { useContext } from 'react';
import { mockData } from './mockData';

const apiClient = new APIClient();

const mock = new MockAdapter(apiClient.axios);

mock.onGet('/action_logs:list').reply(200, mockData);

const schema = {
  type: 'void',
  'x-component': 'Grid',
  'x-initializer': 'BlockInitializers',
};

export default () => {
  const initializers = useContext(SchemaInitializerContext);
  initializers.BlockInitializers.items.push(ActionLogBlockInitializer);
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaInitializerContext.Provider value={initializers}>
        <SchemaComponentProvider>
          <AntdSchemaComponentProvider>
            <SchemaComponent schema={schema} />
          </AntdSchemaComponentProvider>
        </SchemaComponentProvider>
      </SchemaInitializerContext.Provider>
    </APIClientProvider>
  );
};

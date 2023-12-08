import React from 'react';
import {
  CardItem,
  Application,
  SchemaComponent,
  DataBlockProviderV2,
  CollectionManagerProvider,
  TableCollectionFieldInitializer,
} from '@nocobase/client';
import { APIClient } from '@nocobase/sdk';
import MockAdapter from 'axios-mock-adapter';
import requestData from './requestData.json';
import schema from './schema.json';
import collections from '../collections.json';

import { TablePlugin } from './Table.plugin';

const Root = () => {
  return (
    <CollectionManagerProvider collections={collections as any}>
      <SchemaComponent schema={schema} />
    </CollectionManagerProvider>
  );
};

const apiClient = new APIClient({
  baseURL: 'http://localhost:8000/api',
});
const mock = new MockAdapter(apiClient.axios);
mock.onGet('users:list').reply(200, requestData);

const app = new Application({
  apiClient: apiClient.axios,
  plugins: [TablePlugin],
  providers: [Root],
  components: {
    CardItem,
    DataBlockProviderV2,
    TableCollectionFieldInitializer,
  },
  designable: true,
});

export default app.getRootComponent();

import React from 'react';
import {
  CardItem,
  Application,
  SchemaComponent,
  DataBlockProviderV2,
  TableCollectionFieldInitializer,
  CollectionManagerProvider,
} from '@nocobase/client';
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

const app = new Application({
  apiClient: {
    baseURL: 'http://localhost:8000/api',
  },
  plugins: [TablePlugin],
  providers: [Root],
  components: {
    CardItem,
    DataBlockProviderV2,
    TableCollectionFieldInitializer,
  },
  designable: true,
});

const mock = new MockAdapter(app.apiClient.axios);
mock.onGet('users:list').reply(200, requestData);

export default app.getRootComponent();

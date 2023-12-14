import {
  Application,
  ApplicationOptions,
  CardItem,
  CollectionManagerProvider,
  DataBlockProviderV2,
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import React, { ComponentType } from 'react';
import collections from './collections.json';

const defaultMocks = {
  'users:list': {
    data: [
      {
        key: '1',
        name: 'John Brown',
        age: 32,
        address: 'New York No. 1 Lake Park',
      },
      {
        key: '2',
        name: 'Jim Green',
        age: 42,
        address: 'London No. 1 Lake Park',
      },
      {
        key: '3',
        name: 'Joe Black',
        age: 32,
        address: 'Sydney No. 1 Lake Park',
      },
    ],
  },
};

export function createApp(
  Demo: ComponentType<any>,
  options: ApplicationOptions,
  mocks: Record<string, any> = defaultMocks,
) {
  const Provider = () => {
    return (
      <CollectionManagerProvider collections={collections as any}>
        <Demo />
      </CollectionManagerProvider>
    );
  };

  const app = new Application({
    apiClient: {
      baseURL: 'http://localhost:8000',
    },
    providers: [Provider],
    ...options,
    components: {
      ...options.components,
      DataBlockProviderV2,
      CardItem,
    },
    designable: true,
  });

  const mock = new MockAdapter(app.apiClient.axios);

  Object.entries(mocks).forEach(([url, data]) => {
    mock.onGet(url).reply(async (config) => {
      const res = typeof data === 'function' ? data(config) : data;
      return [200, res];
    });
    mock.onPost(url).reply(async (config) => {
      const res = typeof data === 'function' ? data(config) : data;
      return [200, res];
    });
  });

  const Root = app.getRootComponent();
  return Root;
}

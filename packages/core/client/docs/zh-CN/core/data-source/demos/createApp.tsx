import {
  Application,
  ApplicationOptions,
  CardItem,
  Plugin,
  CollectionPlugin,
  DataBlockProvider,
  DEFAULT_DATA_SOURCE_KEY,
  DEFAULT_DATA_SOURCE_TITLE,
  LocalDataSource,
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import { ComponentType } from 'react';
import collections from './collections.json';

const defaultMocks = {
  'users:list': {
    data: [
      {
        id: '1',
        username: 'jack',
        nickname: 'Jack Ma',
        email: 'test@gmail.com',
      },
      {
        id: '2',
        username: 'jim',
        nickname: 'Jim Green',
      },
      {
        id: '3',
        username: 'tom',
        nickname: 'Tom Cat',
        email: 'tom@gmail.com',
      },
    ],
  },
  'roles:list': {
    data: [
      {
        name: 'root',
        title: 'Root',
        description: 'Root',
      },
      {
        name: 'admin',
        title: 'Admin',
        description: 'Admin description',
      },
    ],
  },
};

export function createApp(
  Demo: ComponentType<any>,
  options: ApplicationOptions = {},
  mocks: Record<string, any> = defaultMocks,
) {
  class MyPlugin extends Plugin {
    async load() {
      this.app.dataSourceManager.addDataSource(LocalDataSource, {
        key: DEFAULT_DATA_SOURCE_KEY,
        displayName: DEFAULT_DATA_SOURCE_TITLE,
        collections: collections as any,
      });
    }
  }
  const app = new Application({
    apiClient: {
      baseURL: 'http://localhost:8000',
    },
    providers: [Demo],
    ...options,
    components: {
      ...options.components,
      DataBlockProvider,
      CardItem,
    },
    plugins: [CollectionPlugin, MyPlugin, ...(options.plugins || [])],
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

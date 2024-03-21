import {
  ApplicationOptions,
  Application,
  CardItem,
  Plugin,
  CollectionPlugin,
  DataBlockProvider,
  LocalDataSource,
  DEFAULT_DATA_SOURCE_KEY,
  DEFAULT_DATA_SOURCE_TITLE,
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import { ComponentType } from 'react';
import collections from '../../collections.json';

export function createApp(Demo: ComponentType<any>, options: ApplicationOptions = {}, mocks: Record<string, any>) {
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
    plugins: [CollectionPlugin, MyPlugin],
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

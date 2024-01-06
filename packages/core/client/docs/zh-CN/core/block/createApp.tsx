import { Application, ApplicationOptions } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import { ComponentType } from 'react';
import collections from './collections.json';

export function createApp(Demo: ComponentType<any>, options: ApplicationOptions, mocks: Record<string, any> = {}) {
  const app = new Application({
    apiClient: {
      baseURL: 'http://localhost:8000',
    },
    providers: [Demo],
    collectionManager: {
      collections: collections as any,
    },
    ...options,
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

import { Application, ApplicationOptions, CollectionManagerProvider } from '@nocobase/client';
import { APIClient } from '@nocobase/sdk';
import MockAdapter from 'axios-mock-adapter';
import React, { ComponentType } from 'react';
import collections from './collections.json';

export function createApp(Demo: ComponentType<any>, options: ApplicationOptions, mocks: Record<string, any> = {}) {
  const baseURL = 'http://localhost:8000';
  const api = new APIClient({
    baseURL,
  });

  const mock = new MockAdapter(api.axios);

  Object.entries(mocks).forEach(([url, data]) => {
    mock.onGet(url).reply(async (config) => {
      const res = typeof data === 'function' ? data(config) : data;
      return [200, res];
    });
  });

  const Provider = () => {
    return (
      <CollectionManagerProvider collections={collections as any}>
        <Demo />
      </CollectionManagerProvider>
    );
  };

  const app = new Application({
    apiClient: api.axios,
    providers: [Provider],
    ...options,
  });

  const Root = app.getRootComponent();
  return Root;
}

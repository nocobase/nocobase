import React, { ComponentType } from 'react';
import MockAdapter from 'axios-mock-adapter';
import { AxiosInstance } from 'axios';

// @ts-ignore
import { Application, ApplicationOptions, DataBlockProvider, LocalDataSource, SchemaComponent } from '@nocobase/client';

import dataSourceMainCollections from './dataSourceMainCollections.json';
import dataSource2 from './dataSource2.json';
import usersListData from './usersListData.json';

type URL = string;
type ResponseData = any;

type MockApis = Record<URL, ResponseData>;
type AppOrOptions = Application | ApplicationOptions;

export const mockApi = (axiosInstance: AxiosInstance, apis: MockApis = {}) => {
  const mock = new MockAdapter(axiosInstance);
  Object.keys(apis).forEach((key) => {
    mock.onAny(key).reply(200, apis[key]);
  });

  return (apis: MockApis = {}) => {
    Object.keys(apis).forEach((key) => {
      mock.onAny(key).reply(200, apis[key]);
    });
  };
};

export const mockAppApi = (app: Application, apis: MockApis = {}) => {
  const mock = mockApi(app.apiClient.axios, apis);
  return mock;
};

export interface GetAppOptions {
  appOptions?: AppOrOptions;
  providers?: (ComponentType | [ComponentType, any])[];
  apis?: MockApis;
  enableUserListDataBlock?: boolean;
  enableMultipleDataSource?: boolean;
}

export const getApp = (options: GetAppOptions) => {
  const { appOptions, enableUserListDataBlock, providers, apis, enableMultipleDataSource } = options;
  const app = appOptions instanceof Application ? appOptions : new Application(appOptions);
  if (providers) {
    app.addProviders(providers);
  }

  app.getCollectionManager().addCollections(dataSourceMainCollections as any);

  if (enableUserListDataBlock && !apis['users:list']) {
    apis['users:list'] = usersListData;
  }

  if (enableMultipleDataSource) {
    app.dataSourceManager.addDataSource(LocalDataSource, dataSource2 as any);
  }

  mockAppApi(app, apis);

  const App = app.getRootComponent();
  return {
    App,
    app,
  };
};

export interface GetAppComponentOptions<V = any, Props = {}> {
  schema?: any;
  appOptions?: AppOrOptions;
  apis?: MockApis;
  Component?: ComponentType<Props>;
  value?: V;
  props?: Props;
  onChange?: (value: V) => void;
  enableUserListDataBlock?: boolean;
  enableMultipleDataSource?: boolean;
}

export const getAppComponent = (options: GetAppComponentOptions) => {
  const {
    Component,
    enableUserListDataBlock,
    enableMultipleDataSource,
    value,
    props,
    appOptions,
    apis,
    onChange,
    schema: optionsSchema = {},
  } = options;
  const schema = {
    type: 'object',
    name: 'test',
    default: value,
    'x-component': Component,
    'x-component-props': {
      onChange,
      ...props,
    },
    ...optionsSchema,
  };

  if (!schema.name) {
    schema.name = 'test';
  }

  if (!schema.type) {
    schema.type = 'void';
  }

  const TestDemo = () => {
    if (!enableUserListDataBlock) {
      return <SchemaComponent schema={schema} />;
    }
    return (
      <DataBlockProvider collection={'users'} action="list">
        <SchemaComponent schema={schema} />
      </DataBlockProvider>
    );
  };

  const { App } = getApp({
    appOptions,
    apis,
    providers: [TestDemo],
    enableMultipleDataSource,
    enableUserListDataBlock,
  });

  return App;
};

export const getReadPrettyAppComponent = (options: GetAppComponentOptions) => {
  return getAppComponent({ ...options, schema: { ...(options.schema || {}), 'x-read-pretty': true } });
};

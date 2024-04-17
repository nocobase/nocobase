import React, { ComponentType } from 'react';
import MockAdapter from 'axios-mock-adapter';
import { AxiosInstance } from 'axios';

// @ts-ignore
import {
  AntdSchemaComponentPlugin,
  Application,
  ApplicationOptions,
  DataBlockProvider,
  LocalDataSource,
  SchemaComponent,
  SchemaSettings,
} from '@nocobase/client';

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
  designable?: boolean;
  schemaSettings?: SchemaSettings;
  enableUserListDataBlock?: boolean;
  enableMultipleDataSource?: boolean;
}

const defaultApis = {
  'uiSchemas:patch': { data: { result: 'ok' } },
};

export const getApp = (options: GetAppOptions) => {
  const {
    appOptions = {},
    schemaSettings,
    enableUserListDataBlock,
    providers,
    apis: optionsApis = {},
    enableMultipleDataSource,
    designable,
  } = options;
  const app =
    appOptions instanceof Application
      ? appOptions
      : new Application({ ...appOptions, designable: appOptions.designable || designable });
  if (providers) {
    app.addProviders(providers);
  }

  if (schemaSettings) {
    app.schemaSettingsManager.add(schemaSettings);
  }

  app.pluginManager.add(AntdSchemaComponentPlugin);

  app.getCollectionManager().addCollections(dataSourceMainCollections as any);

  const apis = Object.assign({}, defaultApis, optionsApis);
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

export interface GetAppComponentOptions<V = any, Props = {}> extends GetAppOptions {
  schema?: any;
  Component?: ComponentType<Props>;
  value?: V;
  props?: Props;
  enableUserListDataBlock?: boolean;
  onChange?: (value: V) => void;
}

export const getAppComponent = (options: GetAppComponentOptions) => {
  const {
    schema: optionsSchema = {},
    Component,
    value,
    props,
    onChange,
    enableUserListDataBlock,
    ...otherOptions
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
    ...otherOptions,
    providers: [TestDemo],
    enableUserListDataBlock,
  });

  return App;
};

export const getReadPrettyAppComponent = (options: GetAppComponentOptions) => {
  return getAppComponent({ ...options, schema: { ...(options.schema || {}), 'x-read-pretty': true } });
};

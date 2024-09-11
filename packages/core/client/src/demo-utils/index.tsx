/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import MockAdapter from 'axios-mock-adapter';
import { AxiosInstance, AxiosRequestConfig } from 'axios';

import {
  ActionInitializer,
  AntdSchemaComponentPlugin,
  Application,
  ApplicationOptions,
  BlockSchemaToolbar,
  CollectionPlugin,
  DataBlockInitializer,
  LocalDataSource,
  SchemaSettingsPlugin,
} from '../index';

import dataSourceMainCollections from './dataSourceMainCollections.json';
import dataSource2 from './dataSource2.json';
import dataSourceMainData from './dataSourceMainData.json';
import _ from 'lodash';

const defaultApis = {
  'uiSchemas:patch': { data: { result: 'ok' } },
  'uiSchemas:batchPatch': { data: { result: 'ok' } },
  'uiSchemas:saveAsTemplate': { data: { result: 'ok' } },
  'users:update': { data: { result: 'ok' } },
  'users:create': { data: { result: 'ok' } },
  'roles:update': { data: { result: 'ok' } },
  'roles:create': { data: { result: 'ok' } },
  ...dataSourceMainData,
};

type URL = string;
type ResponseData = any;

type MockApis = Record<URL, ResponseData>;

function getProcessMockData(apis: Record<string, any>, key: string) {
  return (config: AxiosRequestConfig) => {
    if (!apis[key]) return [404, { data: { message: 'mock data not found' } }];
    if (config?.params?.pageSize || config?.params?.page) {
      const { data, meta } = apis[key];

      const pageSize = config.params.pageSize || meta?.pageSize || 20;
      const page = config.params.page || meta?.page || 1;
      return [
        200,
        {
          data: data.slice(pageSize * (page - 1), pageSize * page),
          meta: {
            ...meta,
            page,
            pageSize,
            count: data.length,
            totalPage: Math.ceil(data.length / pageSize),
          },
        },
      ];
    }
    return [200, apis[key]];
  };
}

export const mockApi = (axiosInstance: AxiosInstance, apis: MockApis = {}, delayResponse?: number) => {
  const mock = new MockAdapter(axiosInstance, { delayResponse });
  Object.keys(apis).forEach((key) => {
    mock.onAny(key).reply(getProcessMockData(apis, key));
  });

  return (apis: MockApis = {}) => {
    Object.keys(apis).forEach((key) => {
      mock.onAny(key).reply(getProcessMockData(apis, key));
    });
  };
};

export const mockAppApi = (app: Application, apis: MockApis = {}, delayResponse?: number) => {
  const mock = mockApi(app.apiClient.axios, apis, delayResponse);
  return mock;
};

export interface MockAppOptions extends ApplicationOptions {
  apis?: MockApis;
  delayResponse?: number;
  enableMultipleDataSource?: boolean;
}

export const mockApp = (options: MockAppOptions) => {
  const {
    apis: optionsApis = {},
    enableMultipleDataSource,
    delayResponse,
    router = { type: 'memory', initialEntries: ['/'] },
    ...appOptions
  } = options;
  const app = new Application({
    disableAcl: true,
    ...appOptions,
    router,
  });

  app.pluginManager.add(AntdSchemaComponentPlugin);
  app.pluginManager.add(SchemaSettingsPlugin);
  app.pluginManager.add(CollectionPlugin, { config: { enableRemoteDataSource: false } });
  app.addComponents({
    ActionInitializer,
    DataBlockInitializer,
    BlockSchemaToolbar,
  });

  const apis = Object.assign({}, defaultApis, optionsApis);

  app.getCollectionManager().addCollections(dataSourceMainCollections as any);

  if (enableMultipleDataSource) {
    app.dataSourceManager.addDataSource(LocalDataSource, dataSource2 as any);
  }

  mockAppApi(app, apis, delayResponse);

  return app;
};

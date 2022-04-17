import React from 'react';
import { Table } from 'antd';
import { i18n, compose, APIClient, APIClientProvider, AntdConfigProvider } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import { I18nextProvider } from 'react-i18next';

const apiClient = new APIClient({
  baseURL: `${location.protocol}//${location.host}/api/`,
});

const mock = new MockAdapter(apiClient.axios);

mock.onGet('/app:getLang').reply(200, {
  data: { lang: 'zh-CN' },
});

const providers = [
  [APIClientProvider, { apiClient }],
  [I18nextProvider, { i18n }],
  [AntdConfigProvider, { remoteLocale: true }],
];

export default compose(...providers)(() => {
  return <Table />;
});

import {
  ACLShortcut,
  Action,
  AdminLayout,
  AntdConfigProvider,
  AntdSchemaComponentProvider,
  APIClientProvider,
  AuthLayout,
  CollectionManagerShortcut,
  compose,
  DesignableSwitch,
  DocumentTitleProvider,
  i18n,
  Menu,
  Page,
  PluginManagerProvider,
  RouteSwitch,
  RouteSwitchProvider,
  SchemaComponentProvider,
  SystemSettingsProvider,
  SystemSettingsShortcut,
  useRequest
} from '@nocobase/client';
import { Spin } from 'antd';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import apiClient from './apiClient';

const providers = [
  // [HashRouter],
  [MemoryRouter, { initialEntries: ['/'] }],
  [APIClientProvider, { apiClient }],
  [I18nextProvider, { i18n }],
  [AntdConfigProvider, { remoteLocale: true }],
  SystemSettingsProvider,
  [
    PluginManagerProvider,
    { components: { ACLShortcut, DesignableSwitch, CollectionManagerShortcut, SystemSettingsShortcut } },
  ],
  [SchemaComponentProvider, { components: { Page, Menu, Action } }],
  AntdSchemaComponentProvider,
  [DocumentTitleProvider, { addonAfter: 'NocoBase' }],
  [RouteSwitchProvider, { components: { AuthLayout, AdminLayout } }],
];

const App = compose(...providers)(() => {
  const { data, loading } = useRequest({
    url: 'routes:getAccessible',
  });
  if (loading) {
    return <Spin />;
  }
  return (
    <div>
      <RouteSwitch routes={data?.data || []} />
    </div>
  );
});

export default App;

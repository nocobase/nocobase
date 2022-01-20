import React from 'react';
import { HashRouter, MemoryRouter } from 'react-router-dom';
import {
  i18n,
  compose,
  useRequest,
  AuthLayout,
  AdminLayout,
  APIClientProvider,
  RouteSwitch,
  RouteSwitchProvider,
  AntdConfigProvider,
  SchemaComponentProvider,
  Menu,
  Action,
  PluginManagerProvider,
  DesignableSwitch,
  CollectionManagerShortcut,
  ACLShortcut,
  SystemSettingsShortcut,
} from '@nocobase/client';
import { I18nextProvider } from 'react-i18next';
import { Spin } from 'antd';
import apiClient from './apiClient';

const providers = [
  // [HashRouter],
  [MemoryRouter, { initialEntries: ['/'] }],
  [APIClientProvider, { apiClient }],
  [I18nextProvider, { i18n }],
  [AntdConfigProvider, { remoteLocale: true }],
  [
    PluginManagerProvider,
    { components: { ACLShortcut, DesignableSwitch, CollectionManagerShortcut, SystemSettingsShortcut } },
  ],
  [SchemaComponentProvider, { components: { Menu, Action } }],
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

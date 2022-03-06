import {
  ACLShortcut,
  AdminLayout,
  AntdConfigProvider,
  AntdSchemaComponentProvider,
  APIClientProvider,
  AuthLayout,
  ChinaRegionProvider,
  CollectionManagerShortcut,
  compose,
  DesignableSwitch,
  DocumentTitleProvider,
  i18n,
  MenuItemInitializers,
  PluginManagerProvider,
  RemoteCollectionManagerProvider,
  RouteSchemaComponent,
  RouteSwitch,
  RouteSwitchProvider,
  SchemaComponentProvider,
  SchemaInitializerProvider,
  SigninPage,
  SignupPage,
  SystemSettingsProvider,
  SystemSettingsShortcut,
  useRequest,
  WorkflowShortcut
} from '@nocobase/client';
import { notification, Spin } from 'antd';
import 'antd/dist/antd.css';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import apiClient from './apiClient';

apiClient.axios.interceptors.response.use(
  (response) => response,
  (error) => {
    notification.error({
      message: error?.response?.data?.errors?.map?.((error: any) => {
        return <div>{error.message}</div>;
      }),
    });
    throw error;
  },
);

const providers = [
  // [HashRouter],
  // [MemoryRouter, { initialEntries: ['/'] }],
  [APIClientProvider, { apiClient }],
  [I18nextProvider, { i18n }],
  [AntdConfigProvider, { remoteLocale: true }],
  SystemSettingsProvider,
  [
    PluginManagerProvider,
    {
      components: {
        ACLShortcut,
        DesignableSwitch,
        CollectionManagerShortcut,
        WorkflowShortcut,
        SystemSettingsShortcut,
      },
    },
  ],
  [SchemaComponentProvider, { components: { Link, NavLink } }],
  RemoteCollectionManagerProvider,
  [SchemaInitializerProvider, { initializers: { MenuItemInitializers } }],
  AntdSchemaComponentProvider,
  ChinaRegionProvider,
  [DocumentTitleProvider, { addonAfter: 'NocoBase' }],
  [
    RouteSwitchProvider,
    {
      components: {
        AuthLayout,
        AdminLayout,
        RouteSchemaComponent,
        SigninPage,
        SignupPage,
      },
    },
  ],
];

const App = compose(...providers)(() => {
  const { data, loading } = useRequest({
    url: 'uiRoutes:getAccessible',
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

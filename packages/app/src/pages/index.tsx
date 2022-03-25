import {
  ACLShortcut,
  AdminLayout,
  AntdConfigProvider,
  AntdSchemaComponentProvider,
  APIClientProvider,
  AuthLayout,
  BlockTemplateDetails,
  BlockTemplatePage,
  ChinaRegionProvider,
  CollectionManagerShortcut,
  compose,
  DesignableSwitch,
  DocumentTitleProvider,
  i18n,
  MenuItemInitializers,
  PluginManagerProvider,
  RemoteRouteSwitchProvider,
  // RemoteCollectionManagerProvider,
  RouteSchemaComponent,
  RouteSwitch,
  SchemaComponentProvider,
  SchemaInitializerProvider,
  SchemaTemplateShortcut,
  SigninPage,
  SignupPage,
  SystemSettingsProvider,
  SystemSettingsShortcut,
  useRequest,
  WorkflowPage,
  WorkflowShortcut,
  useRoutes
} from '@nocobase/client';
import { notification } from 'antd';
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
  [
    RemoteRouteSwitchProvider,
    {
      components: {
        AuthLayout,
        AdminLayout,
        RouteSchemaComponent,
        SigninPage,
        SignupPage,
        WorkflowPage,
        BlockTemplatePage,
        BlockTemplateDetails,
      },
    },
  ],
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
        SchemaTemplateShortcut,
      },
    },
  ],
  [SchemaComponentProvider, { components: { Link, NavLink } }],
  // RemoteCollectionManagerProvider,
  [
    SchemaInitializerProvider,
    {
      initializers: {
        MenuItemInitializers,
      },
    },
  ],
  AntdSchemaComponentProvider,
  ChinaRegionProvider,
  [DocumentTitleProvider, { addonAfter: 'NocoBase' }],
];

const App = compose(...providers)(() => {
  const routes = useRoutes();
  return (
    <div>
      <RouteSwitch routes={routes} />
    </div>
  );
});

export default App;

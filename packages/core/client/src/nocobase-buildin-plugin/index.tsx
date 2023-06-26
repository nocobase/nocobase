import { Spin } from 'antd';
import React from 'react';
import { Navigate } from 'react-router-dom';
import { ACLPlugin } from '../acl';
import { AntdConfigPlugin } from '../antd-config-provider';
import { Plugin } from '../application-v2/Plugin';
import { SigninPage, SigninPageExtensionPlugin, SignupPage } from '../auth';
import { BlockSchemaComponentPlugin } from '../block-provider';
import { RemoteDocumentTitlePlugin } from '../document-title';
import { PinnedPluginListPlugin } from '../plugin-manager';
import { PMPlugin } from '../pm';
import { AdminLayoutPlugin, AuthLayout, RouteSchemaComponent } from '../route-switch';
import { AntdSchemaComponentPlugin, MenuItemInitializers, SchemaComponentPlugin } from '../schema-component';
import { ErrorFallback } from '../schema-component/antd/error-fallback';
import { SchemaInitializerPlugin } from '../schema-initializer';
import { BlockTemplateDetails, BlockTemplatePage } from '../schema-templates';
import { SystemSettingsPlugin } from '../system-settings';

const AppSpin = () => (
  <div style={{ textAlign: 'center', margin: 50 }}>
    <Spin />
  </div>
);

export class NocoBaseBuildInPlugin extends Plugin {
  async afterAdd(): Promise<void> {
    this.addPlugins();
  }
  async load() {
    this.addComponents();
    this.addRoutes();
  }
  addRoutes() {
    this.router.add('root', {
      path: '/',
      element: <Navigate replace to="/admin" />,
    });

    this.router.add('admin', {
      path: '/admin',
      Component: 'AdminLayout',
    });
    this.router.add('admin.page', {
      path: '/admin/:name',
      Component: 'RouteSchemaComponent',
    });

    this.router.add('auth', {
      Component: 'AuthLayout',
    });
    this.router.add('auth.signin', {
      path: '/signin',
      Component: 'SigninPage',
    });
    this.router.add('auth.signup', {
      path: '/signup',
      Component: 'SignupPage',
    });
  }

  addComponents() {
    this.app.addComponents({
      AppSpin,
      AuthLayout,
      SigninPage,
      SignupPage,
      ErrorFallback,
      RouteSchemaComponent,
      BlockTemplatePage,
      BlockTemplateDetails,
    });
  }
  addPlugins() {
    this.app.pm.add(AdminLayoutPlugin);
    this.app.pm.add(AntdConfigPlugin, { remoteLocale: true });
    this.app.pm.add(SystemSettingsPlugin);
    this.app.pm.add(PinnedPluginListPlugin, {
      items: {
        ui: { order: 100, component: 'DesignableSwitch', pin: true, snippet: 'ui.*' },
        pm: { order: 200, component: 'PluginManagerLink', pin: true, snippet: 'pm' },
        sc: { order: 300, component: 'SettingsCenterDropdown', pin: true, snippet: 'pm.*' },
      },
    });
    this.app.pm.add(SchemaComponentPlugin);
    this.app.pm.add(SchemaInitializerPlugin, {
      initializers: {
        MenuItemInitializers,
      },
    });
    this.app.pm.add(BlockSchemaComponentPlugin);
    this.app.pm.add(AntdSchemaComponentPlugin);
    this.app.pm.add(SigninPageExtensionPlugin);
    this.app.pm.add(ACLPlugin);
    this.app.pm.add(RemoteDocumentTitlePlugin);
    this.app.pm.add(PMPlugin);
  }
}

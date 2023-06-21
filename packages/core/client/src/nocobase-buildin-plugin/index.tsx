import React from 'react';
import { Navigate } from 'react-router-dom';
import { ACLPlugin } from '../acl';
import { AntdConfigPlugin } from '../antd-config-provider';
import { Plugin } from '../application-v2';
import { SigninPage, SigninPageExtensionPlugin, SignupPage } from '../auth';
import { BlockSchemaComponentPlugin } from '../block-provider';
import { RemoteDocumentTitlePlugin } from '../document-title';
import { PinnedPluginListPlugin } from '../plugin-manager';
import { PMPlugin } from '../pm';
import { AdminLayout, AuthLayout, RouteSchemaComponent } from '../route-switch';
import { AntdSchemaComponentPlugin, MenuItemInitializers, SchemaComponentPlugin } from '../schema-component';
import { SchemaInitializerPlugin } from '../schema-initializer';
import { BlockTemplateDetails, BlockTemplatePage } from '../schema-templates';
import { SystemSettingsPlugin } from '../system-settings';

export class NoCoBaseBuildInPlugin extends Plugin {
  async load() {
    this.addPlugins();
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
      element: <AdminLayout />,
    });
    this.router.add('admin.page', {
      path: '/admin/:name',
      element: <RouteSchemaComponent />,
    });

    this.router.add('auth', {
      element: <AuthLayout />,
    });
    this.router.add('auth.signin', {
      path: '/signin',
      element: <SigninPage />,
    });
    this.router.add('auth.signup', {
      path: '/signup',
      element: <SignupPage />,
    });
  }

  addComponents() {
    this.app.addComponents({
      AuthLayout,
      AdminLayout,
      RouteSchemaComponent,
      BlockTemplatePage,
      BlockTemplateDetails,
    });
  }
  addPlugins() {
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

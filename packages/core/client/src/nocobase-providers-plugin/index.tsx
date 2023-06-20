import React from 'react';
import { Link, Navigate, NavLink } from 'react-router-dom';
import { ACLProvider } from '../acl';
import { AntdConfigProvider } from '../antd-config-provider';
import { Plugin } from '../application-v2';
import { SigninPage, SigninPageExtensionProvider, SignupPage } from '../auth';
import { BlockSchemaComponentProvider } from '../block-provider';
import { RemoteDocumentTitleProvider } from '../document-title';
import { PinnedPluginListProvider } from '../plugin-manager';
import PMProvider, { PluginManagerLink, SettingsCenterDropdown } from '../pm';
import { AdminLayout, AuthLayout, RouteSchemaComponent } from '../route-switch';
import {
  AntdSchemaComponentProvider,
  DesignableSwitch,
  MenuItemInitializers,
  SchemaComponentProvider,
} from '../schema-component';
import { SchemaInitializerProvider } from '../schema-initializer';
import { BlockTemplateDetails, BlockTemplatePage } from '../schema-templates';
import { SystemSettingsProvider } from '../system-settings';

export class NoCoBaseProvidersPlugin extends Plugin {
  async load() {
    this.registerComponents();
    this.addRoutes();
    this.addProviders();
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

  registerComponents() {
    this.app.registerComponents({
      AuthLayout,
      AdminLayout,
      RouteSchemaComponent,
      BlockTemplatePage,
      BlockTemplateDetails,
    });
  }

  addProviders() {
    this.app.use(AntdConfigProvider, { remoteLocale: true });
    this.app.use(SystemSettingsProvider);
    this.app.use(PinnedPluginListProvider, {
      items: {
        ui: { order: 100, component: 'DesignableSwitch', pin: true, snippet: 'ui.*' },
        pm: { order: 200, component: 'PluginManagerLink', pin: true, snippet: 'pm' },
        sc: { order: 300, component: 'SettingsCenterDropdown', pin: true, snippet: 'pm.*' },
      },
    });
    this.app.use(SchemaComponentProvider, {
      components: { Link, NavLink, DesignableSwitch, PluginManagerLink, SettingsCenterDropdown },
    });
    this.app.use(SchemaInitializerProvider, {
      initializers: {
        MenuItemInitializers,
      },
    });
    this.app.use(BlockSchemaComponentProvider);
    this.app.use(AntdSchemaComponentProvider);
    this.app.use(SigninPageExtensionProvider);
    this.app.use(ACLProvider);
    this.app.use(RemoteDocumentTitleProvider);
    this.app.use(PMProvider);
  }
}

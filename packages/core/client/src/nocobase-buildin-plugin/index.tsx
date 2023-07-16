import { css } from '@emotion/css';
import { Button, Result, Spin } from 'antd';
import React, { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { ACLPlugin } from '../acl';
import { AntdConfigPlugin } from '../antd-config-provider';
import { Application } from '../application';
import { Plugin } from '../application/Plugin';
import { SigninPage, SigninPageExtensionPlugin, SignupPage } from '../auth';
import { BlockSchemaComponentPlugin } from '../block-provider';
import CSSVariableProvider from '../css-variable/CSSVariableProvider';
import { RemoteDocumentTitlePlugin } from '../document-title';
import { AntdAppProvider, GlobalThemeProvider } from '../global-theme';
import { PinnedListPlugin } from '../plugin-manager';
import { PMPlugin } from '../pm';
import { AdminLayoutPlugin, AuthLayout, RouteSchemaComponent } from '../route-switch';
import { AntdSchemaComponentPlugin, MenuItemInitializers, SchemaComponentPlugin } from '../schema-component';
import { ErrorFallback } from '../schema-component/antd/error-fallback';
import { SchemaInitializerPlugin } from '../schema-initializer';
import { BlockTemplateDetails, BlockTemplatePage } from '../schema-templates';
import { SystemSettingsPlugin } from '../system-settings';
import { CurrentUserProvider, CurrentUserSettingsMenuProvider } from '../user';

const AppSpin = Spin;

const AppError: FC<{ app: Application; error: Error }> = ({ app, error }) => (
  <div>
    <Result
      className={css`
        top: 50%;
        position: absolute;
        width: 100%;
        transform: translate(0, -50%);
      `}
      status="error"
      title={app.i18n.t('Failed to load plugin')}
      subTitle={app.i18n.t(error?.message)}
      extra={[
        <Button type="primary" key="try" onClick={() => window.location.reload()}>
          {app.i18n.t('Try again')}
        </Button>,
      ]}
    />
  </div>
);

export class NocoBaseBuildInPlugin extends Plugin {
  async afterAdd(): Promise<void> {
    this.app.addComponents({
      AppSpin,
      AppError,
    });
    this.addPlugins();
  }
  async load() {
    this.addComponents();
    this.addRoutes();

    this.app.use(CurrentUserProvider);
    this.app.use(GlobalThemeProvider);
    this.app.use(AntdAppProvider);
    this.app.use(CSSVariableProvider);
    this.app.use(CurrentUserSettingsMenuProvider);
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
    this.app.pm.add(AdminLayoutPlugin, { name: 'admin-layout' });
    this.app.pm.add(AntdConfigPlugin, { name: 'antd-config', config: { remoteLocale: true } });
    this.app.pm.add(SystemSettingsPlugin, { name: 'system-setting' });
    this.app.pm.add(PinnedListPlugin, {
      name: 'pinned-list',
      config: {
        items: {
          ui: { order: 100, component: 'DesignableSwitch', pin: true, snippet: 'ui.*' },
          pm: { order: 200, component: 'PluginManagerLink', pin: true, snippet: 'pm' },
          sc: { order: 300, component: 'SettingsCenterDropdown', pin: true, snippet: 'pm.*' },
        },
      },
    });
    this.app.pm.add(SchemaComponentPlugin, { name: 'schema-component' });
    this.app.pm.add(SchemaInitializerPlugin, {
      name: 'schema-initializer',
      config: {
        initializers: {
          MenuItemInitializers,
        },
      },
    });
    this.app.pm.add(BlockSchemaComponentPlugin, { name: 'block-schema-component' });
    this.app.pm.add(AntdSchemaComponentPlugin, { name: 'antd-schema-component' });
    this.app.pm.add(SigninPageExtensionPlugin, { name: 'signin-page-extension' });
    this.app.pm.add(ACLPlugin, { name: 'acl' });
    this.app.pm.add(RemoteDocumentTitlePlugin, { name: 'remote-document-title' });
    this.app.pm.add(PMPlugin, { name: 'pm' });
  }
}

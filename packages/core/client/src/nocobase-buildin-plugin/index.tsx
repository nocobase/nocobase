import { LoadingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/reactive-react';
import { Button, Modal, Result, Spin } from 'antd';
import React, { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { ACLPlugin } from '../acl';
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
import { LocalePlugin } from './plugins/LocalePlugin';

const AppSpin = () => {
  return (
    <Spin style={{ position: 'fixed', top: '50%', left: '50%', fontSize: 72, transform: 'translate(-50%, -50%)' }} />
  );
};

const AppError: FC<{ app: Application }> = observer(({ app }) => (
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
      subTitle={app.i18n.t(app.error?.message)}
      extra={[
        <Button type="primary" key="try" onClick={() => window.location.reload()}>
          {app.i18n.t('Try again')}
        </Button>,
      ]}
    />
  </div>
));

const getProps = (app: Application) => {
  if (app.ws.serverDown) {
    return {
      status: 'error',
      title: 'App error',
      subTitle: 'The server is down',
    };
  }

  if (!app.error) {
    return {};
  }

  if (app.error.code === 'APP_NOT_FOUND') {
    return {
      status: 'warning',
      title: 'App not found',
      subTitle: app.error?.message,
    };
  }

  if (app.error.code === 'APP_INITIALIZING') {
    return {
      status: 'info',
      icon: <LoadingOutlined />,
      title: 'App initializing',
      subTitle: app.error?.message,
    };
  }

  if (app.error.code === 'APP_INITIALIZED') {
    return {
      status: 'warning',
      title: 'App initialized',
      subTitle: app.error?.message,
    };
  }

  if (app.error.code === 'APP_ERROR') {
    return {
      status: 'error',
      title: 'App error',
      subTitle: app.error?.message,
    };
  }

  if (app.error.code === 'APP_NOT_INSTALLED_ERROR') {
    return {
      status: 'warning',
      title: 'App not installed',
      subTitle: app.error?.message,
    };
  }

  if (app.error.code === 'APP_STOPPED') {
    return {
      status: 'warning',
      title: 'App stopped',
      subTitle: app.error?.message,
    };
  }

  if (app.error.code === 'APP_COMMANDING') {
    const props = {
      status: 'info',
      icon: <LoadingOutlined />,
      title: app.error?.command?.name,
      subTitle: app.error?.message,
    };
    const commands = {
      start: {
        title: 'App starting',
      },
      restart: {
        title: 'App restarting',
      },
      install: {
        title: 'App installing',
      },
      upgrade: {
        title: 'App upgrading',
      },
      'pm.add': {
        title: 'Adding plugin',
      },
      'pm.update': {
        title: 'Updating plugin',
      },
      'pm.enable': {
        title: 'Enabling plugin',
      },
      'pm.disable': {
        title: 'Disabling plugin',
      },
      'pm.remove': {
        title: 'Removing plugin',
      },
    };
    return { ...props, ...commands[app.error?.command?.name] };
  }

  return {};
};

const AppMaintaining: FC<{ app: Application; error: Error }> = observer(({ app }) => {
  const { icon, status, title, subTitle } = getProps(app);
  return (
    <div>
      <Result
        className={css`
          top: 50%;
          position: absolute;
          width: 100%;
          transform: translate(0, -50%);
        `}
        icon={icon}
        status={status}
        title={app.i18n.t(title)}
        subTitle={app.i18n.t(subTitle)}
        // extra={[
        //   <Button type="primary" key="try" onClick={() => window.location.reload()}>
        //     {app.i18n.t('Try again')}
        //   </Button>,
        // ]}
      />
    </div>
  );
});

const AppMaintainingDialog: FC<{ app: Application; error: Error }> = observer(({ app }) => {
  const { icon, status, title, subTitle } = getProps(app);
  return (
    <Modal open={true} footer={null} closable={false}>
      <Result icon={icon} status={status} title={app.i18n.t(title)} subTitle={app.i18n.t(subTitle)} />
    </Modal>
  );
});

export class NocoBaseBuildInPlugin extends Plugin {
  async afterAdd() {
    this.app.addComponents({
      AppSpin,
      AppError,
      AppMaintaining,
      AppMaintainingDialog,
    });
    await this.addPlugins();
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
  async addPlugins() {
    await this.app.pm.add(LocalePlugin, { name: 'locale' });
    await this.app.pm.add(AdminLayoutPlugin, { name: 'admin-layout' });
    await this.app.pm.add(SystemSettingsPlugin, { name: 'system-setting' });
    await this.app.pm.add(PinnedListPlugin, {
      name: 'pinned-list',
      config: {
        items: {
          ui: { order: 100, component: 'DesignableSwitch', pin: true, snippet: 'ui.*' },
          pm: { order: 200, component: 'PluginManagerLink', pin: true, snippet: 'pm' },
          sc: { order: 300, component: 'SettingsCenterDropdown', pin: true, snippet: 'pm.*' },
        },
      },
    });
    await this.app.pm.add(SchemaComponentPlugin, { name: 'schema-component' });
    await this.app.pm.add(SchemaInitializerPlugin, {
      name: 'schema-initializer',
      config: {
        initializers: {
          MenuItemInitializers,
        },
      },
    });
    await this.app.pm.add(BlockSchemaComponentPlugin, { name: 'block-schema-component' });
    await this.app.pm.add(AntdSchemaComponentPlugin, { name: 'antd-schema-component' });
    await this.app.pm.add(SigninPageExtensionPlugin, { name: 'signin-page-extension' });
    await this.app.pm.add(ACLPlugin, { name: 'acl' });
    await this.app.pm.add(RemoteDocumentTitlePlugin, { name: 'remote-document-title' });
    await this.app.pm.add(PMPlugin, { name: 'pm' });
  }
}

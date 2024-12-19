/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisconnectOutlined, LoadingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/reactive-react';
import { getSubAppName } from '@nocobase/sdk';
import { Button, Modal, Result, Spin } from 'antd';
import React, { FC } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ACLPlugin } from '../acl';
import { useAPIClient } from '../api-client';
import { Application } from '../application';
import { Plugin } from '../application/Plugin';
import { BlockSchemaComponentPlugin } from '../block-provider';
import { CollectionPlugin } from '../collection-manager';
import { RemoteDocumentTitlePlugin } from '../document-title';
import { PinnedListPlugin } from '../plugin-manager';
import { PMPlugin } from '../pm';
import { AdminLayoutPlugin, RouteSchemaComponent } from '../route-switch';
import { AntdSchemaComponentPlugin, PageTabs, SchemaComponentPlugin } from '../schema-component';
import { ErrorFallback } from '../schema-component/antd/error-fallback';
import { PagePopups } from '../schema-component/antd/page/PagePopups';
import { AssociationFilterPlugin, SchemaInitializerPlugin } from '../schema-initializer';
import { SchemaSettingsPlugin } from '../schema-settings';
import { BlockTemplateDetails, BlockTemplatePage } from '../schema-templates';
import { SystemSettingsPlugin } from '../system-settings';
import { CurrentUserProvider, CurrentUserSettingsMenuProvider } from '../user';
import { LocalePlugin } from './plugins/LocalePlugin';

const AppSpin = () => {
  return (
    <Spin style={{ position: 'fixed', top: '50%', left: '50%', fontSize: 72, transform: 'translate(-50%, -50%)' }} />
  );
};

const useErrorProps = (app: Application, error: any) => {
  if (!error) {
    return {};
  }
  const err = error?.response?.data?.errors?.[0] || error;
  const subApp = getSubAppName(app.getPublicPath());
  switch (err.code) {
    case 'USER_HAS_NO_ROLES_ERR':
      return {
        title: app.i18n.t('Permission denied'),
        subTitle: err.message,
        extra: [
          <Button
            type="primary"
            key="try"
            onClick={() => {
              app.apiClient.auth.setToken(null);
              window.location.reload();
            }}
          >
            {app.i18n.t('Sign in with another account')}
          </Button>,
          subApp ? (
            <Button key="back" onClick={() => (window.location.href = '/admin')}>
              {app.i18n.t('Return to the main application')}
            </Button>
          ) : null,
        ],
      };
    default:
      return {};
  }
};

const AppError: FC<{ error: Error; app: Application }> = observer(
  ({ app, error }) => {
    const props = useErrorProps(app, error);
    return (
      <div>
        <Result
          className={css`
            top: 50%;
            position: absolute;
            width: 100%;
            transform: translate(0, -50%);
          `}
          status="error"
          title={app.i18n.t('App error')}
          subTitle={app.i18n.t(error?.message)}
          extra={[
            <Button type="primary" key="try" onClick={() => window.location.reload()}>
              {app.i18n.t('Try again')}
            </Button>,
          ]}
          {...props}
        />
      </div>
    );
  },
  { displayName: 'AppError' },
);

const getProps = (app: Application) => {
  if (app.ws.serverDown) {
    return {
      status: 'error',
      icon: <DisconnectOutlined />,
      title: "You're offline",
      subTitle: 'Please check the server status or network connection status',
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

  if (['ENOENT', 'APP_ERROR', 'LOAD_ERROR'].includes(app.error.code)) {
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

  return {
    status: 'warning',
    title: 'App warning',
    subTitle: app.error?.message,
  };
};

const AppMaintaining: FC<{ app: Application; error: Error }> = observer(
  ({ app }) => {
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
          subTitle={<div style={{ whiteSpace: 'pre-wrap' }}>{app.i18n.t(subTitle)}</div>}
          // extra={[
          //   <Button type="primary" key="try" onClick={() => window.location.reload()}>
          //     {app.i18n.t('Try again')}
          //   </Button>,
          // ]}
        />
      </div>
    );
  },
  { displayName: 'AppMaintaining' },
);

const AppMaintainingDialog: FC<{ app: Application; error: Error }> = observer(
  ({ app }) => {
    const { icon, status, title, subTitle } = getProps(app);
    return (
      <Modal open={true} footer={null} closable={false}>
        <Result icon={icon} status={status} title={app.i18n.t(title)} subTitle={app.i18n.t(subTitle)} />
      </Modal>
    );
  },
  { displayName: 'AppMaintainingDialog' },
);

const AppNotFound = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Button onClick={() => navigate('/', { replace: true })} type="primary">
          Back Home
        </Button>
      }
    />
  );
};

export class NocoBaseBuildInPlugin extends Plugin {
  async afterAdd() {
    this.app.addComponents({
      AppSpin,
      AppError,
      AppMaintaining,
      AppMaintainingDialog,
      AppNotFound,
    });
    await this.addPlugins();
  }

  async load() {
    this.addComponents();
    this.addRoutes();

    this.app.use(CurrentUserProvider);
    this.app.use(CurrentUserSettingsMenuProvider);
  }

  addRoutes() {
    this.router.add('root', {
      path: '/',
      element: <Navigate replace to="/admin" />,
    });

    this.router.add('not-found', {
      path: '*',
      Component: AppNotFound,
    });

    this.router.add('admin', {
      path: '/admin',
      Component: 'AdminLayout',
    });
    this.router.add('admin.page', {
      path: '/admin/:name',
      Component: 'AdminDynamicPage',
    });
    this.router.add('admin.page.tab', {
      path: '/admin/:name/tabs/:tabUid',
      Component: PageTabs as any,
    });
    this.router.add('admin.page.popup', {
      path: '/admin/:name/popups/*',
      Component: PagePopups,
    });
    this.router.add('admin.page.tab.popup', {
      path: '/admin/:name/tabs/:tabUid/popups/*',
      Component: PagePopups,
    });
  }

  addComponents() {
    this.app.addComponents({
      ErrorFallback,
      RouteSchemaComponent,
      BlockTemplatePage,
      BlockTemplateDetails,
    });
  }
  async addPlugins() {
    await this.app.pm.add(AssociationFilterPlugin);
    await this.app.pm.add(LocalePlugin, { name: 'builtin-locale' });
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
    await this.app.pm.add(SchemaInitializerPlugin, { name: 'schema-initializer' });
    await this.app.pm.add(SchemaSettingsPlugin, { name: 'schema-settings' });
    await this.app.pm.add(BlockSchemaComponentPlugin, { name: 'block-schema-component' });
    await this.app.pm.add(AntdSchemaComponentPlugin, { name: 'antd-schema-component' });
    await this.app.pm.add(ACLPlugin, { name: 'builtin-acl' });
    await this.app.pm.add(RemoteDocumentTitlePlugin, { name: 'remote-document-title' });
    await this.app.pm.add(PMPlugin, { name: 'builtin-pm' });
    await this.app.pm.add(CollectionPlugin, { name: 'builtin-collection' });
    // await this.app.pm.add(Plugin, { name: 'builtin-plugin' });
  }
}

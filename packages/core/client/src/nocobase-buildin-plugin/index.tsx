import { LoadingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useInterval } from 'ahooks';
import { Button, Result, Spin } from 'antd';
import React, { FC, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ACLPlugin } from '../acl';
import { AntdConfigPlugin } from '../antd-config-provider';
import { Application } from '../application';
import { Plugin } from '../application/Plugin';
import { SigninPage, SigninPageExtensionPlugin, SignupPage } from '../auth';
import { BlockSchemaComponentPlugin } from '../block-provider';
import { RemoteDocumentTitlePlugin } from '../document-title';
import { PinnedListPlugin } from '../plugin-manager';
import { PMPlugin } from '../pm';
import { AdminLayoutPlugin, AuthLayout, RouteSchemaComponent } from '../route-switch';
import { AntdSchemaComponentPlugin, MenuItemInitializers, SchemaComponentPlugin } from '../schema-component';
import { ErrorFallback } from '../schema-component/antd/error-fallback';
import { SchemaInitializerPlugin } from '../schema-initializer';
import { BlockTemplateDetails, BlockTemplatePage } from '../schema-templates';
import { SystemSettingsPlugin } from '../system-settings';

const AppSpin = Spin;

const toData = (error) => {
  const data = error?.response?.data;
  if (data) {
    if (data.doing) {
      if (data.status === 'not-ready') {
        return {
          hideButton: true,
          polling: true,
          icon: <LoadingOutlined />,
          title: 'Application is starting',
          message: data?.doing,
        };
      }
      return {
        status: 'error',
        title: data.lastWorkerError,
        // message: data?.doing,
      };
    }
    return error?.response?.data;
  }
  return {
    status: 'error',
    message: error?.message,
  };
};

const AppError: FC<{ app: Application; error: any }> = ({ app, error }) => {
  const [data, setData] = useState(toData(error));
  const clear = useInterval(() => {
    if (data.polling) {
      app.apiClient
        .silent()
        .request({ url: 'app:getInfo' })
        .then(() => {
          window.location.reload();
        })
        .catch((error) => {
          setData(toData(error));
        });
    } else {
      clear();
    }
  }, 1000);
  return (
    <div>
      <Result
        className={css`
          top: 50%;
          position: absolute;
          width: 100%;
          transform: translate(0, -50%);
        `}
        icon={data.icon}
        status={data.status}
        title={app.i18n.t(data.title)}
        subTitle={app.i18n.t(data.message)}
        extra={
          data.hideButton
            ? []
            : [
                <Button type="primary" key="try" onClick={() => window.location.reload()}>
                  {app.i18n.t('Try again')}
                </Button>,
              ]
        }
      />
    </div>
  );
};

export class NocoBaseBuildInPlugin extends Plugin {
  async afterAdd(): Promise<void> {
    this.app.addComponents({
      AppSpin,
      AppError,
    });
    this.app.apiClient.silent();
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

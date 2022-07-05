import { i18n as i18next } from 'i18next';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { ACLProvider, ACLShortcut } from '../acl';
import { AntdConfigProvider } from '../antd-config-provider';
import { APIClient, APIClientProvider } from '../api-client';
import { BlockSchemaComponentProvider } from '../block-provider';
import { CollectionManagerShortcut } from '../collection-manager';
import { RemoteDocumentTitleProvider } from '../document-title';
import { FileStorageShortcut } from '../file-manager';
import { i18n } from '../i18n';
import { PluginManagerProvider } from '../plugin-manager';
import {
  AdminLayout,
  AuthLayout,
  RemoteRouteSwitchProvider,
  RouteSchemaComponent,
  RouteSwitch,
  useRoutes
} from '../route-switch';
import {
  AntdSchemaComponentProvider,
  DesignableSwitch,
  MenuItemInitializers,
  SchemaComponentProvider
} from '../schema-component';
import { SchemaInitializerProvider } from '../schema-initializer';
import { BlockTemplateDetails, BlockTemplatePage, SchemaTemplateShortcut } from '../schema-templates';
import { SystemSettingsProvider, SystemSettingsShortcut } from '../system-settings';
import { SigninPage, SignupPage } from '../user';
import { compose } from './compose';

export interface ApplicationOptions {
  apiClient?: any;
  i18n?: any;
  plugins?: any[];
}

export type PluginCallback = () => Promise<any>;

export class Application {
  providers = [];
  mainComponent = null;
  apiClient: APIClient;
  i18n: i18next;
  plugins: PluginCallback[] = [];

  constructor(options: ApplicationOptions) {
    this.apiClient = new APIClient({
      baseURL: process.env.API_BASE_URL,
      headers: {
        'X-Hostname': window?.location?.hostname,
      },
      ...options.apiClient,
    });
    this.i18n = options.i18n || i18n;
    this.use(APIClientProvider, { apiClient: this.apiClient });
    this.use(I18nextProvider, { i18n: this.i18n });
    this.use(AntdConfigProvider, { remoteLocale: true });
    this.use(RemoteRouteSwitchProvider, {
      components: {
        AuthLayout,
        AdminLayout,
        RouteSchemaComponent,
        SigninPage,
        SignupPage,
        BlockTemplatePage,
        BlockTemplateDetails,
      },
    });
    this.use(SystemSettingsProvider);
    this.use(PluginManagerProvider, {
      components: {
        ACLShortcut,
        DesignableSwitch,
        CollectionManagerShortcut,
        SystemSettingsShortcut,
        SchemaTemplateShortcut,
        FileStorageShortcut,
      },
    });
    this.use(SchemaComponentProvider, { components: { Link, NavLink } });
    this.use(SchemaInitializerProvider, {
      initializers: {
        MenuItemInitializers,
      },
    });
    this.use(BlockSchemaComponentProvider);
    this.use(AntdSchemaComponentProvider);
    this.use(ACLProvider);
    this.use(RemoteDocumentTitleProvider);

    for (const plugin of options.plugins) {
      const [component, props] = Array.isArray(plugin) ? plugin : [plugin];
      this.use(component, props);
    }
  }

  use(component, props?: any) {
    this.providers.push(props ? [component, props] : component);
  }

  main(mainComponent: any) {
    this.mainComponent = mainComponent;
  }

  /**
   * TODO
   */
  plugin(plugin: PluginCallback) {
    this.plugins.push(plugin);
  }

  render() {
    return compose(...this.providers)(
      this.mainComponent ||
        (() => {
          const routes = useRoutes();
          return (
            <div>
              <RouteSwitch routes={routes} />
            </div>
          );
        }),
    );
  }
}

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@formily/reactive';
import { APIClientOptions, getSubAppName } from '@nocobase/sdk';
import { i18n as i18next } from 'i18next';
import get from 'lodash/get';
import merge from 'lodash/merge';
import set from 'lodash/set';
import React, { ComponentType, FC, ReactElement, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { Link, NavLink, Navigate } from 'react-router-dom';
import { APIClient, APIClientProvider } from '../api-client';
import { CSSVariableProvider } from '../css-variable';
import { AntdAppProvider, GlobalThemeProvider } from '../global-theme';
import { i18n } from '../i18n';
import { PluginManager, PluginType } from './PluginManager';
import { PluginSettingOptions, PluginSettingsManager } from './PluginSettingsManager';
import { ComponentTypeAndString, RouterManager, RouterOptions } from './RouterManager';
import { WebSocketClient, WebSocketClientOptions } from './WebSocketClient';
import { AppComponent, BlankComponent, defaultAppComponents } from './components';
import { SchemaInitializer, SchemaInitializerManager } from './schema-initializer';
import * as schemaInitializerComponents from './schema-initializer/components';
import { SchemaSettings, SchemaSettingsItemType, SchemaSettingsManager } from './schema-settings';

import { compose, normalizeContainer } from './utils';
import { defineGlobalDeps } from './utils/globalDeps';
import { getRequireJs } from './utils/requirejs';

import { CollectionFieldInterfaceComponentOption } from '../data-source/collection-field-interface/CollectionFieldInterface';
import { CollectionField } from '../data-source/collection-field/CollectionField';
import { DataSourceApplicationProvider } from '../data-source/components/DataSourceApplicationProvider';
import { DataBlockProvider } from '../data-source/data-block/DataBlockProvider';
import { DataSourceManager, type DataSourceManagerOptions } from '../data-source/data-source/DataSourceManager';

import type { CollectionFieldInterfaceFactory } from '../data-source';
import { OpenModeProvider } from '../modules/popup/OpenModeProvider';
import { AppSchemaComponentProvider } from './AppSchemaComponentProvider';
import type { Plugin } from './Plugin';
import { getOperators } from './globalOperators';
import { useAclSnippets } from './hooks/useAclSnippets';
import type { RequireJS } from './utils/requirejs';

type JsonLogic = {
  addOperation: (name: string, fn?: any) => void;
  rmOperation: (name: string) => void;
};

declare global {
  interface Window {
    define: RequireJS['define'];
  }
}

export type DevDynamicImport = (packageName: string) => Promise<{ default: typeof Plugin }>;
export type ComponentAndProps<T = any> = [ComponentType, T];
export interface ApplicationOptions {
  name?: string;
  publicPath?: string;
  apiClient?: APIClientOptions | APIClient;
  ws?: WebSocketClientOptions | boolean;
  i18n?: i18next;
  providers?: (ComponentType | ComponentAndProps)[];
  plugins?: PluginType[];
  components?: Record<string, ComponentType>;
  scopes?: Record<string, any>;
  router?: RouterOptions;
  pluginSettings?: Record<string, PluginSettingOptions>;
  schemaSettings?: SchemaSettings[];
  schemaInitializers?: SchemaInitializer[];
  designable?: boolean;
  loadRemotePlugins?: boolean;
  devDynamicImport?: DevDynamicImport;
  dataSourceManager?: DataSourceManagerOptions;
  disableAcl?: boolean;
}

export class Application {
  public eventBus = new EventTarget();

  public providers: ComponentAndProps[] = [];
  public router: RouterManager;
  public scopes: Record<string, any> = {};
  public i18n: i18next;
  public ws: WebSocketClient;
  public apiClient: APIClient;
  public components: Record<string, ComponentType<any> | any> = {
    DataBlockProvider,
    ...defaultAppComponents,
    ...schemaInitializerComponents,
    CollectionField,
  };
  public pluginManager: PluginManager;
  public pluginSettingsManager: PluginSettingsManager;
  public devDynamicImport: DevDynamicImport;
  public requirejs: RequireJS;
  public notification;
  public schemaInitializerManager: SchemaInitializerManager;
  public schemaSettingsManager: SchemaSettingsManager;
  public dataSourceManager: DataSourceManager;
  public name: string;
  public favicon: string;
  public globalVars: Record<string, any> = {};
  public globalVarCtxs: Record<string, any> = {};
  public jsonLogic: JsonLogic;
  loading = true;
  maintained = false;
  maintaining = false;
  error = null;
  hasLoadError = false;

  private wsAuthorized = false;

  get pm() {
    return this.pluginManager;
  }
  get disableAcl() {
    return this.options.disableAcl;
  }

  get isWsAuthorized() {
    return this.wsAuthorized;
  }

  updateFavicon(favicon?: string) {
    let faviconLinkElement: HTMLLinkElement = document.querySelector('link[rel="shortcut icon"]');

    if (favicon) {
      this.favicon = favicon;
    }

    if (!faviconLinkElement) {
      faviconLinkElement = document.createElement('link');
      faviconLinkElement.rel = 'shortcut icon';
      faviconLinkElement.href = this.favicon || '/favicon/favicon.ico';
      document.head.appendChild(faviconLinkElement);
    } else {
      faviconLinkElement.href = this.favicon || '/favicon/favicon.ico';
    }
  }

  setWsAuthorized(authorized: boolean) {
    this.wsAuthorized = authorized;
  }

  constructor(protected options: ApplicationOptions = {}) {
    this.initRequireJs();
    define(this, {
      maintained: observable.ref,
      loading: observable.ref,
      maintaining: observable.ref,
      error: observable.ref,
    });
    this.devDynamicImport = options.devDynamicImport;
    this.scopes = merge(this.scopes, options.scopes);
    this.components = merge(this.components, options.components);
    this.apiClient = options.apiClient instanceof APIClient ? options.apiClient : new APIClient(options.apiClient);
    this.apiClient.app = this;
    this.i18n = options.i18n || i18n;
    this.router = new RouterManager(options.router, this);
    this.schemaSettingsManager = new SchemaSettingsManager(options.schemaSettings, this);
    this.pluginManager = new PluginManager(options.plugins, options.loadRemotePlugins, this);
    this.schemaInitializerManager = new SchemaInitializerManager(options.schemaInitializers, this);
    this.dataSourceManager = new DataSourceManager(options.dataSourceManager, this);
    this.addDefaultProviders();
    this.addReactRouterComponents();
    this.addProviders(options.providers || []);
    this.ws = new WebSocketClient(options.ws);
    this.ws.app = this;
    this.pluginSettingsManager = new PluginSettingsManager(options.pluginSettings, this);
    this.addRoutes();
    this.name = this.options.name || getSubAppName(options.publicPath) || 'main';
    this.i18n.on('languageChanged', (lng) => {
      this.apiClient.auth.locale = lng;
    });
    this.initListeners();
    this.jsonLogic = getOperators();
  }

  private initListeners() {
    this.eventBus.addEventListener('auth:tokenChanged', (event: CustomEvent) => {
      this.setTokenInWebSocket(event.detail);
    });

    this.eventBus.addEventListener('maintaining:end', () => {
      if (this.apiClient.auth.token) {
        this.setTokenInWebSocket({
          token: this.apiClient.auth.token,
          authenticator: this.apiClient.auth.getAuthenticator(),
        });
      }
    });
  }

  protected setTokenInWebSocket(options: { token: string; authenticator: string }) {
    const { token, authenticator } = options;
    if (this.maintaining) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: 'auth:token',
        payload: {
          token,
          authenticator,
        },
      }),
    );
  }

  setMaintaining(maintaining: boolean) {
    // if maintaining is the same, do nothing
    if (this.maintaining === maintaining) {
      return;
    }

    this.maintaining = maintaining;
    if (!maintaining) {
      this.eventBus.dispatchEvent(new Event('maintaining:end'));
    }
  }

  private initRequireJs() {
    this.requirejs = getRequireJs();
    defineGlobalDeps(this.requirejs);
    window.define = this.requirejs.define;
  }

  private addDefaultProviders() {
    this.use(APIClientProvider, { apiClient: this.apiClient });
    this.use(I18nextProvider, { i18n: this.i18n });
    this.use(GlobalThemeProvider);
    this.use(CSSVariableProvider);
    this.use(AppSchemaComponentProvider, {
      designable: this.options.designable,
      appName: this.name,
      components: this.components,
      scope: this.scopes,
    });
    this.use(AntdAppProvider);
    this.use(DataSourceApplicationProvider, { dataSourceManager: this.dataSourceManager });
    this.use(OpenModeProvider);
  }

  private addReactRouterComponents() {
    this.addComponents({
      Link,
      Navigate: Navigate as ComponentType,
      NavLink: NavLink as ComponentType,
    });
  }

  private addRoutes() {
    this.router.add('not-found', {
      path: '*',
      Component: this.components['AppNotFound'],
    });
  }

  getOptions() {
    return this.options;
  }

  getName() {
    return getSubAppName(this.getPublicPath()) || null;
  }

  getPublicPath() {
    let publicPath = this.options.publicPath || '/';
    if (!publicPath.endsWith('/')) {
      publicPath += '/';
    }
    return publicPath;
  }

  getApiUrl(pathname = '') {
    let baseURL = this.apiClient.axios['defaults']['baseURL'];
    if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
      const { protocol, host } = window.location;
      baseURL = `${protocol}//${host}${baseURL}`;
    }
    return baseURL.replace(/\/$/g, '') + '/' + pathname.replace(/^\//g, '');
  }

  getRouteUrl(pathname: string) {
    return this.getPublicPath() + pathname.replace(/^\//g, '');
  }

  getHref(pathname: string) {
    const name = this.name;
    if (name && name !== 'main') {
      return this.getPublicPath() + 'apps/' + name + '/' + pathname.replace(/^\//g, '');
    }
    return this.getPublicPath() + pathname.replace(/^\//g, '');
  }

  getCollectionManager(dataSource?: string) {
    return this.dataSourceManager.getDataSource(dataSource)?.collectionManager;
  }

  /**
   * @internal
   */
  getComposeProviders() {
    const Providers = compose(...this.providers)(BlankComponent);
    Providers.displayName = 'Providers';
    return Providers;
  }

  use<T = any>(component: ComponentType, props?: T) {
    return this.addProvider(component, props);
  }

  addProvider<T = any>(component: ComponentType, props?: T) {
    return this.providers.push([component, props]);
  }

  addProviders(providers: (ComponentType | [ComponentType, any])[]) {
    providers.forEach((provider) => {
      if (Array.isArray(provider)) {
        this.addProvider(provider[0], provider[1]);
      } else {
        this.addProvider(provider);
      }
    });
  }

  async load() {
    try {
      this.loading = true;
      await this.loadWebSocket();
      await this.pm.load();
    } catch (error) {
      this.hasLoadError = true;

      //not trigger infinite reload when blocked ip
      if (error?.response?.data?.errors?.[0]?.code === 'BLOCKED_IP') {
        this.hasLoadError = false;
      }

      if (this.ws.enabled) {
        await new Promise((resolve) => {
          setTimeout(() => resolve(null), 1000);
        });
      }
      this.error = {
        code: 'LOAD_ERROR',
        ...this.apiClient.toErrMessages(error)?.[0],
      };
      console.error(error, this.error);
    }
    this.loading = false;
    this.updateFavicon();
  }

  async loadWebSocket() {
    this.eventBus.addEventListener('ws:message:authorized', () => {
      this.setWsAuthorized(true);
    });

    this.ws.on('message', (event) => {
      const data = JSON.parse(event.data);

      if (data?.payload?.refresh) {
        window.location.reload();
        return;
      }

      if (data.type === 'notification') {
        this.notification[data.payload?.type || 'info']({ message: data.payload?.message });
        return;
      }

      const maintaining = data.type === 'maintaining' && data.payload.code !== 'APP_RUNNING';
      if (maintaining) {
        this.setMaintaining(true);
        this.error = data.payload;
      } else {
        if (this.hasLoadError) {
          window.location.reload();
        }

        this.setMaintaining(false);
        this.maintained = true;
        this.error = null;

        const type = data.type;
        if (!type) {
          return;
        }

        const eventName = `ws:message:${type}`;
        this.eventBus.dispatchEvent(new CustomEvent(eventName, { detail: data.payload }));
      }
    });

    this.ws.on('serverDown', () => {
      this.maintaining = true;
      this.maintained = false;
    });

    this.ws.on('open', () => {
      const token = this.apiClient.auth.token;

      if (token) {
        this.setTokenInWebSocket({ token, authenticator: this.apiClient.auth.getAuthenticator() });
      }
    });

    this.ws.connect();
  }

  getComponent<T = any>(Component: ComponentTypeAndString<T>, isShowError = true): ComponentType<T> | undefined {
    const showError = (msg: string) => isShowError && console.error(msg);
    if (!Component) {
      showError(`getComponent called with ${Component}`);
      return;
    }

    // ClassComponent or FunctionComponent
    if (typeof Component === 'function') return Component;

    // Component is a string, try to get it from this.components
    if (typeof Component === 'string') {
      const res = get(this.components, Component) as ComponentType<T>;
      if (!res) {
        showError(`Component ${Component} not found`);
        return;
      }
      return res;
    }

    showError(`Component ${Component} should be a string or a React component`);
    return;
  }

  renderComponent<T extends {}>(Component: ComponentTypeAndString, props?: T, children?: ReactNode): ReactElement {
    return React.createElement(this.getComponent(Component), props, children);
  }

  /**
   * @internal use addComponents({ SomeComponent }) instead
   */
  protected addComponent(component: ComponentType, name?: string) {
    const componentName = name || component.displayName || component.name;
    if (!componentName) {
      console.error('Component must have a displayName or pass name as second argument');
      return;
    }
    set(this.components, componentName, component);
  }

  addComponents(components: Record<string, ComponentType>) {
    Object.keys(components).forEach((name) => {
      this.addComponent(components[name], name);
    });
  }

  addScopes(scopes: Record<string, any>) {
    this.scopes = merge(this.scopes, scopes);
  }

  getRootComponent() {
    const Root: FC<{ children?: React.ReactNode }> = ({ children }) => (
      <AppComponent app={this}>{children}</AppComponent>
    );
    return Root;
  }

  mount(containerOrSelector: Element | ShadowRoot | string) {
    const container = normalizeContainer(containerOrSelector);
    if (!container) return;
    const App = this.getRootComponent();
    const root = createRoot(container);
    root.render(<App />);
    return root;
  }

  addFieldInterfaces(fieldInterfaceClasses: CollectionFieldInterfaceFactory[] = []) {
    return this.dataSourceManager.collectionFieldInterfaceManager.addFieldInterfaces(fieldInterfaceClasses);
  }

  addFieldInterfaceComponentOption(fieldName: string, componentOption: CollectionFieldInterfaceComponentOption) {
    return this.dataSourceManager.collectionFieldInterfaceManager.addFieldInterfaceComponentOption(
      fieldName,
      componentOption,
    );
  }

  /**
   * 为指定的字段接口添加操作符选项
   *
   * @param name 字段接口的名称
   * @param operatorOption 要添加的操作符选项
   *
   * @example
   * // 为"单行文本"类型字段添加"等于任意一个"操作符
   * app.addFieldInterfaceOperator('input', {
   *   label: '{{t("equals any of")}}',
   *   value: '$in',
   * });
   */
  addFieldInterfaceOperator(name: string, operatorOption: any) {
    return this.dataSourceManager.collectionFieldInterfaceManager.addFieldInterfaceOperator(name, operatorOption);
  }

  addGlobalVar(key: string, value: any, varCtx?: any) {
    set(this.globalVars, key, value);
    if (varCtx) {
      set(this.globalVarCtxs, key, varCtx);
    }
  }

  getGlobalVar(key) {
    return get(this.globalVars, key);
  }

  getGlobalVarCtx(key) {
    return get(this.globalVarCtxs, key);
  }
  addUserCenterSettingsItem(item: SchemaSettingsItemType & { aclSnippet?: string }) {
    const useVisibleProp = item.useVisible || (() => true);
    const useVisible = () => {
      const { allow } = useAclSnippets();
      const visible = useVisibleProp();
      if (!visible) {
        return false;
      }
      return item.aclSnippet ? allow(item.aclSnippet) : true;
    };

    this.schemaSettingsManager.addItem('userCenterSettings', item.name, {
      ...item,
      useVisible: useVisible,
    });
  }
}

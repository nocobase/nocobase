/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@formily/reactive';
import {
  FlowEngine,
  FlowEngineContext,
  FlowEngineGlobalsContextProvider,
  FlowEngineProvider,
  FlowModel,
  FlowModelRenderer,
} from '@nocobase/flow-engine';
import { APIClient, type APIClientOptions, getSubAppName } from '@nocobase/sdk';
import { createInstance, type i18n as i18next } from 'i18next';
import _ from 'lodash';
import React, { ComponentType, FC, ReactElement, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { Link, NavLink, Navigate } from 'react-router-dom';
import type { Plugin } from './Plugin';
import { PluginManager, type PluginType } from './PluginManager';
import { type PluginSettingOptions, PluginSettingsManager } from './PluginSettingsManager';
import { type ComponentTypeAndString, RouterManager, type RouterOptions } from './RouterManager';
import { WebSocketClient, type WebSocketClientOptions } from './WebSocketClient';
import { BlankComponent } from './components';
import { compose, normalizeContainer } from './utils';
import type { RequireJS } from './utils/requirejs';
import { getRequireJs } from './utils/requirejs';

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
  apiClient?: APIClientOptions;
  ws?: WebSocketClientOptions | boolean;
  i18n?: i18next;
  providers?: (ComponentType | ComponentAndProps)[];
  plugins?: PluginType[];
  components?: Record<string, ComponentType>;
  scopes?: Record<string, any>;
  router?: RouterOptions;
  pluginSettings?: Record<string, PluginSettingOptions>;
  designable?: boolean;
  loadRemotePlugins?: boolean;
  devDynamicImport?: DevDynamicImport;
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
    AppNotFound: () => <div>Not Found</div>,
    AppError: () => <div>{this.error?.message}</div>,
    AppSpin: () => <div>Loading</div>,
    AppMaintaining: () => <div>Maintaining</div>,
    AppMaintainingDialog: () => <div>Maintaining Dialog</div>,
  };
  public pluginManager: PluginManager;
  public pluginSettingsManager: PluginSettingsManager;
  public devDynamicImport: DevDynamicImport;
  public requirejs: RequireJS;
  public name: string;
  public favicon: string;
  public flowEngine: FlowEngine;
  public context: FlowEngineContext & {
    pluginSettingsRouter: PluginSettingsManager;
    pluginManager: PluginManager;
  };
  maintained = false;
  maintaining = false;
  error = null;

  model: ApplicationModel;

  private wsAuthorized = false;
  apps: {
    Component?: ComponentType;
  } = {
    Component: null,
  };

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
      maintaining: observable.ref,
      error: observable.ref,
    });
    this.devDynamicImport = options.devDynamicImport;
    this.components = _.merge(this.components, options.components);
    this.apiClient = new APIClient(options.apiClient);
    this.i18n = options.i18n || createInstance();
    this.router = new RouterManager(options.router, this);
    this.pluginManager = new PluginManager(options.plugins, options.loadRemotePlugins, this);
    this.flowEngine = new FlowEngine();
    this.flowEngine.registerModels({ ApplicationModel });
    this.model = this.flowEngine.createModel<ApplicationModel>({
      use: 'ApplicationModel',
      uid: '__app_model__',
    });
    this.context = this.flowEngine.context as any;
    this.context.defineProperty('pluginManager', {
      get: () => this.pluginManager,
    });
    this.context.defineProperty('pluginSettingsRouter', {
      get: () => this.pluginSettingsManager,
    });
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
    if (typeof window === 'undefined') {
      return;
    }
    // 避免重复初始化 requirejs
    if (window['requirejs']) {
      this.requirejs = window['requirejs'];
      return;
    }
    window['requirejs'] = this.requirejs = getRequireJs();
    window.define = this.requirejs.define;
  }

  private addDefaultProviders() {
    this.use(I18nextProvider, { i18n: this.i18n });
    this.flowEngine.context.defineProperty('app', {
      value: this,
    });
    this.flowEngine.context.defineProperty('api', {
      value: this.apiClient,
    });
    this.flowEngine.context.defineProperty('i18n', {
      value: this.i18n,
    });
    this.flowEngine.context.defineProperty('router', {
      get: () => this.router.router,
      cache: false,
    });
    this.flowEngine.context.defineProperty('documentTitle', {
      get: () => document.title,
    });
    this.flowEngine.context.defineProperty('route', {
      get: () => {},
      observable: true,
    });
    this.flowEngine.context.defineProperty('location', {
      get: () => location,
      observable: true,
    });
    this.use(FlowEngineProvider, { engine: this.flowEngine });
    this.use(FlowEngineGlobalsContextProvider);
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
    await this.loadWebSocket();
    await this.pm.load();
    await this.flowEngine.flowSettings.load();
    this.updateFavicon();
  }

  async loadWebSocket() {
    this.eventBus.addEventListener('ws:message:authorized', () => {
      this.setWsAuthorized(true);
    });

    this.ws.on('message', (event) => {
      if (!event.data) {
        return;
      }
      const data = JSON.parse(event.data);

      if (data?.payload?.refresh) {
        window.location.reload();
        return;
      }

      if (data.type === 'notification') {
        this.context.notification[data.payload?.type || 'info']({ message: data.payload?.message });
        return;
      }

      if (this.error && data.payload.code === 'APP_RUNNING') {
        this.maintained = true;
        this.setMaintaining(false);
        this.error = null;
        window.location.reload();
        return;
      }

      const maintaining = data.type === 'maintaining' && data.payload.code !== 'APP_RUNNING';
      console.log('ws:message', { maintaining, data });
      if (maintaining) {
        this.setMaintaining(true);
        this.error = data.payload;
      } else {
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
      const res = _.get(this.components, Component) as ComponentType<T>;
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

  private addComponent(component: ComponentType, name?: string) {
    const componentName = name || component.displayName || component.name;
    if (!componentName) {
      console.error('Component must have a displayName or pass name as second argument');
      return;
    }
    _.set(this.components, componentName, component);
  }

  addComponents(components: Record<string, ComponentType>) {
    Object.keys(components).forEach((name) => {
      this.addComponent(components[name], name);
    });
  }

  getRootComponent() {
    const Root: FC<{ children?: React.ReactNode }> = () => (
      <FlowEngineProvider engine={this.flowEngine}>
        <FlowModelRenderer fallback={this.renderComponent('AppSpin')} model={this.model} />
      </FlowEngineProvider>
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
}

class ApplicationModel extends FlowModel {
  #providers: ComponentType;
  #router: any;

  get app() {
    return this.context.app as Application;
  }

  getProviders() {
    this.#providers = this.app.getComposeProviders();
    return this.#providers;
  }

  getRouter() {
    this.#router = this.app.router.getRouterComponent();
    return this.#router;
  }

  render() {
    console.log('render', {
      maintaining: this.app.maintaining,
      maintained: this.app.maintained,
      error: this.app.error,
    });
    if (this.app.maintaining) {
      return this.renderMaintaining();
    }
    if (this.app.error) {
      return this.renderError();
    }
    return this.renderContent();
  }

  renderMaintaining() {
    if (!this.app.maintained) {
      return this.app.renderComponent('AppMaintaining');
    }
    return this.app.renderComponent('AppMaintainingDialog');
  }

  renderError() {
    return this.app.renderComponent('AppError');
  }

  renderContent() {
    const Router = this.getRouter();
    const Providers = this.getProviders();
    return <Router BaseLayout={Providers} />;
  }
}

ApplicationModel.registerFlow({
  key: 'appFlow',
  steps: {
    init: {
      async handler(ctx, params) {
        try {
          await ctx.app.load();
        } catch (err) {
          ctx.model.app.error = err;
          console.error(err);
        }
      },
    },
  },
});

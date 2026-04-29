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
import { APIClient, getSubAppName } from '@nocobase/sdk';
import type { i18n as i18next } from 'i18next';
import { get, merge, set } from 'lodash';
import React, { ErrorInfo, FC, ReactElement, ReactNode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { ErrorBoundary } from 'react-error-boundary';
import { Link, NavLink, Navigate } from 'react-router-dom';
import { isValidElementType } from 'react-is';
import AntdAppProvider from './theme/AntdAppProvider';
import { GlobalThemeProvider } from './theme';
import { AIManager } from './ai';
import { AppError, AppMaintaining, AppMaintainingDialog, AppNotFound, AppSpin, BlankComponent } from './components';
import { SystemSettingsSource } from './flow/system-settings';
import type { PluginClass, PluginManager, PluginType } from './PluginManager';
import { RouteRepository } from './RouteRepository';
import type {
  ComponentTypeAndString,
  RenderableComponentType,
  RouterComponentType,
  RouterManager,
  RouterOptions,
} from './RouterManager';
import { WebSocketClient, type WebSocketClientOptions } from './WebSocketClient';
import { compose, normalizeContainer } from './utils';
import { defineGlobalDeps } from './utils/globalDeps';
import { getRequireJs } from './utils/requirejs';
import type { RequireJS } from './utils/requirejs';

declare global {
  interface Window {
    requirejs?: RequireJS;
    define: RequireJS['define'];
  }
}

type AnyComponent = RenderableComponentType<any>;
type AuthTokenPayload = {
  token: string;
  authenticator: string | null;
};

const LEADING_SLASHES_REGEXP = /^\/+/;
const TRAILING_SLASHES_REGEXP = /\/+$/;

const trimLeadingSlashes = (value: string) => {
  const match = LEADING_SLASHES_REGEXP.exec(value);
  return match ? value.slice(match[0].length) : value;
};

const trimTrailingSlashes = (value: string) => {
  const match = TRAILING_SLASHES_REGEXP.exec(value);
  return match ? value.slice(0, -match[0].length) : value;
};

const isRenderableComponentType = (value: unknown): value is AnyComponent => isValidElementType(value);

export type DevDynamicImport = (packageName: string) => Promise<{ default: PluginClass }>;
export type ComponentAndProps<T = any> = [AnyComponent, T];

export interface BaseApplicationOptions<TPluginType> {
  name?: string;
  publicPath?: string;
  apiClient?: any;
  ws?: WebSocketClientOptions | boolean;
  i18n?: i18next;
  providers?: (AnyComponent | ComponentAndProps)[];
  plugins?: TPluginType[];
  components?: Record<string, AnyComponent>;
  scopes?: Record<string, any>;
  router?: RouterOptions;
  designable?: boolean;
  loadRemotePlugins?: boolean;
  devDynamicImport?: DevDynamicImport;
  disableAcl?: boolean;
}

/**
 * 共享的应用运行时基类。
 *
 * 该类只负责承接 client 与 client-v2 共用的 Application 骨架，
 * 具体产品行为通过子类钩子补齐。
 */
export abstract class BaseApplication<
  TOptions extends BaseApplicationOptions<any> = BaseApplicationOptions<PluginType>,
  TPluginManager extends PluginManager<any> = PluginManager<any>,
  TRouterManager extends RouterManager<any> = RouterManager<any>,
  TApiClient extends APIClient = APIClient,
  TPluginSettingsManager = any,
> {
  public eventBus = new EventTarget();
  public providers: ComponentAndProps[] = [];
  public router: TRouterManager;
  public scopes: Record<string, any> = {};
  public i18n: i18next;
  public ws: WebSocketClient;
  public apiClient: TApiClient;
  public components: Record<string, AnyComponent> = {};
  public pluginManager: TPluginManager;
  public pluginSettingsManager: TPluginSettingsManager;
  public aiManager!: AIManager;
  public devDynamicImport?: DevDynamicImport;
  public requirejs!: RequireJS;
  public name: string;
  public favicon!: string;
  public flowEngine: FlowEngine;
  public dataSourceManager: any;
  public context: FlowEngineContext & {
    routeRepository: RouteRepository;
    appInfo: Promise<Record<string, any>>;
    pageInfo: { version?: 'v1' | 'v2' };
    systemSettings: SystemSettingsSource;
    acl?: {
      data: Record<string, any>;
      meta: Record<string, any>;
      setData: (data: Record<string, any>) => void;
      setMeta: (meta: Record<string, any>) => void;
    };
    pluginManager: TPluginManager;
  };
  public systemSettings!: SystemSettingsSource;
  maintained = false;
  maintaining = false;
  error: any = null;

  model: ApplicationModel;

  private wsAuthorized = false;
  apps: {
    Component?: AnyComponent | null;
  } = {
    Component: null,
  };

  get pm(): TPluginManager {
    return this.pluginManager;
  }

  get disableAcl() {
    return this.options.disableAcl;
  }

  get isWsAuthorized() {
    return this.wsAuthorized;
  }

  constructor(protected options: TOptions = {} as TOptions) {
    this.initRequireJs();
    this.defineObservableState();
    this.devDynamicImport = options.devDynamicImport;
    this.scopes = merge(this.scopes, options.scopes);
    this.components = merge(this.getDefaultComponents(), options.components);
    this.name = this.options.name || getSubAppName(options.publicPath) || 'main';
    this.apiClient = this.createApiClient(options);
    this.initializeExtendedState();
    this.i18n = this.createI18n(options);
    this.router = this.createRouterManager(options);
    this.pluginManager = this.createPluginManager(options);
    this.flowEngine = new FlowEngine();
    this.flowEngine.registerModels({ ApplicationModel });
    this.model = this.flowEngine.createModel<ApplicationModel>({
      use: 'ApplicationModel',
      uid: '__app_model__',
    });
    this.context = this.flowEngine.context as any;
    this.configureRuntimeAdapters();
    this.context.defineProperty('pluginManager', {
      get: () => this.pluginManager,
    });
    this.configureBaseContext();
    this.configureContext();
    this.addBaseProviders();
    this.addCustomProviders();
    this.addReactRouterComponents();
    this.addProviders(options.providers || []);
    this.ws = this.createWebSocketClient(options);
    this.ws.app = this;
    this.pluginSettingsManager = this.createPluginSettingsManager(options);
    this.addRoutes();
    this.i18n.on('languageChanged', (lng) => {
      this.apiClient.auth.locale = lng;
    });
    this.initListeners();
    this.afterManagersInitialized();
  }

  /**
   * 注册共享 observable 状态。
   */
  protected defineObservableState() {
    define(this, {
      maintained: observable.ref,
      maintaining: observable.ref,
      error: observable.ref,
    });
  }

  protected initializeExtendedState() {
    this.systemSettings = new SystemSettingsSource(this.apiClient);
  }

  protected afterManagersInitialized() {
    this.aiManager = new AIManager(this);
  }

  protected configureContext() {
    // 供子类按需覆盖。
  }

  protected configureRuntimeAdapters() {
    // 供子类按需覆盖。
  }

  protected addCustomProviders() {
    // 供子类按需覆盖。
  }

  protected initListeners() {
    this.eventBus.addEventListener('auth:tokenChanged', (event: Event) => {
      const detail = (event as CustomEvent<AuthTokenPayload>).detail;
      if (!detail?.token) {
        return;
      }
      this.setTokenInWebSocket(detail);
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

  protected setTokenInWebSocket(options: AuthTokenPayload) {
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

  protected initRequireJs() {
    if (globalThis.window === undefined) {
      return;
    }
    const currentWindow = globalThis.window;
    if (currentWindow.requirejs) {
      this.requirejs = currentWindow.requirejs;
      return;
    }
    currentWindow.requirejs = this.requirejs = getRequireJs();
    defineGlobalDeps(this.requirejs);
    currentWindow.define = this.requirejs.define;
  }

  /**
   * 注入两边共享的基础 context。
   */
  protected configureBaseContext() {
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
    this.flowEngine.context.defineProperty('routeRepository', {
      value: new RouteRepository(this.flowEngine.context),
    });
    this.flowEngine.context.defineProperty('appInfo', {
      get: async () => {
        const rest = await this.apiClient.request({
          url: 'app:getInfo',
        });
        return rest.data?.data || {};
      },
    });
    this.flowEngine.context.defineProperty('pageInfo', {
      value: observable({ version: undefined as 'v2' | 'v1' | undefined }),
    });
    this.flowEngine.context.defineProperty('systemSettings', {
      get: () => this.systemSettings,
    });
  }

  /**
   * 注册两边共享的默认 providers。
   */
  protected addBaseProviders() {
    this.use(I18nextProvider, { i18n: this.i18n });
    this.use(FlowEngineProvider, { engine: this.flowEngine });
    this.use(GlobalThemeProvider);
    this.use(AntdAppProvider);
    this.use(FlowEngineGlobalsContextProvider);
  }

  addReactRouterComponents() {
    this.addComponents({
      Link,
      Navigate: Navigate as AnyComponent,
      NavLink: NavLink as AnyComponent,
    });
  }

  addRoutes() {
    this.router.add('not-found', {
      path: '*',
      Component: this.components['AppNotFound'],
    });
  }

  updateFavicon(favicon?: string) {
    let faviconLinkElement = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;

    if (favicon) {
      this.favicon = favicon;
    }

    const iconHref = this.favicon || '/favicon/favicon.ico';

    if (faviconLinkElement) {
      faviconLinkElement.href = iconHref;
    } else {
      faviconLinkElement = document.createElement('link');
      faviconLinkElement.rel = 'shortcut icon';
      faviconLinkElement.href = iconHref;
      document.head.appendChild(faviconLinkElement);
    }
  }

  setWsAuthorized(authorized: boolean) {
    this.wsAuthorized = authorized;
  }

  setMaintaining(maintaining: boolean) {
    if (this.maintaining === maintaining) {
      return;
    }

    this.maintaining = maintaining;
    if (!maintaining) {
      this.eventBus.dispatchEvent(new Event('maintaining:end'));
    }
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
    let baseURL = this.apiClient.axios.defaults.baseURL ?? '';
    if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
      const { protocol, host } = globalThis.window.location;
      baseURL = `${protocol}//${host}${baseURL}`;
    }
    return `${trimTrailingSlashes(baseURL)}/${trimLeadingSlashes(pathname)}`;
  }

  getRouteUrl(pathname: string) {
    return this.getPublicPath() + trimLeadingSlashes(pathname);
  }

  getHref(pathname: string) {
    const name = this.name;
    if (name && name !== 'main') {
      return `${this.getPublicPath()}apps/${name}/${trimLeadingSlashes(pathname)}`;
    }
    return this.getPublicPath() + trimLeadingSlashes(pathname);
  }

  getComposeProviders() {
    const Providers = compose(...this.providers)(BlankComponent);
    Providers.displayName = 'Providers';
    return Providers;
  }

  use<T = any>(component: AnyComponent, props?: T) {
    return this.addProvider(component, props);
  }

  addProvider<T = any>(component: AnyComponent, props?: T) {
    return this.providers.push([component, props]);
  }

  addProviders(providers: (AnyComponent | ComponentAndProps)[]) {
    providers.forEach((provider) => {
      if (Array.isArray(provider)) {
        this.addProvider(provider[0], provider[1]);
      } else {
        this.addProvider(provider);
      }
    });
  }

  getComponent<T = any>(Component: ComponentTypeAndString<T>, isShowError = true): AnyComponent | undefined {
    const showError = (msg: string) => isShowError && console.error(msg);
    if (!Component) {
      showError(`getComponent called with ${Component}`);
      return;
    }

    if (typeof Component === 'string') {
      const res = get(this.components, Component) as AnyComponent;
      if (!res) {
        showError(`Component ${Component} not found`);
        return;
      }
      return res;
    }

    if (isRenderableComponentType(Component)) {
      return Component;
    }

    showError(`Component ${Component} should be a string or a React component`);
  }

  renderComponent<T extends {}>(
    Component: ComponentTypeAndString,
    props?: T,
    children?: ReactNode,
  ): ReactElement | null {
    const ResolvedComponent = this.getComponent(Component);
    if (!ResolvedComponent) {
      return null;
    }
    return React.createElement(ResolvedComponent, props, children);
  }

  /**
   * @internal
   */
  protected addComponent(component: AnyComponent, name?: string) {
    const componentInfo = component as { displayName?: string; name?: string };
    const componentName = name || componentInfo.displayName || componentInfo.name;
    if (componentName) {
      set(this.components, componentName, component);
    } else {
      console.error('Component must have a displayName or pass name as second argument');
    }
  }

  addComponents(components: Record<string, AnyComponent>) {
    Object.keys(components).forEach((name) => {
      this.addComponent(components[name], name);
    });
  }

  protected getRootFallback() {
    return this.renderComponent('AppSpin');
  }

  getRootComponent() {
    const model = this.model;
    const flowEngine = this.flowEngine;
    const getRootFallback = () => this.getRootFallback();
    const Root: FC<{ children?: React.ReactNode }> = ({ children }) => {
      useLayoutEffect(() => {
        model.setProps({ children });
      }, [children]);

      return (
        <FlowEngineProvider engine={flowEngine}>
          <FlowModelRenderer fallback={getRootFallback()} model={model} />
        </FlowEngineProvider>
      );
    };
    return Root;
  }

  mount(containerOrSelector: Element | ShadowRoot | string) {
    const container = normalizeContainer(containerOrSelector);
    if (container) {
      const App = this.getRootComponent();
      const root = createRoot(container);
      root.render(<App />);
      return root;
    }
  }

  protected abstract createApiClient(options: TOptions): TApiClient;
  protected abstract createI18n(options: TOptions): i18next;
  protected abstract createRouterManager(options: TOptions): TRouterManager;
  protected abstract createPluginManager(options: TOptions): TPluginManager;
  protected abstract createPluginSettingsManager(options: TOptions): TPluginSettingsManager;
  protected createWebSocketClient(options: TOptions) {
    return new WebSocketClient(options.ws ?? false);
  }
  protected getDefaultComponents(): Record<string, AnyComponent> {
    return {
      AppNotFound,
      AppError,
      AppSpin,
      AppMaintaining,
      AppMaintainingDialog,
    };
  }
  abstract load(): Promise<void>;
  abstract loadWebSocket(): Promise<void>;
}

/**
 * Application 共享根模型。
 *
 * 该模型统一承接 app.load、错误态、维护态和主内容渲染。
 */
export class ApplicationModel extends FlowModel {
  #providers?: AnyComponent;
  #router?: RouterComponentType;

  get app() {
    return this.context.app as BaseApplication;
  }

  getProviders() {
    this.#providers ||= this.app.getComposeProviders();
    return this.#providers;
  }

  getRouter() {
    this.#router ||= this.app.router.getRouterComponent();
    return this.#router;
  }

  render() {
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
      return this.app.renderComponent('AppMaintaining', { app: this.app, error: this.app.error });
    }
    return this.app.renderComponent('AppMaintainingDialog', { app: this.app, error: this.app.error });
  }

  renderError() {
    return this.app.renderComponent('AppError', { app: this.app, error: this.app.error });
  }

  renderContent() {
    const AppError = this.app.getComponent('AppError', false);
    const Router = this.getRouter();
    const Providers = this.getProviders();
    const content = <Router BaseLayout={Providers} />;

    if (!AppError) {
      return content;
    }

    const handleErrors = (error: Error, info: ErrorInfo) => {
      console.error(error);
      const componentStack = info.componentStack?.trim();
      if (!componentStack) {
        return;
      }
      const err = new Error('React component stack');
      err.stack = componentStack;
      console.error(err);
    };

    return (
      <ErrorBoundary FallbackComponent={(props) => <AppError app={this.app} {...props} />} onError={handleErrors}>
        {content}
      </ErrorBoundary>
    );
  }
}

ApplicationModel.registerFlow({
  key: 'appFlow',
  steps: {
    init: {
      async handler(ctx) {
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

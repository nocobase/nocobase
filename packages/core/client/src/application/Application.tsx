import { APIClientOptions } from '@nocobase/sdk';
import { i18n as i18next } from 'i18next';
import get from 'lodash/get';
import merge from 'lodash/merge';
import set from 'lodash/set';
import React, { ComponentType, FC, ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { Link, Navigate, NavLink } from 'react-router-dom';
import { APIClient, APIClientProvider } from '../api-client';
import { i18n } from '../i18n';
import { AppComponent, BlankComponent, defaultAppComponents } from './components';
import { PluginManager, PluginType } from './PluginManager';
import { ComponentTypeAndString, RouterManager, RouterOptions } from './RouterManager';
import { compose, normalizeContainer } from './utils';

export type ComponentAndProps<T = any> = [ComponentType, T];
export interface ApplicationOptions {
  apiClient?: APIClientOptions;
  i18n?: i18next;
  providers?: (ComponentType | ComponentAndProps)[];
  plugins?: PluginType[];
  components?: Record<string, ComponentType>;
  scopes?: Record<string, any>;
  router?: RouterOptions;
  dynamicImport?: any;
}

export class Application {
  public providers: ComponentAndProps[] = [];
  public router: RouterManager;
  public scopes: Record<string, any> = {};
  public i18n: i18next;
  public apiClient: APIClient;
  public components: Record<string, ComponentType> = { ...defaultAppComponents };
  public pm: PluginManager;

  constructor(protected options: ApplicationOptions = {}) {
    this.scopes = merge(this.scopes, options.scopes);
    this.components = merge(this.components, options.components);
    this.apiClient = new APIClient(options.apiClient);
    this.i18n = options.i18n || i18n;
    this.router = new RouterManager({
      ...options.router,
      renderComponent: this.renderComponent.bind(this),
    });
    this.pm = new PluginManager(options.plugins, this);
    this.addDefaultProviders();
    this.addReactRouterComponents();
    this.addProviders(options.providers || []);
  }

  private addDefaultProviders() {
    this.use(APIClientProvider, { apiClient: this.apiClient });
    this.use(I18nextProvider, { i18n: this.i18n });
  }

  private addReactRouterComponents() {
    this.addComponents({
      Link,
      Navigate: Navigate as ComponentType,
      NavLink,
    });
  }

  get dynamicImport() {
    return this.options.dynamicImport;
  }

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
    return this.pm.load();
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

  renderComponent<T extends {}>(Component: ComponentTypeAndString, props?: T): ReactElement {
    return React.createElement(this.getComponent(Component), props);
  }

  addComponent(component: ComponentType, name?: string) {
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
    const Root: FC = () => <AppComponent app={this} />;
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

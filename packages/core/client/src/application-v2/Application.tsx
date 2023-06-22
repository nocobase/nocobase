import { i18n as i18next } from 'i18next';
import { merge } from 'lodash';
import get from 'lodash/get';
import set from 'lodash/set';
import React, { ComponentType, FC, ReactElement, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { Link, Navigate, NavLink } from 'react-router-dom';
import { APIClient, APIClientProvider } from '../api-client';
import { i18n } from '../i18n';
import { AppComponent, defaultAppComponents } from './components';
import { BlankComponent } from './components/BlankComponent';
import { compose } from './compose';
import { PluginManager } from './PluginManager';
import { Router } from './Router';
import { ApplicationOptions, ComponentAndProps, ComponentTypeAndString } from './types';
import { normalizeContainer } from './utils';

export class Application {
  providers: ComponentAndProps[] = [];
  router: Router;
  scopes: Record<string, any> = {};
  i18n: i18next;
  apiClient: APIClient;
  components: Record<string, ComponentType> = { ...defaultAppComponents };
  pm: PluginManager;

  constructor(protected options: ApplicationOptions) {
    this.scopes = options.scopes || {};
    this.components = options.components || {};
    this.apiClient = new APIClient(options.apiClient);
    this.i18n = options.i18n || i18n;
    this.router = new Router(options.router, this);
    this.pm = new PluginManager(options.plugins, this);
    this.useDefaultProviders();
    this.addReactRouterComponents();
    this.addProviders(options.providers || []);
  }

  private useDefaultProviders() {
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

  renderProviders() {
    const Providers = compose(...this.providers)(BlankComponent);
    Providers.displayName = 'Providers';
    return Providers;
  }

  use<T = any>(component: ComponentType, props?: T) {
    return this.addProvider(component, props);
  }

  addProvider<T = any>(component: ComponentType, props?: T) {
    this.providers.push([component, props]);
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

  getComponent(Component: ComponentTypeAndString): ComponentType {
    if (!Component) return null;
    if (typeof Component !== 'string') return Component;
    const res = get(this.components, Component);
    if (!res) {
      console.error(`Component ${Component} not found`);
      return BlankComponent;
    }
    return res;
  }

  renderComponent<T extends {}>(Component: ComponentTypeAndString, props?: T): ReactElement {
    return React.createElement(this.getComponent(Component), props);
  }

  addComponent(name: string, component: any) {
    set(this.components, name, component);
  }

  addComponents(components: Record<string, ComponentType>) {
    Object.keys(components).forEach((name) => {
      this.addComponent(name, components[name]);
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

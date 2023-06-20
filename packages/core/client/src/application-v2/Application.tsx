import { i18n as i18next } from 'i18next';
import { merge } from 'lodash';
import get from 'lodash/get';
import set from 'lodash/set';
import React, { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { APIClient, APIClientProvider } from '../api-client';
import { i18n } from '../i18n';
import { AppComponent } from './components';
import { BlankComponent } from './components/BlankComponent';
import { compose } from './compose';
import { PluginManager } from './PluginManager';
import { Router } from './Router';
import { ApplicationOptions, ComponentAndProps, ComponentTypeAndString } from './types';
import { getCurrentTimezone, normalizeContainer } from './utils';

export class Application {
  providers: ComponentAndProps[];
  router: Router;
  scopes: Record<string, any>;
  i18n: i18next;
  apiClient: APIClient;
  components: Record<string, ComponentType>;
  pm: PluginManager;

  constructor(protected options: ApplicationOptions) {
    this.providers = [];
    this.scopes = options.scopes || {};
    this.components = options.components || {};
    this.apiClient = new APIClient({
      baseURL: process.env.API_BASE_URL,
      headers: {
        'X-Hostname': window?.location?.hostname,
        'X-Timezone': getCurrentTimezone(),
      },
      ...options.apiClient,
    });
    this.i18n = options.i18n || i18n;
    this.router = new Router(options.router, this);
    this.pm = new PluginManager(options.plugins, this);
    this.useDefaultProviders();
  }

  useDefaultProviders() {
    this.use(APIClientProvider, { apiClient: this.apiClient });
    this.use(I18nextProvider, { i18n: this.i18n });
  }

  renderProviders() {
    const Providers = compose(...this.providers)(BlankComponent);
    Providers.displayName = 'Providers';
    return Providers;
  }

  use<T = any>(component: ComponentType, props?: T) {
    this.providers.push([component, props]);
  }

  async load() {
    return this.pm.load();
  }

  getComponent(Component: ComponentTypeAndString) {
    if (!Component) return null;
    if (typeof Component !== 'string') return Component;
    const res = get(this.components, Component);
    if (!res) {
      console.warn(`Component ${Component} not found`);
      return BlankComponent;
    }
    return res;
  }

  renderComponent<T extends {}>(Component: ComponentTypeAndString, props?: T) {
    return React.createElement(this.getComponent(Component), props);
  }

  registerComponent(name: string, component: any) {
    set(this.components, name, component);
  }

  registerComponents(components: Record<string, ComponentType>) {
    Object.keys(components).forEach((name) => {
      this.registerComponent(name, components[name]);
    });
  }

  registerScopes(scopes: Record<string, any>) {
    this.scopes = merge(this.scopes, scopes);
  }

  getRootComponent() {
    return () => <AppComponent app={this} />;
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

import { i18n } from 'i18next';
import { merge } from 'lodash';
import get from 'lodash/get';
import set from 'lodash/set';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { APIClient, APIClientProvider } from '../api-client';
import { Plugin } from './Plugin';
import { Router } from './Router';
import { AppComponent, defaultAppComponents } from './components';
import { ApplicationOptions } from './types';

export class Application {
  providers: any[];
  options: ApplicationOptions;
  router: Router;
  plugins: Map<string, Plugin>;
  scopes: Record<string, any>;
  i18n: i18n;
  apiClient: APIClient;
  components: any;

  constructor(options: ApplicationOptions) {
    this.providers = [];
    this.options = options;
    this.plugins = new Map<string, Plugin>();
    this.scopes = merge(this.scopes, options.scopes || {});
    this.components = merge(defaultAppComponents, options.components || {});
    this.apiClient = new APIClient(options.apiClient);
    this.router = new Router(options.router, { app: this });
    this.useDefaultProviders();
  }

  useDefaultProviders() {
    this.use([APIClientProvider, { apiClient: this.apiClient }]);
    this.use(I18nextProvider, { i18n: this.i18n });
  }

  getPlugin(name: string) {
    return this.plugins.get(name);
  }

  getComponent(name: string) {
    return get(this.components, name);
  }

  renderComponent(name: string, props = {}) {
    return React.createElement(this.getComponent(name), props);
  }

  registerComponent(name: string, component: any) {
    set(this.components, name, component);
  }

  registerComponents(components: any) {
    Object.keys(components).forEach((name) => {
      this.registerComponent(name, components[name]);
    });
  }

  registerScopes(scopes: Record<string, any>) {
    this.scopes = merge(this.scopes, scopes);
  }

  use(component: any, props?: any) {
    this.providers.push(props ? [component, props] : component);
  }

  async load() {
    const { plugins = [], importPlugins } = this.options;
    for (const name of plugins) {
      try {
        const Plugin = await importPlugins?.(name);
        if (Plugin) {
          const instance = new Plugin(this);
          await instance.load();
          this.plugins.set(name, instance);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  getRootComponent() {
    return () => <AppComponent app={this} />;
  }

  mount(selector: string) {
    const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (container) {
      const App = this.getRootComponent();
      const root = createRoot(container);
      root.render(<App />);
    }
  }
}

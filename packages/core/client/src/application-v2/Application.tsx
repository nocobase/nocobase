import { i18n } from 'i18next';
import { merge } from 'lodash';
import get from 'lodash/get';
import set from 'lodash/set';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { APIClient, APIClientProvider } from '../api-client';
import { Plugin } from './Plugin';
import { PluginManager } from './PluginManager';
import { Router } from './Router';
import { AppComponent, defaultAppComponents } from './components';
import { ApplicationOptions, RouterOptions } from './types';

export class Application {
  providers: any[];
  router: Router;
  plugins: Map<string, Plugin>;
  scopes: Record<string, any>;
  i18n: i18n;
  apiClient: APIClient;
  components: any;
  pm: PluginManager;

  constructor(protected _options: ApplicationOptions) {
    this.providers = [];
    this.plugins = new Map<string, Plugin>();
    this.scopes = merge(this.scopes, _options.scopes || {});
    this.components = merge(defaultAppComponents, _options.components || {});
    this.apiClient = new APIClient(_options.apiClient);
    this.router = this.createRouter(_options.router);
    this.pm = new PluginManager(this);
    this.useDefaultProviders();
  }

  get options() {
    return this._options;
  }

  useDefaultProviders() {
    this.use([APIClientProvider, { apiClient: this.apiClient }]);
    this.use(I18nextProvider, { i18n: this.i18n });
  }

  getPlugin(name: string) {
    return this.plugins.get(name);
  }

  getComponent(name: any) {
    return get(this.components, name) || name;
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

  createRouter(options: RouterOptions) {
    return new Router(options, { app: this });
  }

  use(component: any, props?: any) {
    this.providers.push(props ? [component, props] : component);
  }

  async load() {
    return this.pm.load();
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

import { uid } from '@nocobase/database';
import { Application } from './application';

export interface PluginOptions {
  app?: Application;
  name?: string;
  activate?: boolean;
  displayName?: string;
  description?: string;
  version?: string;
}

export interface IPlugin {
  install?: (this: Plugin) => void;
  load?: (this: Plugin) => void;
}

export type PluginFn = (this: Plugin) => void;

export type PluginType = string | PluginFn | typeof Plugin | IPlugin;

export class Plugin implements IPlugin {
  options: PluginOptions = {};
  app: Application;
  callbacks: IPlugin = {};

  constructor(plugin?: PluginType, options?: PluginOptions) {
    this.app = options?.app;
    this.options = options || {};
    if (typeof plugin === 'function') {
      if (!this.options?.name && plugin.name) {
        this.options.name = plugin.name;
      }
      this.callbacks.load = plugin as any;
    } else if (
      typeof plugin === 'object' &&
      plugin.constructor === {}.constructor
    ) {
      this.callbacks = plugin;
    }
    const cName = this.constructor.name;
    if (this.options && !this.options?.name && cName && cName !== 'Plugin') {
      this.options.name = cName;
    }
  }

  getName() {
    return this.options.name || uid();
  }

  async activate() {
    this.options.activate = true;
  }

  async install() {
    await this.call('install');
  }

  async call(name: string) {
    if (!this.callbacks[name]) {
      return;
    }
    const callback = this.callbacks[name].bind(this);
    await callback();
  }

  async load() {
    await this.call('load');
  }
}

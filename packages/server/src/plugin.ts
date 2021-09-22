import { uid } from '@nocobase/database';
import { Application } from './application';
import _ from 'lodash';

export interface IPlugin {
  install?: (this: Plugin) => void;
  load?: (this: Plugin) => void;
}

export interface PluginOptions {
  name?: string;
  activate?: boolean;
  displayName?: string;
  description?: string;
  version?: string;
  install?: (this: Plugin) => void;
  load?: (this: Plugin) => void;
  plugin?: typeof Plugin;
  [key: string]: any;
}

export type PluginFn = (this: Plugin) => void;

export type PluginType = string | PluginFn | typeof Plugin;

export class Plugin implements IPlugin {
  options: PluginOptions = {};
  app: Application;
  callbacks: IPlugin = {};

  constructor(options?: PluginOptions & { app?: Application }) {
    this.app = options?.app;
    this.options = options;
    this.callbacks = _.pick(options, ['load', 'activate']);
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

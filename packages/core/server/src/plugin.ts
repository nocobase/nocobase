import { Application } from './application';
import { InstallOptions } from './plugin-manager';
import { PluginData } from './plugin-manager/types';

export interface PluginInterface {
  beforeLoad?: () => void;

  load();

  getName(): string;
}

export interface PluginOptions {
  activate?: boolean;
  displayName?: string;
  description?: string;
  version?: string;
  enabled?: boolean;
  install?: (this: Plugin) => void;
  load?: (this: Plugin) => void;
  plugin?: typeof Plugin;

  [key: string]: any;
}

export type PluginType = typeof Plugin;

export class Plugin<O = any> implements PluginInterface {
  options: PluginOptions;
  app: Application;

  constructor(app: Application, options?: PluginData) {
    this.app = app;
    this.setOptions(options);
  }

  setOptions(options: PluginOptions) {
    this.options = options || {};
  }

  getName() {
    return (this.options as any).name;
  }

  get name() {
    return this.options.name as string;
  }

  get db() {
    return this.app.db;
  }

  get enabled() {
    return this.options.enabled;
  }

  set enabled(value) {
    this.options.enabled = value;
  }

  get builtIn() {
    return this.options.builtIn;
  }

  set builtIn(value) {
    this.options.builtIn = value;
  }

  get installed() {
    return this.options.installed;
  }

  get setInstalled() {
    return this.options.installed;
  }

  async afterAdd() { }

  async beforeLoad() { }
  async load() { }
  async afterLoad() { }

  async beforeInstall() { }
  async install(options?: InstallOptions) { }
  async afterInstall() { }

  async beforeUpgrade() { }
  async afterUpgrade() { }

  async beforeEnable() { }
  async afterEnable() {}

  async beforeDisable() { }
  async afterDisable() { }

  async beforeRemove() { }
  async afterRemove() { }

  async importCollections(collectionsPath: string) {
    await this.db.import({
      directory: collectionsPath,
      from: this.getName(),
    });
  }

  requiredPlugins() {
    return [];
  }
}

export default Plugin;

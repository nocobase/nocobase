import { Model } from '@nocobase/database';
import { Application } from './application';
import { InstallOptions } from './plugin-manager';

export interface PluginInterface {
  beforeLoad?: () => void;

  load();

  getName(): string;
}

export interface PluginOptions {
  name?: string;
  packageName?: string;
  version?: string;
  enabled?: boolean;
  installed?: boolean;
  isPreset?: boolean;
  [key: string]: any;
}

export abstract class Plugin implements PluginInterface {
  options: any;
  app: Application;
  model: Model;
  state: any = {};

  constructor(app: Application, options?: PluginOptions) {
    this.app = app;
    this.setOptions(options);
  }

  get log() {
    return this.app.log;
  }

  get name() {
    return this.options.name as string;
  }

  get pm() {
    return this.app.pm;
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

  get installed() {
    return this.options.installed;
  }

  set installed(value) {
    this.options.installed = value;
  }

  setOptions(options: any) {
    this.options = options || {};
  }

  getName() {
    return (this.options as any).name;
  }

  afterAdd() {}

  beforeLoad() {}

  async load() {}

  async install(options?: InstallOptions) {}

  async beforeEnable() {}

  async afterEnable() {}

  async beforeDisable() {}

  async afterDisable() {}

  async beforeRemove() {}

  async afterRemove() {}

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

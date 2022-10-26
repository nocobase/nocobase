import { Database, Model } from '@nocobase/database';
import { Application } from './application';
import { InstallOptions } from './plugin-manager';

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

export abstract class Plugin<O = any> implements PluginInterface {
  options: O;
  app: Application;
  db: Database;
  model: Model;

  constructor(app: Application, options?: O) {
    this.app = app;
    this.db = app.db;
    this.setOptions(options);
    this.initialize();
  }

  setOptions(options: O) {
    this.options = options || ({} as any);
  }

  setModel(model) {
    this.model = model;
  }

  get enabled() {
    return (this.options as any).enabled;
  }

  public getName() {
    return (this.options as any).name;
  }

  initialize() {}

  beforeLoad() {}

  async install(options?: InstallOptions) {}

  async load() {}

  async disable() {}
}

export default Plugin;

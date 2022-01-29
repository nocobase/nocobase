import { Application } from './application';
import { Database } from '@nocobase/database';

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
  install?: (this: Plugin) => void;
  load?: (this: Plugin) => void;
  plugin?: typeof Plugin;
  [key: string]: any;
}

export type PluginType = typeof Plugin;

export abstract class Plugin implements PluginInterface {
  options: PluginOptions = {};
  app: Application;
  db: Database;

  constructor(options?: PluginOptions & { app?: Application }) {
    this.app = options?.app;
    this.db = this.app.db;
    this.options = options;
  }

  getName(): string {
    return this.constructor.name;
  }

  activate() {
    this.options.activate = true;
  }

  beforeLoad() {}

  abstract load();
}

import { Database } from '@nocobase/database';
import { Application } from './application';
import path from 'path';

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

export abstract class Plugin<O = any> implements PluginInterface {
  options: O;
  app: Application;
  db: Database;

  constructor(app: Application, options?: O) {
    this.app = app;
    this.db = app.db;
    this.setOptions(options);
  }

  setOptions(options: O) {
    this.options = options || ({} as any);
  }

  getName(): string {
    return this.constructor.name;
  }

  beforeLoad() {}

  async load() {
    const collectionPath = this.collectionPath();
    if (collectionPath) {
      await this.db.import({
        directory: collectionPath,
      });
    }
  }

  collectionPath() {
    return null;
  }
}

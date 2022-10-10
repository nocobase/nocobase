import { Database } from '@nocobase/database';
import finder from 'find-package-json';
import { Application } from './application';
import { InstallOptions } from './plugin-manager';
import { Context } from '@nocobase/actions';

export interface PluginInterface {
  beforeLoad?: () => void;

  load();

  getName(): string;

  /**
   * when generate token sign ,will merge return value into sign data
   * @param {Context} ctx
   * @returns {any} should return json object
   */
  addTokenSign?: (ctx: Context) => Promise<any>;
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

  public abstract getName(): string;

  beforeLoad() {}

  async addTokenSign(ctx: Context): Promise<any> {
    return {};
  }

  async install(options?: InstallOptions) {}

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

  protected getPackageName(dirname: string) {
    const f = finder(dirname);
    const packageObj = f.next().value;
    return packageObj['name'];
  }
}

export default Plugin;

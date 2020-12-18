import Koa from 'koa';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

export interface ApplicationOptions {
  database: any;
  resourcer: any;
}

export class PluginManager {

  protected application: Application;

  protected plugins = new Map<string, any>();

  constructor(application: Application) {
    this.application = application;
  }

  register(key: string | object, plugin?: any) {
    if (typeof key === 'object') {
      Object.keys(key).forEach((k) => {
        this.register(k, key[k]);
      });
    } else {
      this.plugins.set(key, plugin);
    }
  }

  async load() {
    for (const pluginOptions of this.plugins.values()) {
      if (Array.isArray(pluginOptions)) {
        const [entry, options = {}] = pluginOptions;
        await this.call(entry, options);
      } else {
        await this.call(pluginOptions);
      }
    }
  }

  async call(entry: string | Function, options: any = {}) {
    const main = typeof entry === 'function'
      ? entry
      : require(`${entry}/${__filename.endsWith('.ts') ? 'src' : 'lib'}/server`).default;

    await main.call(this.application, options);
  }
}

export class Application extends Koa {

  public readonly database: Database;

  public readonly resourcer: Resourcer;

  public readonly pluginManager: PluginManager;

  constructor(options: ApplicationOptions) {
    super();
    this.database = new Database(options.database);
    this.resourcer = new Resourcer();
    this.pluginManager = new PluginManager(this);
    // this.runHook('afterInit');
  }

  registerPlugin(key: string, plugin: any) {
    this.pluginManager.register(key, plugin);
  }

  registerPlugins(plugins: object) {
    this.pluginManager.register(plugins);
  }

  async loadPlugins() {
    return this.pluginManager.load();
  }
}

export default Application;

import Koa from 'koa';
import Database, { DatabaseOptions } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

export interface ApplicationOptions {
  database: DatabaseOptions;
  resourcer?: any;
}

export class Application extends Koa {
  // static const EVENT_PLUGINS_LOADED = Symbol('pluginsLoaded');

  public readonly database: Database;

  public readonly resourcer: Resourcer;

  protected plugins = new Map<string, any>();

  constructor(options: ApplicationOptions) {
    super();
    this.database = new Database(options.database);
    this.resourcer = new Resourcer();
    // this.runHook('afterInit');
  }

  async emitAsync(event: string | symbol, ...args: any[]): Promise<boolean> {
    // @ts-ignore
    const events = this._events;
    let callbacks = events[event];
    if (!callbacks) {
      return false;
    }
    // helper function to reuse as much code as possible
    const run = (cb) => {
      switch (args.length) {
        // fast cases
        case 0:
          cb = cb.call(this);
          break;
        case 1:
          cb = cb.call(this, args[0]);
          break;
        case 2:
          cb = cb.call(this, args[0], args[1]);
          break;
        case 3:
          cb = cb.call(this, args[0], args[1], args[2]);
          break;
        // slower
        default:
          cb = cb.apply(this, args);
      }

      if (
        cb && (
          cb instanceof Promise ||
          typeof cb.then === 'function'
        )
      ) {
        return cb;
      }

      return Promise.resolve(true);
    };

    if (typeof callbacks === 'function') {
      await run(callbacks);
    } else if (typeof callbacks === 'object') {
      callbacks = callbacks.slice().filter(Boolean);
      await callbacks.reduce((prev, next) => {
        return prev.then((res) => {
          return run(next).then((result) => Promise.resolve(res.concat(result)));
        });
      }, Promise.resolve([]));
    }

    return true;
  }

  registerPlugin(key: string | object, plugin?: any) {
    if (typeof key === 'object') {
      Object.keys(key).forEach((k) => {
        this.registerPlugin(k, key[k]);
      });
    } else {
      const config = {};
      if (Array.isArray(plugin)) {
        const [entry, options = {}] = plugin;
        Object.assign(config, { entry, options });
      } else {
        Object.assign(config, { entry: plugin, options: {} });
      }
      this.plugins.set(key, config);
    }
  }

  getPluginInstance(key: string) {
    const plugin = this.plugins.get(key);
    return plugin && plugin.instance;
  }

  async loadPlugins() {
    await this.emitAsync('plugins.beforeLoad');
    const allPlugins = this.plugins.values();
    for (const plugin of allPlugins) {
      plugin.instance = await this.loadPlugin(plugin);
    }
    await this.emitAsync('plugins.afterLoad');
  }

  async start(port) {
    await this.loadPlugins();
    await this.emitAsync('server.beforeStart');
    this.listen(port);
  }

  protected async loadPlugin({ entry, options = {} }: { entry: string | Function, options: any }) {
    let main: any;
    if (typeof entry === 'function') {
      main = entry;
    } else if (typeof entry === 'string') {
      const pathname = `${entry}/${__filename.endsWith('.ts') ? 'src' : 'lib'}/server`;
      main = require(pathname).default;
    }
    return main && await main.call(this, options);
  }
}

export default Application;

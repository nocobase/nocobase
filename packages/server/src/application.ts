import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { Command } from 'commander';
import Database, { DatabaseOptions } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { dataWrapping, table2resource } from './middlewares';

export interface ResourcerOptions {
  prefix?: string;
}

export interface ApplicationOptions {
  database?: DatabaseOptions;
  resourcer?: ResourcerOptions;
  bodyParser?: any;
  cors?: any;
  dataWrapping?: boolean;
}

export class Application extends Koa {
  public readonly database: Database;

  public readonly resourcer: Resourcer;

  public readonly cli: Command;

  protected plugins = new Map<string, any>();

  constructor(options: ApplicationOptions) {
    super();

    this.database = new Database(options.database);
    this.resourcer = new Resourcer({ ...options.resourcer });
    this.cli = new Command();

    this.use(
      bodyParser({
        ...options.bodyParser,
      }),
    );

    this.use(
      cors({
        exposeHeaders: ['content-disposition'],
        ...options.cors,
      }),
    );

    this.use(async (ctx, next) => {
      ctx.db = this.database;
      ctx.database = this.database;
      ctx.resourcer = this.resourcer;
      await next();
    });

    if (options.dataWrapping !== false) {
      this.use(dataWrapping);
    }

    this.use(table2resource);
    this.use(this.resourcer.restApiMiddleware());

    this.cli
      .command('db sync')
      .option('-f, --force')
      .action(async (...args) => {
        const cli = args.pop();
        await this.database.sync();
        await this.database.close();
      });

    this.cli
      .command('db init')
      // .option('-f, --force')
      .action(async (...args) => {
        const cli = args.pop();
        await this.emitAsync('db.init');
        await this.destroy();
      });

    this.cli
      .command('start')
      .option('-p, --port [port]')
      .action(async (...args) => {
        const cli = args.pop();
        console.log(args);
        const opts = cli.opts();
        await this.loadPlugins();
        await this.emitAsync('server.beforeStart');
        this.listen(opts.port || 3000);
        console.log(`http://localhost:${opts.port || 3000}/`);
      });
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

      if (cb && (cb instanceof Promise || typeof cb.then === 'function')) {
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
          return run(next).then((result) =>
            Promise.resolve(res.concat(result)),
          );
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

  async loadPlugins() {
    await this.emitAsync('plugins.beforeLoad');
    const allPlugins = this.plugins.values();
    for (const plugin of allPlugins) {
      plugin.instance = await this.loadPlugin(plugin);
    }
    await this.emitAsync('plugins.afterLoad');
  }

  async start(argv = process.argv) {
    return this.cli.parseAsync(argv);
  }

  async destroy() {
    await this.database.close()
  }

  protected async loadPlugin({
    entry,
    options = {},
  }: {
    entry: string | Function;
    options: any;
  }) {
    let main: any;
    if (typeof entry === 'function') {
      main = entry;
    } else if (typeof entry === 'string') {
      const pathname = `${entry}/${__filename.endsWith('.ts') ? 'src' : 'lib'
        }/server`;
      main = require(pathname).default;
    }
    return main && (await main.call(this, options));
  }
}

export default Application;

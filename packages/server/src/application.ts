import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { Command, CommandOptions } from 'commander';
import Database, { DatabaseOptions, TableOptions } from '@nocobase/database';
import Resourcer, { ResourceOptions } from '@nocobase/resourcer';
import { dataWrapping, table2resource } from './middlewares';
import { PluginType, Plugin, PluginOptions } from './plugin';
import { registerActions } from '@nocobase/actions';

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

interface DefaultState {
  currentUser?: any;
  [key: string]: any;
}

interface DefaultContext {
  db: Database;
  resourcer: Resourcer;
  [key: string]: any;
}

interface MiddlewareOptions {
  name?: string;
  resourceName?: string;
  resourceNames?: string[];
  insertBefore?: string;
  insertAfter?: string;
}

interface ActionsOptions {
  resourceName?: string;
  resourceNames?: string[];
}

export class Application<
  StateT = DefaultState,
  ContextT = DefaultContext
  > extends Koa {

  public readonly db: Database;

  public readonly resourcer: Resourcer;

  public readonly cli: Command;

  protected plugins = new Map<string, Plugin>();

  constructor(options: ApplicationOptions) {
    super();

    if (options.database instanceof Database) {
      this.db = options.database;
    } else {
      this.db = new Database(options.database);
    }

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

    this.use<DefaultState, DefaultContext>(async (ctx, next) => {
      ctx.db = this.db;
      ctx.resourcer = this.resourcer;
      await next();
    });

    if (options.dataWrapping !== false) {
      this.use(dataWrapping());
    }

    this.use(table2resource());
    this.use(this.resourcer.restApiMiddleware());

    registerActions(this);

    this.cli
      .command('db:sync')
      .option('-f, --force')
      .action(async (...args) => {
        console.log('db sync...');
        const cli = args.pop();
        const force = cli.opts()?.force;
        await this.db.sync(
          force
            ? {
              force: true,
              alter: {
                drop: true,
              },
            }
            : {},
        );
        await this.destroy();
      });

    this.cli
      .command('init')
      // .option('-f, --force')
      .action(async (...args) => {
        const cli = args.pop();
        await this.db.sync({
          force: true,
          alter: {
            drop: true,
          },
        });
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
        await this.emitAsync('beforeStart');
        this.listen(opts.port || 3000);
        console.log(`http://localhost:${opts.port || 3000}/`);
      });
  }

  use<NewStateT = {}, NewContextT = {}>(
    middleware: Koa.Middleware<StateT & NewStateT, ContextT & NewContextT>,
    options?: MiddlewareOptions,
  ) {
    // @ts-ignore
    return super.use(middleware);
  }

  collection(options: TableOptions) {
    return this.db.table(options);
  }

  resource(options: ResourceOptions) {
    return this.resourcer.define(options);
  }

  actions(handlers: any, options?: ActionsOptions) {
    return this.resourcer.registerActions(handlers);
  }

  command(nameAndArgs: string, opts?: CommandOptions) {
    return this.cli.command(nameAndArgs, opts);
  }

  plugin(options?: PluginType | PluginOptions): Plugin {
    if (typeof options === 'string') {
      return this.plugin(require(options).default);
    }
    let instance: Plugin;
    if (typeof options === 'function') {
      try {
        // @ts-ignore
        instance = new options({
          name: options.name,
          app: this,
        });
        if (!(instance instanceof Plugin)) {
          throw new Error('plugin must be instanceof Plugin');
        }
      } catch (err) {
        // console.log(err);
        instance = new Plugin({
          name: options.name,
          // @ts-ignore
          load: options,
          app: this,
        });
      }
    } else if (typeof options === 'object') {
      const plugin = options.plugin || Plugin;
      instance = new plugin({
        name: options.plugin ? plugin.name : undefined,
        ...options,
        app: this,
      });
    }
    const name = instance.getName();
    if (this.plugins.has(name)) {
      throw new Error(`plugin name [${name}] is repeated`);
    }
    this.plugins.set(name, instance);
    return instance;
  }

  async load() {
    await this.emitAsync('plugins.beforeLoad');
    for (const [name, plugin] of this.plugins) {
      await this.emitAsync(`plugins.${name}.beforeLoad`);
      await plugin.load();
      await this.emitAsync(`plugins.${name}.afterLoad`);
    }
    await this.emitAsync('plugins.afterLoad');
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

  async parse(argv = process.argv) {
    await this.load();
    return this.cli.parseAsync(argv);
  }

  async destroy() {
    await this.db.close();
  }
}

export default Application;

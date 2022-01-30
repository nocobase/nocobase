import { registerActions } from '@nocobase/actions';
import Database, { CollectionOptions, DatabaseOptions, SyncOptions } from '@nocobase/database';
import Resourcer, { ResourceOptions } from '@nocobase/resourcer';
import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import { Command, CommandOptions } from 'commander';
import { Server } from 'http';
import { i18n, InitOptions } from 'i18next';
import Koa from 'koa';
import { createCli, createDatabase, createI18n, createResourcer, registerMiddlewares } from './helper';
import { Plugin } from './plugin';
import { PluginManager } from './plugin-manager';

export interface ResourcerOptions {
  prefix?: string;
}

export interface ApplicationOptions {
  database?: DatabaseOptions;
  resourcer?: ResourcerOptions;
  bodyParser?: any;
  cors?: any;
  dataWrapping?: boolean;
  registerActions?: boolean;
  i18n?: i18n | InitOptions;
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

interface StartOptions {
  port?: number | undefined;
  host?: string | undefined;
  backlog?: number | undefined;
  path?: string | undefined;
  exclusive?: boolean | undefined;
  readableAll?: boolean | undefined;
  writableAll?: boolean | undefined;
  /**
   * @default false
   */
  ipv6Only?: boolean | undefined;
  signal?: AbortSignal | undefined;
}

export class Application<StateT = DefaultState, ContextT = DefaultContext> extends Koa implements AsyncEmitter {
  public readonly db: Database;

  public readonly resourcer: Resourcer;

  public readonly cli: Command;

  public readonly i18n: i18n;

  public readonly pm: PluginManager;

  protected plugins = new Map<string, Plugin>();

  public listenServer: Server;

  constructor(options: ApplicationOptions) {
    super();

    this.db = createDatabase(options);
    this.resourcer = createResourcer(options);
    this.cli = createCli(this, options);
    this.i18n = createI18n(options);

    this.pm = new PluginManager({
      app: this,
    });

    registerMiddlewares(this, options);
    if (options.registerActions !== false) {
      registerActions(this);
    }
  }

  plugin<O = any>(pluginClass: any, options?: O): Plugin<O> {
    return this.pm.add(pluginClass, options);
  }

  use<NewStateT = {}, NewContextT = {}>(
    middleware: Koa.Middleware<StateT & NewStateT, ContextT & NewContextT>,
    options?: MiddlewareOptions,
  ) {
    // @ts-ignore
    return super.use(middleware);
  }

  collection(options: CollectionOptions) {
    return this.db.collection(options);
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

  findCommand(name: string): Command {
    return (this.cli as any)._findCommand(name);
  }

  async load() {
    await this.pm.load();
  }

  getPlugin<P extends Plugin>(name: string) {
    return this.pm.get(name) as P;
  }

  async parse(argv = process.argv) {
    await this.load();
    return this.cli.parseAsync(argv);
  }

  async start(options?: StartOptions) {
    // reconnect database
    if (this.db.closed()) {
      await this.db.reconnect();
    }

    await this.emitAsync('beforeStart');

    if (options?.port) {
      const listen = () =>
        new Promise((resolve) => {
          const Server = this.listen(options, () => {
            resolve(Server);
          });
        });

      // @ts-ignore
      this.listenServer = await listen();
    }

    await this.emitAsync('afterStart');
  }

  async stop() {
    await this.emitAsync('beforeStop');

    // close database connection
    await this.db.close();

    // close http server
    if (this.listenServer) {
      const closeServer = () =>
        new Promise((resolve, reject) => {
          this.listenServer.close((err) => {
            if (err) {
              return reject(err);
            }

            this.listenServer = null;
            resolve(true);
          });
        });

      await closeServer();
    }

    await this.emitAsync('afterStop');
  }

  async destroy() {
    await this.emitAsync('beforeDestroy');
    await this.stop();
    await this.emitAsync('afterDestroy');
  }

  async install(options?: { clean?: true; syncOptions?: SyncOptions }) {
    if (options?.clean) {
      await this.clean({ drop: true });
    }

    await this.emitAsync('beforeInstall');

    await this.db.sync(options?.syncOptions);

    await this.emitAsync('afterInstall');
  }

  async clean(options?: { drop?: true }) {
    if (options.drop) {
      await this.db.sequelize.getQueryInterface().dropAllTables();
    }
  }

  emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;
}

applyMixins(Application, [AsyncEmitter]);

export default Application;

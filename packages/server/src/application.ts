import Koa from 'koa';
import { Command, CommandOptions } from 'commander';
import Database, { DatabaseOptions, CollectionOptions } from '@nocobase/database';
import Resourcer, { ResourceOptions } from '@nocobase/resourcer';
import { PluginType, Plugin, PluginOptions } from './plugin';
import { registerActions } from '@nocobase/actions';
import { createCli, createI18n, createDatabase, createResourcer, registerMiddlewares } from './helper';
import { i18n, InitOptions } from 'i18next';
import { PluginManager } from './plugin-manager';
import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import { Server } from 'http';

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

type StartOptions = { port: number } | { listen: false };

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

  plugin(options?: PluginType | PluginOptions, ext?: PluginOptions): Plugin {
    return this.pm.add(options);
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
    return this.plugins.get(name) as P;
  }

  async parse(argv = process.argv) {
    await this.load();
    return this.cli.parseAsync(argv);
  }

  async start(options?: StartOptions) {
    await this.emitAsync('beforeStart');

    // reconnect database
    if (this.db.closed()) {
      await this.db.reconnect();
    }

    // load configuration
    await this.load();

    if (options['port']) {
      this.listenServer = this.listen(options['port']);
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

  async install(options?: { clean?: true }) {
    await this.emitAsync('beforeInstall');

    if (options?.clean) {
      await this.clean({ drop: true });
    }

    await this.db.sync();

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

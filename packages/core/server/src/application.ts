import { ACL } from '@nocobase/acl';
import { registerActions } from '@nocobase/actions';
import { Cache, createCache, ICacheConfig } from '@nocobase/cache';
import Database, { Collection, CollectionOptions, IDatabaseOptions } from '@nocobase/database';
import { AppLoggerOptions, createAppLogger, Logger } from '@nocobase/logger';
import Resourcer, { ResourceOptions } from '@nocobase/resourcer';
import { applyMixins, AsyncEmitter, Toposort, ToposortOptions } from '@nocobase/utils';
import chalk from 'chalk';
import { Command, CommandOptions, ParseOptions } from 'commander';
import { Server } from 'http';
import { i18n, InitOptions } from 'i18next';
import Koa, { DefaultContext as KoaDefaultContext, DefaultState as KoaDefaultState } from 'koa';
import compose from 'koa-compose';
import semver from 'semver';
import { promisify } from 'util';
import { createACL } from './acl';
import { AppManager } from './app-manager';
import { registerCli } from './commands';
import { createI18n, createResourcer, registerMiddlewares } from './helper';
import { Plugin } from './plugin';
import { InstallOptions, PluginManager } from './plugin-manager';

const packageJson = require('../package.json');

export type PluginConfiguration = string | [string, any];

export interface ResourcerOptions {
  prefix?: string;
}

export interface ApplicationOptions {
  database?: IDatabaseOptions | Database;
  cache?: ICacheConfig | ICacheConfig[];
  resourcer?: ResourcerOptions;
  bodyParser?: any;
  cors?: any;
  dataWrapping?: boolean;
  registerActions?: boolean;
  i18n?: i18n | InitOptions;
  plugins?: PluginConfiguration[];
  acl?: boolean;
  logger?: AppLoggerOptions;
  pmSock?: string;
  name?: string;
}

export interface DefaultState extends KoaDefaultState {
  currentUser?: any;

  [key: string]: any;
}

export interface DefaultContext extends KoaDefaultContext {
  db: Database;
  cache: Cache;
  resourcer: Resourcer;
  i18n: any;

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

interface ListenOptions {
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

interface StartOptions {
  cliArgs?: any[];
  dbSync?: boolean;
  listen?: ListenOptions;
}

export class ApplicationVersion {
  protected app: Application;
  protected collection: Collection;

  constructor(app: Application) {
    this.app = app;
    if (!app.db.hasCollection('applicationVersion')) {
      app.db.collection({
        name: 'applicationVersion',
        namespace: 'core',
        duplicator: 'required',
        timestamps: false,
        fields: [{ name: 'value', type: 'string' }],
      });
    }
    this.collection = this.app.db.getCollection('applicationVersion');
  }

  async get() {
    if (await this.app.db.collectionExistsInDb('applicationVersion')) {
      const model = await this.collection.model.findOne();
      if (!model) {
        return null;
      }
      return model.get('value') as any;
    }
    return null;
  }

  async update() {
    await this.collection.sync();
    await this.collection.model.destroy({
      truncate: true,
    });

    await this.collection.model.create({
      value: this.app.getVersion(),
    });
  }

  async satisfies(range: string) {
    if (await this.app.db.collectionExistsInDb('applicationVersion')) {
      const model: any = await this.collection.model.findOne();
      const version = model?.value as any;
      if (!version) {
        return true;
      }
      return semver.satisfies(version, range, { includePrerelease: true });
    }
    return true;
  }
}

export class Application<StateT = DefaultState, ContextT = DefaultContext> extends Koa implements AsyncEmitter {
  protected _db: Database;
  protected _logger: Logger;

  protected _resourcer: Resourcer;

  protected _cache: Cache;

  protected _cli: Command;

  protected _i18n: i18n;

  protected _pm: PluginManager;

  protected _acl: ACL;

  protected _appManager: AppManager;

  protected _version: ApplicationVersion;

  protected plugins = new Map<string, Plugin>();

  public listenServer: Server;

  declare middleware: any;

  constructor(public options: ApplicationOptions) {
    super();
    this.init();
  }

  get db() {
    return this._db;
  }

  get cache() {
    return this._cache;
  }

  get resourcer() {
    return this._resourcer;
  }

  get cli() {
    return this._cli;
  }

  get acl() {
    return this._acl;
  }

  get i18n() {
    return this._i18n;
  }

  get pm() {
    return this._pm;
  }

  get version() {
    return this._version;
  }

  get appManager() {
    return this._appManager;
  }

  get logger() {
    return this._logger;
  }

  get log() {
    return this._logger;
  }

  get name() {
    return this.options.name || 'main';
  }

  protected init() {
    const options = this.options;
    const logger = createAppLogger(options.logger);
    this._logger = logger.instance;
    // @ts-ignore
    this._events = [];
    // @ts-ignore
    this._eventsCount = [];
    this.removeAllListeners();
    this.middleware = new Toposort<any>();
    this.plugins = new Map<string, Plugin>();
    this._acl = createACL();

    this.use(logger.middleware, { tag: 'logger' });

    if (this._db) {
      // MaxListenersExceededWarning
      this._db.removeAllListeners();
    }

    this._db = this.createDatabase(options);

    this._resourcer = createResourcer(options);
    this._cli = new Command('nocobase').usage('[command] [options]');
    this._i18n = createI18n(options);
    this._cache = createCache(options.cache);
    this.context.db = this._db;
    this.context.logger = this._logger;
    this.context.resourcer = this._resourcer;
    this.context.cache = this._cache;

    if (this._pm) {
      this._pm = this._pm.clone();
    } else {
      this._pm = new PluginManager({
        app: this,
        plugins: options.plugins,
      });
    }

    this._appManager = new AppManager(this);

    if (this.options.acl !== false) {
      this._resourcer.use(this._acl.middleware(), { tag: 'acl', after: ['parseToken'] });
    }

    registerMiddlewares(this, options);

    if (options.registerActions !== false) {
      registerActions(this);
    }

    registerCli(this);

    this._version = new ApplicationVersion(this);
  }

  private createDatabase(options: ApplicationOptions) {
    return new Database({
      ...(options.database instanceof Database ? options.database.options : options.database),
      migrator: {
        context: { app: this },
      },
    });
  }

  getVersion() {
    return packageJson.version;
  }

  plugin<O = any>(pluginClass: any, options?: O): Plugin {
    return this.pm.addStatic(pluginClass, options);
  }

  // @ts-ignore
  use<NewStateT = {}, NewContextT = {}>(
    middleware: Koa.Middleware<StateT & NewStateT, ContextT & NewContextT>,
    options?: ToposortOptions,
  ) {
    this.middleware.add(middleware, options);
    return this;
  }

  callback() {
    const fn = compose(this.middleware.nodes);

    if (!this.listenerCount('error')) this.on('error', this.onerror);

    const handleRequest = (req, res) => {
      const ctx = this.createContext(req, res);
      // @ts-ignore
      return this.handleRequest(ctx, fn);
    };

    return handleRequest;
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

  command(name: string, desc?: string, opts?: CommandOptions): Command {
    return this.cli.command(name, desc, opts).allowUnknownOption();
  }

  findCommand(name: string): Command {
    return (<any>this.cli)._findCommand(name);
  }

  async load(options?: any) {
    if (options?.reload) {
      console.log(`Reload the application configuration`);
      const oldDb = this._db;
      this.init();
      await oldDb.close();
    }

    await this.emitAsync('beforeLoad', this, options);
    await this.pm.load(options);
    await this.emitAsync('afterLoad', this, options);
  }

  async reload(options?: any) {
    await this.load({
      ...options,
      reload: true,
    });
  }

  getPlugin<P extends Plugin>(name: string) {
    return this.pm.get(name) as P;
  }

  async parse(argv = process.argv) {
    return this.runAsCLI(argv);
  }

  async runAsCLI(argv = process.argv, options?: ParseOptions) {
    try {
      await this.db.auth({ retry: 30 });
    } catch (error) {
      console.log(chalk.red(error.message));
      process.exit(1);
    }

    await this.dbVersionCheck({ exit: true });

    await this.db.prepare();

    if (argv?.[2] !== 'upgrade') {
      await this.load({
        method: argv?.[2],
      });
    }

    return this.cli.parseAsync(argv, options);
  }

  async start(options: StartOptions = {}) {
    // reconnect database
    if (this.db.closed()) {
      await this.db.reconnect();
    }

    if (options.dbSync) {
      console.log('db sync...');
      await this.db.sync();
    }

    await this.emitAsync('beforeStart', this, options);

    if (options?.listen?.port) {
      const pmServer = await this.pm.listen();
      const listen = () =>
        new Promise((resolve, reject) => {
          const Server = this.listen(options?.listen, () => {
            resolve(Server);
          });

          Server.on('error', (err) => {
            reject(err);
          });

          Server.on('close', () => {
            pmServer.close();
          });
        });

      try {
        //@ts-ignore
        this.listenServer = await listen();
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    }

    await this.emitAsync('afterStart', this, options);
  }

  listen(...args): Server {
    return this.appManager.listen(...args);
  }

  async stop(options: any = {}) {
    await this.emitAsync('beforeStop', this, options);

    try {
      // close database connection
      // silent if database already closed
      if (!this.db.closed()) {
        await this.db.close();
      }
    } catch (e) {
      console.log(e);
    }

    // close http server
    if (this.listenServer) {
      await promisify(this.listenServer.close).call(this.listenServer);
      this.listenServer = null;
    }

    await this.emitAsync('afterStop', this, options);
  }

  async destroy(options: any = {}) {
    await this.emitAsync('beforeDestroy', this, options);
    await this.stop(options);
    await this.emitAsync('afterDestroy', this, options);
  }

  async dbVersionCheck(options?: { exit?: boolean }) {
    const r = await this.db.version.satisfies({
      mysql: '>=8.0.17',
      sqlite: '3.x',
      postgres: '>=10',
    });

    if (!r) {
      console.log(chalk.red('The database only supports MySQL 8.0.17 and above, SQLite 3.x and PostgreSQL 10+'));
      if (options?.exit) {
        process.exit();
      }
      return false;
    }

    if (this.db.inDialect('mysql')) {
      const result = await this.db.sequelize.query(`SHOW VARIABLES LIKE 'lower_case_table_names'`, { plain: true });
      if (result?.Value === '1' && !this.db.options.underscored) {
        console.log(
          `Your database lower_case_table_names=1, please add ${chalk.yellow('DB_UNDERSCORED=true')} to the .env file`,
        );
        if (options?.exit) {
          process.exit();
        }
        return false;
      }
    }

    return true;
  }

  async isInstalled() {
    return (
      (await this.db.collectionExistsInDb('applicationVersion')) || (await this.db.collectionExistsInDb('collections'))
    );
  }

  async install(options: InstallOptions = {}) {
    console.log('Database dialect: ' + this.db.sequelize.getDialect());

    if (options?.clean || options?.sync?.force) {
      console.log('Truncate database and reload app configuration');
      await this.db.clean({ drop: true });
      await this.reload({ method: 'install' });
    }

    await this.emitAsync('beforeInstall', this, options);
    await this.db.sync();
    await this.pm.install(options);
    await this.version.update();
    await this.emitAsync('afterInstall', this, options);
  }

  async upgrade(options: any = {}) {
    await this.emitAsync('beforeUpgrade', this, options);
    const force = false;
    await this.db.migrator.up();
    await this.db.sync({
      force,
      alter: {
        drop: force,
      },
    });
    await this.version.update();
    await this.emitAsync('afterUpgrade', this, options);
  }

  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;

  toJSON() {
    return {
      appName: this.name,
    };
  }
}

applyMixins(Application, [AsyncEmitter]);

export default Application;

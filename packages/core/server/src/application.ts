import { ACL } from '@nocobase/acl';
import { registerActions } from '@nocobase/actions';
import { actions as authActions, AuthManager } from '@nocobase/auth';
import { Cache, createCache, ICacheConfig } from '@nocobase/cache';
import Database, { CollectionOptions, IDatabaseOptions } from '@nocobase/database';
import { AppLoggerOptions, createAppLogger, Logger } from '@nocobase/logger';
import Resourcer, { ResourceOptions } from '@nocobase/resourcer';
import { applyMixins, AsyncEmitter, Toposort, ToposortOptions } from '@nocobase/utils';
import chalk from 'chalk';
import { Command, CommandOptions, ParseOptions } from 'commander';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { i18n, InitOptions } from 'i18next';
import Koa, { DefaultContext as KoaDefaultContext, DefaultState as KoaDefaultState } from 'koa';
import compose from 'koa-compose';
import { createACL } from './acl';
import { registerCli } from './commands';
import { createI18n, createResourcer, registerMiddlewares } from './helper';
import { Locale } from './locale';
import { Plugin } from './plugin';
import { InstallOptions, PluginManager } from './plugin-manager';
import { ApplicationVersion } from './helpers/application-version';
import { AppSupervisor, supervisedAppCall } from './app-supervisor';
import lodash from 'lodash';
import { ApplicationFsm } from './helpers/application-fsm';

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
  checkInstall?: boolean;
}

function SwitchAppReadyStatus(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    this.setReadyStatus(false, `start ${originalMethod.name}`);
    const result = await originalMethod.apply(this, args);
    this.setReadyStatus(true, `end ${originalMethod.name}`);
    return result;
  };

  return descriptor;
}

export class Application<StateT = DefaultState, ContextT = DefaultContext> extends Koa implements AsyncEmitter {
  public listenServer: Server;
  declare middleware: any;
  stopped = false;
  ready = false;
  startMode = false;
  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;
  public rawOptions: ApplicationOptions;
  protected plugins = new Map<string, Plugin>();
  protected _appSupervisor: AppSupervisor = AppSupervisor.getInstance();

  private _fsm;
  private _fsmInterpret;

  constructor(public options: ApplicationOptions) {
    super();
    this.rawOptions = this.name == 'main' ? lodash.cloneDeep(options) : {};
    this._fsm = ApplicationFsm.buildFsm(this);

    this.init();
    this._appSupervisor.addApp(this);
  }

  private _workingMessage: string = 'idle' as string;

  get workingMessage() {
    return this._workingMessage;
  }

  protected _db: Database;

  get db() {
    return this._db;
  }

  protected _logger: Logger;

  get logger() {
    return this._logger;
  }

  protected _resourcer: Resourcer;

  get resourcer() {
    return this._resourcer;
  }

  protected _cache: Cache;

  get cache() {
    return this._cache;
  }

  protected _cli: Command;

  get cli() {
    return this._cli;
  }

  protected _i18n: i18n;

  get i18n() {
    return this._i18n;
  }

  protected _pm: PluginManager;

  get pm() {
    return this._pm;
  }

  protected _acl: ACL;

  get acl() {
    return this._acl;
  }

  protected _authManager: AuthManager;

  get authManager() {
    return this._authManager;
  }

  protected _locales: Locale;

  get locales() {
    return this._locales;
  }

  protected _version: ApplicationVersion;

  get version() {
    return this._version;
  }

  get log() {
    return this._logger;
  }

  get name() {
    return this.options.name || 'main';
  }

  getStateMachine() {
    return this._fsm;
  }

  getFsmInterpreter() {
    if (!this._fsmInterpret) {
      this._fsmInterpret = ApplicationFsm.getInterpreter(this);
    }

    return this._fsmInterpret;
  }

  setWorkingMessage(message: string) {
    this._workingMessage = message;

    this.emit('workingMessageChanged', {
      message: this._workingMessage,
      ready: this.ready,
    });
  }

  getVersion() {
    return packageJson.version;
  }

  plugin<O = any>(pluginClass: any, options?: O): Plugin {
    this.log.debug(`add plugin ${pluginClass.name}`);
    return this.pm.addStatic(pluginClass, options);
  }

  async isAlive() {
    return true;
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

    return (req: IncomingMessage, res: ServerResponse) => {
      const ctx = this.createContext(req, res);

      // @ts-ignore
      return this.handleRequest(ctx, fn);
    };
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
    return (this.cli as any)._findCommand(name);
  }

  @supervisedAppCall
  async load(options?: any) {
    this.setWorkingMessage('start load');

    if (options?.reload) {
      this.log.info(`Reload application configuration`);
      const oldDb = this._db;
      this.init();
      await oldDb.close();
    }

    this.setWorkingMessage('emit beforeLoad');
    await this.emitAsync('beforeLoad', this, options);

    await this.pm.load(options);

    this.setWorkingMessage('emit afterLoad');
    await this.emitAsync('afterLoad', this, options);
  }

  async reload(options?: any) {
    this.log.debug(`start reload`);

    await this.load({
      ...options,
      reload: true,
    });

    this.log.debug('emit afterReload');
    this.setWorkingMessage('emit afterReload');
    await this.emitAsync('afterReload', this, options);
    this.log.debug(`finish reload`);
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

    const command = argv?.[2];

    if (command !== 'upgrade') {
      try {
        await this.load({
          method: command,
        });
      } catch (error) {
        console.log(`ignore error ${error.message}`);
      }
    }

    return this.cli.parseAsync(argv, options);
  }

  @supervisedAppCall
  async start(options: StartOptions = {}) {
    if (options.checkInstall && !(await this.isInstalled())) {
      throw new Error(
        `Application ${this.name} is not installed, Please run 'yarn run nocobase install' command first`,
      );
    }

    this.startMode = true;
    this.setWorkingMessage('starting app...');

    if (this.db.closed()) {
      await this.db.reconnect();
    }

    await this.emitAsync('beforeStart', this, options);
    await this.emitAsync('afterStart', this, options);
    this.stopped = false;
    this.setWorkingMessage('started');
    this.setReadyStatus(true, 'started');
  }

  setReadyStatus(status: boolean, reason: string) {
    this.ready = status;

    this.logger.debug(`set ready status to ${status} because ${reason}`);
    this.emit('readyStatusChanged', this.ready);
  }

  async stop(options: any = {}) {
    this.log.debug('stop app...');
    this.setWorkingMessage('stopping app...');
    if (this.stopped) {
      this.log.warn(`Application ${this.name} already stopped`);
      return;
    }

    await this.emitAsync('beforeStop', this, options);

    try {
      // close database connection
      // silent if database already closed
      if (!this.db.closed()) {
        this.logger.info(`close db`);
        await this.db.close();
      }
    } catch (e) {
      this.log.error(e);
    }

    await this.emitAsync('afterStop', this, options);
    this.stopped = true;
    this.log.info(`${this.name} is stopped`);
    this.setWorkingMessage('stopped');
  }

  async destroy(options: any = {}) {
    this.logger.debug('start destroy app');
    this.setWorkingMessage('destroying app...');
    await this.emitAsync('beforeDestroy', this, options);
    await this.stop(options);

    this.logger.debug('emit afterDestroy');
    await this.emitAsync('afterDestroy', this, options);

    this.logger.debug('finish destroy app');
    this.setWorkingMessage('destroyed');
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

  @SwitchAppReadyStatus
  async install(options: InstallOptions = {}) {
    console.log('Database dialect: ' + this.db.sequelize.getDialect());

    if (options?.clean || options?.sync?.force) {
      console.log('Truncate database and reload app configuration');
      await this.db.clean({ drop: true });
      await this.reload({ method: 'install' });
    }

    this.log.debug('emit beforeInstall');
    await this.emitAsync('beforeInstall', this, options);
    this.log.debug('call db.sync()');
    await this.db.sync();
    this.log.debug('start install plugins');
    await this.pm.install(options);
    this.log.debug('update version');
    await this.version.update();
    this.log.debug('emit afterInstall');
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

  toJSON() {
    return {
      appName: this.name,
    };
  }

  public async handleDynamicCall(method: string, ...args: any[]): Promise<{ result: any }> {
    const target = lodash.get(this, method);
    let result = target;

    if (typeof target === 'function') {
      const methodPaths: Array<string> = method.split('.');
      methodPaths.pop();
      result = await target.apply(methodPaths.length > 0 ? lodash.get(this, methodPaths.join('.')) : this, args);
    }

    return JSON.parse(JSON.stringify({ result }));
  }

  protected init() {
    const options = this.options;

    const logger = createAppLogger({
      ...options.logger,
      defaultMeta: {
        app: this.name,
      },
    });

    this._logger = logger.instance;

    const alwaysRebindEvents = [];

    // @ts-ignore
    for (const event of Object.keys(this._events)) {
      // @ts-ignore
      const events = lodash.castArray(this._events[event] || []);

      events
        .filter((listener: any) => listener.alwaysBind)
        .forEach((listener: any) => {
          alwaysRebindEvents.push([event, listener]);
        });
    }

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

    this._authManager = new AuthManager({
      authKey: 'X-Authenticator',
      default: 'basic',
    });

    this.resource({
      name: 'auth',
      actions: authActions,
    });

    this._resourcer.use(this._authManager.middleware(), { tag: 'auth' });

    if (this.options.acl !== false) {
      this._resourcer.use(this._acl.middleware(), { tag: 'acl', after: ['auth'] });
    }

    this._locales = new Locale(this);

    registerMiddlewares(this, options);

    if (options.registerActions !== false) {
      registerActions(this);
    }

    registerCli(this);

    this._version = new ApplicationVersion(this);

    for (const [event, listener] of alwaysRebindEvents) {
      this.on(event, listener);
    }
  }

  private createDatabase(options: ApplicationOptions) {
    const db = new Database({
      ...(options.database instanceof Database ? options.database.options : options.database),
      migrator: {
        context: { app: this },
      },
    });

    db.setLogger(this._logger);

    return db;
  }
}

applyMixins(Application, [AsyncEmitter]);

export default Application;

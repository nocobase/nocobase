import { ACL } from '@nocobase/acl';
import { registerActions } from '@nocobase/actions';
import { actions as authActions, AuthManager, AuthManagerOptions } from '@nocobase/auth';
import { Cache, CacheManager, CacheManagerOptions } from '@nocobase/cache';
import Database, { CollectionOptions, IDatabaseOptions } from '@nocobase/database';
import { AppLoggerOptions, createAppLogger, Logger } from '@nocobase/logger';
import { ResourceOptions, Resourcer } from '@nocobase/resourcer';
import { applyMixins, AsyncEmitter, measureExecutionTime, Toposort, ToposortOptions } from '@nocobase/utils';
import chalk from 'chalk';
import { Command, CommandOptions, ParseOptions } from 'commander';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { i18n, InitOptions } from 'i18next';
import Koa, { DefaultContext as KoaDefaultContext, DefaultState as KoaDefaultState } from 'koa';
import compose from 'koa-compose';
import lodash from 'lodash';
import { createACL } from './acl';
import { AppCommand } from './app-command';
import { AppSupervisor } from './app-supervisor';
import { createCacheManager } from './cache';
import { registerCli } from './commands';
import { CronJobManager } from './cron/cron-job-manager';
import { ApplicationNotInstall } from './errors/application-not-install';
import {
  createAppProxy,
  createI18n,
  createResourcer,
  getCommandFullName,
  registerMiddlewares,
  enablePerfHooks,
} from './helper';
import { ApplicationVersion } from './helpers/application-version';
import { Locale } from './locale';
import { Plugin } from './plugin';
import { InstallOptions, PluginManager } from './plugin-manager';
import { RecordableHistogram, performance } from 'node:perf_hooks';

const packageJson = require('../package.json');

export type PluginType = string | typeof Plugin;
export type PluginConfiguration = PluginType | [PluginType, any];

export interface ResourcerOptions {
  prefix?: string;
}

export interface ApplicationOptions {
  database?: IDatabaseOptions | Database;
  cacheManager?: CacheManagerOptions;
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
  authManager?: AuthManagerOptions;
  perfHooks?: boolean;
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
  recover?: boolean;
}

type MaintainingStatus = 'command_begin' | 'command_end' | 'command_running' | 'command_error';

export type MaintainingCommandStatus = {
  command: {
    name: string;
  };
  status: MaintainingStatus;
  error?: Error;
};

export class Application<StateT = DefaultState, ContextT = DefaultContext> extends Koa implements AsyncEmitter {
  public listenServer: Server;
  declare middleware: any;
  stopped = false;
  ready = false;
  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;
  public rawOptions: ApplicationOptions;
  public activatedCommand: {
    name: string;
  } = null;
  public running = false;
  public perfHistograms = new Map<string, RecordableHistogram>();
  protected plugins = new Map<string, Plugin>();
  protected _appSupervisor: AppSupervisor = AppSupervisor.getInstance();
  protected _started: boolean;
  private _authenticated = false;
  private _maintaining = false;
  private _maintainingCommandStatus: MaintainingCommandStatus;
  private _maintainingStatusBeforeCommand: MaintainingCommandStatus | null;
  private _actionCommand: Command;

  constructor(public options: ApplicationOptions) {
    super();
    this.rawOptions = this.name == 'main' ? lodash.cloneDeep(options) : {};
    this.init();

    this._appSupervisor.addApp(this);
  }

  protected _loaded: boolean;

  get loaded() {
    return this._loaded;
  }

  private _maintainingMessage: string;

  get maintainingMessage() {
    return this._maintainingMessage;
  }

  protected _cronJobManager: CronJobManager;

  get cronJobManager() {
    return this._cronJobManager;
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

  protected _cacheManager: CacheManager;

  get cacheManager() {
    return this._cacheManager;
  }

  protected _cache: Cache;

  set cache(cache: Cache) {
    this._cache = cache;
  }

  get cache() {
    return this._cache;
  }

  protected _cli: AppCommand;

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

  get localeManager() {
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

  isMaintaining() {
    return this._maintaining;
  }

  getMaintaining() {
    return this._maintainingCommandStatus;
  }

  setMaintaining(_maintainingCommandStatus: MaintainingCommandStatus) {
    this._maintainingCommandStatus = _maintainingCommandStatus;

    this.emit('maintaining', _maintainingCommandStatus);

    if (_maintainingCommandStatus.status == 'command_end') {
      this._maintaining = false;
      return;
    }

    this._maintaining = true;
  }

  setMaintainingMessage(message: string) {
    this._maintainingMessage = message;

    this.emit('maintainingMessageChanged', {
      message: this._maintainingMessage,
      maintainingStatus: this._maintainingCommandStatus,
    });
  }

  getVersion() {
    return packageJson.version;
  }

  plugin<O = any>(pluginClass: any, options?: O) {
    this.log.debug(`add plugin ${pluginClass.name}`);
    this.pm.addPreset(pluginClass, options);
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

  command(name: string, desc?: string, opts?: CommandOptions): AppCommand {
    return this.cli.command(name, desc, opts).allowUnknownOption();
  }

  findCommand(name: string): Command {
    return (this.cli as any)._findCommand(name);
  }

  async load(options?: any) {
    if (this._loaded) {
      return;
    }

    if (options?.reload) {
      this.setMaintainingMessage('app reload');
      this.log.info(`app.reload()`);
      const oldDb = this._db;
      this.init();
      if (!oldDb.closed()) {
        await oldDb.close();
      }
      if (this._cacheManager) {
        await this._cacheManager.close();
      }
    }

    this._cacheManager = await createCacheManager(this, this.options.cacheManager);

    this.setMaintainingMessage('init plugins');
    await this.pm.initPlugins();

    this.setMaintainingMessage('start load');

    this.setMaintainingMessage('emit beforeLoad');
    await this.emitAsync('beforeLoad', this, options);

    await this.pm.load(options);

    this.setMaintainingMessage('emit afterLoad');
    await this.emitAsync('afterLoad', this, options);
    this._loaded = true;
  }

  async reload(options?: any) {
    this.log.debug(`start reload`);

    this._loaded = false;

    await this.emitAsync('beforeReload', this, options);

    await this.load({
      ...options,
      reload: true,
    });

    this.log.debug('emit afterReload');
    this.setMaintainingMessage('emit afterReload');
    await this.emitAsync('afterReload', this, options);
    this.log.debug(`finish reload`);
  }

  getPlugin<P extends Plugin>(name: string | typeof Plugin) {
    return this.pm.get(name) as P;
  }

  async parse(argv = process.argv) {
    return this.runAsCLI(argv);
  }

  async authenticate() {
    if (this._authenticated) {
      return;
    }
    this._authenticated = true;
    await this.db.auth();
    await this.db.checkVersion();
    await this.db.prepare();
  }

  async runCommand(command: string, ...args: any[]) {
    return await this.runAsCLI([command, ...args], { from: 'user' });
  }

  createCli() {
    const command = new AppCommand('nocobase')
      .usage('[command] [options]')
      .hook('preAction', async (_, actionCommand) => {
        this._actionCommand = actionCommand;
        this.activatedCommand = {
          name: getCommandFullName(actionCommand),
        };

        this.setMaintaining({
          status: 'command_begin',
          command: this.activatedCommand,
        });

        this.setMaintaining({
          status: 'command_running',
          command: this.activatedCommand,
        });

        await this.authenticate();
        await this.load();
      })
      .hook('postAction', async (_, actionCommand) => {
        if (this._maintainingStatusBeforeCommand?.error && this._started) {
          await this.restart();
        }
      });

    command.exitOverride((err) => {
      throw err;
    });

    return command;
  }

  async runAsCLI(argv = process.argv, options?: ParseOptions & { throwError?: boolean }) {
    if (this.activatedCommand) {
      return;
    }

    this._maintainingStatusBeforeCommand = this._maintainingCommandStatus;

    try {
      const command = await this.cli.parseAsync(argv, options);

      this.setMaintaining({
        status: 'command_end',
        command: this.activatedCommand,
      });

      return command;
    } catch (error) {
      console.log({ error });
      if (!this.activatedCommand) {
        this.activatedCommand = {
          name: 'unknown',
        };
      }

      this.setMaintaining({
        status: 'command_error',
        command: this.activatedCommand,
        error,
      });

      if (options?.throwError) {
        throw error;
      }
    } finally {
      const _actionCommand = this._actionCommand;
      if (_actionCommand) {
        const options = _actionCommand['options'];
        _actionCommand['_optionValues'] = {};
        _actionCommand['_optionValueSources'] = {};
        _actionCommand['options'] = [];
        for (const option of options) {
          _actionCommand.addOption(option);
        }
      }
      this._actionCommand = null;
      this.activatedCommand = null;
    }
  }

  async start(options: StartOptions = {}) {
    if (this._started) {
      return;
    }

    this._started = true;

    if (options.checkInstall && !(await this.isInstalled())) {
      throw new ApplicationNotInstall(
        `Application ${this.name} is not installed, Please run 'yarn nocobase install' command first`,
      );
    }

    this.setMaintainingMessage('starting app...');

    if (this.db.closed()) {
      await this.db.reconnect();
    }

    this.setMaintainingMessage('emit beforeStart');
    await this.emitAsync('beforeStart', this, options);

    this.setMaintainingMessage('emit afterStart');
    await this.emitAsync('afterStart', this, options);
    await this.emitStartedEvent(options);

    this.stopped = false;
  }

  async emitStartedEvent(options: StartOptions = {}) {
    await this.emitAsync('__started', this, {
      maintainingStatus: lodash.cloneDeep(this._maintainingCommandStatus),
      options,
    });
  }

  async isStarted() {
    return this._started;
  }

  async tryReloadOrRestart(options: StartOptions = {}) {
    if (this._started) {
      await this.restart(options);
    } else {
      await this.reload(options);
    }
  }

  async restart(options: StartOptions = {}) {
    if (!this._started) {
      return;
    }

    this._started = false;
    await this.emitAsync('beforeStop');
    await this.reload(options);
    await this.start(options);
    this.emit('__restarted', this, options);
  }

  async stop(options: any = {}) {
    this.log.debug('stop app...');
    this.setMaintainingMessage('stopping app...');

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

    if (this._cacheManager) {
      await this._cacheManager.close();
    }

    await this.emitAsync('afterStop', this, options);

    this.stopped = true;
    this.log.info(`${this.name} is stopped`);
    this._started = false;
  }

  async destroy(options: any = {}) {
    this.logger.debug('start destroy app');
    this.setMaintainingMessage('destroying app...');
    await this.emitAsync('beforeDestroy', this, options);
    await this.stop(options);

    this.logger.debug('emit afterDestroy');
    await this.emitAsync('afterDestroy', this, options);

    this.logger.debug('finish destroy app');
  }

  async isInstalled() {
    return (
      (await this.db.collectionExistsInDb('applicationVersion')) || (await this.db.collectionExistsInDb('collections'))
    );
  }

  async install(options: InstallOptions = {}) {
    this.setMaintainingMessage('installing app...');
    this.log.debug('Database dialect: ' + this.db.sequelize.getDialect());

    if (options?.clean || options?.sync?.force) {
      this.log.debug('truncate database');
      await this.db.clean({ drop: true });
      this.log.debug('app reloading');
      await this.reload();
    } else if (await this.isInstalled()) {
      this.log.warn('app is installed');
      return;
    }

    this.log.debug('emit beforeInstall');
    this.setMaintainingMessage('call beforeInstall hook...');
    await this.emitAsync('beforeInstall', this, options);
    this.log.debug('start install plugins');
    await this.pm.install(options);
    this.log.debug('update version');
    await this.version.update();
    this.log.debug('emit afterInstall');
    this.setMaintainingMessage('call afterInstall hook...');
    await this.emitAsync('afterInstall', this, options);

    if (this._maintainingStatusBeforeCommand?.error) {
      return;
    }

    if (this._started) {
      await this.restart();
    }
  }

  async upgrade(options: any = {}) {
    await this.emitAsync('beforeUpgrade', this, options);
    const force = false;

    await measureExecutionTime(async () => {
      await this.db.migrator.up();
    }, 'Migrator');

    await measureExecutionTime(async () => {
      await this.db.sync({
        force,
        alter: {
          drop: force,
        },
      });
    }, 'Sync');

    await this.version.update();
    await this.emitAsync('afterUpgrade', this, options);

    this.log.debug(chalk.green(`✨  NocoBase has been upgraded to v${this.getVersion()}`));

    if (this._started) {
      await measureExecutionTime(async () => {
        await this.restart();
      }, 'Restart');
    }
  }

  toJSON() {
    return {
      appName: this.name,
      name: this.name,
    };
  }

  reInitEvents() {
    for (const eventName of this.eventNames()) {
      for (const listener of this.listeners(eventName)) {
        if (listener['_reinitializable']) {
          this.removeListener(eventName, listener as any);
        }
      }
    }
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

    this.reInitEvents();

    this.middleware = new Toposort<any>();
    this.plugins = new Map<string, Plugin>();
    this._acl = createACL();

    this._cronJobManager = new CronJobManager(this);

    this.use(logger.middleware, { tag: 'logger' });

    if (this._db) {
      // MaxListenersExceededWarning
      this._db.removeAllListeners();
    }

    this._db = this.createDatabase(options);

    this._resourcer = createResourcer(options);
    this._cli = this.createCli();
    this._i18n = createI18n(options);
    this.context.db = this._db;
    this.context.logger = this._logger;
    this.context.resourcer = this._resourcer;
    this.context.cacheManager = this._cacheManager;
    this.context.cache = this._cache;

    const plugins = this._pm ? this._pm.options.plugins : options.plugins;

    this._pm = new PluginManager({
      app: this,
      plugins: plugins || [],
    });

    this._authManager = new AuthManager({
      authKey: 'X-Authenticator',
      default: 'basic',
      ...(this.options.authManager || {}),
    });

    this.resource({
      name: 'auth',
      actions: authActions,
    });

    this._resourcer.use(this._authManager.middleware(), { tag: 'auth' });

    if (this.options.acl !== false) {
      this._resourcer.use(this._acl.middleware(), { tag: 'acl', after: ['auth'] });
    }

    this._locales = new Locale(createAppProxy(this));

    if (options.perfHooks) {
      enablePerfHooks(this);
    }

    registerMiddlewares(this, options);

    if (options.registerActions !== false) {
      registerActions(this);
    }

    registerCli(this);

    this._version = new ApplicationVersion(this);
  }

  protected createDatabase(options: ApplicationOptions) {
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

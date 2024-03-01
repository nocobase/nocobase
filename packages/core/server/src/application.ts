import { registerActions } from '@nocobase/actions';
import { actions as authActions, AuthManager, AuthManagerOptions } from '@nocobase/auth';
import { Cache, CacheManager, CacheManagerOptions } from '@nocobase/cache';
import Database, { CollectionOptions, IDatabaseOptions } from '@nocobase/database';
import {
  createLogger,
  createSystemLogger,
  getLoggerFilePath,
  LoggerOptions,
  RequestLoggerOptions,
  SystemLogger,
  SystemLoggerOptions,
} from '@nocobase/logger';
import { ResourceOptions, Resourcer } from '@nocobase/resourcer';
import { Telemetry, TelemetryOptions } from '@nocobase/telemetry';
import { applyMixins, AsyncEmitter, importModule, Toposort, ToposortOptions } from '@nocobase/utils';
import { Command, CommandOptions, ParseOptions } from 'commander';
import { randomUUID } from 'crypto';
import glob from 'glob';
import { IncomingMessage, ServerResponse } from 'http';
import { i18n, InitOptions } from 'i18next';
import Koa, { DefaultContext as KoaDefaultContext, DefaultState as KoaDefaultState } from 'koa';
import compose from 'koa-compose';
import lodash from 'lodash';
import { RecordableHistogram } from 'node:perf_hooks';
import { basename, resolve } from 'path';
import semver from 'semver';
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
  enablePerfHooks,
  getCommandFullName,
  registerMiddlewares,
} from './helper';
import { ApplicationVersion } from './helpers/application-version';
import { Locale } from './locale';
import { Plugin } from './plugin';
import { InstallOptions, PluginManager } from './plugin-manager';

import { DataSourceManager, SequelizeDataSource } from '@nocobase/data-source-manager';
import packageJson from '../package.json';
import { MainDataSource } from './main-data-source';

export type PluginType = string | typeof Plugin;
export type PluginConfiguration = PluginType | [PluginType, any];

export interface ResourcerOptions {
  prefix?: string;
}

export interface AppLoggerOptions {
  request: RequestLoggerOptions;
  system: SystemLoggerOptions;
}

export interface AppTelemetryOptions extends TelemetryOptions {
  enabled?: boolean;
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
  telemetry?: AppTelemetryOptions;
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
  quickstart?: boolean;
  reload?: boolean;
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
    this.context.reqId = randomUUID();
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

  get mainDataSource() {
    return this.dataSourceManager?.dataSources.get('main') as SequelizeDataSource;
  }

  get db(): Database {
    if (!this.mainDataSource) {
      return null;
    }

    // @ts-ignore
    return this.mainDataSource.collectionManager.db;
  }

  protected _logger: SystemLogger;

  get logger() {
    return this._logger;
  }

  get resourcer() {
    return this.mainDataSource.resourceManager;
  }

  protected _cacheManager: CacheManager;

  get cacheManager() {
    return this._cacheManager;
  }

  protected _cache: Cache;

  get cache() {
    return this._cache;
  }

  set cache(cache: Cache) {
    this._cache = cache;
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

  get acl() {
    return this.mainDataSource.acl;
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

  protected _telemetry: Telemetry;

  get telemetry() {
    return this._telemetry;
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

  protected _dataSourceManager: DataSourceManager;

  get dataSourceManager() {
    return this._dataSourceManager;
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

  /**
   * @deprecated
   */
  plugin<O = any>(pluginClass: any, options?: O) {
    this.log.debug(`add plugin`, { method: 'plugin', name: pluginClass.name });
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

  async preload() {
    // load core collections
    // load plugin commands
  }

  async reInit() {
    if (!this._loaded) {
      return;
    }

    this.log.info('app reinitializing');

    if (this.cacheManager) {
      await this.cacheManager.close();
    }

    if (this.telemetry.started) {
      await this.telemetry.shutdown();
    }

    const oldDb = this.db;

    this.init();
    if (!oldDb.closed()) {
      await oldDb.close();
    }

    this._loaded = false;
  }

  async load(options?: any) {
    if (this._loaded) {
      return;
    }

    if (options?.reload) {
      this.setMaintainingMessage('app reload');
      this.log.info(`app.reload()`, { method: 'load' });

      if (this.cacheManager) {
        await this.cacheManager.close();
      }

      if (this.telemetry.started) {
        await this.telemetry.shutdown();
      }

      const oldDb = this.db;

      this.init();

      if (!oldDb.closed()) {
        await oldDb.close();
      }
    }

    this._cacheManager = await createCacheManager(this, this.options.cacheManager);

    this.setMaintainingMessage('init plugins');
    await this.pm.initPlugins();

    this.setMaintainingMessage('start load');
    this.setMaintainingMessage('emit beforeLoad');

    if (options?.hooks !== false) {
      await this.emitAsync('beforeLoad', this, options);
    }

    // Telemetry is initialized after beforeLoad hook
    // since some configuration may be registered in beforeLoad hook
    this.telemetry.init();
    if (this.options.telemetry?.enabled) {
      // Start collecting telemetry data if enabled
      this.telemetry.start();
    }

    await this.pm.load(options);

    if (options?.sync) {
      await this.db.sync();
    }

    this.setMaintainingMessage('emit afterLoad');
    if (options?.hooks !== false) {
      await this.emitAsync('afterLoad', this, options);
    }
    this._loaded = true;
  }

  async reload(options?: any) {
    this.log.debug(`start reload`, { method: 'reload' });

    this._loaded = false;

    await this.emitAsync('beforeReload', this, options);

    await this.load({
      ...options,
      reload: true,
    });

    this.log.debug('emit afterReload', { method: 'reload' });
    this.setMaintainingMessage('emit afterReload');
    await this.emitAsync('afterReload', this, options);
    this.log.debug(`finish reload`, { method: 'reload' });
  }

  /**
   * @deprecated
   */
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

  async runCommandThrowError(command: string, ...args: any[]) {
    return await this.runAsCLI([command, ...args], { from: 'user', throwError: true });
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

        if (actionCommand['_authenticate']) {
          await this.authenticate();
        }

        if (actionCommand['_preload']) {
          await this.load();
        }
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

  async loadMigrations(options) {
    const { directory, context, namespace } = options;
    const migrations = {
      beforeLoad: [],
      afterSync: [],
      afterLoad: [],
    };
    const extensions = ['js', 'ts'];
    const patten = `${directory}/*.{${extensions.join(',')}}`;
    const files = glob.sync(patten, {
      ignore: ['**/*.d.ts'],
    });
    const appVersion = await this.version.get();
    for (const file of files) {
      let filename = basename(file);
      filename = filename.substring(0, filename.lastIndexOf('.')) || filename;
      const Migration = await importModule(file);
      const m = new Migration({ app: this, db: this.db, ...context });
      if (!m.appVersion || semver.satisfies(appVersion, m.appVersion, { includePrerelease: true })) {
        m.name = `${filename}/${namespace}`;
        migrations[m.on || 'afterLoad'].push(m);
      }
    }
    return migrations;
  }

  async loadCoreMigrations() {
    const migrations = await this.loadMigrations({
      directory: resolve(__dirname, 'migrations'),
      namespace: '@nocobase/server',
    });
    return {
      beforeLoad: {
        up: async () => {
          this.log.debug('run core migrations(beforeLoad)');
          const migrator = this.db.createMigrator({ migrations: migrations.beforeLoad });
          await migrator.up();
        },
      },
      afterSync: {
        up: async () => {
          this.log.debug('run core migrations(afterSync)');
          const migrator = this.db.createMigrator({ migrations: migrations.afterSync });
          await migrator.up();
        },
      },
      afterLoad: {
        up: async () => {
          this.log.debug('run core migrations(afterLoad)');
          const migrator = this.db.createMigrator({ migrations: migrations.afterLoad });
          await migrator.up();
        },
      },
    };
  }

  async loadPluginCommands() {
    this.log.debug('load plugin commands');
    await this.pm.loadCommands();
  }

  async runAsCLI(argv = process.argv, options?: ParseOptions & { throwError?: boolean; reqId?: string }) {
    if (this.activatedCommand) {
      return;
    }
    if (options.reqId) {
      this.context.reqId = options.reqId;
      this._logger = this._logger.child({ reqId: this.context.reqId });
    }
    this._maintainingStatusBeforeCommand = this._maintainingCommandStatus;

    try {
      const commandName = options?.from === 'user' ? argv[0] : argv[2];
      if (!this.cli.hasCommand(commandName)) {
        await this.pm.loadCommands();
      }
      const command = await this.cli.parseAsync(argv, options);

      this.setMaintaining({
        status: 'command_end',
        command: this.activatedCommand,
      });

      return command;
    } catch (error) {
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

    this.log.info('restarting...');

    this._started = false;
    await this.emitAsync('beforeStop');
    await this.reload(options);
    await this.start(options);
    this.emit('__restarted', this, options);
  }

  async stop(options: any = {}) {
    const log =
      options.logging === false
        ? {
            debug() {},
            warn() {},
            info() {},
            error() {},
          }
        : this.log;
    log.debug('stop app...', { method: 'stop' });
    this.setMaintainingMessage('stopping app...');

    if (this.stopped) {
      log.warn(`app is stopped`, { method: 'stop' });
      return;
    }

    await this.emitAsync('beforeStop', this, options);

    try {
      // close database connection
      // silent if database already closed
      if (!this.db.closed()) {
        log.info(`close db`, { method: 'stop' });
        await this.db.close();
      }
    } catch (e) {
      log.error(e.message, { method: 'stop', err: e.stack });
    }

    if (this.cacheManager) {
      await this.cacheManager.close();
    }

    if (this.telemetry.started) {
      await this.telemetry.shutdown();
    }

    await this.emitAsync('afterStop', this, options);

    this.stopped = true;
    log.info(`app has stopped`, { method: 'stop' });
    this._started = false;
  }

  async destroy(options: any = {}) {
    this.log.debug('start destroy app', { method: 'destory' });
    this.setMaintainingMessage('destroying app...');
    await this.emitAsync('beforeDestroy', this, options);
    await this.stop(options);

    this.log.debug('emit afterDestroy', { method: 'destory' });
    await this.emitAsync('afterDestroy', this, options);

    this.log.debug('finish destroy app', { method: 'destory' });
  }

  async isInstalled() {
    return (
      (await this.db.collectionExistsInDb('applicationVersion')) || (await this.db.collectionExistsInDb('collections'))
    );
  }

  async install(options: InstallOptions = {}) {
    const reinstall = options.clean || options.force;
    if (reinstall) {
      await this.db.clean({ drop: true });
    }
    if (await this.isInstalled()) {
      this.log.warn('app is installed');
      return;
    }
    await this.reInit();
    await this.db.sync();
    await this.load({ hooks: false });

    this.log.debug('emit beforeInstall', { method: 'install' });
    this.setMaintainingMessage('call beforeInstall hook...');
    await this.emitAsync('beforeInstall', this, options);

    // await app.db.sync();
    await this.pm.install();
    await this.version.update();
    // this.setMaintainingMessage('installing app...');
    // this.log.debug('Database dialect: ' + this.db.sequelize.getDialect(), { method: 'install' });

    // if (options?.clean || options?.sync?.force) {
    //   this.log.debug('truncate database', { method: 'install' });
    //   await this.db.clean({ drop: true });
    //   this.log.debug('app reloading', { method: 'install' });
    //   await this.reload();
    // } else if (await this.isInstalled()) {
    //   this.log.warn('app is installed', { method: 'install' });
    //   return;
    // }

    // this.log.debug('start install plugins', { method: 'install' });
    // await this.pm.install(options);
    // this.log.debug('update version', { method: 'install' });
    // await this.version.update();

    this.log.debug('emit afterInstall', { method: 'install' });
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
    this.log.info('upgrading...');
    await this.reInit();
    const migrator1 = await this.loadCoreMigrations();
    await migrator1.beforeLoad.up();
    await this.db.sync();
    await migrator1.afterSync.up();
    await this.pm.initPresetPlugins();
    const migrator2 = await this.pm.loadPresetMigrations();
    await migrator2.beforeLoad.up();
    // load preset plugins
    await this.pm.load();
    await this.db.sync();
    await migrator2.afterSync.up();
    // upgrade preset plugins
    await this.pm.upgrade();
    await this.pm.initOtherPlugins();
    const migrator3 = await this.pm.loadOtherMigrations();
    await migrator3.beforeLoad.up();
    // load other plugins
    // TODO：改成约定式
    await this.load({ sync: true });
    // await this.db.sync();
    await migrator3.afterSync.up();
    // upgrade plugins
    await this.pm.upgrade();
    await migrator1.afterLoad.up();
    await migrator2.afterLoad.up();
    await migrator3.afterLoad.up();
    await this.pm.repository.updateVersions();
    await this.version.update();
    // await this.emitAsync('beforeUpgrade', this, options);
    // const force = false;
    // await measureExecutionTime(async () => {
    //   await this.db.migrator.up();
    // }, 'Migrator');
    // await measureExecutionTime(async () => {
    //   await this.db.sync({
    //     force,
    //     alter: {
    //       drop: force,
    //     },
    //   });
    // }, 'Sync');
    await this.emitAsync('afterUpgrade', this, options);
    await this.restart();
    // this.log.debug(chalk.green(`✨  NocoBase has been upgraded to v${this.getVersion()}`));
    // if (this._started) {
    //   await measureExecutionTime(async () => {
    //     await this.restart();
    //   }, 'Restart');
    // }
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

  createLogger(options: LoggerOptions) {
    const { dirname } = options;
    return createLogger({
      ...options,
      dirname: getLoggerFilePath(this.name || 'main', dirname || ''),
    });
  }

  protected init() {
    const options = this.options;

    this._logger = createSystemLogger({
      dirname: getLoggerFilePath(this.name),
      filename: 'system',
      seperateError: true,
      ...(options.logger?.system || {}),
    }).child({
      reqId: this.context.reqId,
      app: this.name,
      module: 'application',
    });

    this.reInitEvents();

    this.middleware = new Toposort<any>();
    this.plugins = new Map<string, Plugin>();

    if (this.db) {
      this.db.removeAllListeners();
    }

    this.createMainDataSource(options);

    this._cronJobManager = new CronJobManager(this);

    this._cli = this.createCli();
    this._i18n = createI18n(options);
    this.context.db = this.db;

    this.context.resourcer = this.resourcer;
    this.context.cacheManager = this._cacheManager;
    this.context.cache = this._cache;

    const plugins = this._pm ? this._pm.options.plugins : options.plugins;

    this._pm = new PluginManager({
      app: this,
      plugins: plugins || [],
    });

    this._telemetry = new Telemetry({
      serviceName: `nocobase-${this.name}`,
      version: this.getVersion(),
      ...options.telemetry,
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

    this._dataSourceManager.use(this._authManager.middleware(), { tag: 'auth' });
    this.resourcer.use(this._authManager.middleware(), { tag: 'auth' });

    if (this.options.acl !== false) {
      this.resourcer.use(this.acl.middleware(), { tag: 'acl', after: ['auth'] });
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

  protected createMainDataSource(options: ApplicationOptions) {
    const mainDataSourceInstance = new MainDataSource({
      name: 'main',
      database: this.createDatabase(options),
      acl: createACL(),
      resourceManager: createResourcer(options),
    });

    this._dataSourceManager = new DataSourceManager();

    this.dataSourceManager.dataSources.set('main', mainDataSourceInstance);
  }

  protected createDatabase(options: ApplicationOptions) {
    const sqlLogger = this.createLogger({
      filename: 'sql',
      level: 'debug',
    });
    const logging = (msg: any) => {
      if (typeof msg === 'string') {
        msg = msg.replace(/[\r\n]/gm, '').replace(/\s+/g, ' ');
      }
      if (msg.includes('INSERT INTO')) {
        msg = msg.substring(0, 2000) + '...';
      }
      sqlLogger.debug({ message: msg, app: this.name, reqId: this.context.reqId });
    };
    const dbOptions = options.database instanceof Database ? options.database.options : options.database;
    const db = new Database({
      ...dbOptions,
      logging: dbOptions.logging ? logging : false,
      migrator: {
        context: { app: this },
      },
      logger: this._logger.child({ module: 'database' }),
    });
    return db;
  }
}

applyMixins(Application, [AsyncEmitter]);

export default Application;

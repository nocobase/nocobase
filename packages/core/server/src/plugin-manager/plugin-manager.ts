import { CleanOptions, Collection, SyncOptions } from '@nocobase/database';
import fs from 'fs';
import net from 'net';
import path from 'path';
import xpipe from 'xpipe';
import Application from '../application';
import { Plugin } from '../plugin';
import collectionOptions from './options/collection';
import resourceOptions from './options/resource';
import { PluginManagerRepository } from './plugin-manager-repository';
import { pluginStatic } from './pluginStatic';
import { PluginData } from './types';
import {
  addOrUpdatePluginByNpm,
  addOrUpdatePluginByZip,
  checkPluginPackage,
  getClientStaticUrl,
  getExtraPluginInfo,
  getLocalPluginDir,
  getLocalPluginPackagesPathArr,
  getNewVersion,
  getPackageJsonByLocalPath,
  linkLocalPackageToNodeModules,
  removePluginPackage,
} from './utils';

export interface PluginManagerOptions {
  app: Application;
  plugins?: (typeof Plugin | [typeof Plugin, any])[];
}

export interface InstallOptions {
  cliArgs?: any[];
  clean?: CleanOptions | boolean;
  sync?: SyncOptions;
}

export class PluginManager {
  options: PluginManagerOptions;
  app: Application;
  pmSock: string;
  server: net.Server;
  collection: Collection;
  hasInit = false;
  initStaticPluginsPromise: Promise<void>;
  initDatabasePluginsPromise: Promise<void>;
  repository: PluginManagerRepository;
  plugins = new Map<string | typeof Plugin, Plugin>();

  constructor(options: PluginManagerOptions) {
    this.options = options;
    this.app = options.app;
    this.app.db.registerRepositories({
      PluginManagerRepository,
    });

    this.initCommandCliSocket();
    this.collection = this.app.db.collection(collectionOptions);
    this.repository = this.collection.repository as PluginManagerRepository;
    this.repository.setPluginManager(this);
    this.app.resourcer.define(resourceOptions);
    this.app.acl.registerSnippet({
      name: 'pm',
      actions: ['pm:*'],
    });
    this.app.acl.allow('pm', 'clientPlugins');

    // plugin static files
    this.app.use(pluginStatic);

    this.initStaticPluginsPromise = this.initStaticPlugins(options.plugins);

    this.app.on('beforeInstall', async (app, options) => {
      await this.collection.sync();
    });
    this.app.on('beforeUpgrade', async (app, options) => {
      await this.collection.sync();
    });

    this.app.on('beforeLoad', async (app, options) => {
      const exists = await this.app.db.collectionExistsInDb('applicationPlugins');
      if (!exists) {
        this.app.log.warn(`applicationPlugins collection not exists in ${this.app.name}`);
        return;
      }

      // init static plugins
      await this.initStaticPluginsPromise;

      // init database plugins
      this.initDatabasePluginsPromise = this.initDatabasePlugins();
      await this.initDatabasePluginsPromise;
    });

    this.app.on('beforeUpgrade', async () => {
      await this.collection.sync();
    });
  }

  async waitPluginsInit() {
    if (this.hasInit) return;
    await Promise.all([this.initStaticPluginsPromise, this.initDatabasePluginsPromise]);
    this.hasInit = true;
  }

  initCommandCliSocket() {
    const f = path.resolve(process.cwd(), 'storage', 'pm.sock');
    this.pmSock = xpipe.eq(this.app.options.pmSock || f);
    this.app.db.registerRepositories({
      PluginManagerRepository,
    });
  }

  async initStaticPlugins(plugins: PluginManagerOptions['plugins'] = []) {
    const pluginsWithOptions: [typeof Plugin, any][] = plugins.map((item) => (Array.isArray(item) ? item : [item, {}]));

    for await (const [PluginClass, options] of pluginsWithOptions) {
      console.log(`static plugin [${PluginClass.name}]: init`);
      const pluginInstance = this.setPluginInstance(PluginClass, options);

      console.log(`database plugin [${PluginClass.name}]: afterAdd`);
      await this.app.emitAsync('beforeAddPlugin', pluginInstance, options);
      await pluginInstance.afterAdd();
      await this.app.emitAsync('beforeAddPlugin', pluginInstance, options);
    }
  }

  async initDatabasePlugins() {
    const pluginList: PluginData[] = await this.repository.list();

    for await (const pluginData of pluginList) {
      await checkPluginPackage(pluginData);
      console.log(`database plugin [${pluginData.name}]: init`);
      const pluginInstance = await this.setDatabasePlugin(pluginData);

      console.log(`database plugin [${pluginData.name}]: afterAdd`);
      await this.app.emitAsync('beforeAddPlugin', pluginInstance, pluginData);
      await pluginInstance.afterAdd();
      await this.app.emitAsync('beforeAddPlugin', pluginInstance, pluginData);
    }
  }

  /**
   * get plugins static files
   *
   * @example
   * getClientPlugins() =>
   *  {
   *    '@nocobase/acl': '/api/@nocobase/acl/index.js',
   *    'foo': '/api/foo/index.js'
   *  }
   */
  async getClientPlugins(): Promise<Record<string, string>> {
    const pluginList: PluginData[] = await this.repository.list({ enabled: true, installed: true });
    return pluginList.reduce<Record<string, string>>((memo, item) => {
      const { name, clientUrl } = item;
      memo[name] = clientUrl;
      return memo;
    }, {});
  }

  async list() {
    const pluginData: PluginData[] = await this.repository.list();

    return Promise.all(
      pluginData.map(async (item) => {
        const extraInfo = await getExtraPluginInfo(item);
        return {
          ...item,
          ...extraInfo,
        };
      }),
    );
  }

  async setDatabasePlugin(pluginData: PluginData) {
    const shouldRequireSource = pluginData.type === 'local' && process.env.NODE_ENV === 'development';
    const PluginClass = require(shouldRequireSource ? `${pluginData.name}/src/server` : pluginData.name);
    const pluginInstance = this.setPluginInstance(PluginClass, pluginData);
    return pluginInstance;
  }

  setPluginInstance(
    PluginClass: typeof Plugin & { default?: typeof Plugin },
    options: Pick<PluginData, 'name' | 'builtIn' | 'enabled' | 'installed'>,
  ) {
    const { name, enabled, builtIn, installed } = options;

    const PluginCls: typeof Plugin = PluginClass.default || PluginClass;

    if (!(typeof PluginCls === 'function' && PluginCls.prototype instanceof Plugin)) {
      throw new Error(`plugin [${name || PluginCls?.name}] must export a class`);
    }

    // 2. new plugin instance
    const instance: Plugin = new PluginCls(this.app, {
      name,
      enabled,
      builtIn,
      installed,
    });

    // 3. add instance to plugins
    this.plugins.set(name || PluginCls, instance);

    return instance;
  }

  async addByNpm(data: Pick<PluginData, 'name' | 'builtIn' | 'registry' | 'isOfficial'>) {
    const { name, registry, builtIn, isOfficial } = data;

    if (this.plugins.has(name)) {
      throw new Error(`plugin name [${name}] already exists`);
    }
    console.log(`plugin [${name}]: add`);

    // 1. emit event: beforeAddPlugin
    await this.app.emitAsync('beforeAddPlugin', name, data);

    // 2. download and unzip plugin
    const { version } = await addOrUpdatePluginByNpm({ name, registry });

    // 3. update database
    const res = await this.repository.create({
      values: {
        name,
        registry,
        zipUrl: undefined,
        clientUrl: getClientStaticUrl(name),
        version,
        preVersion: version,
        enabled: false,
        isOfficial,
        type: 'npm',
        installed: false,
        builtIn,
        options: {},
      },
    });

    // 4.init plugin
    const pluginInstance = await this.setDatabasePlugin({ ...data });

    // 5. run lifecycle: `afterAdd` & emit event: `afterAddPlugin`
    await pluginInstance.afterAdd();
    await this.app.emitAsync('afterAddPlugin', pluginInstance, { ...data, version });

    return res;
  }

  async addByUpload(data: PluginData = {}) {
    // download and unzip plugin
    const { packageDir } = await addOrUpdatePluginByZip({ zipUrl: data.zipUrl });

    return this.addLocalPath(packageDir, { ...data, type: 'upload' });
  }

  async addLocalPath(localPath: string, data: PluginData = {}) {
    const { zipUrl, builtIn = false, isOfficial = false, type, enabled } = data;
    const { name, version } = getPackageJsonByLocalPath(localPath);
    if (this.plugins.has(name)) {
      throw new Error(`plugin [${name}] already exists`);
    }
    console.log(`plugin [${name}]: add`);

    // 1. run `beforeAddPlugin` hook
    await this.app.emitAsync('beforeAddPlugin', name, data);

    // 2. set plugin instance
    const instance = await this.setDatabasePlugin({ ...data, name, version });

    // 3. add plugin to database
    const res = await this.repository.create({
      values: {
        name,
        zipUrl,
        builtIn,
        type,
        isOfficial,
        clientUrl: getClientStaticUrl(name),
        version,
        preVersion: version,
        registry: undefined,
        enabled: false,
        installed: false,
        options: {},
      },
    });

    // 4. run lifecycle: `afterAdd`
    await instance.afterAdd();

    // 5. emit event: afterAddPlugin
    await this.app.emitAsync('afterAddPlugin', instance, { ...data, name });

    if (enabled) {
      await this.enable(name);
    }

    return res;
  }

  async addLocalPackage(packageDirBasename: string, data: PluginData = {}) {
    const localPackage = getLocalPluginDir(packageDirBasename);

    await linkLocalPackageToNodeModules(localPackage);

    return this.addLocalPath(localPackage, { ...data, zipUrl: packageDirBasename, type: 'local' });
  }

  get add() {
    return this.addLocalPackage;
  }

  async enable(name: string) {
    console.log(`plugin [${name}]: enable`);
    const pluginInstance = this.getPluginInstance(name);
    const pluginData = await this.getPluginData(name);

    // 1. check required plugins
    const requiredPlugins = pluginInstance.requiredPlugins();
    for (const requiredPluginName of requiredPlugins) {
      const requiredPlugin = this.plugins.get(requiredPluginName);
      if (!requiredPlugin.enabled) {
        throw new Error(`${name} plugin need ${requiredPluginName} plugin enabled`);
      }
    }

    // 1. emit event: `beforeEnablePlugin` & run lifecycle: `beforeEnable`
    await this.app.emitAsync('beforeEnablePlugin', pluginInstance, pluginData);
    await pluginInstance.beforeEnable();

    // 2. update database
    await this.repository.update({
      filter: {
        name,
      },
      values: {
        enabled: true,
      },
    });

    // 3. run app: `reload`
    await this.app.reload({ reload: true });

    // 4. sync database
    await this.app.db.sync();

    // 5. install plugin
    if (!pluginInstance.installed) {
      await this.install(pluginInstance);
    }

    // 6. run database migration
    if (pluginData.preVersion !== pluginData.version) {
      await this.app.db.migrator.up();
    }

    // 7.run lifecycle: `afterEnable` & emit event: `afterEnablePlugin`
    await pluginInstance.afterEnable();
    await this.app.emitAsync('afterEnablePlugin', pluginInstance, { ...pluginData, enabled: true });
  }

  async upgradeByNpm(name: string) {
    const pluginData = await this.getPluginData(name);
    const pluginInstance = this.getPluginInstance(name);

    // 1. check has new version
    const latestVersion = await getNewVersion(pluginData);
    if (!latestVersion) return;

    // 2. emit event: `beforeEnablePlugin` & run lifecycle: `beforeEnable`
    await this.app.emitAsync('beforeUpgradePlugin', pluginInstance, pluginData);
    await pluginInstance.beforeUpgrade();

    // 3. download and unzip package
    await addOrUpdatePluginByNpm({ name, registry: pluginData.registry, version: latestVersion }, true);

    // 4. common upgrade
    return this.commonUpgrade(name, latestVersion, pluginData.version);
  }

  async upgradeByZip(name: string, zipUrl: string) {
    const pluginData = await this.getPluginData(name);
    const pluginInstance = this.getPluginInstance(name);

    // 1. emit event: `beforeEnablePlugin` & run lifecycle: `beforeEnable`
    await this.app.emitAsync('beforeUpgradePlugin', pluginInstance, pluginData);
    await pluginInstance.beforeUpgrade();

    // 2. download and unzip package
    const { version } = await addOrUpdatePluginByZip({ name, zipUrl });

    // 3. common upgrade
    return this.commonUpgrade(name, version, pluginData.version);
  }

  async commonUpgrade(name: string, newVersion: string, oldVersion: string) {
    // 1. update database
    await this.repository.update({
      filter: { name },
      values: {
        version: newVersion,
        preVersion: oldVersion,
      },
    });

    const pluginData = await this.getPluginData(name);
    const newPluginData = { ...pluginData, version: newVersion, preVersion: oldVersion };

    // 2. update instance
    const pluginInstance = await this.setDatabasePlugin(newPluginData);

    // 3. run database migration
    if (pluginData.enabled) {
      await this.app.reload({});
      await this.app.db.sync();
      await this.app.db.migrator.up();
    }

    // 4.run lifecycle: `afterEnable` & emit event: `afterEnablePlugin`
    await pluginInstance.afterEnable();
    await this.app.emitAsync('afterEnablePlugin', pluginInstance, newPluginData);
  }

  async disable(name: string) {
    const pluginInstance = this.getPluginInstance(name);

    if (pluginInstance.builtIn) {
      throw new Error(`${name} plugin is builtIn, can not disable`);
    }

    if (!pluginInstance.enabled) {
      return;
    }

    const pluginData = await this.getPluginData(name);

    // 1. emit event: `beforeDisablePlugin` & run lifecycle: `beforeDisable`
    await this.app.emitAsync('beforeDisablePlugin', pluginInstance, pluginData);
    await pluginInstance.beforeDisable();

    // 2. update database
    await this.repository.update({
      filter: {
        name,
      },
      values: {
        enabled: false,
      },
    });

    // 3. run app action: `reload`
    await this.app.reload({});

    // 5. run lifecycle: `afterEnable` & emit event: `afterDisablePlugin`
    await pluginInstance.afterEnable();
    await this.app.emitAsync('afterDisablePlugin', pluginInstance, { ...pluginData, enabled: true });
  }

  async remove(name: string) {
    const pluginInstance = this.getPluginInstance(name);

    if (pluginInstance.builtIn) {
      throw new Error(`${name} plugin is builtIn, can not remove`);
    }

    const pluginData = await this.getPluginData(name);

    // 1. emit event: `beforeRemovePlugin` & run lifecycle: `beforeRemove`
    await this.app.emitAsync('beforeRemovePlugin', pluginInstance, pluginData);
    await pluginInstance.beforeRemove();

    // 2. remove plugin from database
    await this.repository.destroy({
      filter: {
        name,
      },
    });

    // 3. remove instance
    this.plugins.delete(name);

    // 4. remove plugin package
    await removePluginPackage(name);

    // 5. reload app
    await this.app.reload({});

    // 6. run lifecycle: `afterRemove` && emit event: `afterRemovePlugin`
    await pluginInstance.afterRemove();
    await this.app.emitAsync('afterRemovePlugin', pluginInstance, pluginData);
  }

  async doAllPluginsLifecycle(lifecycle: string, options?: any) {
    for await (const pluginInstance of this.plugins.values()) {
      if (pluginInstance.enabled) {
        console.log(`plugin [${pluginInstance.name}]: ${lifecycle}`);
        await pluginInstance[lifecycle](options);
        if (lifecycle === 'install') {
          await this.app.db.sync();
        }
      }
    }
  }

  async load(pluginInstance: Plugin, options: any = {}) {
    if (!pluginInstance.enabled) return;

    await this.app.emitAsync('beforeLoadPlugin', pluginInstance, options);
    await pluginInstance.load();
    await this.app.db.sync();
    await this.app.emitAsync('afterLoadPlugin', pluginInstance, options);
  }

  async getPluginData(name: string) {
    const pluginData: PluginData = await this.repository.findOne({
      filter: { name },
    });

    if (!pluginData) {
      throw new Error(`plugin [${name}] not exists`);
    }

    return pluginData;
  }

  getPluginInstance(name: string) {
    const pluginInstance: Plugin = this.plugins.get(name);
    if (!pluginInstance) {
      throw new Error(`${name} plugin does not exist`);
    }

    return pluginInstance;
  }

  clone() {
    const pm = new PluginManager({
      app: this.app,
      plugins: this.options.plugins,
    });
    return pm;
  }

  async install(pluginInstance: Plugin, options: InstallOptions = {}) {
    if (!pluginInstance.enabled && pluginInstance.installed) return;
    await this.app.emitAsync('beforeInstallPlugin', pluginInstance, options);
    await pluginInstance.install(options);

    // update database
    await this.repository.update({
      filter: {
        name: pluginInstance.name,
      },
      values: {
        installed: true,
      },
    });

    await this.app.emitAsync('afterInstallPlugin', pluginInstance, options);
  }

  // by cli: `yarn nocobase pm create xxx`
  async createByCli(name: string) {
    console.log(`creating ${name} plugin...`);
    const { run } = require('@nocobase/cli/src/util');
    const { PluginGenerator } = require('@nocobase/cli/src/plugin-generator');
    const generator = new PluginGenerator({
      cwd: getLocalPluginPackagesPathArr()[0],
      args: {},
      context: {
        name,
      },
    });
    await generator.run();
    await run('yarn', ['install']);
  }

  // by cli: `yarn nocobase pm add xxx`
  async addByCli(name: string) {
    console.log(`adding ${name} plugin...`);
    return this.addLocalPath(name);
  }

  // by cli: `yarn nocobase pm remove xxx`
  get removeByCli() {
    return this.remove;
  }

  // by cli: `yarn nocobase pm enable xxx`
  get enableByCli() {
    return this.enable;
  }

  // by cli: `yarn nocobase pm disable xxx`
  get disableByCli() {
    return this.disable;
  }

  async doCliCommand(method: string, name: string | string[]) {
    const pluginNames = Array.isArray(name) ? name : [name];
    for await (const name of pluginNames) {
      await this[`${method}ByCli`](name);
    }
  }

  // for cli: `yarn nocobase pm create/add/enable/disable/remove xxx`
  async clientWrite(data: { method: string; plugins: string | string[] }) {
    const { method, plugins } = data;
    if (method === 'create') {
      try {
        console.log(method, plugins);
        await this.doCliCommand(method, plugins);
      } catch (error) {
        console.error(error.message);
      }
      return;
    }
    const client = new net.Socket();
    client.connect(this.pmSock, () => {
      client.write(JSON.stringify(data));
      client.end();
    });
    client.on('error', async () => {
      try {
        console.log(method, plugins);
        await this.doCliCommand(method, plugins);
      } catch (error) {
        console.error(error.message);
      }
    });
  }

  async listen(): Promise<net.Server> {
    this.server = net.createServer((socket) => {
      socket.on('data', async (data) => {
        const { method, plugins } = JSON.parse(data.toString());
        try {
          console.log(method, plugins);
          await this.doCliCommand(method, plugins);
        } catch (error) {
          console.error(error.message);
        }
      });
      socket.pipe(socket);
    });

    if (fs.existsSync(this.pmSock)) {
      await fs.promises.unlink(this.pmSock);
    }
    return new Promise((resolve) => {
      this.server.listen(this.pmSock, () => {
        resolve(this.server);
      });
    });
  }
}

export default PluginManager;

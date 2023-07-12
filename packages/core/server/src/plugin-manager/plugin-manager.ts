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

    // init static plugins
    this.initStaticPlugins(options.plugins);

    this.app.on('beforeLoad', async (app, options) => {
      if (options?.method && ['install', 'upgrade'].includes(options.method)) {
        await this.collection.sync();
      }

      const exists = await this.app.db.collectionExistsInDb('applicationPlugins');

      if (!exists) {
        this.app.log.warn(`applicationPlugins collection not exists in ${this.app.name}`);
        return;
      }

      if (options?.method !== 'install' || options.reload) {
        // await all database plugins init
        this.initDatabasePluginsPromise = this.initDatabasePlugins().then(async () => {
          // run all plugins' beforeLoad
          for await (const plugin of this.plugins.values()) {
            if (plugin.enabled) {
              await plugin.beforeLoad();
            }
          }
        });
        await this.initDatabasePluginsPromise;
      }
    });

    this.app.on('beforeUpgrade', async () => {
      await this.collection.sync();
    });
  }

  initCommandCliSocket() {
    const f = path.resolve(process.cwd(), 'storage', 'pm.sock');
    this.pmSock = xpipe.eq(this.app.options.pmSock || f);
    this.app.db.registerRepositories({
      PluginManagerRepository,
    });
  }

  async initStaticPlugins(plugins: PluginManagerOptions['plugins'] = []) {
    for await (const plugin of plugins) {
      let instance: Plugin;

      // 1. get plugin instance
      if (Array.isArray(plugin)) {
        const [PluginClass, options] = plugin;
        instance = this.setPluginInstance(PluginClass, { ...options, enabled: true });
      } else {
        instance = this.setPluginInstance(plugin, { enabled: true });
      }
    }
  }

  async initDatabasePlugins() {
    const pluginList: PluginData[] = await this.repository.list();

    // TODO: 并发执行还是循序执行，现在的做法是顺序一个一个执行？
    for await (const pluginData of pluginList) {
      await checkPluginPackage(pluginData);
      this.setDatabasePlugin(pluginData);
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
    // await all plugins init
    await this.initDatabasePluginsPromise;

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
    options: Pick<PluginData, 'name' | 'builtIn' | 'enabled'>,
  ) {
    const { name, enabled, builtIn } = options;

    const PluginCls: typeof Plugin = PluginClass.default || PluginClass;

    if (!(typeof PluginCls === 'function' && PluginCls.prototype instanceof Plugin)) {
      throw new Error(`plugin [${name || PluginCls?.name}] must export a class`);
    }

    // 2. new plugin instance
    const instance: Plugin = new PluginCls(this.app, {
      name,
      enabled,
      builtIn,
    });

    // 3. add instance to plugins
    this.plugins.set(name || PluginCls, instance);

    return instance;
  }

  async addByNpm(data: Pick<PluginData, 'name' | 'builtIn' | 'registry' | 'isOfficial'>) {
    // 1. add plugin to database
    const { name, registry, builtIn, isOfficial } = data;

    if (this.plugins.has(name)) {
      throw new Error(`plugin name [${name}] already exists`);
    }

    const res = await this.repository.create({
      values: {
        name,
        registry,
        zipUrl: undefined,
        clientUrl: undefined,
        version: undefined,
        enabled: false,
        isOfficial,
        type: 'npm',
        installed: false,
        builtIn,
        options: {},
      },
    });

    // 2. download and unzip plugin
    const { version } = await addOrUpdatePluginByNpm({ name, registry });

    // 3. update database
    await this.repository.update({
      filter: { name },
      values: {
        version,
        clientUrl: getClientStaticUrl(name),
        installed: true,
      },
    });

    // 4.init plugin
    await this.setDatabasePlugin(data);

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

    // 1. set plugin instance
    const instance = await this.setDatabasePlugin({ ...data, name });

    if (enabled) {
      // 2. run `load` hook
      await instance.beforeLoad();

      // 3. run `load` hook
      await this.load(instance);

      // 4. run `install` hook
      await this.install(instance);

      // 5. run `afterEnable` hook
      await instance.afterEnable();
    }

    // 5. add plugin to database
    const res = await this.repository.create({
      values: {
        name,
        zipUrl,
        builtIn,
        type,
        isOfficial,
        clientUrl: getClientStaticUrl(name),
        version,
        registry: undefined,
        enabled,
        installed: true,
        options: {},
      },
    });

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

  async upgradeByNpm(name: string) {
    const pluginData = await this.getPluginData(name);

    // 1. download and unzip package
    const latestVersion = await getNewVersion(pluginData);
    if (latestVersion) {
      await addOrUpdatePluginByNpm({ name, registry: pluginData.registry, version: latestVersion });
    }

    // 2. update database
    await this.repository.update({
      filter: { name },
      values: {
        version: latestVersion,
      },
    });

    // 3. run plugin
    const instance = await this.setDatabasePlugin(pluginData);

    // TODO: 升级后应该执行哪些 hooks？
    // 这里只执行了 `load`
    if (pluginData.enabled) {
      await this.load(instance);
    }
  }

  async upgradeByZip(name: string, zipUrl: string) {
    // 1. download and unzip package
    const { version } = await addOrUpdatePluginByZip({ name, zipUrl });

    // 2. update database
    const pluginData = await this.repository.update({
      filter: { name },
      values: {
        version,
      },
    });

    // 3. run plugin
    const instance = await this.setDatabasePlugin(pluginData);

    // TODO: 升级后应该执行哪些 hooks？
    // 这里只执行了 `load`
    if (pluginData.enabled) {
      await this.load(instance);
    }
  }

  async enable(name: string) {
    const pluginInstance = this.getPluginInstance(name);

    // 1. check required plugins
    const requiredPlugins = pluginInstance.requiredPlugins();
    for (const requiredPluginName of requiredPlugins) {
      const requiredPlugin = this.plugins.get(requiredPluginName);
      if (!requiredPlugin.enabled) {
        throw new Error(`${name} plugin need ${requiredPluginName} plugin enabled`);
      }
    }

    // 2. update database
    await this.repository.update({
      filter: {
        name,
      },
      values: {
        enabled: true,
      },
    });

    // 3. load plugin
    await this.load(pluginInstance);

    // 4. run `install` hook
    await this.install(pluginInstance);

    // 6. run `afterEnable` hook
    await pluginInstance.afterEnable();

    // 6. emit app hook
    await this.app.emitAsync('afterEnablePlugin', name);
  }

  async disable(name: string) {
    const pluginInstance = this.getPluginInstance(name);

    if (pluginInstance.builtIn) {
      throw new Error(`${name} plugin is builtIn, can not disable`);
    }

    // 1. update database
    await this.repository.update({
      filter: {
        name,
        builtIn: false,
      },
      values: {
        enabled: false,
      },
    });

    // 2. run `afterDisable` hook
    await pluginInstance.afterDisable();

    // 3. emit app hook
    await this.app.emitAsync('afterDisablePlugin', name);
  }

  async remove(name: string) {
    const pluginInstance = this.getPluginInstance(name);

    if (pluginInstance.builtIn) {
      throw new Error(`${name} plugin is builtIn, can not remove`);
    }

    // 1. run `remove` hook
    await pluginInstance.remove();

    // 2. remove plugin from database
    await this.repository.destroy({
      filter: {
        name,
        builtIn: false,
      },
    });

    // 3. remove instance
    this.plugins.delete(name);

    // 4. remove plugin package
    await removePluginPackage(name);
  }

  async loadAll(options: any) {
    for await (const [name, pluginInstance] of this.plugins.entries()) {
      await this.load(pluginInstance, options);
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

  async install(pluginInstance: Plugin, options: any = {}) {
    if (!pluginInstance.enabled) return;
    await this.app.emitAsync('beforeInstallPlugin', pluginInstance, options);
    await pluginInstance.install({});
    await this.app.emitAsync('afterInstallPlugin', pluginInstance, options);
  }

  async installAll(options: InstallOptions = {}) {
    // for (const [name, plugin] of this.plugins) {
    // await this.install(plugin, options);
    // }
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

  doCliCommand(method: string, name: string | string[]) {
    const pluginNames = Array.isArray(name) ? name : [name];
    return Promise.all(pluginNames.map((name) => this[`${method}ByCli`](name)));
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

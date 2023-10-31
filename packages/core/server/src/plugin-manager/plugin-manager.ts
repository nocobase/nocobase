import { CleanOptions, Collection, SyncOptions } from '@nocobase/database';
import { isURL } from '@nocobase/utils';
import { fsExists } from '@nocobase/utils/plugin-symlink';
import execa from 'execa';
import _ from 'lodash';
import net from 'net';
import { resolve, sep } from 'path';
import Application from '../application';
import { createAppProxy, tsxRerunning } from '../helper';
import { Plugin } from '../plugin';
import { uploadMiddleware } from './middleware';
import collectionOptions from './options/collection';
import resourceOptions from './options/resource';
import { PluginManagerRepository } from './plugin-manager-repository';
import { PluginData } from './types';
import {
  copyTempPackageToStorageAndLinkToNodeModules,
  downloadAndUnzipToTempDir,
  getNpmInfo,
  getPluginInfoByNpm,
  removeTmpDir,
  requireModule,
  requireNoCache,
  updatePluginByCompressedFileUrl,
} from './utils';

export interface PluginManagerOptions {
  app: Application;
  plugins?: any[];
}

export interface InstallOptions {
  cliArgs?: any[];
  clean?: CleanOptions | boolean;
  sync?: SyncOptions;
}

export class AddPresetError extends Error {}

export class PluginManager {
  app: Application;
  collection: Collection;
  _repository: PluginManagerRepository;
  pluginInstances = new Map<typeof Plugin, Plugin>();
  pluginAliases = new Map<string, Plugin>();
  server: net.Server;

  constructor(public options: PluginManagerOptions) {
    this.app = options.app;
    this.app.db.registerRepositories({
      PluginManagerRepository,
    });

    this.collection = this.app.db.collection(collectionOptions);

    this._repository = this.collection.repository as PluginManagerRepository;
    this._repository.setPluginManager(this);
    this.app.resourcer.define(resourceOptions);
    this.app.acl.allow('pm', 'listEnabled', 'public');
    this.app.acl.registerSnippet({
      name: 'pm',
      actions: ['pm:*'],
    });
    this.app.db.addMigrations({
      namespace: 'core/pm',
      directory: resolve(__dirname, '../migrations'),
    });
    this.app.resourcer.use(uploadMiddleware);
  }

  get repository() {
    return this.app.db.getRepository('applicationPlugins') as PluginManagerRepository;
  }

  static getPackageJson(packageName: string) {
    return requireNoCache(`${packageName}/package.json`);
  }

  static getPackageName(name: string) {
    const prefixes = this.getPluginPkgPrefix();
    for (const prefix of prefixes) {
      try {
        require.resolve(`${prefix}${name}`);
        return `${prefix}${name}`;
      } catch (error) {
        continue;
      }
    }
    throw new Error(`${name} plugin does not exist`);
  }

  static getPluginPkgPrefix() {
    return (process.env.PLUGIN_PACKAGE_PREFIX || '@nocobase/plugin-,@nocobase/preset-,@nocobase/plugin-pro-').split(
      ',',
    );
  }

  static async findPackage(name: string) {
    try {
      const packageName = this.getPackageName(name);
      return packageName;
    } catch (error) {
      console.log(`\`${name}\` plugin not found locally`);
      const prefixes = this.getPluginPkgPrefix();
      for (const prefix of prefixes) {
        try {
          const packageName = `${prefix}${name}`;
          console.log(`Try to find ${packageName}`);
          await execa('npm', ['v', packageName, 'versions']);
          console.log(`${packageName} downloading`);
          await execa('yarn', ['add', packageName, '-W']);
          console.log(`${packageName} downloaded`);
          return packageName;
        } catch (error) {
          continue;
        }
      }
    }
    throw new Error(`No available packages found, ${name} plugin does not exist`);
  }

  static clearCache(packageName: string) {
    const packageNamePath = packageName.replace('/', sep);
    Object.keys(require.cache).forEach((key) => {
      if (key.includes(packageNamePath)) {
        delete require.cache[key];
      }
    });
  }

  static resolvePlugin(pluginName: string | typeof Plugin, isUpgrade = false, isPkg = false) {
    if (typeof pluginName === 'string') {
      const packageName = isPkg ? pluginName : this.getPackageName(pluginName);
      this.clearCache(packageName);
      return requireModule(packageName);
    } else {
      return pluginName;
    }
  }

  addPreset(plugin: string | typeof Plugin, options: any = {}) {
    if (this.app.loaded) {
      throw new AddPresetError('must be added before executing app.load()');
    }
    if (!this.options.plugins) {
      this.options.plugins = [];
    }
    this.options.plugins.push([plugin, options]);
  }

  getPlugins() {
    return this.app.pm.pluginInstances;
  }

  getAliases() {
    return this.app.pm.pluginAliases.keys();
  }

  get(name: string | typeof Plugin) {
    if (typeof name === 'string') {
      return this.app.pm.pluginAliases.get(name);
    }
    return this.app.pm.pluginInstances.get(name);
  }

  has(name: string | typeof Plugin) {
    if (typeof name === 'string') {
      return this.app.pm.pluginAliases.has(name);
    }
    return this.app.pm.pluginInstances.has(name);
  }

  del(name: string | typeof Plugin) {
    const instance = this.get(name);
    if (instance) {
      this.app.pm.pluginAliases.delete(instance.name);
      this.app.pm.pluginInstances.delete(instance.constructor as typeof Plugin);
    }
  }

  async create(pluginName: string) {
    console.log('creating...');
    const createPlugin = async (name) => {
      const { PluginGenerator } = require('@nocobase/cli/src/plugin-generator');
      const generator = new PluginGenerator({
        cwd: resolve(process.cwd(), name),
        args: {},
        context: {
          name,
        },
      });
      await generator.run();
    };
    await createPlugin(pluginName);
    await this.repository.create({
      values: {
        name: pluginName,
        packageName: pluginName,
        version: '0.1.0',
      },
    });
    await tsxRerunning();
    // await createDevPluginSymLink(pluginName);
    // await this.add(pluginName, { packageName: pluginName }, true);
  }

  async add(plugin?: any, options: any = {}, insert = false, isUpgrade = false) {
    if (!isUpgrade && this.has(plugin)) {
      const name = typeof plugin === 'string' ? plugin : plugin.name;
      this.app.log.warn(`plugin [${name}] added`);
      return;
    }
    if (!options.name && typeof plugin === 'string') {
      options.name = plugin;
    }
    try {
      if (typeof plugin === 'string' && options.name && !options.packageName) {
        const packageName = PluginManager.getPackageName(options.name);
        options['packageName'] = packageName;
      }
      if (options.packageName) {
        const packageJson = PluginManager.getPackageJson(options.packageName);
        options['packageJson'] = packageJson;
        options['version'] = packageJson.version;
      }
    } catch (error) {
      console.error(error);
      // empty
    }
    this.app.log.debug(`adding plugin...`, options.name, { function: 'add', submodule: 'plugin-manager' });
    let P: any;
    try {
      P = PluginManager.resolvePlugin(options.packageName || plugin, isUpgrade, !!options.packageName);
    } catch (error) {
      this.app.log.warn('plugin not found', error);
      return;
    }
    const instance: Plugin = new P(createAppProxy(this.app), options);
    this.pluginInstances.set(P, instance);
    if (options.name) {
      this.pluginAliases.set(options.name, instance);
    }
    if (insert && options.name) {
      await this.repository.updateOrCreate({
        values: {
          ...options,
        },
        filterKeys: ['name'],
      });
    }
    await instance.afterAdd();
  }

  async initPlugins() {
    await this.initPresetPlugins();
    await this.repository.init();
  }

  async load(options: any = {}) {
    this.app.setMaintainingMessage('loading plugins...');
    const total = this.pluginInstances.size;

    let current = 0;

    for (const [P, plugin] of this.getPlugins()) {
      if (plugin.state.loaded) {
        continue;
      }

      const name = P.name;
      current += 1;

      this.app.setMaintainingMessage(`before load plugin [${name}], ${current}/${total}`);
      if (!plugin.enabled) {
        continue;
      }
      this.app.logger.debug(`before load plugin...`, name, { submodule: 'plugin-manager', function: 'load' });
      await plugin.beforeLoad();
    }

    current = 0;

    for (const [P, plugin] of this.getPlugins()) {
      if (plugin.state.loaded) {
        continue;
      }
      const name = P.name;
      current += 1;
      this.app.setMaintainingMessage(`load plugin [${name}], ${current}/${total}`);

      if (!plugin.enabled) {
        continue;
      }

      await this.app.emitAsync('beforeLoadPlugin', plugin, options);
      this.app.logger.debug(`loading plugin...`, name, { submodule: 'plugin-manager', function: 'load' });
      await plugin.load();
      plugin.state.loaded = true;
      await this.app.emitAsync('afterLoadPlugin', plugin, options);
      this.app.logger.debug(`after load plugin...`, name, { submodule: 'plugin-manager', function: 'load' });
    }

    this.app.setMaintainingMessage('loaded plugins');
  }

  async install(options: InstallOptions = {}) {
    this.app.setMaintainingMessage('install plugins...');
    const total = this.pluginInstances.size;
    let current = 0;

    this.app.log.debug('call db.sync()');
    await this.app.db.sync();
    const toBeUpdated = [];

    for (const [P, plugin] of this.getPlugins()) {
      if (plugin.state.installing || plugin.state.installed) {
        continue;
      }

      const name = P.name;
      current += 1;

      if (!plugin.enabled) {
        continue;
      }

      plugin.state.installing = true;
      this.app.setMaintainingMessage(`before install plugin [${name}], ${current}/${total}`);
      await this.app.emitAsync('beforeInstallPlugin', plugin, options);
      this.app.logger.debug(`install plugin [${name}]...`);
      await plugin.install(options);
      toBeUpdated.push(name);
      plugin.state.installing = false;
      plugin.state.installed = true;
      plugin.installed = true;
      this.app.setMaintainingMessage(`after install plugin [${name}], ${current}/${total}`);
      await this.app.emitAsync('afterInstallPlugin', plugin, options);
    }
    await this.repository.update({
      filter: {
        name: toBeUpdated,
      },
      values: {
        installed: true,
      },
    });
  }

  async enable(name: string | string[]) {
    const pluginNames = _.castArray(name);
    this.app.log.debug(`enabling plugin ${pluginNames.join(',')}`);
    this.app.setMaintainingMessage(`enabling plugin ${pluginNames.join(',')}`);
    const toBeUpdated = [];
    for (const pluginName of pluginNames) {
      const plugin = this.get(pluginName);
      if (!plugin) {
        throw new Error(`${pluginName} plugin does not exist`);
      }
      if (plugin.enabled) {
        continue;
      }
      await this.app.emitAsync('beforeEnablePlugin', pluginName);
      await plugin.beforeEnable();
      plugin.enabled = true;
      toBeUpdated.push(pluginName);
    }
    if (toBeUpdated.length === 0) {
      return;
    }
    await this.repository.update({
      filter: {
        name: toBeUpdated,
      },
      values: {
        enabled: true,
      },
    });
    try {
      await this.app.reload();
      this.app.log.debug(`syncing database in enable plugin ${pluginNames.join(',')}...`);
      this.app.setMaintainingMessage(`syncing database in enable plugin ${pluginNames.join(',')}...`);
      await this.app.db.sync();
      for (const pluginName of pluginNames) {
        const plugin = this.get(pluginName);
        if (!plugin.installed) {
          this.app.log.debug(`installing plugin ${pluginName}...`);
          this.app.setMaintainingMessage(`installing plugin ${pluginName}...`);
          await plugin.install();
          plugin.installed = true;
        }
      }
      await this.repository.update({
        filter: {
          name: toBeUpdated,
        },
        values: {
          installed: true,
        },
      });
      for (const pluginName of pluginNames) {
        const plugin = this.get(pluginName);
        this.app.log.debug(`emit afterEnablePlugin event...`);
        await plugin.afterEnable();
        await this.app.emitAsync('afterEnablePlugin', pluginName);
        this.app.log.debug(`afterEnablePlugin event emitted`);
      }
      await this.app.tryReloadOrRestart();
    } catch (error) {
      await this.repository.update({
        filter: {
          name: toBeUpdated,
        },
        values: {
          enabled: false,
          installed: false,
        },
      });
      await this.app.tryReloadOrRestart({
        recover: true,
      });
      throw error;
    }
  }

  async disable(name: string | string[]) {
    const pluginNames = _.castArray(name);
    this.app.log.debug(`disabling plugin ${pluginNames.join(',')}`);
    this.app.setMaintainingMessage(`disabling plugin ${pluginNames.join(',')}`);
    const toBeUpdated = [];
    for (const pluginName of pluginNames) {
      const plugin = this.get(pluginName);
      if (!plugin) {
        throw new Error(`${pluginName} plugin does not exist`);
      }
      if (!plugin.enabled) {
        continue;
      }
      await this.app.emitAsync('beforeDisablePlugin', pluginName);
      await plugin.beforeDisable();
      plugin.enabled = false;
      toBeUpdated.push(pluginName);
    }
    if (toBeUpdated.length === 0) {
      return;
    }
    await this.repository.update({
      filter: {
        name: toBeUpdated,
      },
      values: {
        enabled: false,
      },
    });
    try {
      await this.app.tryReloadOrRestart();
      for (const pluginName of pluginNames) {
        const plugin = this.get(pluginName);
        this.app.log.debug(`emit afterDisablePlugin event...`);
        await plugin.afterDisable();
        await this.app.emitAsync('afterDisablePlugin', pluginName);
        this.app.log.debug(`afterDisablePlugin event emitted`);
      }
    } catch (error) {
      await this.repository.update({
        filter: {
          name: toBeUpdated,
        },
        values: {
          enabled: true,
        },
      });
      await this.app.tryReloadOrRestart({
        recover: true,
      });
      throw error;
    }
  }

  async remove(name: string | string[]) {
    const pluginNames = _.castArray(name);
    for (const pluginName of pluginNames) {
      const plugin = this.get(pluginName);
      if (!plugin) {
        continue;
      }
      if (plugin.enabled) {
        throw new Error(`${pluginName} plugin is enabled`);
      }
      await plugin.beforeRemove();
    }
    await this.repository.destroy({
      filter: {
        name: pluginNames,
      },
    });
    const plugins: Plugin[] = [];
    for (const pluginName of pluginNames) {
      const plugin = this.get(pluginName);
      if (!plugin) {
        continue;
      }
      plugins.push(plugin);
      this.del(pluginName);
      // if (plugin.options.type && plugin.options.packageName) {
      //   await removePluginPackage(plugin.options.packageName);
      // }
    }
    await this.app.reload();
    for (const plugin of plugins) {
      await plugin.afterRemove();
    }
    await this.app.emitStartedEvent();
  }

  protected async initPresetPlugins() {
    for (const plugin of this.options.plugins) {
      const [p, opts = {}] = Array.isArray(plugin) ? plugin : [plugin];
      await this.add(p, { enabled: true, isPreset: true, ...opts });
    }
  }

  async loadOne(plugin: Plugin) {
    this.app.setMaintainingMessage(`loading plugin ${plugin.name}...`);
    if (plugin.state.loaded || !plugin.enabled) {
      return;
    }
    const name = plugin.getName();
    await plugin.beforeLoad();

    await this.app.emitAsync('beforeLoadPlugin', plugin, {});
    this.app.logger.debug(`loading plugin...`, name, { submodule: 'plugin-manager', function: 'loadOne' });
    await plugin.load();
    plugin.state.loaded = true;
    await this.app.emitAsync('afterLoadPlugin', plugin, {});
    this.app.logger.debug(`after load plugin...`, name, { submodule: 'plugin-manager', function: 'loadOne' });

    this.app.setMaintainingMessage(`loaded plugin ${plugin.name}`);
  }

  async addViaCLI(urlOrName: string, options?: PluginData) {
    if (isURL(urlOrName)) {
      await this.addByCompressedFileUrl({
        ...options,
        compressedFileUrl: urlOrName,
      });
    } else if (await fsExists(urlOrName)) {
      await this.addByCompressedFileUrl({
        ...(options as any),
        compressedFileUrl: urlOrName,
      });
    } else if (options?.registry) {
      if (!options.name) {
        const model = await this.repository.findOne({ filter: { packageName: urlOrName } });
        if (model) {
          options['name'] = model?.name;
        }
        if (!options.name) {
          options['name'] = urlOrName.replace('@nocobase/plugin-', '');
        }
      }
      await this.addByNpm({
        ...(options as any),
        packageName: urlOrName,
      });
    } else {
      const opts = {
        ...options,
      };
      const model = await this.repository.findOne({ filter: { packageName: urlOrName } });
      if (model) {
        opts['name'] = model.name;
      }
      if (!opts['name']) {
        opts['packageName'] = urlOrName;
      }
      await this.add(opts['name'] || urlOrName, opts, true);
    }
    await this.app.emitStartedEvent();
  }

  async addByNpm(options: { packageName: string; name?: string; registry: string; authToken?: string }) {
    let { name = '', registry, packageName, authToken } = options;
    name = name.trim();
    registry = registry.trim();
    packageName = packageName.trim();
    authToken = authToken?.trim();
    const { compressedFileUrl } = await getPluginInfoByNpm({
      packageName,
      registry,
      authToken,
    });
    return this.addByCompressedFileUrl({ name, compressedFileUrl, registry, authToken, type: 'npm' });
  }

  async addByFile(options: { file: string; registry?: string; authToken?: string; type?: string; name?: string }) {
    const { file, authToken } = options;

    const { packageName, tempFile, tempPackageContentDir } = await downloadAndUnzipToTempDir(file, authToken);

    const name = options.name || packageName;

    if (this.has(name)) {
      await removeTmpDir(tempFile, tempPackageContentDir);
      throw new Error(`plugin name [${name}] already exists`);
    }
    await copyTempPackageToStorageAndLinkToNodeModules(tempFile, tempPackageContentDir, packageName);
    return this.add(name, { packageName }, true);
  }

  async addByCompressedFileUrl(options: {
    compressedFileUrl: string;
    registry?: string;
    authToken?: string;
    type?: string;
    name?: string;
  }) {
    const { compressedFileUrl, authToken } = options;

    const { packageName, tempFile, tempPackageContentDir } = await downloadAndUnzipToTempDir(
      compressedFileUrl,
      authToken,
    );

    const name = options.name || packageName;

    if (this.has(name)) {
      await removeTmpDir(tempFile, tempPackageContentDir);
      throw new Error(`plugin name [${name}] already exists`);
    }
    await copyTempPackageToStorageAndLinkToNodeModules(tempFile, tempPackageContentDir, packageName);
    return this.add(name, { packageName }, true);
  }

  async update(options: PluginData) {
    if (options['url']) {
      options.compressedFileUrl = options['url'];
    }
    if (!options.name) {
      const model = await this.repository.findOne({ filter: { packageName: options.packageName } });
      options['name'] = model.name;
    }
    if (options.compressedFileUrl) {
      await this.upgradeByCompressedFileUrl(options);
    } else {
      await this.upgradeByNpm(options as any);
    }
    await this.app.upgrade();
  }

  async upgradeByNpm(values: PluginData) {
    const name = values.name;
    const plugin = this.get(name);
    if (!this.has(name)) {
      throw new Error(`plugin name [${name}] not exists`);
    }
    if (!plugin.options.packageName || !values.registry) {
      throw new Error(`plugin name [${name}] not installed by npm`);
    }
    const version = values.version?.trim();
    const registry = values.registry?.trim() || plugin.options.registry;
    const authToken = values.authToken?.trim() || plugin.options.authToken;
    const { compressedFileUrl } = await getPluginInfoByNpm({
      packageName: plugin.options.packageName,
      registry: registry,
      authToken: authToken,
      version,
    });
    return this.upgradeByCompressedFileUrl({ compressedFileUrl, name, version, registry, authToken });
  }

  async upgradeByCompressedFileUrl(options: PluginData) {
    const { name, compressedFileUrl, authToken } = options;
    const data = await this.repository.findOne({ filter: { name } });
    const { version } = await updatePluginByCompressedFileUrl({
      compressedFileUrl,
      packageName: data.packageName,
      authToken: authToken,
    });
    await this.add(name, { version, packageName: data.packageName }, true, true);
  }

  getNameByPackageName(packageName: string) {
    const prefixes = PluginManager.getPluginPkgPrefix();
    const prefix = prefixes.find((prefix) => packageName.startsWith(prefix));
    if (!prefix) {
      throw new Error(
        `package name [${packageName}] invalid, just support ${prefixes.join(
          ', ',
        )}. You can modify process.env.PLUGIN_PACKAGE_PREFIX add more prefix.`,
      );
    }
    return packageName.replace(prefix, '');
  }

  async list(options: any = {}) {
    const { locale = 'en-US', isPreset = false } = options;
    return Promise.all(
      [...this.getAliases()]
        .map((name) => {
          const plugin = this.get(name);
          if (!isPreset && plugin.options.isPreset) {
            return;
          }
          return plugin.toJSON({ locale });
        })
        .filter(Boolean),
    );
  }

  async getNpmVersionList(name: string) {
    const plugin = this.get(name);
    const npmInfo = await getNpmInfo(plugin.options.packageName, plugin.options.registry, plugin.options.authToken);
    return Object.keys(npmInfo.versions);
  }
}

export default PluginManager;

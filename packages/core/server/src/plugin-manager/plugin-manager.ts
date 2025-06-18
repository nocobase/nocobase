/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Topo from '@hapi/topo';
import { CleanOptions, Collection, SyncOptions } from '@nocobase/database';
import { importModule, isURL } from '@nocobase/utils';
import execa from 'execa';
import fg from 'fast-glob';
import fs from 'fs-extra';
import _ from 'lodash';
import net from 'net';
import { basename, join, resolve, sep } from 'path';
import { logger } from '@nocobase/logger';
import Application from '../application';
import { createAppProxy, tsxRerunning } from '../helper';
import { Plugin } from '../plugin';
import { uploadMiddleware } from './middleware';
import collectionOptions from './options/collection';
import resourceOptions from './options/resource';
import { PluginManagerRepository } from './plugin-manager-repository';
import { PluginData } from './types';
import {
  checkAndGetCompatible,
  copyTempPackageToStorageAndLinkToNodeModules,
  downloadAndUnzipToTempDir,
  getNpmInfo,
  getPluginBasePath,
  getPluginInfoByNpm,
  updatePluginByCompressedFileUrl,
} from './utils';

export const sleep = async (timeout = 0) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

export interface PluginManagerOptions {
  app: Application;
  plugins?: any[];
}

export interface InstallOptions {
  cliArgs?: any[];
  clean?: CleanOptions | boolean;
  force?: boolean;
  sync?: SyncOptions;
}

export class AddPresetError extends Error {}

export class PluginManager {
  static checkAndGetCompatible = checkAndGetCompatible;

  /**
   * @internal
   */
  app: Application;

  /**
   * @internal
   */
  collection: Collection;

  /**
   * @internal
   */
  pluginInstances = new Map<typeof Plugin, Plugin>();

  /**
   * @internal
   */
  pluginAliases = new Map<string, Plugin>();

  /**
   * @internal
   */
  server: net.Server;

  /**
   * @internal
   */
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

  /**
   * @internal
   */
  _repository: PluginManagerRepository;

  get repository() {
    return this.app.db.getRepository('applicationPlugins') as PluginManagerRepository;
  }

  static async packageExists(nameOrPkg: string) {
    const { packageName } = await this.parseName(nameOrPkg);
    const file = resolve(process.env.NODE_MODULES_PATH, packageName, 'package.json');
    return fs.exists(file);
  }

  /**
   * @internal
   */
  static async getPackageJson(nameOrPkg: string) {
    const { packageName } = await this.parseName(nameOrPkg);
    const packageFile = resolve(process.env.NODE_MODULES_PATH, packageName, 'package.json');
    if (!(await fs.exists(packageFile))) {
      throw new Error(`Cannot find plugin '${nameOrPkg}'`);
    }
    return fs.readJSON(packageFile);
  }

  /**
   * @internal
   */
  static async getPackageName(name: string) {
    const { packageName } = await this.parseName(name);
    const packageFile = resolve(process.env.NODE_MODULES_PATH, packageName, 'package.json');
    if (!(await fs.exists(packageFile))) {
      return null;
    }
    return packageName;
  }

  /**
   * @internal
   */
  static getPluginPkgPrefix() {
    return (process.env.PLUGIN_PACKAGE_PREFIX || '@nocobase/plugin-,@nocobase/preset-,@nocobase/plugin-pro-').split(
      ',',
    );
  }

  /**
   * @internal
   */
  static async findPackage(name: string) {
    try {
      const packageName = this.getPackageName(name);
      return packageName;
    } catch (error) {
      logger.info(`\`${name}\` plugin not found locally`);
      const prefixes = this.getPluginPkgPrefix();
      for (const prefix of prefixes) {
        try {
          const packageName = `${prefix}${name}`;
          logger.info(`Try to find ${packageName}`);
          await execa('npm', ['v', packageName, 'versions']);
          logger.info(`${packageName} downloading`);
          await execa('yarn', ['add', packageName, '-W']);
          logger.info(`${packageName} downloaded`);
          return packageName;
        } catch (error) {
          continue;
        }
      }
    }
    throw new Error(`No available packages found, ${name} plugin does not exist`);
  }

  /**
   * @internal
   */
  static clearCache(packageName: string) {
    return;
    const packageNamePath = packageName.replace('/', sep);
    Object.keys(require.cache).forEach((key) => {
      if (key.includes(packageNamePath)) {
        delete require.cache[key];
      }
    });
  }

  /**
   * @internal
   */
  static async resolvePlugin(pluginName: string | typeof Plugin, isUpgrade = false, isPkg = false) {
    if (typeof pluginName === 'string') {
      const { packageName } = await this.parseName(pluginName);
      return await importModule(packageName);
    } else {
      return pluginName;
    }
  }

  static parsedNames = {};

  static async parseName(nameOrPkg: string) {
    if (this.parsedNames[nameOrPkg]) {
      return this.parsedNames[nameOrPkg];
    }
    if (nameOrPkg.startsWith('@nocobase/plugin-')) {
      this.parsedNames[nameOrPkg] = {
        packageName: nameOrPkg,
        name: nameOrPkg.replace('@nocobase/plugin-', ''),
      };
      return this.parsedNames[nameOrPkg];
    }
    if (nameOrPkg.startsWith('@nocobase/preset-')) {
      this.parsedNames[nameOrPkg] = {
        packageName: nameOrPkg,
        name: nameOrPkg.replace('@nocobase/preset-', ''),
      };
      return this.parsedNames[nameOrPkg];
    }
    const exists = async (name: string, isPreset = false) => {
      return fs.exists(
        resolve(process.env.NODE_MODULES_PATH, `@nocobase/${isPreset ? 'preset' : 'plugin'}-${name}`, 'package.json'),
      );
    };
    if (await exists(nameOrPkg)) {
      this.parsedNames[nameOrPkg] = { name: nameOrPkg, packageName: `@nocobase/plugin-${nameOrPkg}` };
    } else if (await exists(nameOrPkg, true)) {
      this.parsedNames[nameOrPkg] = { name: nameOrPkg, packageName: `@nocobase/preset-${nameOrPkg}` };
    } else {
      this.parsedNames[nameOrPkg] = { name: nameOrPkg, packageName: nameOrPkg };
    }
    return this.parsedNames[nameOrPkg];
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

  get<T extends Plugin>(name: string | typeof Plugin | (new () => T)): T {
    if (typeof name === 'string') {
      return this.app.pm.pluginAliases.get(name) as any;
    }
    return this.app.pm.pluginInstances.get(name as any) as any;
  }

  has(name: string | typeof Plugin) {
    if (typeof name === 'string') {
      return this.app.pm.pluginAliases.has(name);
    }
    return this.app.pm.pluginInstances.has(name);
  }

  del(name: any) {
    const instance = this.get(name);
    if (instance) {
      this.app.pm.pluginAliases.delete(instance.name);
      this.app.pm.pluginInstances.delete(instance.constructor as typeof Plugin);
    }
  }

  /* istanbul ignore next -- @preserve */
  async create(pluginName: string, options?: { forceRecreate?: boolean }) {
    const createPlugin = async (name) => {
      const pluginDir = resolve(process.cwd(), 'packages/plugins', name);
      if (options?.forceRecreate) {
        await fs.rm(pluginDir, { recursive: true, force: true });
      }
      const { PluginGenerator } = require('@nocobase/cli/src/plugin-generator');
      const generator = new PluginGenerator({
        cwd: process.cwd(),
        args: {},
        context: {
          name,
        },
      });
      await generator.run();
    };
    await createPlugin(pluginName);
    this.app.log.info('attempt to add the plugin to the app');
    const { name, packageName } = await PluginManager.parseName(pluginName);
    const json = await PluginManager.getPackageJson(packageName);
    this.app.log.info(`add plugin [${packageName}]`, {
      name,
      packageName,
      version: json.version,
    });
    await tsxRerunning();
  }

  async add(plugin?: string | typeof Plugin, options: any = {}, insert = false, isUpgrade = false) {
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
        const packageName = await PluginManager.getPackageName(options.name);
        if (packageName) {
          options['packageName'] = packageName;
        }
      }

      if (options.packageName) {
        const packageJson = await PluginManager.getPackageJson(options.packageName);
        options['packageJson'] = packageJson;
        options['version'] = packageJson.version;
      }
    } catch (error) {
      this.app.log.error(error);
      console.error(error);
      // empty
    }
    this.app.log.trace(`adding plugin [${options.name}]`, {
      method: 'add',
      submodule: 'plugin-manager',
      name: options.name,
      options,
    });
    let P: any;
    try {
      P = await PluginManager.resolvePlugin(options.packageName || plugin, isUpgrade, !!options.packageName);
    } catch (error) {
      this.app.log.warn('plugin not found', error);
      return;
    }

    const instance: Plugin = new P(createAppProxy(this.app), options);

    this.pluginInstances.set(P, instance);
    if (options.name) {
      this.pluginAliases.set(options.name, instance);
    }
    if (options.packageName) {
      this.pluginAliases.set(options.packageName, instance);
    }
    await instance.afterAdd();
    this.app.log.trace(`added plugin [${options.name}]`, {
      method: 'add',
      submodule: 'plugin-manager',
      name: instance.name,
      options: instance.options,
    });
  }

  /**
   * @internal
   */
  async initPlugins() {
    await this.initPresetPlugins();
    await this.initOtherPlugins();
  }

  /**
   * @internal
   */
  async loadCommands() {
    this.app.log.info('load commands');
    const items = await this.repository.find({
      filter: {
        enabled: true,
      },
    });
    const packageNames: string[] = items.map((item) => item.packageName);
    const source = [];
    for (const packageName of packageNames) {
      try {
        const dirname = await getPluginBasePath(packageName);
        const directory = join(dirname, 'server/commands/*.' + (basename(dirname) === 'src' ? '{ts,js}' : 'js'));

        source.push(directory.replaceAll(sep, '/'));
      } catch (error) {
        this.app.log.error(error);
        continue;
      }
    }
    for (const plugin of this.options.plugins || []) {
      if (typeof plugin === 'string') {
        const { packageName } = await PluginManager.parseName(plugin);
        const dirname = await getPluginBasePath(packageName);
        const directory = join(dirname, 'server/commands/*.' + (basename(dirname) === 'src' ? '{ts,js}' : 'js'));
        source.push(directory.replaceAll(sep, '/'));
      }
    }
    const files = await fg(source, {
      ignore: ['**/*.d.ts'],
      cwd: process.env.NODE_MODULES_PATH,
    });

    for (const file of files) {
      const callback = await importModule(file);
      callback(this.app);
    }
  }

  async load(options: any = {}) {
    this.app.log.debug('loading plugins...');
    this.app.setMaintainingMessage('loading plugins...');
    const total = this.pluginInstances.size;

    let current = 0;

    for (const [P, plugin] of this.getPlugins()) {
      if (plugin.state.loaded) {
        continue;
      }

      const name = plugin.name || P.name;
      current += 1;

      this.app.setMaintainingMessage(`before load plugin [${name}], ${current}/${total}`);
      if (!plugin.enabled) {
        continue;
      }
      this.app.logger.trace(`before load plugin [${name}]`, { submodule: 'plugin-manager', method: 'load', name });
      await plugin.beforeLoad();
    }

    current = 0;

    for (const [P, plugin] of this.getPlugins()) {
      if (plugin.state.loaded) {
        continue;
      }
      const name = plugin.name || P.name;
      current += 1;
      this.app.setMaintainingMessage(`load plugin [${name}], ${current}/${total}`);

      if (!plugin.enabled) {
        continue;
      }

      await this.app.emitAsync('beforeLoadPlugin', plugin, options);
      this.app.logger.trace(`load plugin [${name}] `, { submodule: 'plugin-manager', method: 'load', name });
      await plugin.loadCollections();
      await plugin.load();
      plugin.state.loaded = true;
      await this.app.emitAsync('afterLoadPlugin', plugin, options);
    }

    const getSourceAndTargetForAddAction = async (ctx: any) => {
      const { packageName } = ctx.action.params;
      return {
        targetCollection: 'applicationPlugins',
        targetRecordUK: packageName,
      };
    };

    const getSourceAndTargetForUpdateAction = async (ctx: any) => {
      let { packageName } = ctx.action.params;
      if (ctx.file) {
        packageName = ctx.request.body.packageName;
      }
      return {
        targetCollection: 'applicationPlugins',
        targetRecordUK: packageName,
      };
    };

    const getSourceAndTargetForOtherActions = async (ctx: any) => {
      const { filterByTk } = ctx.action.params;
      return {
        targetCollection: 'applicationPlugins',
        targetRecordUK: filterByTk,
      };
    };

    this.app.auditManager.registerActions([
      { name: 'pm:add', getSourceAndTarget: getSourceAndTargetForAddAction },
      { name: 'pm:update', getSourceAndTarget: getSourceAndTargetForUpdateAction },
      { name: 'pm:enable', getSourceAndTarget: getSourceAndTargetForOtherActions },
      { name: 'pm:disable', getSourceAndTarget: getSourceAndTargetForOtherActions },
      { name: 'pm:remove', getSourceAndTarget: getSourceAndTargetForOtherActions },
    ]);

    this.app.log.debug('plugins loaded');
    this.app.setMaintainingMessage('plugins loaded');
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

      const name = plugin.name || P.name;
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

  async enable(nameOrPkg: string | string[]) {
    let pluginNames = nameOrPkg;
    if (nameOrPkg === '*') {
      const plugin = this.get('nocobase') as any;
      pluginNames = await plugin.findLocalPlugins();
    }
    pluginNames = await this.sort(pluginNames);
    try {
      const added = {};
      for (const name of pluginNames) {
        const { name: pluginName } = await PluginManager.parseName(name);
        if (this.has(pluginName)) {
          added[pluginName] = true;
          continue;
        }
        await this.add(pluginName);
      }
      for (const name of pluginNames) {
        const { name: pluginName } = await PluginManager.parseName(name);
        const plugin = this.get(pluginName);
        if (!plugin) {
          throw new Error(`${pluginName} plugin does not exist`);
        }
        if (added[pluginName]) {
          continue;
        }
        const instance = await this.repository.findOne({
          filter: {
            name: pluginName,
          },
        });
        if (instance) {
          plugin.enabled = instance.enabled;
          plugin.installed = instance.installed;
        }
        if (plugin.enabled) {
          continue;
        }
        await plugin.beforeLoad();
      }
      for (const name of pluginNames) {
        const { name: pluginName } = await PluginManager.parseName(name);
        const plugin = this.get(pluginName);
        if (!plugin) {
          throw new Error(`${pluginName} plugin does not exist`);
        }
        if (added[pluginName]) {
          continue;
        }
        if (plugin.enabled) {
          continue;
        }
        await plugin.loadCollections();
        await plugin.load();
      }
    } catch (error) {
      await this.app.tryReloadOrRestart({
        recover: true,
      });
      throw error;
    }
    this.app.log.debug(`enabling plugin ${pluginNames.join(',')}`);
    this.app.setMaintainingMessage(`enabling plugin ${pluginNames.join(',')}`);
    const toBeUpdated = [];
    for (const name of pluginNames) {
      const { name: pluginName } = await PluginManager.parseName(name);
      const plugin = this.get(pluginName);
      if (!plugin) {
        throw new Error(`${pluginName} plugin does not exist`);
      }
      if (plugin.enabled) {
        continue;
      }
      await this.app.emitAsync('beforeEnablePlugin', pluginName);
      try {
        await plugin.beforeEnable();
        toBeUpdated.push(pluginName);
      } catch (error) {
        if (nameOrPkg === '*') {
          this.app.log.error(error.message);
        } else {
          throw error;
        }
      }
    }
    if (toBeUpdated.length === 0) {
      return;
    }
    try {
      this.app.log.debug(`syncing database in enable plugin ${toBeUpdated.join(',')}...`);
      this.app.setMaintainingMessage(`syncing database in enable plugin ${toBeUpdated.join(',')}...`);
      await this.app.db.sync();
      for (const pluginName of toBeUpdated) {
        const plugin = this.get(pluginName);
        if (!plugin.installed) {
          this.app.log.debug(`installing plugin ${pluginName}...`);
          this.app.setMaintainingMessage(`installing plugin ${pluginName}...`);
          await plugin.install();
          plugin.installed = true;
        }
      }
      for (const pluginName of toBeUpdated) {
        const { name } = await PluginManager.parseName(pluginName);
        const packageJson = await PluginManager.getPackageJson(pluginName);
        const values = {
          name,
          packageName: packageJson?.name,
          enabled: true,
          installed: true,
          version: packageJson?.version,
        };
        await this.repository.updateOrCreate({
          values,
          filterKeys: ['name'],
        });
      }
      for (const pluginName of toBeUpdated) {
        const plugin = this.get(pluginName);
        this.app.log.debug(`emit afterEnablePlugin event...`);
        await plugin.afterEnable();
        plugin.enabled = true;
        await this.app.emitAsync('afterEnablePlugin', pluginName);
        this.app.log.debug(`afterEnablePlugin event emitted`);
      }
      await this.app.tryReloadOrRestart();
    } catch (error) {
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
    for (const name of pluginNames) {
      const { name: pluginName } = await PluginManager.parseName(name);
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
    try {
      for (const pluginName of toBeUpdated) {
        const plugin = this.get(pluginName);
        this.app.log.debug(`emit afterDisablePlugin event...`);
        await plugin.afterDisable();
        await this.app.emitAsync('afterDisablePlugin', pluginName);
        this.app.log.debug(`afterDisablePlugin event emitted`);
      }
      await this.repository.update({
        filter: {
          name: toBeUpdated,
        },
        values: {
          enabled: false,
        },
      });
      await this.app.tryReloadOrRestart();
    } catch (error) {
      await this.app.tryReloadOrRestart({
        recover: true,
      });
      throw error;
    }
  }

  async remove(name: string | string[], options?: { removeDir?: boolean; force?: boolean }) {
    const names = _.castArray(name);
    const pluginNames = [];
    const records = [];
    for (const nameOrPkg of names) {
      const { name, packageName } = await PluginManager.parseName(nameOrPkg);
      pluginNames.push(name);
      records.push({
        name,
        packageName,
      });
    }
    const removeDir = async () => {
      await Promise.all(
        records.map(async (plugin) => {
          const dir = resolve(process.env.NODE_MODULES_PATH, plugin.packageName);
          try {
            const realDir = await fs.realpath(dir);
            this.app.log.debug('realDir %s', realDir);
            this.app.log.debug(`rm -rf ${realDir}`);
            return fs.rm(realDir, { force: true, recursive: true });
          } catch (error) {
            return false;
          }
        }),
      );
    };
    await this.repository.destroy({
      filter: {
        name: pluginNames,
      },
    });
    if (!this.app.db.getCollection('applications')) {
      await removeDir();
    }
  }

  /**
   * @internal
   */
  async addViaCLI(urlOrName: string | string[], options?: PluginData, emitStartedEvent = true) {
    const writeFile = async () => {
      if (process.env.VITEST) {
        return;
      }
      const file = resolve(process.cwd(), 'storage/.upgrading');
      this.app.log.debug('pending upgrade');
      await fs.writeFile(file, 'upgrading');
    };
    await writeFile();
    if (Array.isArray(urlOrName)) {
      for (const packageName of urlOrName) {
        await this.addViaCLI(packageName, _.omit(options, 'name'), false);
      }
      return;
    }
    if (isURL(urlOrName)) {
      await this.addByCompressedFileUrl(
        {
          ...options,
          compressedFileUrl: urlOrName,
        },
        emitStartedEvent,
      );
    } else if (await fs.exists(urlOrName)) {
      await this.addByCompressedFileUrl(
        {
          ...(options as any),
          compressedFileUrl: urlOrName,
        },
        emitStartedEvent,
      );
    } else if (options?.registry) {
      const { name, packageName } = await PluginManager.parseName(urlOrName);
      options['name'] = name;
      await this.addByNpm(
        {
          ...(options as any),
          packageName,
        },
        emitStartedEvent,
      );
    }
  }

  /**
   * @internal
   */
  async addByNpm(
    options: { packageName: string; name?: string; registry: string; authToken?: string },
    throwError = true,
  ) {
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
    return this.addByCompressedFileUrl({ name, compressedFileUrl, registry, authToken, type: 'npm' }, throwError);
  }

  /**
   * @internal
   */
  async addByFile(
    options: { file: string; registry?: string; authToken?: string; type?: string; name?: string },
    throwError = true,
  ) {
    const { file, authToken } = options;

    const { packageName, tempFile, tempPackageContentDir } = await downloadAndUnzipToTempDir(file, authToken);

    await copyTempPackageToStorageAndLinkToNodeModules(tempFile, tempPackageContentDir, packageName);
  }

  /**
   * @internal
   */
  async addByCompressedFileUrl(
    options: {
      compressedFileUrl: string;
      registry?: string;
      authToken?: string;
      type?: string;
      name?: string;
    },
    throwError = true,
  ) {
    const { compressedFileUrl, authToken } = options;

    const { packageName, tempFile, tempPackageContentDir } = await downloadAndUnzipToTempDir(
      compressedFileUrl,
      authToken,
    );

    await copyTempPackageToStorageAndLinkToNodeModules(tempFile, tempPackageContentDir, packageName);
  }

  async update(nameOrPkg: string | string[], options: PluginData, emitStartedEvent = true) {
    const upgrade = async () => {
      if (!(await this.app.isStarted())) {
        this.app.log.debug('app upgrading');
        await this.app.runCommand('upgrade');
        await tsxRerunning();
        await execa('yarn', ['nocobase', 'pm2-restart'], {
          env: process.env,
        });
        return;
      }
      const file = resolve(process.cwd(), 'storage/app-upgrading');
      await fs.writeFile(file, '', 'utf-8');
      // await this.app.upgrade();
      await tsxRerunning();
      await execa('yarn', ['nocobase', 'pm2-restart'], {
        env: process.env,
      });
    };
    if (Array.isArray(nameOrPkg)) {
      for (const name of nameOrPkg) {
        await this.update(name, { ...options }, false);
      }
      return upgrade();
    }
    const opts = { ...options };
    if (isURL(nameOrPkg)) {
      opts.compressedFileUrl = nameOrPkg;
    } else if (await fs.exists(nameOrPkg)) {
      opts.compressedFileUrl = nameOrPkg;
    }
    if (opts.compressedFileUrl) {
      await this.upgradeByCompressedFileUrl(opts);
    } else {
      const { name, packageName } = await PluginManager.parseName(nameOrPkg);
      await this.upgradeByNpm({ ...opts, packageName, name } as any);
    }
    if (emitStartedEvent) {
      await upgrade();
    }
  }

  /**
   * @internal
   */
  async upgradeByNpm(values: PluginData) {
    const name = values.name;
    if (!(await this.repository.has(name))) {
      throw new Error(`plugin name [${name}] not exists`);
    }
    if (!values.registry) {
      throw new Error(`plugin name [${name}] not installed by npm`);
    }
    const version = values.version?.trim();
    const registry = values.registry?.trim();
    const authToken = values.authToken?.trim();
    const { compressedFileUrl } = await getPluginInfoByNpm({
      packageName: values.packageName,
      registry: registry,
      authToken: authToken,
      version,
    });
    return this.upgradeByCompressedFileUrl({
      compressedFileUrl,
      name,
      version,
      registry,
      authToken,
    });
  }

  /**
   * @internal
   */
  async upgradeByCompressedFileUrl(options: PluginData) {
    const { compressedFileUrl, authToken } = options;
    const { packageName, version } = await updatePluginByCompressedFileUrl({
      compressedFileUrl,
      authToken: authToken,
      repository: this.repository,
    });
    const { name } = await PluginManager.parseName(packageName);
    // await this.add(name, { name, version, packageName }, true, true);
  }

  /**
   * @internal
   */
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
      [...this.getPlugins().keys()]
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

  /**
   * @internal
   */
  async getNpmVersionList(name: string) {
    const plugin = this.get(name);
    const npmInfo = await getNpmInfo(plugin.options.packageName, plugin.options.registry, plugin.options.authToken);
    return Object.keys(npmInfo.versions);
  }

  /**
   * @internal
   */
  async loadPresetMigrations() {
    const migrations = {
      beforeLoad: [],
      afterSync: [],
      afterLoad: [],
    };
    for (const [P, plugin] of this.getPlugins()) {
      if (!plugin.isPreset) {
        continue;
      }
      const { beforeLoad, afterSync, afterLoad } = await plugin.loadMigrations();
      migrations.beforeLoad.push(...beforeLoad);
      migrations.afterSync.push(...afterSync);
      migrations.afterLoad.push(...afterLoad);
    }
    return {
      beforeLoad: {
        up: async () => {
          this.app.log.debug('run preset migrations(beforeLoad)');
          const migrator = this.app.db.createMigrator({ migrations: migrations.beforeLoad });
          await migrator.up();
        },
      },
      afterSync: {
        up: async () => {
          this.app.log.debug('run preset migrations(afterSync)');
          const migrator = this.app.db.createMigrator({ migrations: migrations.afterSync });
          await migrator.up();
        },
      },
      afterLoad: {
        up: async () => {
          this.app.log.debug('run preset migrations(afterLoad)');
          const migrator = this.app.db.createMigrator({ migrations: migrations.afterLoad });
          await migrator.up();
        },
      },
    };
  }

  /**
   * @internal
   */
  async loadOtherMigrations() {
    const migrations = {
      beforeLoad: [],
      afterSync: [],
      afterLoad: [],
    };
    for (const [P, plugin] of this.getPlugins()) {
      if (plugin.isPreset) {
        continue;
      }
      if (!plugin.enabled) {
        continue;
      }
      const { beforeLoad, afterSync, afterLoad } = await plugin.loadMigrations();
      migrations.beforeLoad.push(...beforeLoad);
      migrations.afterSync.push(...afterSync);
      migrations.afterLoad.push(...afterLoad);
    }
    return {
      beforeLoad: {
        up: async () => {
          this.app.log.debug('run others migrations(beforeLoad)');
          const migrator = this.app.db.createMigrator({ migrations: migrations.beforeLoad });
          await migrator.up();
        },
      },
      afterSync: {
        up: async () => {
          this.app.log.debug('run others migrations(afterSync)');
          const migrator = this.app.db.createMigrator({ migrations: migrations.afterSync });
          await migrator.up();
        },
      },
      afterLoad: {
        up: async () => {
          this.app.log.debug('run others migrations(afterLoad)');
          const migrator = this.app.db.createMigrator({ migrations: migrations.afterLoad });
          await migrator.up();
        },
      },
    };
  }

  /**
   * @internal
   */
  async loadPresetPlugins() {
    await this.initPresetPlugins();
    await this.load();
  }

  async upgrade() {
    this.app.log.info('run upgrade');
    const toBeUpdated = [];
    for (const [P, plugin] of this.getPlugins()) {
      if (plugin.state.upgraded) {
        continue;
      }
      if (!plugin.enabled) {
        continue;
      }
      if (!plugin.isPreset && !plugin.installed) {
        this.app.log.info(`install built-in plugin [${plugin.name}]`);
        await plugin.install();
        toBeUpdated.push(plugin.name);
      }
      this.app.log.debug(`upgrade plugin [${plugin.name}]`);
      await plugin.upgrade();
      plugin.state.upgraded = true;
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

  /**
   * @internal
   */
  async initOtherPlugins() {
    if (this['_initOtherPlugins']) {
      return;
    }
    await this.repository.init();
    this['_initOtherPlugins'] = true;
  }

  /**
   * @internal
   */
  async initPresetPlugins() {
    if (this['_initPresetPlugins']) {
      return;
    }
    for (const plugin of this.options.plugins) {
      const [p, opts = {}] = Array.isArray(plugin) ? plugin : [plugin];
      await this.add(p, { enabled: true, isPreset: true, ...opts });
    }
    this['_initPresetPlugins'] = true;
  }

  private async sort(names: string | string[]) {
    const pluginNames = _.castArray(names);
    if (pluginNames.length === 1) {
      return pluginNames;
    }
    const sorter = new Topo.Sorter<string>();
    for (const pluginName of pluginNames) {
      const packageJson = await PluginManager.getPackageJson(pluginName);
      const peerDependencies = Object.keys(packageJson?.peerDependencies || {});
      sorter.add(pluginName, { after: peerDependencies, group: packageJson?.packageName || pluginName });
    }
    return sorter.nodes;
  }
}

export default PluginManager;

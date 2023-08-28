import { CleanOptions, Collection, SyncOptions } from '@nocobase/database';
import { requireModule } from '@nocobase/utils';
import execa from 'execa';
import _ from 'lodash';
import net from 'net';
import { resolve } from 'path';
import Application from '../application';
import { createAppProxy } from '../helper';
import { Plugin } from '../plugin';
import collectionOptions from './options/collection';
import resourceOptions from './options/resource';
import { PluginManagerRepository } from './plugin-manager-repository';

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

    this.app.resourcer.use(async (ctx, next) => {
      await next();
      const { resourceName, actionName } = ctx.action;
      if (resourceName === 'applicationPlugins' && actionName === 'list') {
        const lng = ctx.getCurrentLocale();
        if (Array.isArray(ctx.body)) {
          ctx.body = ctx.body.map((plugin) => {
            const json = plugin.toJSON();
            const packageName = PluginManager.getPackageName(json.name);
            const packageJson = PluginManager.getPackageJson(packageName);
            return {
              displayName: packageJson[`displayName.${lng}`] || packageJson.displayName,
              description: packageJson[`description.${lng}`] || packageJson.description,
              ...json,
            };
          });
        }
      }
    });

    this.app.acl.registerSnippet({
      name: 'pm',
      actions: ['pm:*', 'applicationPlugins:list'],
    });
  }

  get repository() {
    return this.app.db.getRepository('applicationPlugins') as PluginManagerRepository;
  }

  static getPackageJson(packageName: string) {
    return require(`${packageName}/package.json`);
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

  static resolvePlugin(pluginName: string | typeof Plugin) {
    if (typeof pluginName === 'string') {
      const packageName = this.getPackageName(pluginName);
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

  async create(name: string | string[]) {
    console.log('creating...');
    const pluginNames = Array.isArray(name) ? name : [name];
    const { run } = require('@nocobase/cli/src/util');
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
    await Promise.all(pluginNames.map((pluginName) => createPlugin(pluginName)));
    await run('yarn', ['install']);
  }

  async add(plugin?: any, options: any = {}, insert = false) {
    if (this.has(plugin)) {
      const name = typeof plugin === 'string' ? plugin : plugin.name;
      this.app.log.warn(`plugin [${name}] added`);
      return;
    }
    if (!options.name && typeof plugin === 'string') {
      options.name = plugin;
    }
    this.app.log.debug(`adding plugin [${options.name}]...`);
    let P: any;
    try {
      P = PluginManager.resolvePlugin(plugin);
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
      const packageName = PluginManager.getPackageName(options.name);
      const packageJson = PluginManager.getPackageJson(packageName);
      await this.repository.updateOrCreate({
        values: {
          ...options,
          version: packageJson.version,
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
      this.app.logger.debug(`before load plugin [${name}]...`);
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
      this.app.logger.debug(`loading plugin [${name}]...`);
      await plugin.load();
      plugin.state.loaded = true;
      await this.app.emitAsync('afterLoadPlugin', plugin, options);
      this.app.logger.debug(`after load plugin [${name}]...`);
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
      await this.app.tryReloadOrRestart();
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
      await this.app.tryReloadOrRestart();
      throw error;
    }
  }

  async remove(name: string | string[]) {
    const pluginNames = _.castArray(name);
    for (const pluginName of pluginNames) {
      const plugin = this.get(pluginName);
      if (!plugin) {
        throw new Error(`${pluginName} plugin does not exist`);
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
      plugins.push(plugin);
      this.del(pluginName);
    }
    await this.app.reload();
    for (const plugin of plugins) {
      await plugin.afterRemove();
    }
  }

  protected async initPresetPlugins() {
    for (const plugin of this.options.plugins) {
      const [p, opts = {}] = Array.isArray(plugin) ? plugin : [plugin];
      await this.add(p, { enabled: true, isPreset: true, ...opts });
    }
  }
}

export default PluginManager;

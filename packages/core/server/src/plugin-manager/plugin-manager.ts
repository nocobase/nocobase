import { CleanOptions, Collection, SyncOptions } from '@nocobase/database';
import { requireModule } from '@nocobase/utils';
import execa from 'execa';
import net from 'net';
import { resolve } from 'path';
import Application from '../application';
import { Plugin } from '../plugin';
import { clientStaticMiddleware } from './clientStaticMiddleware';
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
  repository: PluginManagerRepository;
  pluginInstances = new Map<typeof Plugin, Plugin>();
  pluginAliases = new Map<string, Plugin>();
  server: net.Server;

  constructor(public options: PluginManagerOptions) {
    this.app = options.app;
    this.app.db.registerRepositories({
      PluginManagerRepository,
    });

    this.collection = this.app.db.collection(collectionOptions);

    this.repository = this.collection.repository as PluginManagerRepository;
    this.repository.setPluginManager(this);
    this.app.resourcer.define(resourceOptions);

    this.app.use(clientStaticMiddleware);

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

  protected async initPresetPlugins() {
    for (const plugin of this.options.plugins) {
      const [p, opts = {}] = Array.isArray(plugin) ? plugin : [plugin];
      await this.add(p, { ...opts, enabled: true, isPreset: true });
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
    return this.pluginInstances;
  }

  getAliases() {
    return this.pluginAliases.keys();
  }

  get(name: string | typeof Plugin) {
    if (typeof name === 'string') {
      return this.pluginAliases.get(name);
    }
    return this.pluginInstances.get(name);
  }

  has(name: string | typeof Plugin) {
    if (typeof name === 'string') {
      return this.pluginAliases.has(name);
    }
    return this.pluginInstances.has(name);
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

  async add(plugin?: any, options: any = {}) {
    if (this.has(plugin)) {
      const name = typeof plugin === 'string' ? plugin : plugin.name;
      this.app.log.warn(`plugin [${name}] added`);
      return;
    }
    if (!options.name && typeof plugin === 'string') {
      options.name = plugin;
    }
    let P: any;
    try {
      P = PluginManager.resolvePlugin(plugin);
    } catch (error) {
      this.app.log.warn('plugin not found', error);
      return;
    }
    const instance: Plugin = new P(this.app, options);
    if (!options.isPreset && options.name) {
      const model = await this.repository.firstOrCreate({
        values: { ...options },
        filterKeys: ['name'],
      });
      instance.model = model;
    }
    this.pluginInstances.set(P, instance);
    if (options.name) {
      this.pluginAliases.set(options.name, instance);
    }
    await instance.afterAdd();
  }

  async load(options: any = {}) {
    this.app.setWorkingMessage('loading plugins...');

    await this.initPresetPlugins();
    await this.repository.init();

    const total = this.pluginInstances.size;

    let current = 0;

    for (const [P, plugin] of this.getPlugins()) {
      if (plugin.state.loaded) {
        continue;
      }

      const name = P.name;
      current += 1;

      this.app.setWorkingMessage(`before load plugin [${name}], ${current}/${total}`);
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
      this.app.setWorkingMessage(`load plugin [${name}], ${current}/${total}`);

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

    this.app.setWorkingMessage('loaded plugins');
  }

  async install(options: InstallOptions = {}) {
    this.app.setWorkingMessage('install plugins...');
    const total = this.pluginInstances.size;
    let current = 0;

    this.app.log.debug('call db.sync()');
    await this.app.db.sync();

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
      this.app.setWorkingMessage(`before install plugin [${name}], ${current}/${total}`);
      await this.app.emitAsync('beforeInstallPlugin', plugin, options);
      this.app.logger.debug(`install plugin [${name}]...`);
      await plugin.install(options);
      plugin.state.installing = false;
      plugin.state.installed = true;
      this.app.setWorkingMessage(`after install plugin [${name}], ${current}/${total}`);
      await this.app.emitAsync('afterInstallPlugin', plugin, options);
    }
  }

  async enable(name: string | string[]) {
    this.app.log.debug(`enabling plugin ${name}`);

    this.app.setWorkingMessage(`enabling plugin ${name}`);
    const pluginNames = await this.repository.enable(name);

    await this.app.reload();

    this.app.log.debug(`syncing database in enable plugin ${name}...`);

    this.app.setWorkingMessage(`sync database`);
    await this.app.db.sync();

    for (const pluginName of pluginNames) {
      const plugin = this.app.getPlugin(pluginName);
      if (!plugin) {
        throw new Error(`${name} plugin does not exist`);
      }
      this.app.log.debug(`installing plugin ${pluginName}...`);
      this.app.setWorkingMessage(`install plugin ${pluginName}...`);
      await plugin.install();
      await plugin.afterEnable();
    }

    this.app.log.debug(`emit afterEnablePlugin event...`);
    await this.app.emitAsync('afterEnablePlugin', name);
    this.app.log.debug(`afterEnablePlugin event emitted`);
  }

  async disable(name: string | string[]) {
    try {
      this.app.setWorkingMessage(`disabling plugin ${name}`);
      const pluginNames = await this.repository.disable(name);
      await this.app.reload();
      for (const pluginName of pluginNames) {
        const plugin = this.app.getPlugin(pluginName);
        if (!plugin) {
          throw new Error(`${name} plugin does not exist`);
        }
        await plugin.afterDisable();
      }

      await this.app.emitAsync('afterDisablePlugin', name);
      this.app.setWorkingMessage(`plugin ${name} disabled`);
    } catch (error) {
      throw error;
    }
  }

  async remove(name: string | string[]) {
    const pluginNames = typeof name === 'string' ? [name] : name;
    for (const pluginName of pluginNames) {
      const plugin = this.app.getPlugin(pluginName);
      if (!plugin) {
        throw new Error(`${name} plugin does not exist`);
      }
      await plugin.remove();
    }
    await this.repository.remove(name);
    this.app.reload();
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
}

export default PluginManager;

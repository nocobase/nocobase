import { CleanOptions, Collection, SyncOptions } from '@nocobase/database';
import { requireModule } from '@nocobase/utils';
import Application from '../application';
import { Plugin } from '../plugin';
import collectionOptions from './options/collection';
import resourceOptions from './options/resource';
import { PluginManagerRepository } from './PluginManagerRepository';

export interface PluginManagerOptions {
  app: Application;
}

export interface InstallOptions {
  cliArgs?: any[];
  clean?: CleanOptions | boolean;
  sync?: SyncOptions;
}

export class PluginManager {
  app: Application;
  collection: Collection;
  repository: PluginManagerRepository;
  plugins = new Map<string, Plugin>();

  constructor(options: PluginManagerOptions) {
    this.app = options.app;
    this.app.db.registerRepositories({
      PluginManagerRepository,
    });
    this.collection = this.app.db.collection(collectionOptions);
    this.repository = this.collection.repository as PluginManagerRepository;
    this.repository.setPluginManager(this);
    this.app.resourcer.define(resourceOptions);
    this.app.acl.use(async (ctx, next) => {
      if (ctx.action.resourceName === 'pm') {
        ctx.permission = {
          skip: true,
        };
      }
      await next();
    });
    this.app.on('beforeLoad', async (app, options) => {
      if (options.method && ['install', 'upgrade'].includes(options.method)) {
        await this.collection.sync();
      }
      const exists = await this.app.db.collectionExistsInDb('applicationPlugins');
      if (!exists) {
        return;
      }
      if (options.method !== 'install' || options.reload) {
        await this.repository.register();
      }
    });
  }

  getPlugins() {
    return this.plugins;
  }

  get(name: string) {
    return this.plugins.get(name);
  }

  remove(name: string) {
    return this.plugins.delete(name);
  }

  addStatic(plugin?: any, options?: any) {
    let name: string;
    if (typeof plugin === 'string') {
      name = plugin;
      plugin = PluginManager.resolvePlugin(plugin);
    } else {
      name = plugin.constructor.name;
    }
    const instance = new plugin(this.app, {
      ...options,
      name,
      enabled: true,
    });
    const pluginName = instance.getName();
    if (this.plugins.has(pluginName)) {
      throw new Error(`plugin name [${pluginName}] exists`);
    }
    this.plugins.set(pluginName, instance);
    return instance;
  }

  async add(plugin: any, options: any = {}) {
    if (Array.isArray(plugin)) {
      const addMultiple = async () => {
        for (const p of plugin) {
          await this.add(p, options);
        }
      };
      return addMultiple();
    }
    const packageName = PluginManager.getPackageName(plugin);
    const packageJson = require(`${packageName}/package.json`);
    const instance = this.addStatic(plugin, options);
    let model = await this.repository.findOne({
      filter: { name: plugin },
    });
    if (model) {
      throw new Error(`${plugin} plugin already exists`);
    }
    const { enabled, builtIn, installed, ...others } = options;
    model = await this.repository.create({
      values: {
        name: plugin,
        version: packageJson.version,
        enabled: !!enabled,
        builtIn: !!builtIn,
        installed: !!installed,
        options: {
          ...others,
        },
      },
    });
    return instance;
  }

  async load(options: any = {}) {
    for (const [name, plugin] of this.plugins) {
      if (!plugin.enabled) {
        continue;
      }
      await plugin.beforeLoad();
    }

    for (const [name, plugin] of this.plugins) {
      if (!plugin.enabled) {
        continue;
      }
      await this.app.emitAsync('beforeLoadPlugin', plugin, options);
      await plugin.load();
      await this.app.emitAsync('afterLoadPlugin', plugin, options);
    }
  }

  async install(options: InstallOptions = {}) {
    for (const [name, plugin] of this.plugins) {
      if (!plugin.enabled) {
        continue;
      }
      await this.app.emitAsync('beforeInstallPlugin', plugin, options);
      await plugin.install(options);
      await this.app.emitAsync('afterInstallPlugin', plugin, options);
    }
  }

  static getPackageName(name: string) {
    const prefixes = (process.env.PLUGIN_PACKAGE_PREFIX || '@nocobase/plugin-,@nocobase/preset-').split(',');
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

  static resolvePlugin(pluginName: string) {
    const packageName = this.getPackageName(pluginName);
    return requireModule(packageName);
  }
}

export default PluginManager;

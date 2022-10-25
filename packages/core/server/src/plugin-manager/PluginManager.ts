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
    this.app.on('beforeLoadAll', async (app, options) => {
      if (options.method && ['install', 'upgrade'].includes(options.method)) {
        await this.collection.sync();
      }
      const exists = await this.app.db.collectionExistsInDb('applicationPlugins');
      if (!exists) {
        return;
      }
      await this.repository.register();
    });
  }

  getPackageName(name: string) {
    if (name.includes('@nocobase/plugin-')) {
      return name;
    }
    if (name.includes('/')) {
      return `@${name}`;
    }
    return `@nocobase/plugin-${name}`;
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

  addStatic(pluginClass?: any, options?: any) {
    if (typeof pluginClass === 'string') {
      const packageName = this.getPackageName(pluginClass);
      try {
        require.resolve(packageName);
      } catch (error) {
        throw new Error(`${pluginClass} plugin does not exist`);
      }
      pluginClass = requireModule(packageName);
    }
    const instance = new pluginClass(this.app, {
      ...options,
      enabled: true,
    });
    const pluginName = instance.getName();
    if (this.plugins.has(pluginName)) {
      throw new Error(`plugin name [${pluginName}] exists`);
    }
    this.plugins.set(pluginName, instance);
    return instance;
  }

  async add(pluginClass: any, options: any = {}) {
    if (Array.isArray(pluginClass)) {
      const addMultiple = async () => {
        for (const plugin of pluginClass) {
          await this.add(plugin, options);
        }
      };
      return addMultiple();
    }
    const packageName = this.getPackageName(pluginClass);
    const packageJson = require(`${packageName}/package.json`);
    const instance = this.addStatic(pluginClass, options);
    if (this.plugins.has(instance.getName())) {
      throw new Error(`${pluginClass} plugin already exists`);
    }
    let model = await this.repository.findOne({
      filter: { name: pluginClass },
    });
    if (model) {
      throw new Error(`${pluginClass} plugin already exists`);
    }
    const { enabled, builtIn, installed, ...others } = options;
    model = await this.repository.create({
      values: {
        name: pluginClass,
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
    await this.app.emitAsync('beforeLoadAll', this.app, options);

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

    await this.app.emitAsync('afterLoadAll', this.app, options);
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

  static resolvePlugin(pluginName: string) {
    return require(pluginName).default;
  }
}

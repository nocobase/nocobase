import { CleanOptions, Collection, Model, Repository, SyncOptions } from '@nocobase/database';
import Application from './application';
import { Plugin } from './plugin';

interface PluginManagerOptions {
  app: Application;
}

export interface InstallOptions {
  cliArgs?: any[];
  clean?: CleanOptions | boolean;
  sync?: SyncOptions;
}

class PluginManagerRepository extends Repository {
  getInstance(): Plugin {
    return;
  }
  async add(name: string | string[], options) {}
  async enable(name: string | string[], options) {}
  async disable(name: string | string[], options) {}
  async remove(name: string | string[], options) {}
  async upgrade(name: string | string[], options) {}
}

export class PluginManager {
  app: Application;
  collection: Collection;
  repository: PluginManagerRepository;
  plugins = new Map<string, Plugin>();

  constructor(options: PluginManagerOptions) {
    this.app = options.app;
    this.collection = this.app.db.collection({
      name: 'applicationPlugins',
      fields: [
        { type: 'string', name: 'name', unique: true },
        { type: 'string', name: 'version' },
        { type: 'boolean', name: 'enabled' },
        { type: 'json', name: 'options' },
      ],
    });
    this.repository = this.collection.repository as PluginManagerRepository;
    this.app.resourcer.define({
      name: 'pm',
      actions: {
        async add(ctx, next) {
          ctx.body = 'ok';
          await next();
        },
        async enable(ctx, next) {
          ctx.body = 'ok';
          await next();
        },
        async disable(ctx, next) {
          ctx.body = 'ok';
          await next();
        },
        async upgrade(ctx, next) {
          ctx.body = 'ok';
          await next();
        },
        async remove(ctx, next) {
          ctx.body = 'ok';
          await next();
        },
      },
    });
    this.app.on('beforeInstall', async () => {
      await this.collection.sync();
    });
    this.app.on('beforeLoadAll', async (options) => {
      const exists = await this.app.db.collectionExistsInDb('applicationPlugins');
      if (!exists) {
        return;
      }
      const items = await this.repository.find();
      for (const item of items) {
        await this.add(item);
      }
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

  private addByModel(model) {
    try {
      const packageName = this.getPackageName(model.get('name'));
      require.resolve(packageName);
      const cls = require(packageName).default;
      const instance = new cls(this.app, {
        ...model.get('options'),
        name: model.get('name'),
        version: model.get('version'),
        enabled: model.get('enabled'),
      });
      this.plugins.set(packageName, instance);
      return instance;
    } catch (error) {}
  }

  getPlugins() {
    return this.plugins;
  }

  get(name: string) {
    return this.plugins.get(name);
  }

  add<P = Plugin, O = any>(pluginClass: any, options?: O) {
    if (typeof pluginClass === 'string') {
      const packageName = this.getPackageName(pluginClass);
      const packageJson = require(`${packageName}/package.json`);
      const addNew = async () => {
        const model = await this.repository.create({
          values: {
            name: pluginClass,
            version: packageJson.version,
            enabled: true,
            options: {},
          },
        });
        return this.addByModel(model);
      };
      return addNew();
    }

    if (pluginClass instanceof Model) {
      return this.addByModel(pluginClass);
    }

    const instance = new pluginClass(this.app, options);

    const name = instance.getName();

    if (this.plugins.has(name)) {
      throw new Error(`plugin name [${name}] exists`);
    }

    this.plugins.set(name, instance);

    return instance;
  }

  async load() {
    await this.app.emitAsync('beforeLoadAll');

    for (const [name, plugin] of this.plugins) {
      await plugin.beforeLoad();
    }

    for (const [name, plugin] of this.plugins) {
      await this.app.emitAsync('beforeLoadPlugin', plugin);
      await plugin.load();
      await this.app.emitAsync('afterLoadPlugin', plugin);
    }

    await this.app.emitAsync('afterLoadAll');
  }

  async install(options: InstallOptions = {}) {
    for (const [name, plugin] of this.plugins) {
      await this.app.emitAsync('beforeInstallPlugin', plugin, options);
      await plugin.install(options);
      await this.app.emitAsync('afterInstallPlugin', plugin, options);
    }
  }

  static resolvePlugin(pluginName: string) {
    return require(pluginName).default;
  }
}

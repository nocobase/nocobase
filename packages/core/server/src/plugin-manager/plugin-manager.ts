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

function SwitchAppReadyStatus(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    this.app.setReadyStatus(false, `start ${originalMethod.name}`);
    const result = await originalMethod.apply(this, args);
    this.app.setReadyStatus(true, `end ${originalMethod.name}`);
    return result;
  };

  return descriptor;
}

export class PluginManager {
  app: Application;
  collection: Collection;
  repository: PluginManagerRepository;
  plugins = new Map<string, Plugin>();
  server: net.Server;
  _tmpPluginArgs = [];

  constructor(options: PluginManagerOptions) {
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
        await this.repository.load();
      }
    });

    this.app.on('beforeUpgrade', async () => {
      await this.collection.sync();
    });

    this.addStaticMultiple(options.plugins);
  }

  addStaticMultiple(plugins: any) {
    for (const plugin of plugins || []) {
      if (typeof plugin == 'string') {
        this.addStatic(plugin);
      } else {
        this.addStatic(...plugin);
      }
    }
  }

  getPlugins() {
    return this.plugins;
  }

  get(name: string) {
    return this.plugins.get(name);
  }

  has(name: string) {
    return this.plugins.has(name);
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

  clone() {
    const pm = new PluginManager({
      app: this.app,
    });
    for (const arg of this._tmpPluginArgs) {
      pm.addStatic(...arg);
    }
    return pm;
  }

  addStatic(plugin?: any, options?: any) {
    if (!options?.async) {
      this._tmpPluginArgs.push([plugin, options]);
    }

    let name: string;
    if (typeof plugin === 'string') {
      name = plugin;
      plugin = PluginManager.resolvePlugin(plugin);
    } else {
      name = plugin.name;
      if (!name) {
        throw new Error(`plugin name invalid`);
      }
    }

    const instance = new plugin(this.app, {
      name,
      enabled: true,
      ...options,
    });

    const pluginName = instance.getName();

    if (this.plugins.has(pluginName)) {
      throw new Error(`plugin name [${pluginName}] already exists`);
    }

    this.plugins.set(pluginName, instance);
    return instance;
  }

  async add(plugin: any, options: any = {}, transaction?: any) {
    if (Array.isArray(plugin)) {
      const t = transaction || (await this.app.db.sequelize.transaction());
      try {
        const items = [];

        for (const p of plugin) {
          items.push(await this.add(p, options, t));
        }

        await t.commit();
        return items;
      } catch (error) {
        await t.rollback();
        throw error;
      }
    }

    const packageName = await PluginManager.findPackage(plugin);

    const instance = this.addStatic(plugin, {
      ...options,
      async: true,
    });

    const model = await this.repository.findOne({
      transaction,
      filter: { name: plugin },
    });

    const packageJson = PluginManager.getPackageJson(packageName);

    if (!model) {
      const { enabled, builtIn, installed, ...others } = options;
      await this.repository.create({
        transaction,
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
    }
    return instance;
  }

  async load(options: any = {}) {
    this.app.setWorkingMessage('loading plugins...');

    const total = this.plugins.size;

    let current = 0;

    for (const [name, plugin] of this.plugins) {
      current += 1;

      this.app.setWorkingMessage(`before load plugin [${name}], ${current}/${total}`);
      if (!plugin.enabled) {
        continue;
      }

      this.app.logger.debug(`before load plugin [${name}]...`);
      await plugin.beforeLoad();
    }

    current = 0;
    for (const [name, plugin] of this.plugins) {
      current += 1;
      this.app.setWorkingMessage(`load plugin [${name}], ${current}/${total}`);

      if (!plugin.enabled) {
        continue;
      }

      await this.app.emitAsync('beforeLoadPlugin', plugin, options);
      this.app.logger.debug(`loading plugin [${name}]...`);
      await plugin.load();
      await this.app.emitAsync('afterLoadPlugin', plugin, options);
      this.app.logger.debug(`after load plugin [${name}]...`);
    }

    this.app.setWorkingMessage('loaded plugins');
  }

  async install(options: InstallOptions = {}) {
    this.app.setWorkingMessage('install plugins...');
    const total = this.plugins.size;

    let current = 0;

    for (const [name, plugin] of this.plugins) {
      current += 1;

      if (!plugin.enabled) {
        continue;
      }

      this.app.setWorkingMessage(`before install plugin [${name}], ${current}/${total}`);
      await this.app.emitAsync('beforeInstallPlugin', plugin, options);
      this.app.logger.debug(`install plugin [${name}]...`);
      await plugin.install(options);
      this.app.setWorkingMessage(`after install plugin [${name}], ${current}/${total}`);
      await this.app.emitAsync('afterInstallPlugin', plugin, options);
    }
  }

  @SwitchAppReadyStatus
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

  @SwitchAppReadyStatus
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

  @SwitchAppReadyStatus
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

  static resolvePlugin(pluginName: string) {
    const packageName = this.getPackageName(pluginName);
    return requireModule(packageName);
  }
}

export default PluginManager;

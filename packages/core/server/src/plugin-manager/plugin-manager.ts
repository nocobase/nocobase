import { CleanOptions, Collection, SyncOptions } from '@nocobase/database';
import execa from 'execa';
import fs from 'fs';
import net from 'net';
import { resolve, sep } from 'path';
import xpipe from 'xpipe';
import Application from '../application';
import { Plugin } from '../plugin';
import { clientStaticMiddleware, getChangelogUrl, getReadmeUrl } from './clientStaticMiddleware';
import collectionOptions from './options/collection';
import resourceOptions from './options/resource';
import { PluginManagerRepository } from './plugin-manager-repository';
import {
  updatePluginByCompressedFileUrl,
  checkCompatible,
  copyTempPackageToStorageAndLinkToNodeModules,
  downloadAndUnzipToTempDir,
  getCompatible,
  getNewVersion,
  getPluginInfoByNpm,
  removePluginPackage,
  requireModule,
  requireNoCache,
  removeTmpDir,
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

export class PluginManager {
  app: Application;
  collection: Collection;
  repository: PluginManagerRepository;
  plugins = new Map<string, Plugin>();
  server: net.Server;
  pmSock: string;
  _tmpPluginArgs = [];

  constructor(options: PluginManagerOptions) {
    this.app = options.app;
    const f = resolve(process.cwd(), 'storage', 'pm.sock');
    this.pmSock = xpipe.eq(this.app.options.pmSock || f);
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
          ctx.body = await Promise.all(
            ctx.body.map(async (plugin) => {
              const json = plugin.toJSON();
              let packageName;
              let packageJson;
              try {
                packageName = PluginManager.getPackageName(json.name);
                packageJson = PluginManager.getPackageJson(packageName);
              } catch (e) {
                return {
                  ...json,
                  error: true,
                };
              }
              let newVersion = undefined;

              try {
                newVersion = await getNewVersion(json);
              } catch (e) {
                console.error(e);
                newVersion = undefined;
              }

              return {
                ...json,
                packageName,
                displayName: packageJson[`displayName.${lng}`] || packageJson.displayName,
                description: packageJson[`description.${lng}`] || packageJson.description,
                readmeUrl: getReadmeUrl(packageName, lng),
                changelogUrl: getChangelogUrl(packageName),
                newVersion,
                isCompatible: checkCompatible(packageName),
              };
            }),
          );
          ctx.body = ctx.body.filter((item) => item);
        }
      }
    });

    this.app.acl.registerSnippet({
      name: 'pm',
      actions: ['pm:*', 'applicationPlugins:list'],
    });

    this.app.on('beforeLoad', async (app, options) => {
      await this.collection.sync();
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

  clientWrite(data: any) {
    const { method, plugins } = data;
    if (method === 'create') {
      try {
        console.log(method, plugins);
        this[method](plugins);
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
        await this[method](plugins);
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
          await this[method](plugins);
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

  async addByNpm(options: { packageName: string; registry: string; authToken?: string }) {
    let { registry, packageName, authToken } = options;
    registry = registry.trim();
    packageName = packageName.trim();
    authToken = authToken?.trim();
    const { compressedFileUrl } = await getPluginInfoByNpm({
      packageName,
      registry,
      authToken,
    });
    return this.addByCompressedFileUrl({ compressedFileUrl, registry, authToken, type: 'npm' });
  }

  async addByCompressedFileUrl(options: {
    compressedFileUrl: string;
    registry?: string;
    authToken?: string;
    type?: string;
  }) {
    const { compressedFileUrl, registry, type, authToken } = options;

    const { packageName, tempFile, tempPackageContentDir } = await downloadAndUnzipToTempDir(
      compressedFileUrl,
      authToken,
    );
    const name = this.getNameByPackageName(packageName);

    if (this.plugins.has(name)) {
      await removeTmpDir(tempFile, tempPackageContentDir);
      throw new Error(`plugin name [${name}] already exists`);
    }
    await copyTempPackageToStorageAndLinkToNodeModules(tempFile, tempPackageContentDir, packageName);
    return this.add(name, { packageName, compressedFileUrl, authToken, registry, type });
  }

  async upgradeByNpm(name: string) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`plugin name [${name}] not exists`);
    }
    if (!plugin.options.packageName || !plugin.options.registry) {
      throw new Error(`plugin name [${name}] not installed by npm`);
    }
    const { compressedFileUrl } = await getPluginInfoByNpm({
      packageName: plugin.options.packageName,
      registry: plugin.options.registry,
      authToken: plugin.options.authToken,
    });
    return this.upgradeByCompressedFileUrl({ compressedFileUrl, name });
  }

  async upgradeByCompressedFileUrl(options: { compressedFileUrl: string; name: string }) {
    const { name, compressedFileUrl } = options;
    const data = await this.repository.findOne({ filter: { name } });
    if (!data) {
      throw new Error(`plugin name [${name}] not exists`);
    }

    const { version } = await updatePluginByCompressedFileUrl({
      compressedFileUrl,
      packageName: data.packageName,
      authToken: data.authToken,
    });

    await this.addStatic(name, { ...data.toJSON(), compressedFileUrl, version }, true);
    await this.repository.upgrade(name, { version, compressedFileUrl });
    if (data.enabled) {
      const newPlugin = this.plugins.get(name);
      await this.load({}, new Map([[name, newPlugin]]));
    }
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

  addStatic(plugin?: any, options?: any, upgrade = false) {
    if (!options?.async) {
      this._tmpPluginArgs.push([plugin, options]);
    }

    let name: string;
    if (typeof plugin === 'string') {
      name = plugin;
      plugin = PluginManager.resolvePlugin(plugin, upgrade);
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

    if (!upgrade && this.plugins.has(pluginName)) {
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
      const { enabled, builtIn, installed, registry, packageName, authToken, compressedFileUrl, type, ...others } =
        options;
      await this.repository.create({
        transaction,
        values: {
          name: plugin,
          version: packageJson.version,
          enabled: !!enabled,
          builtIn: !!builtIn,
          installed: !!installed,
          registry,
          packageName,
          compressedFileUrl,
          type,
          authToken,
          options: {
            ...others,
          },
        },
      });
    }
    return instance;
  }

  async load(options: any = {}, plugins = this.plugins) {
    for (const [name, plugin] of plugins) {
      if (!plugin.enabled) {
        continue;
      }
      try {
        await plugin.beforeLoad();
      } catch (e) {
        await this.handleError(name, plugin.options.builtIn, e);
      }
    }

    for (const [name, plugin] of plugins) {
      if (!plugin.enabled) {
        continue;
      }
      try {
        await this.app.emitAsync('beforeLoadPlugin', plugin, options);
        await plugin.load();
        await this.app.emitAsync('afterLoadPlugin', plugin, options);
      } catch (e) {
        await this.handleError(name, plugin.options.builtIn, e);
      }
    }
  }

  async handleError(name: string, builtIn: boolean, error: Error) {
    if (!builtIn) {
      console.error(
        `plugin [${name}] load error, will disable it. error message: ${error.message}, stack: ${error.stack}`,
      );
      await this.disable(name);
    } else {
      throw error;
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

  async enable(name: string | string[]) {
    try {
      const pluginNames = await this.repository.enable(name);
      await this.app.reload();

      await this.app.db.sync();
      for (const pluginName of pluginNames) {
        const plugin = this.app.getPlugin(pluginName);
        if (!plugin) {
          throw new Error(`${name} plugin does not exist`);
        }
        if (!plugin.options.installed) {
          await plugin.install();
          plugin.options.installed = true;
        }
        await plugin.afterEnable();
      }

      await this.app.emitAsync('afterEnablePlugin', name);
    } catch (error) {
      throw error;
    }
  }

  async disable(name: string | string[]) {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  async remove(name: string | string[]) {
    const pluginNames = typeof name === 'string' ? [name] : name;
    for (const pluginName of pluginNames) {
      const plugin = this.app.getPlugin(pluginName);
      if (!plugin) {
        continue;
      }
      if (plugin.options.type && plugin.options.packageName) {
        await removePluginPackage(plugin.options.packageName);
      }
      await plugin.remove();
      this.plugins.delete(pluginName);
    }
    await this.repository.remove(name);
    this.app.reload();
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

  static resolvePlugin(pluginName: string, isUpgrade = false) {
    const packageName = this.getPackageName(pluginName);
    if (isUpgrade) {
      const packageNamePath = packageName.replace('/', sep);
      Object.keys(require.cache).forEach((key) => {
        if (key.includes(packageNamePath)) {
          delete require.cache[key];
        }
      });
    }
    return requireModule(packageName);
  }

  async detail(name: string) {
    const packageName = PluginManager.getPackageName(name);
    const packageJson = PluginManager.getPackageJson(packageName);
    const file = require.resolve(PluginManager.getPackageName(name));
    return {
      packageJson,
      depsCompatible: getCompatible(packageName),
      lastUpdated: fs.statSync(file).ctime,
    };
  }
}

export default PluginManager;

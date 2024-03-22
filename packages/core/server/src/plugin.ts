import { Model } from '@nocobase/database';
import { LoggerOptions } from '@nocobase/logger';
import { fsExists, importModule } from '@nocobase/utils';
import fs from 'fs';
import glob from 'glob';
import type { TFuncKey, TOptions } from 'i18next';
import { basename, resolve } from 'path';
import { Application } from './application';
import { InstallOptions, getExposeChangelogUrl, getExposeReadmeUrl } from './plugin-manager';
import { checkAndGetCompatible } from './plugin-manager/utils';

export interface PluginInterface {
  beforeLoad?: () => void;

  load();

  getName(): string;
}

export interface PluginOptions {
  activate?: boolean;
  displayName?: string;
  description?: string;
  version?: string;
  enabled?: boolean;
  install?: (this: Plugin) => void;
  load?: (this: Plugin) => void;
  plugin?: typeof Plugin;

  [key: string]: any;
}

export abstract class Plugin<O = any> implements PluginInterface {
  options: any;
  app: Application;

  /**
   * @deprecated
   */
  model: Model;

  /**
   * @internal
   */
  state: any = {};

  /**
   * @internal
   */
  private _sourceDir: string;

  constructor(app: Application, options?: any) {
    this.app = app;
    this.setOptions(options);
  }

  get log() {
    return this.app.log.child({
      reqId: this.app.context.reqId,
      module: this.name,
    });
  }

  get name() {
    return this.options.name as string;
  }

  get pm() {
    return this.app.pm;
  }

  get db() {
    return this.app.db;
  }

  get enabled() {
    return this.options.enabled;
  }

  set enabled(value) {
    this.options.enabled = value;
  }

  get installed() {
    return this.options.installed;
  }

  set installed(value) {
    this.options.installed = value;
  }

  get isPreset() {
    return this.options.isPreset;
  }

  getName() {
    return (this.options as any).name;
  }

  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }

  afterAdd() {}

  beforeLoad() {}

  async load() {}

  async install(options?: InstallOptions) {}

  async upgrade() {}

  async beforeEnable() {}

  async afterEnable() {}

  async beforeDisable() {}

  async afterDisable() {}

  async beforeRemove() {}

  async afterRemove() {}

  /**
   * @deprecated
   */
  async importCollections(collectionsPath: string) {}

  /**
   * @internal
   */
  setOptions(options: any) {
    this.options = options || {};
  }

  /**
   * @internal
   */
  protected async getSourceDir() {
    if (this._sourceDir) {
      return this._sourceDir;
    }
    if (await this.isDev()) {
      return (this._sourceDir = 'src');
    }
    if (basename(__dirname) === 'src') {
      return (this._sourceDir = 'src');
    }
    return (this._sourceDir = this.isPreset ? 'lib' : 'dist');
  }

  /**
   * @internal
   */
  async loadCommands() {
    const extensions = ['js', 'ts'];
    const directory = resolve(
      process.env.NODE_MODULES_PATH,
      this.options.packageName,
      await this.getSourceDir(),
      'server/commands',
    );
    const patten = `${directory}/*.{${extensions.join(',')}}`;
    const files = glob.sync(patten, {
      ignore: ['**/*.d.ts'],
    });
    for (const file of files) {
      let filename = basename(file);
      filename = filename.substring(0, filename.lastIndexOf('.')) || filename;
      const callback = await importModule(file);
      callback(this.app);
    }
    if (files.length) {
      this.app.log.debug(`load commands [${this.name}]`);
    }
  }

  /**
   * @internal
   */
  async loadMigrations() {
    this.app.log.debug(`load plugin migrations [${this.name}]`);
    if (!this.options.packageName) {
      return { beforeLoad: [], afterSync: [], afterLoad: [] };
    }
    const directory = resolve(
      process.env.NODE_MODULES_PATH,
      this.options.packageName,
      await this.getSourceDir(),
      'server/migrations',
    );
    return await this.app.loadMigrations({
      directory,
      namespace: this.options.packageName,
      context: {
        plugin: this,
      },
    });
  }

  /**
   * @internal
   */
  async loadCollections() {
    if (!this.options.packageName) {
      return;
    }
    const directory = resolve(
      process.env.NODE_MODULES_PATH,
      this.options.packageName,
      await this.getSourceDir(),
      'server/collections',
    );
    if (await fsExists(directory)) {
      await this.db.import({
        directory,
        from: this.options.packageName,
      });
    }
  }

  /**
   * @deprecated
   */
  requiredPlugins() {
    return [];
  }

  t(text: TFuncKey | TFuncKey[], options: TOptions = {}) {
    return this.app.i18n.t(text, { ns: this.options['packageName'], ...(options as any) });
  }

  /**
   * @internal
   */
  protected async isDev() {
    if (!this.options.packageName) {
      return false;
    }
    const file = await fs.promises.realpath(
      resolve(process.env.NODE_MODULES_PATH || resolve(process.cwd(), 'node_modules'), this.options.packageName),
    );
    if (file.startsWith(resolve(process.cwd(), 'packages'))) {
      return !!process.env.IS_DEV_CMD;
    }
    return false;
  }

  /**
   * @experimental
   */
  async toJSON(options: any = {}) {
    const { locale = 'en-US' } = options;
    const { name, packageName, packageJson } = this.options;
    if (!packageName) {
      return {
        ...this.options,
      };
    }

    const results = {
      ...this.options,
      keywords: packageJson.keywords,
      readmeUrl: getExposeReadmeUrl(packageName, locale),
      changelogUrl: getExposeChangelogUrl(packageName),
      displayName: packageJson[`displayName.${locale}`] || packageJson.displayName || name,
      description: packageJson[`description.${locale}`] || packageJson.description,
      homepage: packageJson[`homepage.${locale}`] || packageJson.homepage,
    };

    if (!options.withOutOpenFile) {
      const file = await fs.promises.realpath(
        resolve(process.env.NODE_MODULES_PATH || resolve(process.cwd(), 'node_modules'), packageName),
      );

      return {
        ...results,
        ...(await checkAndGetCompatible(packageName)),
        lastUpdated: (await fs.promises.stat(file)).ctime,
        file,
        updatable: file.startsWith(process.env.PLUGIN_STORAGE_PATH),
      };
    }

    return results;
  }
}

export default Plugin;

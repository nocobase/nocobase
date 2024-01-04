import { Model } from '@nocobase/database';
import { LoggerOptions } from '@nocobase/logger';
import fs from 'fs';
import type { TFuncKey, TOptions } from 'i18next';
import { resolve } from 'path';
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
  model: Model;
  state: any = {};

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

  setOptions(options: any) {
    this.options = options || {};
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

  async beforeEnable() {}

  async afterEnable() {}

  async beforeDisable() {}

  async afterDisable() {}

  async beforeRemove() {}

  async afterRemove() {}

  async importCollections(collectionsPath: string) {
    await this.db.import({
      directory: collectionsPath,
      from: this.getName(),
    });
  }

  requiredPlugins() {
    return [];
  }

  t(text: TFuncKey | TFuncKey[], options: TOptions = {}) {
    return this.app.i18n.t(text, { ns: this.options['packageName'], ...(options as any) });
  }

  async toJSON(options: any = {}) {
    const { locale = 'en-US' } = options;
    const { name, packageName, packageJson } = this.options;
    if (!packageName) {
      return {
        ...this.options,
      };
    }
    const file = await fs.promises.realpath(resolve(process.env.NODE_MODULES_PATH, packageName));
    const lastUpdated = (await fs.promises.stat(file)).ctime;
    const others = await checkAndGetCompatible(packageName);
    return {
      ...this.options,
      ...others,
      readmeUrl: getExposeReadmeUrl(packageName, locale),
      changelogUrl: getExposeChangelogUrl(packageName),
      lastUpdated,
      file,
      updatable: file.startsWith(process.env.PLUGIN_STORAGE_PATH),
      displayName: packageJson[`displayName.${locale}`] || packageJson.displayName || name,
      description: packageJson[`description.${locale}`] || packageJson.description,
    };
  }
}

export default Plugin;

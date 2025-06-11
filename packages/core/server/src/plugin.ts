/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { Model, Transactionable } from '@nocobase/database';
import { LoggerOptions } from '@nocobase/logger';
import { fsExists } from '@nocobase/utils';
import fs from 'fs';
import type { TFuncKey, TOptions } from 'i18next';
import { resolve } from 'path';
import { Application } from './application';
import { getExposeChangelogUrl, getExposeReadmeUrl, InstallOptions } from './plugin-manager';
import { checkAndGetCompatible, getPluginBasePath } from './plugin-manager/utils';
import { PubSubManagerPublishOptions } from './pub-sub-manager';

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

  async handleSyncMessage(message: any) {}
  async sendSyncMessage(message: any, options?: PubSubManagerPublishOptions & Transactionable) {
    if (!this.name) {
      throw new Error(`plugin name invalid`);
    }
    await this.app.syncMessageManager.publish(this.name, message, options);
  }

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
  async loadMigrations() {
    this.app.log.debug(`load plugin migrations [${this.name}]`);
    const basePath = await this.getPluginBasePath();
    if (!basePath) {
      return { beforeLoad: [], afterSync: [], afterLoad: [] };
    }
    const directory = resolve(basePath, 'server/migrations');
    return await this.app.loadMigrations({
      directory,
      namespace: this.options.packageName,
      context: {
        plugin: this,
      },
    });
  }

  private async getPluginBasePath() {
    if (!this.options.packageName) {
      this.app.log.trace(`plugin '${this.name}' is missing packageName`);
      return;
    }
    return getPluginBasePath(this.options.packageName);
  }

  /**
   * @internal
   */
  async loadCollections() {
    const basePath = await this.getPluginBasePath();
    if (!basePath) {
      return;
    }
    const directory = resolve(basePath, 'server/collections');
    if (await fsExists(directory)) {
      this.app.log.trace(`load plugin collections [${this.name}]`);
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

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BaseApplication } from './BaseApplication';
import type { Plugin, PluginOptions } from './Plugin';
import { getPlugins } from './utils/remotePlugins';

export type PluginClass<Opts = any, TApp extends BaseApplication<any> = BaseApplication<any>> = new (
  options: PluginOptions<Opts>,
  app: TApp,
) => Plugin<PluginOptions<Opts>, TApp>;
export type PluginType<Opts = any, TApp extends BaseApplication<any> = BaseApplication<any>> =
  | PluginClass<Opts, TApp>
  | [PluginClass<Opts, TApp>, PluginOptions<Opts>];
export type PluginClassLike<TApp extends BaseApplication<any> = BaseApplication<any>> = PluginClass<any, TApp>;
export type PluginTypeLike<TApp extends BaseApplication<any> = BaseApplication<any>> = PluginType<any, TApp>;
export type PluginData = {
  name: string;
  packageName: string;
  version: string;
  url: string;
  type: 'local' | 'upload' | 'npm';
};

export class PluginManager<TApp extends BaseApplication<any> = BaseApplication<any>> {
  protected pluginInstances: Map<PluginClass<any, TApp>, Plugin<any, TApp>> = new Map();
  protected pluginsAliases: Record<string, Plugin<any, TApp>> = {};
  private initPlugins: Promise<void>;
  private static readonly REMOTE_PLUGIN_RETRY_LIMIT = 12;
  private static readonly REMOTE_PLUGIN_RETRY_INITIAL_DELAY = 200;
  private static readonly REMOTE_PLUGIN_RETRY_MAX_DELAY = 2000;
  private static readonly REMOTE_PLUGIN_RETRY_AFTER_MAX_DELAY = 5000;

  constructor(
    protected _plugins: PluginType<any, TApp>[] | undefined,
    protected loadRemotePlugins: boolean | undefined,
    protected app: TApp,
  ) {
    this.app = app;
    this.initPlugins = this.init(_plugins || []);
    this.loadRemotePlugins = loadRemotePlugins;
  }

  /**
   * @internal
   */
  async init(_plugins: PluginType<any, TApp>[]) {
    await this.initStaticPlugins(_plugins);
    if (this.loadRemotePlugins) {
      await this.initRemotePlugins();
    }
  }

  private static getHeader(headers: any, name: string) {
    if (!headers) {
      return;
    }
    if (typeof headers.get === 'function') {
      return headers.get(name);
    }
    return headers[name] ?? headers[name.toLowerCase()];
  }

  private static getRetryAfterDelay(error: any) {
    const retryAfter = PluginManager.getHeader(error?.response?.headers, 'retry-after');
    if (!retryAfter) {
      return;
    }
    const value = String(retryAfter).trim();
    const seconds = Number(value);
    if (Number.isFinite(seconds)) {
      return Math.min(Math.max(0, seconds * 1000), PluginManager.REMOTE_PLUGIN_RETRY_AFTER_MAX_DELAY);
    }
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) {
      return Math.min(Math.max(0, timestamp - Date.now()), PluginManager.REMOTE_PLUGIN_RETRY_AFTER_MAX_DELAY);
    }
  }

  private static getRetryDelay(error: any, attempt: number) {
    const retryAfterDelay = PluginManager.getRetryAfterDelay(error);
    if (retryAfterDelay !== undefined) {
      return retryAfterDelay;
    }
    return Math.min(
      PluginManager.REMOTE_PLUGIN_RETRY_INITIAL_DELAY * 2 ** attempt,
      PluginManager.REMOTE_PLUGIN_RETRY_MAX_DELAY,
    );
  }

  protected getRemotePluginsRequestUrl() {
    return 'pm:listEnabledV2';
  }

  private async initStaticPlugins(_plugins: PluginType<any, TApp>[] = []) {
    for await (const plugin of _plugins) {
      const pluginClass = Array.isArray(plugin) ? plugin[0] : plugin;
      const opts = Array.isArray(plugin) ? plugin[1] : undefined;
      await this.add(pluginClass, opts);
    }
  }

  protected async requestRemotePluginList(): Promise<PluginData[]> {
    let res;
    for (let attempt = 0; attempt < PluginManager.REMOTE_PLUGIN_RETRY_LIMIT; attempt++) {
      try {
        res = await this.app.apiClient.request({ url: this.getRemotePluginsRequestUrl() });
        break;
      } catch (error) {
        const isMaintaining = !!error?.response?.data?.error?.maintaining;
        const isLastAttempt = attempt === PluginManager.REMOTE_PLUGIN_RETRY_LIMIT - 1;
        if (!isMaintaining || isLastAttempt) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, PluginManager.getRetryDelay(error, attempt)));
      }
    }

    return res?.data?.data || [];
  }

  protected async initRemotePlugins() {
    const pluginList = await this.requestRemotePluginList();
    const plugins = await getPlugins({
      requirejs: this.app.requirejs,
      pluginData: pluginList,
      devDynamicImport: this.app.devDynamicImport,
    });
    for await (const [name, pluginClass] of plugins) {
      const info = pluginList.find((item) => item.name === name);
      await this.add(pluginClass as any, info);
    }
  }

  async add<T = any>(plugin: PluginClass<T, TApp>, opts: PluginOptions<T> = {}) {
    const instance = this.getInstance(plugin, opts);

    this.pluginInstances.set(plugin, instance);

    if (opts.name) {
      this.pluginsAliases[opts.name] = instance;
    }

    if (opts.packageName) {
      this.pluginsAliases[opts.packageName] = instance;
    }

    await instance.afterAdd();
  }

  get<T extends PluginClass<any, TApp>>(PluginClass: T): InstanceType<T>;
  get<T extends {}>(name: string): T;
  get(nameOrPluginClass: any) {
    if (typeof nameOrPluginClass === 'string') {
      return this.pluginsAliases[nameOrPluginClass];
    }
    return this.pluginInstances.get(nameOrPluginClass.default || nameOrPluginClass);
  }

  protected getInstance<T>(plugin: PluginClass<T, TApp>, opts: PluginOptions<T> = {}) {
    return new plugin(opts, this.app);
  }

  /**
   * @internal
   */
  async load() {
    await this.initPlugins;

    for (const plugin of this.pluginInstances.values()) {
      await plugin.beforeLoad();
    }

    for (const plugin of this.pluginInstances.values()) {
      await plugin.load();
      this.app.eventBus.dispatchEvent(new CustomEvent(`plugin:${plugin.options.name}:loaded`, { detail: plugin }));
    }
  }
}

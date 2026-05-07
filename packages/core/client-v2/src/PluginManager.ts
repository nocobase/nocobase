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

  protected async initRemotePlugins() {
    const res = await this.app.apiClient.request({ url: this.getRemotePluginsRequestUrl() });
    const pluginList: PluginData[] = res?.data?.data || [];
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

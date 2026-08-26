/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { TFuncKey, TOptions } from 'i18next';
import type { BaseApplication } from './BaseApplication';
import { Application } from './Application';

/**
 * 插件配置选项。
 *
 * 作为 Plugin 类的泛型参数，描述插件注册时可接收的配置项。
 *
 * @template T 插件自定义配置类型
 */
export interface PluginOptions<T = any> {
  name?: string;
  packageName?: string;
  options?: any;
  config?: T;
  [key: string]: any;
}

export class Plugin<T extends PluginOptions<any> = PluginOptions, TApp extends BaseApplication<any> = Application> {
  constructor(
    public options: T,
    protected app: TApp,
  ) {
    this.options = options;
    this.app = app;
  }

  get pluginManager() {
    return this.app.pluginManager;
  }

  get context() {
    return this.app.context;
  }

  get flowEngine() {
    return this.app.flowEngine;
  }

  get engine() {
    return this.app.flowEngine;
  }

  get pm() {
    return this.app.pm;
  }

  get router() {
    return this.app.router;
  }

  get pluginSettingsManager() {
    return this.app.pluginSettingsManager;
  }

  get schemaInitializerManager() {
    // @ts-ignore
    return this.app.schemaInitializerManager;
  }

  get schemaSettingsManager() {
    // @ts-ignore
    return this.app.schemaSettingsManager;
  }

  get dataSourceManager() {
    // @ts-ignore
    return this.app.dataSourceManager;
  }

  get ai() {
    return this.app.aiManager;
  }

  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  t(text: TFuncKey | TFuncKey[], options: TOptions = {}) {
    return this.app.i18n.t(text, { ns: this.options?.packageName, ...(options as any) });
  }
}

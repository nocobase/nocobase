/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { EventManager } from './event-manager';
import { FilterManager } from './filter-manager';
export * from './event-manager';
export * from './filter-manager';
export * from './hooks';
export * from './types';

export class PluginEventFilterSystemClient extends Plugin {
  eventManager: EventManager;
  filterManager: FilterManager;

  constructor(options = {}, app) {
    super(options, app);
    this.eventManager = new EventManager();
    this.filterManager = new FilterManager();
  }

  async load() {
    // 注册事件管理器到应用
    this.app.eventManager = this.eventManager;
    // 注册过滤器管理器到应用
    this.app.filterManager = this.filterManager;

    // 扩展 app 类型以支持 TypeScript 提示
    // TypeScript 类型扩展在另一个文件中声明
  }
}

export default PluginEventFilterSystemClient;

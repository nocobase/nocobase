/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { set } from 'lodash';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

import { Icon } from '../icon';
import type { Application } from './Application';
import type { RouteType } from './RouterManager';

export const ADMIN_SETTINGS_KEY = 'admin.settings.';
export const ADMIN_SETTINGS_PATH = '/admin/settings/';
export const SNIPPET_PREFIX = 'pm.';

export interface PluginSettingOptions {
  title: any;
  /**
   * @default Outlet
   */
  Component?: RouteType['Component'];
  componentLoader?: RouteType['componentLoader'];
  icon?: string | ReactNode;
  /**
   * sort, the smaller the number, the higher the priority
   * @default 0
   */
  sort?: number;
  aclSnippet?: string;
  link?: string;
  isTopLevel?: boolean;
  isPinned?: boolean;
  [index: string]: any;
}

export interface PluginSettingsPageType {
  label?: string | ReactNode;
  title: string | ReactNode;
  link?: string;
  key: string;
  icon: ReactNode;
  path: string;
  sort?: number;
  name?: string;
  isAllow?: boolean;
  topLevelName?: string;
  aclSnippet: string;
  children?: PluginSettingsPageType[];
  [index: string]: any;
}

/**
 * client-v1 兼容版插件设置管理器。
 *
 * 继续保留旧的 dotted-key 注册协议，与 client-v2 的新两层实现完全脱钩。
 *
 * @example
 * ```typescript
 * app.pluginSettingsManager.add('system.test', { title: 'Test', Component: DemoPage });
 * ```
 */
export class PluginSettingsManager {
  protected settings: Record<string, PluginSettingOptions> = {};
  protected aclSnippets: string[] = [];
  public app: Application;
  private cachedList = {} as Record<string, PluginSettingsPageType[]>;

  constructor(_pluginSettings: Record<string, PluginSettingOptions> | undefined, app: Application) {
    this.app = app;
    if (_pluginSettings) {
      Object.entries(_pluginSettings || {}).forEach(([name, pluginSettingOptions]) => {
        this.add(name, pluginSettingOptions);
      });
    }
  }

  /**
   * 渲染图标字符串为 Icon 组件。
   *
   * @param {PluginSettingOptions['icon']} icon 图标定义
   * @returns {ReactNode} 图标节点
   */
  protected renderIcon(icon: PluginSettingOptions['icon']): ReactNode {
    return typeof icon === 'string' ? createElement(Icon as ComponentType<{ type: string }>, { type: icon }) : icon;
  }

  /**
   * 清理缓存。
   *
   * @returns {void}
   */
  clearCache() {
    this.cachedList = {};
  }

  /**
   * 设置 ACL snippets。
   *
   * @param {string[]} aclSnippets snippets 列表
   * @returns {void}
   */
  setAclSnippets(aclSnippets: string[]) {
    this.aclSnippets = aclSnippets;
    this.clearCache();
  }

  /**
   * 获取 ACL snippet。
   *
   * @param {string} name settings 名称
   * @returns {string | null} snippet
   */
  getAclSnippet(name: string) {
    const setting = this.settings[name];
    if (setting?.skipAclConfigure) {
      return null;
    }
    return setting?.aclSnippet ? setting.aclSnippet : `${SNIPPET_PREFIX}${name}`;
  }

  /**
   * 获取 route name。
   *
   * @param {string} name settings 名称
   * @returns {string} route name
   */
  getRouteName(name: string) {
    return `${ADMIN_SETTINGS_KEY}${name}`;
  }

  /**
   * 获取 route path。
   *
   * @param {string} name settings 名称
   * @returns {string} route path
   */
  getRoutePath(name: string) {
    return `${ADMIN_SETTINGS_PATH}${name.replaceAll('.', '/')}`;
  }

  /**
   * 追加 settings 配置。
   *
   * @param {string} name dotted settings key
   * @param {PluginSettingOptions} options 配置项
   * @returns {void}
   */
  add(name: string, options: PluginSettingOptions) {
    this.clearCache();
    const nameArr = name.split('.');
    const topLevelName = nameArr[0];
    this.settings[name] = {
      ...this.settings[name],
      Component: Outlet,
      ...options,
      name,
      topLevelName: options.topLevelName || topLevelName,
    };
    if (nameArr.length > 1) {
      set(this.settings, nameArr.join('.children.'), this.settings[name]);
    }

    this.app.router.add(this.getRouteName(name), {
      path: this.getRoutePath(name),
      Component: this.settings[name].Component,
      componentLoader: this.settings[name].componentLoader,
    });
  }

  /**
   * 删除 settings 配置。
   *
   * @param {string} name settings 名称
   * @returns {void}
   */
  remove(name: string) {
    this.clearCache();
    Object.keys(this.settings).forEach((key) => {
      if (key.startsWith(name)) {
        delete this.settings[key];
        this.app.router.remove(`${ADMIN_SETTINGS_KEY}${key}`);
      }
    });
  }

  /**
   * 判断 ACL 是否允许。
   *
   * @param {string} name settings 名称
   * @returns {boolean} 是否允许
   */
  hasAuth(name: string) {
    if (this.aclSnippets.includes(`!${this.getAclSnippet('*')}`)) return false;
    return this.aclSnippets.includes(`!${this.getAclSnippet(name)}`) === false;
  }

  /**
   * 获取内部原始设置。
   *
   * @param {string} name settings 名称
   * @returns {PluginSettingOptions | undefined} 原始设置
   */
  getSetting(name: string) {
    return this.settings[name];
  }

  /**
   * 判断配置是否存在且可访问。
   *
   * @param {string} name settings 名称
   * @returns {boolean} 是否存在
   */
  has(name: string) {
    const hasAuth = this.hasAuth(name);
    if (!hasAuth) return false;
    return !!this.getSetting(name);
  }

  /**
   * 获取 settings 快照。
   *
   * @param {string} name settings 名称
   * @param {boolean} [filterAuth=true] 是否过滤 ACL
   * @returns {PluginSettingsPageType | null} settings 快照
   */
  get(name: string, filterAuth = true): PluginSettingsPageType | null {
    const isAllow = this.hasAuth(name);
    const pluginSetting = this.getSetting(name);
    if ((filterAuth && !isAllow) || !pluginSetting) return null;
    const children = Object.keys(pluginSetting.children || {})
      .sort((a, b) => a.localeCompare(b))
      .map((key) => this.get(pluginSetting.children[key].name, filterAuth))
      .filter(Boolean)
      .sort((a, b) => (a?.sort || 0) - (b?.sort || 0));
    const { title, icon, aclSnippet, ...others } = pluginSetting;
    return {
      isTopLevel: name === pluginSetting.topLevelName,
      ...others,
      aclSnippet: this.getAclSnippet(name) as string,
      title,
      isAllow,
      label: title,
      icon: this.renderIcon(icon),
      path: this.getRoutePath(name),
      key: name,
      children: children.length ? (children as PluginSettingsPageType[]) : undefined,
    };
  }

  /**
   * 获取顶级 settings 列表。
   *
   * @param {boolean} [filterAuth=true] 是否过滤 ACL
   * @returns {PluginSettingsPageType[]} 顶级列表
   */
  getList(filterAuth = true): PluginSettingsPageType[] {
    const cacheKey = JSON.stringify(filterAuth);
    if (this.cachedList[cacheKey]) return this.cachedList[cacheKey];

    return (this.cachedList[cacheKey] = Array.from(
      new Set(Object.values(this.settings).map((item) => item.topLevelName)),
    )
      .sort((a, b) => a.localeCompare(b))
      .map((name) => this.get(name, filterAuth))
      .filter(Boolean)
      .sort((a, b) => (a?.sort || 0) - (b?.sort || 0)) as PluginSettingsPageType[]);
  }

  /**
   * 获取所有 ACL snippets。
   *
   * @returns {(string | null)[]} snippet 列表
   */
  getAclSnippets() {
    return Object.keys(this.settings)
      .map((name) => this.getAclSnippet(name))
      .filter(Boolean);
  }
}

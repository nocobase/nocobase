/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createElement, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

import type { BaseApplication } from './BaseApplication';
import { Icon } from './components';
import type { RouteType } from './RouterManager';

export const ADMIN_SETTINGS_KEY = 'admin.settings.';
export const ADMIN_SETTINGS_PATH = '/admin/settings/';
export const SNIPPET_PREFIX = 'pm.';

export interface PluginSettingsMenuItemOptions {
  key: string;
  title?: React.ReactNode;
  icon?: string | ReactNode;
  /**
   * sort, the smaller the number, the higher the priority
   *
   * @default 0
   */
  sort?: number;
  aclSnippet?: string;
  isPinned?: boolean;
  hidden?: boolean;
  showTabs?: boolean;
  [index: string]: any;
}

export interface PluginSettingsPageItemOptions {
  menuKey: string;
  key: string;
  title?: React.ReactNode;
  Component?: RouteType['Component'];
  componentLoader?: RouteType['componentLoader'];
  sort?: number;
  aclSnippet?: string;
  link?: string;
  hidden?: boolean;
  [index: string]: any;
}

export interface PluginSettingsPageType {
  readonly label?: React.ReactNode;
  readonly title?: React.ReactNode;
  readonly link?: string;
  readonly key: string;
  readonly menuKey: string;
  readonly pageKey?: string;
  readonly pluginKey?: string;
  readonly icon?: ReactNode;
  readonly path: string;
  readonly sort?: number;
  readonly name: string;
  readonly isAllow: boolean;
  readonly isTopLevel: boolean;
  readonly topLevelName: string;
  readonly aclSnippet: string | null;
  readonly isPinned?: boolean;
  readonly hidden?: boolean;
  readonly showTabs?: boolean;
  readonly Component?: RouteType['Component'];
  readonly componentLoader?: RouteType['componentLoader'];
  readonly children?: readonly PluginSettingsPageType[];
  readonly [index: string]: any;
}

interface InternalMenuItemRecord extends PluginSettingsMenuItemOptions {
  name: string;
  Component: RouteType['Component'];
}

interface InternalPageItemRecord extends PluginSettingsPageItemOptions {
  name: string;
}

/**
 * Client V2 settings 注册与查询管理器。
 *
 * 内部仅维护两层结构：menu item 与 page item。
 * 对外继续暴露稳定的查询接口，返回克隆后的快照，避免消费侧意外污染内部状态。
 *
 * @example
 * ```typescript
 * app.pluginSettingsManager.addMenuItem({ key: 'system-settings', title: 'System settings' });
 * app.pluginSettingsManager.addPageTabItem({ menuKey: 'system-settings', key: 'index', componentLoader: async () => ({ default: Page }) });
 * ```
 */
export class PluginSettingsManager<TApp extends BaseApplication<any> = BaseApplication<any>> {
  protected menus: Record<string, InternalMenuItemRecord> = {};
  protected pages: Record<string, InternalPageItemRecord> = {};
  protected aclSnippets: string[] = [];
  public app: TApp;

  private cachedList: Record<string, PluginSettingsPageType[]> = {};

  constructor(app: TApp) {
    this.app = app;
  }

  /**
   * 清理查询缓存。
   *
   * @returns {void}
   */
  clearCache() {
    this.cachedList = {};
  }

  /**
   * 设置 ACL snippets。
   *
   * @param {string[]} aclSnippets 当前角色的 snippets
   * @returns {void}
   */
  setAclSnippets(aclSnippets: string[]) {
    this.aclSnippets = aclSnippets;
    this.clearCache();
  }

  /**
   * 获取指定 settings 项的 ACL snippet。
   *
   * @param {string} name settings 名称
   * @returns {string | null} ACL snippet
   */
  getAclSnippet(name: string) {
    const item = this.menus[name] || this.pages[name];
    return item?.aclSnippet ?? `${SNIPPET_PREFIX}${name}`;
  }

  /**
   * 获取 route id。
   *
   * @param {string} name settings 名称
   * @returns {string} route id
   */
  getRouteName(name: string) {
    return `${ADMIN_SETTINGS_KEY}${name}`;
  }

  /**
   * 获取 settings 对应的绝对路径。
   *
   * @param {string} name menu 或 page 名称
   * @returns {string} settings 绝对路径
   */
  getRoutePath(name: string) {
    const { menuName, pageName } = this.parseName(name);
    const menuPath = `${ADMIN_SETTINGS_PATH}${menuName}`;

    if (!pageName || pageName === 'index') {
      return menuPath;
    }

    return `${menuPath}/${pageName}`;
  }

  /**
   * 注册或更新 menu item。
   *
   * @param {PluginSettingsMenuItemOptions} options menu 配置
   * @returns {void}
   * @throws {Error} 当路径与其他配置冲突时抛错
   */
  addMenuItem(options: PluginSettingsMenuItemOptions) {
    this.assertMenuKey(options.key, 'key');

    const menuName = options.key;
    const nextMenu: InternalMenuItemRecord = {
      ...this.menus[menuName],
      ...options,
      key: options.key,
      name: menuName,
      Component: Outlet,
    };

    this.assertPathConflict(menuName, this.getRoutePath(menuName));
    this.menus[menuName] = nextMenu;
    this.syncMenuRoute(nextMenu);
    this.clearCache();
  }

  /**
   * 注册或更新 page item。
   *
   * @param {PluginSettingsPageItemOptions} options page 配置
   * @returns {void}
   * @throws {Error} 当 menu 不存在或路径冲突时抛错
   */
  addPageTabItem(options: PluginSettingsPageItemOptions) {
    this.assertMenuKey(options.menuKey, 'menuKey');

    const menu = this.menus[options.menuKey];

    if (!menu) {
      throw new Error(`Plugin settings menuKey does not exist: menuKey=${options.menuKey}`);
    }

    const pageName = this.getPageName(options.menuKey, options.key);
    const nextPage: InternalPageItemRecord = {
      ...this.pages[pageName],
      ...options,
      menuKey: options.menuKey,
      key: options.key,
      name: pageName,
    };

    this.assertIndexConflict(nextPage);
    this.assertPathConflict(pageName, this.getRoutePath(pageName));

    this.pages[pageName] = nextPage;
    this.syncPageRoute(nextPage);
    this.clearCache();
  }

  /**
   * 删除 menu 或 page。
   *
   * 删除 menu 时会级联删除其下全部 pages；删除 page 时仅删除单页。
   *
   * @param {string} name menu 或 page 名称
   * @returns {void}
   */
  remove(name: string) {
    const menu = this.menus[name];
    const page = this.pages[name];

    if (!menu && !page) {
      return;
    }

    const routeNames: string[] = [];

    if (menu) {
      const pageNames = this.getPageNamesByMenu(name);

      delete this.menus[name];
      routeNames.push(this.getRouteName(name));

      pageNames.forEach((pageName) => {
        delete this.pages[pageName];
        routeNames.push(this.getRouteName(pageName));
      });
    } else if (page) {
      delete this.pages[name];
      routeNames.push(this.getRouteName(name));
    }

    routeNames.forEach((routeName) => {
      this.app.router.remove(routeName);
    });
    this.clearCache();
  }

  /**
   * 判断当前 settings 是否有权限访问。
   *
   * @param {string} name settings 名称
   * @returns {boolean} 是否允许访问
   */
  hasAuth(name: string) {
    const allBlockedSnippet = this.getAclSnippet('*');

    if (allBlockedSnippet && this.aclSnippets.includes(`!${allBlockedSnippet}`)) {
      return false;
    }

    const aclSnippet = this.getAclSnippet(name);
    if (!aclSnippet) {
      return true;
    }

    return this.aclSnippets.includes(`!${aclSnippet}`) === false;
  }

  /**
   * 判断指定 settings 是否已注册。
   *
   * 该判断不受 ACL 与 hidden 影响。
   *
   * @param {string} name menu 或 page 名称
   * @returns {boolean} 是否已注册
   */
  has(name: string) {
    return !!(this.menus[name] || this.pages[name]);
  }

  /**
   * 获取单个 menu 或 page 的只读快照。
   *
   * @param {string} name menu 或 page 名称
   * @param {boolean} [filterAuth=true] 是否按 ACL 过滤
   * @returns {PluginSettingsPageType | null} 快照结果
   */
  get(name: string, filterAuth = true): PluginSettingsPageType | null {
    const snapshot = this.buildSnapshot(name, {
      filterAuth,
      includeHidden: true,
    });

    return snapshot ? this.cloneSnapshot(snapshot) : null;
  }

  /**
   * 获取顶级 menu 列表的只读快照。
   *
   * @param {boolean} [filterAuth=true] 是否按 ACL 过滤
   * @returns {PluginSettingsPageType[]} 顶级 menu 列表
   */
  getList(filterAuth = true): PluginSettingsPageType[] {
    const cacheKey = JSON.stringify({ filterAuth, includeHidden: true });

    if (!this.cachedList[cacheKey]) {
      this.cachedList[cacheKey] = this.sortMenuNames()
        .map((name) => this.buildSnapshot(name, { filterAuth, includeHidden: true }))
        .filter(Boolean) as PluginSettingsPageType[];
    }

    return this.cachedList[cacheKey].map((item) => this.cloneSnapshot(item));
  }

  /**
   * 获取全部已注册 settings 的 ACL snippets。
   *
   * @returns {(string | null)[]} ACL snippets
   */
  getAclSnippets() {
    return [...this.sortMenuNames(), ...this.sortPageNames(Object.keys(this.pages))]
      .map((name) => this.getAclSnippet(name))
      .filter(Boolean);
  }

  protected renderIcon(icon: PluginSettingsMenuItemOptions['icon']): ReactNode {
    if (!icon) {
      return null;
    }

    if (typeof icon === 'string') {
      return createElement(Icon, { type: icon });
    }

    return icon;
  }

  private buildSnapshot(
    name: string,
    options: {
      filterAuth: boolean;
      includeHidden: boolean;
    },
  ): PluginSettingsPageType | null {
    const menu = this.menus[name];
    if (menu) {
      return this.buildMenuSnapshot(menu, options);
    }

    const page = this.pages[name];
    if (page) {
      return this.buildPageSnapshot(page, options);
    }

    return null;
  }

  private buildMenuSnapshot(
    menu: InternalMenuItemRecord,
    options: {
      filterAuth: boolean;
      includeHidden: boolean;
    },
  ) {
    const menuIsAllow = this.hasAuth(menu.name);

    const children = this.sortPageNames(this.getPageNamesByMenu(menu.key))
      .map((pageName) => this.buildPageSnapshot(this.pages[pageName], options))
      .filter(Boolean) as PluginSettingsPageType[];
    const isAllow = menuIsAllow || children.some((child) => child.isAllow);

    if (options.filterAuth && children.length === 0) {
      return null;
    }

    if (!options.includeHidden && menu.hidden) {
      return null;
    }

    const { title, icon, aclSnippet, key, name, Component, ...others } = menu;

    return {
      ...others,
      key: name,
      menuKey: key,
      pluginKey: name,
      name,
      title,
      label: title,
      icon: this.renderIcon(icon),
      path: this.getRoutePath(name),
      sort: menu.sort,
      isAllow,
      isTopLevel: true,
      topLevelName: name,
      aclSnippet: this.getAclSnippet(name),
      Component,
      children: children.length ? children : undefined,
    } satisfies PluginSettingsPageType;
  }

  private buildPageSnapshot(
    page: InternalPageItemRecord,
    options: {
      filterAuth: boolean;
      includeHidden: boolean;
    },
  ) {
    const isAllow = this.hasAuth(page.name);

    if (options.filterAuth && !isAllow) {
      return null;
    }

    if (!options.includeHidden && page.hidden) {
      return null;
    }

    const { title, aclSnippet, key, menuKey, name, ...others } = page;

    return {
      ...others,
      key: name,
      menuKey,
      pageKey: key,
      pluginKey: menuKey,
      name,
      title,
      label: title,
      path: this.getRoutePath(name),
      sort: page.sort,
      isAllow,
      isTopLevel: false,
      topLevelName: menuKey,
      aclSnippet: this.getAclSnippet(name),
      children: undefined,
    } satisfies PluginSettingsPageType;
  }

  private cloneSnapshot(snapshot: PluginSettingsPageType): PluginSettingsPageType {
    return {
      ...snapshot,
      children: snapshot.children?.map((item) => this.cloneSnapshot(item)),
    };
  }

  private sortMenuNames(menuNames = Object.keys(this.menus)) {
    return [...menuNames].sort((a, b) => {
      const menuA = this.menus[a];
      const menuB = this.menus[b];
      const sortA = menuA?.sort || 0;
      const sortB = menuB?.sort || 0;

      if (sortA !== sortB) {
        return sortA - sortB;
      }

      return a.localeCompare(b);
    });
  }

  private sortPageNames(pageNames: string[]) {
    return [...pageNames].sort((a, b) => {
      const pageA = this.pages[a];
      const pageB = this.pages[b];
      const sortA = pageA?.sort || 0;
      const sortB = pageB?.sort || 0;

      if (sortA !== sortB) {
        return sortA - sortB;
      }

      return a.localeCompare(b);
    });
  }

  private getPageNamesByMenu(menuKey: string) {
    return Object.keys(this.pages).filter((name) => this.pages[name].menuKey === menuKey);
  }

  private getPageName(menuKey: string, key: string) {
    return `${menuKey}.${key}`;
  }

  private parseName(name: string) {
    const separatorIndex = name.indexOf('.');

    if (separatorIndex < 0) {
      return { menuName: name, pageName: undefined };
    }

    return {
      menuName: name.slice(0, separatorIndex),
      pageName: name.slice(separatorIndex + 1),
    };
  }

  private syncMenuRoute(menu: InternalMenuItemRecord) {
    this.app.router.add(this.getRouteName(menu.name), {
      path: menu.key,
      Component: Outlet,
    });
  }

  private syncPageRoute(page: InternalPageItemRecord) {
    const fallbackComponent = page.Component || Outlet;

    if (page.key === 'index') {
      this.app.router.add(this.getRouteName(page.name), {
        index: true,
        Component: fallbackComponent,
        componentLoader: page.componentLoader,
      });
      return;
    }

    this.app.router.add(this.getRouteName(page.name), {
      path: page.key,
      Component: fallbackComponent,
      componentLoader: page.componentLoader,
    });
  }

  private assertIndexConflict(page: InternalPageItemRecord) {
    if (page.key !== 'index') {
      return;
    }

    const existedIndexPage = this.getPageNamesByMenu(page.menuKey).find((name) => this.pages[name].key === 'index');

    if (existedIndexPage && existedIndexPage !== page.name) {
      throw new Error(
        `Plugin settings page index conflict: menuKey=${page.menuKey}, key=${page.key}, existed=${existedIndexPage}`,
      );
    }
  }

  private assertPathConflict(name: string, path: string) {
    const registeredEntries = [
      ...this.sortMenuNames().map((menuName) => ({ name: menuName, path: this.getRoutePath(menuName) })),
      ...this.sortPageNames(Object.keys(this.pages)).map((pageName) => ({
        name: pageName,
        path: this.getRoutePath(pageName),
      })),
    ];

    const conflict = registeredEntries.find((item) => {
      if (item.path !== path || item.name === name) {
        return false;
      }

      return !this.isMenuIndexPair(item.name, name);
    });

    if (conflict) {
      throw new Error(`Plugin settings path conflict: name=${name}, path=${path}, conflict=${conflict.name}`);
    }
  }

  private isMenuIndexPair(leftName: string, rightName: string) {
    const menuIndexPairs = new Set([`${leftName}.index`, `${rightName}.index`]);
    return menuIndexPairs.has(rightName) || menuIndexPairs.has(leftName);
  }

  private assertMenuKey(value: string, fieldName: 'key' | 'menuKey') {
    if (!value.includes('.')) {
      return;
    }

    throw new Error(`Plugin settings menu key cannot contain ".": ${fieldName}=${value}`);
  }
}

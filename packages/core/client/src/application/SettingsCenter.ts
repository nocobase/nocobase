import { set } from 'lodash';
import { createElement } from 'react';

import type { Application } from './Application';
import type { RouteType } from './RouterManager';
import { Icon } from '../icon';

const ADMIN_SETTINGS_KEY = 'admin.settings.';
const ADMIN_SETTINGS_PATH = '/admin/settings/';
const SNIPPET_PREFIX = 'pm.';

export interface SettingOptionsType {
  title: string;
  Component: RouteType['Component'];
  icon?: string;
  /**
   * sort, the smaller the number, the higher the priority
   * @default 0
   */
  sort?: number;
  isBookmark?: boolean;
  [index: string]: any;
}

export interface SettingPageType {
  label?: string;
  title: string;
  key: string;
  icon: any;
  path: string;
  sort?: number;
  isBookmark?: boolean;
  children?: SettingPageType[];
  [index: string]: any;
}

export class SettingsCenter {
  protected settings: Record<string, SettingOptionsType> = {};
  protected snippets: string[] = [];

  constructor(protected app: Application) {
    this.app = app;
  }

  setRoleSnippets(snippets: string[]) {
    this.snippets = snippets;
  }

  getSnippetKey(name: string) {
    return `${SNIPPET_PREFIX}${name}`;
  }

  getRouteName(name: string) {
    return `${ADMIN_SETTINGS_KEY}${name}`;
  }

  getRoutePath(name: string) {
    return `${ADMIN_SETTINGS_PATH}${name.replaceAll('.', '/')}`;
  }

  add(name: string, options: SettingOptionsType) {
    this.settings[name] = { ...options, name };

    // add children
    set(this.settings, name.replaceAll('.', '.children.'), this.settings[name]);

    // add route
    this.app.router.add(this.getRouteName(name), {
      path: this.getRoutePath(name),
      Component: options.Component,
    });
  }

  remove(name: string) {
    // delete self and children
    Object.keys(this.settings).forEach((key) => {
      if (key.startsWith(name)) {
        delete this.settings[key];
        this.app.router.remove(`${ADMIN_SETTINGS_KEY}${key}`);
      }
    });
  }

  hasAuth(name: string) {
    return this.snippets.includes(`!${this.getSnippetKey(name)}`) === false;
  }

  getSetting(name: string): SettingOptionsType & { children?: Record<string, SettingOptionsType> } {
    const hasAuth = this.hasAuth(name);
    if (hasAuth) return this.settings[name];
  }

  has(name: string) {
    return !!this.getSetting(name);
  }

  get(name: string, filterAuth = true): SettingPageType {
    const isAllow = this.hasAuth(name);
    if (filterAuth && !isAllow) return null;
    const pluginSetting = this.getSetting(name);
    const children = Object.keys(pluginSetting.children || {})
      .map((key) => this.get(pluginSetting.children[key].name, filterAuth))
      .filter(Boolean)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));
    const { title, icon, ...others } = pluginSetting;
    return {
      ...others,
      title,
      isAllow,
      label: title,
      icon: typeof icon === 'string' ? createElement(Icon, { type: icon }) : icon,
      key: this.getSnippetKey(name),
      path: this.getRoutePath(name),
      children: children.length ? children : undefined,
    };
  }

  getList(filterAuth = true): SettingPageType[] {
    return Object.keys(this.settings)
      .filter((item) => !item.includes('.')) // top level
      .map((name) => this.get(name, filterAuth))
      .filter(Boolean)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  getSnippetKeys() {
    return Object.keys(this.settings).map((name) => this.getSnippetKey(name));
  }
}

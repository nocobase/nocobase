import { set } from 'lodash';
import type { Application } from './Application';
import type { RouteType } from './RouterManager';

const ADMIN_SETTINGS_KEY = 'admin.settings.';
const ADMIN_SETTINGS_PATH = '/admin/settings/';

export interface SettingOptionsType {
  Component: RouteType['Component'];
  title?: string;
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
  title?: string;
  icon?: any;
  key: string;
  sort?: number;
  path: string;
  isBookmark?: boolean;
  children?: SettingPageType[];
  [index: string]: any;
}

type TransformMenuFnType<T extends SettingPageType> = (menu: SettingPageType) => T;

export class SettingsCenter {
  public settings: Record<string, SettingOptionsType> = {};

  constructor(protected app: Application) {
    this.app = app;
  }

  add(name: string, options: SettingOptionsType) {
    this.settings[name] = { ...options, name };
    set(this.settings, name.replaceAll('.', '.children.'), { ...options, name });
    this.app.router.add(`${ADMIN_SETTINGS_KEY}${name}`, {
      path: this.getRoutePath(name),
      Component: options.Component,
    });
  }

  remove(name: string) {
    // 删除自身和子页面
    Object.keys(this.settings).forEach((key) => {
      if (key.startsWith(name)) {
        delete this.settings[key];
        this.app.router.remove(`${ADMIN_SETTINGS_KEY}${key}`);
      }
    });
  }

  get(name: string) {
    return this.settings[name];
  }

  getRoutePath(name: string) {
    return `${ADMIN_SETTINGS_PATH}${name.replaceAll('.', '/')}`;
  }

  getSettingPage<T extends SettingPageType = SettingPageType>(
    pluginSetting: SettingOptionsType,
    transform?: TransformMenuFnType<SettingPageType>,
  ): T | undefined {
    if (pluginSetting) {
      const children = Object.keys(pluginSetting.children || {})
        .map((key) => this.getSettingPage(pluginSetting.children[key], transform))
        .filter(Boolean)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));
      const res: SettingPageType = {
        ...pluginSetting,
        label: pluginSetting.title,
        key: pluginSetting.name,
        path: this.getRoutePath(pluginSetting.name),
        children: children.length ? children : undefined,
      };
      return transform ? transform(res) : (res as any);
    }
  }

  getList<T extends SettingPageType>(transform?: TransformMenuFnType<SettingPageType>) {
    return Object.keys(this.settings)
      .filter((item) => !item.includes('.'))
      .map((name) => this.getSettingPage<T>(this.settings[name], transform))
      .filter(Boolean)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }
}

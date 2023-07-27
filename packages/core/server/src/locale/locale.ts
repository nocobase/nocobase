import { Cache, createCache } from '@nocobase/cache';
import { lodash } from '@nocobase/utils';
import Application from '../application';
import { PluginManager } from '../plugin-manager';
import { getAntdLocale } from './antd';
import { getCronstrueLocale } from './cronstrue';
import { getResource } from './resource';

export class Locale {
  app: Application;
  cache: Cache;
  defaultLang = 'en-US';

  constructor(app: Application) {
    this.app = app;
    this.cache = createCache();

    this.app.on('afterLoad', () => this.load());
  }

  load() {
    this.getCacheResources(this.defaultLang);
  }

  async get(lang: string) {
    return {
      antd: await this.wrapCache(`locale:antd:${lang}`, () => getAntdLocale(lang)),
      cronstrue: await this.wrapCache(`locale:cronstrue:${lang}`, () => getCronstrueLocale(lang)),
      resources: await this.getCacheResources(lang),
    };
  }

  async wrapCache(key: string, fn: () => any) {
    const result = await this.cache.get(key);
    if (result) {
      return result;
    }
    const value = await fn();
    if (lodash.isEmpty(value)) {
      return value;
    }
    await this.cache.set(key, value);
    return value;
  }

  async getCacheResources(lang: string) {
    return await this.wrapCache(`locale:resources:${lang}`, () => this.getResources(lang));
  }

  getResources(lang: string) {
    const resources = {};
    const plugins = this.app.pm.getPlugins();
    for (const name of plugins.keys()) {
      try {
        const packageName = PluginManager.getPackageName(name);
        const res = getResource(packageName, lang);
        if (res) {
          resources[name] = { ...res };
        }
      } catch (err) {
        // empty
      }
    }
    const res = getResource('@nocobase/client', lang, false);
    if (res) {
      resources['client'] = { ...(resources['client'] || {}), ...res };
    }
    return resources;
  }
}

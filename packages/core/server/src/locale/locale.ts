import { Cache, createCache } from '@nocobase/cache';
import { lodash } from '@nocobase/utils';
import Application from '../application';
import { PluginManager } from '../plugin-manager';
import { getResource } from './resource';

export class Locale {
  app: Application;
  cache: Cache;
  defaultLang = 'en-US';
  localeFn = new Map();

  constructor(app: Application) {
    this.app = app;
    this.cache = createCache();

    this.app.on('afterLoad', () => this.load());
  }

  load() {
    this.getCacheResources(this.defaultLang);
  }

  setLocaleFn(name: string, fn: (lang: string) => Promise<any>) {
    this.localeFn.set(name, fn);
  }

  async get(lang: string) {
    const defaults = {
      resources: await this.getCacheResources(lang),
    };
    for (const [name, fn] of this.localeFn) {
      const result = await this.wrapCache(`locale:${name}:${lang}`, async () => await fn(lang));
      if (result) {
        defaults[name] = result;
      }
    }
    return defaults;
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

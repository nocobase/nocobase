import { Cache } from '@nocobase/cache';
import { lodash } from '@nocobase/utils';
import Application from '../application';
import { getResource } from './resource';

export class Locale {
  app: Application;
  cache: Cache;
  defaultLang = 'en-US';
  localeFn = new Map();
  resourceCached = new Map();
  i18nInstances = new Map();

  constructor(app: Application) {
    this.app = app;
    this.app.on('afterLoad', async () => {
      this.app.log.debug('load locale resource', { submodule: 'locale', method: 'onAfterLoad' });
      this.app.setMaintainingMessage('load locale resource');
      await this.load();
      this.app.log.debug('locale resource loaded', { submodule: 'locale', method: 'onAfterLoad' });
      this.app.setMaintainingMessage('locale resource loaded');
    });
  }

  async load() {
    this.cache = await this.app.cacheManager.createCache({
      name: 'locale',
      prefix: 'locale',
      store: 'memory',
    });

    await this.get(this.defaultLang);
  }

  setLocaleFn(name: string, fn: (lang: string) => Promise<any>) {
    this.localeFn.set(name, fn);
  }

  async get(lang: string) {
    const defaults = {
      resources: await this.getCacheResources(lang),
    };
    for (const [name, fn] of this.localeFn) {
      // this.app.log.debug(`load [${name}] locale resource `);
      const result = await this.wrapCache(`${name}:${lang}`, async () => await fn(lang));
      if (result) {
        defaults[name] = result;
      }
    }
    return defaults;
  }

  async wrapCache(key: string, fn: () => any) {
    return await this.cache.wrapWithCondition(key, fn, {
      isCacheable: (val: any) => !lodash.isEmpty(val),
    });
  }

  async loadResourcesByLang(lang: string) {
    if (!this.cache) {
      return;
    }
    if (!this.resourceCached.has(lang)) {
      await this.getCacheResources(lang);
    }
  }

  async getCacheResources(lang: string) {
    this.resourceCached.set(lang, true);
    if (process.env.APP_ENV !== 'production') {
      await this.cache.reset();
    }
    return await this.wrapCache(`resources:${lang}`, () => this.getResources(lang));
  }

  getResources(lang: string) {
    const resources = {};
    const names = this.app.pm.getAliases();
    for (const name of names) {
      try {
        const p = this.app.pm.get(name);
        if (!p) {
          continue;
        }
        const packageName: string = p.options?.packageName;
        if (!packageName) {
          continue;
        }
        // this.app.log.debug(`load [${packageName}] locale resource `);
        // this.app.setMaintainingMessage(`load [${packageName}] locale resource `);
        const res = getResource(packageName, lang);
        if (res) {
          resources[packageName] = { ...res };
          if (packageName.includes('@nocobase/plugin-')) {
            resources[packageName.substring('@nocobase/plugin-'.length)] = { ...res };
          }
        }
      } catch (err) {
        // empty
      }
    }
    Object.keys(resources).forEach((name) => {
      this.app.i18n.addResources(lang, name, resources[name]);
    });

    return resources;
  }

  async getI18nInstance(lang: string) {
    if (lang === '*' || !lang) {
      return this.app.i18n.cloneInstance({ initImmediate: false });
    }
    let instance = this.i18nInstances.get(lang);
    if (!instance) {
      instance = this.app.i18n.cloneInstance({ initImmediate: false });
      this.i18nInstances.set(lang, instance);
    }
    return instance;
  }
}

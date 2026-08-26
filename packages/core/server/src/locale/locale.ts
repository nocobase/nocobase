/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache } from '@nocobase/cache';
import { Registry, lodash } from '@nocobase/utils';
import Application from '../application';
import { OFFICIAL_PLUGIN_PREFIX } from '../constants';
import { getResource } from './resource';
import deepmerge from 'deepmerge';

export interface ResourceStorer {
  getResources(lang: string): Promise<{
    [ns: string]: Record<string, string>;
  }>;
  reset?: () => Promise<void>;
}

export type LocaleSourceText = {
  text: string;
  module: string;
};

export type LocaleSource = {
  title: string;
  sync?: (ctx: any) => Promise<{
    [module: string]: {
      [text: string]: string;
    };
  }>;
  namespace?: string;
  collections?: {
    collection: string;
    fields?: string[];
    getTexts?: (instance: any, options?: any) => LocaleSourceText[] | Promise<LocaleSourceText[]>;
  }[];
};

export class Locale {
  app: Application;
  cache: Cache;
  defaultLang = 'en-US';
  localeFn = new Map();
  resourceCached = new Map();
  i18nInstances = new Map();
  resourceStorers = new Registry<ResourceStorer>();
  sources = new Registry<LocaleSource>();

  constructor(app: Application) {
    this.app = app;
    this.app.on('afterLoad', async () => {
      this.app.log.debug('loading locale resource...', { submodule: 'locale', method: 'onAfterLoad' });
      this.app.setMaintainingMessage('load locale resource');
      await this.load();
      this.app.log.debug('locale resource loaded', { submodule: 'locale', method: 'onAfterLoad' });
      this.app.setMaintainingMessage('locale resource loaded');
    });
    this.app.syncMessageManager.subscribe('localeManager', async (message) => {
      switch (message.type) {
        case 'reload':
          await this.reset();
          return;
      }
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

  async reset() {
    const storers = Array.from(this.resourceStorers.getValues());
    const promises = storers.map((storer) => storer.reset());
    await Promise.all([this.cache.reset(), ...promises]);
  }

  async reload() {
    await this.reset();
    this.app.syncMessageManager.publish('localeManager', { type: 'reload' });
  }

  setLocaleFn(name: string, fn: (lang: string) => Promise<any>) {
    this.localeFn.set(name, fn);
  }

  registerResourceStorer(name: string, storer: ResourceStorer) {
    this.resourceStorers.register(name, storer);
  }

  registerSource(name: string, source: LocaleSource) {
    this.sources.register(name, source);
  }

  async syncSources(ctx: any, types: string[]) {
    const resources: { [module: string]: any } = { client: {} };
    const sources = Array.from(this.sources.getKeys());
    const syncSources = sources.filter((source) => types.includes(source) && this.sources.get(source).sync);
    const promises = syncSources.map((source) => this.sources.get(source).sync(ctx));
    const results = await Promise.all(promises);
    return results.reduce((result, resource) => {
      Object.entries(resource).forEach(([module, texts]) => {
        result[module] = {
          ...(result[module] || {}),
          ...texts,
        };
      });
      return result;
    }, resources);
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
      await this.reload();
    }
    return await this.wrapCache(`resources:${lang}`, () => this.getResources(lang));
  }

  async getBuiltInResources(lang: string) {
    const resources = {};
    const names = this.app.pm.getPlugins().keys();
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
        const res = await getResource(packageName, lang);
        if (res) {
          resources[packageName] = { ...res };
          if (packageName.includes(OFFICIAL_PLUGIN_PREFIX)) {
            resources[packageName.substring(OFFICIAL_PLUGIN_PREFIX.length)] = { ...res };
          }
        }
      } catch (err) {
        // empty
      }
    }

    return resources;
  }

  async getResources(lang: string) {
    const resources = await this.getBuiltInResources(lang);

    // handle custom resources
    const storers = this.resourceStorers.getValues();
    for (const storer of storers) {
      const custom = await storer.getResources(lang);
      Object.keys(custom).forEach((key) => {
        const module = key.replace('resources.', '');
        const resource = resources[module];
        const customResource = custom[key];
        resources[module] = resource ? deepmerge(resource, customResource) : customResource;
        const pkgName = `${OFFICIAL_PLUGIN_PREFIX}${module}`;
        if (resources[pkgName]) {
          resources[pkgName] = { ...resources[module] };
        }
      });
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

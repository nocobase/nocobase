/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { InstallOptions, OFFICIAL_PLUGIN_PREFIX, Plugin } from '@nocobase/server';
import localization from './actions/localization';
import localizationTexts from './actions/localizationTexts';
import Resources from './resources';
import { getTextsFromDBRecord } from './utils';
import { NAMESPACE_COLLECTIONS } from './constants';
import { SourceManager } from './source-manager';
import { tval } from '@nocobase/utils';
// @ts-ignore
import pkg from '../../package.json';

export class PluginLocalizationServer extends Plugin {
  resources: Resources;
  sourceManager = new SourceManager();

  addNewTexts = async (texts: { text: string; module: string }[], options?: any) => {
    texts = await this.resources.filterExists(texts, options?.transaction);
    await this.db
      .getModel('localizationTexts')
      .bulkCreate(
        texts.map(({ text, module }) => ({
          module,
          text,
        })),
        {
          transaction: options?.transaction,
        },
      )
      .then((newTexts) => {
        this.resources.updateCacheTexts(newTexts, options?.transaction);
        this.sendSyncMessage(
          {
            type: 'updateCacheTexts',
            texts: newTexts,
          },
          { transaction: options?.transaction },
        );
      })
      .catch((err) => {
        this.log.error(err);
      });
  };

  afterAdd() {
    this.app.on('afterLoad', () => this.sourceManager.handleTextsSaved(this.db, this.addNewTexts));
  }

  beforeLoad() {}

  async load() {
    this.app.resourceManager.define({
      name: 'localizationTexts',
      actions: localizationTexts,
    });
    this.app.resourceManager.define({
      name: 'localization',
      actions: localization,
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.localization`,
      actions: ['localization:*', 'localizationTexts:*', 'localizationTranslations:*'],
    });

    this.app.localeManager.registerResourceStorer('plugin-localization', {
      getResources: (lang: string) => this.resources.getResources(lang),
      reset: () => this.resources.reset(),
    });

    const cache = await this.app.cacheManager.createCache({
      name: 'localization',
      prefix: 'localization',
      store: 'memory',
    });
    this.resources = new Resources(this.db, cache);

    this.sourceManager.registerSource('local', {
      title: tval('System & Plugins', { ns: pkg.name }),
      sync: async (ctx) => {
        const resources = await ctx.app.localeManager.getCacheResources(ctx.get('X-Locale') || 'en-US');
        const result = {};
        Object.entries(resources).forEach(([module, resource]) => {
          if (module.startsWith(OFFICIAL_PLUGIN_PREFIX)) {
            const name = module.replace(OFFICIAL_PLUGIN_PREFIX, '');
            if (resources[name]) {
              return;
            }
          }
          result[module] = resource;
        });
        return result;
      },
    });
    this.sourceManager.registerSource('db', {
      title: tval('Collections & Fields', { ns: pkg.name }),
      namespace: NAMESPACE_COLLECTIONS,
      sync: async (ctx) => {
        const db = ctx.db;
        const result = {};
        const collections = Array.from(db.collections.values());
        for (const collection of collections) {
          const fields = Array.from(collection.fields.values())
            .filter((field) => field.options?.translation)
            .map((field) => field.name);
          if (!fields.length) {
            continue;
          }
          const repo = db.getRepository(collection.name);
          const records = await repo.find({ fields });
          records.forEach((record) => {
            const texts = getTextsFromDBRecord(fields, record);
            texts.forEach((text) => (result[text] = ''));
          });
        }
        return {
          [NAMESPACE_COLLECTIONS]: result,
        };
      },
    });

    this.db.on('afterSave', async (instance: Model, options?: any) => {
      const module = `resources.${NAMESPACE_COLLECTIONS}`;
      const model = instance.constructor as typeof Model;
      const collection = model.collection;
      if (!collection) {
        return;
      }
      const texts = [];
      const fields = Array.from(collection.fields.values())
        .filter((field) => field.options?.translation && instance['_changed'].has(field.name))
        .map((field) => field.name);
      if (!fields.length) {
        return;
      }
      const textsFromDB = getTextsFromDBRecord(fields, instance);
      textsFromDB.forEach((text) => {
        texts.push({ text, module });
      });
      await this.addNewTexts(texts, options);
    });
  }

  async handleSyncMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'updateCacheTexts':
        await this.resources.updateCacheTexts(message.texts);
        return;
    }
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginLocalizationServer;

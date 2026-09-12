/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import type { LocaleSource } from '@nocobase/server';
import { InstallOptions, OFFICIAL_PLUGIN_PREFIX, Plugin } from '@nocobase/server';
import localization from './actions/localization';
import aiTranslate from './actions/aiTranslate';
import localizationTexts from './actions/localizationTexts';
import Resources from './resources';
import { getTextsFromDBRecord } from './utils';
import { NAMESPACE_COLLECTIONS } from './constants';
import { tval } from '@nocobase/utils';
import { AsyncTasksManager } from '@nocobase/plugin-async-task-manager';
import { LocalizationAITranslateTask } from './tasks/localization-ai-translate';
// @ts-ignore
import pkg from '../../package.json';

export class PluginLocalizationServer extends Plugin {
  resources: Resources;
  private aiTranslateTaskRegistered = false;
  private localeSourceTextHookKeys = new Set<string>();

  normalizeResourceModule(module: string) {
    const prefix = 'resources.';
    const namespace = module.startsWith(prefix) ? module.slice(prefix.length) : module;
    const normalizedNamespace = namespace.startsWith(OFFICIAL_PLUGIN_PREFIX)
      ? namespace.replace(OFFICIAL_PLUGIN_PREFIX, '')
      : namespace;
    return `${prefix}${normalizedNamespace}`;
  }

  addNewTexts = async (texts: { text: string; module: string }[], options?: { transaction?: any; locale?: string }) => {
    texts = texts.map(({ text, module }) => ({
      text,
      module: this.normalizeResourceModule(module),
    }));
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
      .then(async (newTexts) => {
        this.resources.updateCacheTexts(newTexts, options?.transaction);
        this.sendSyncMessage(
          {
            type: 'updateCacheTexts',
            texts: newTexts,
          },
          { transaction: options?.transaction },
        );
        if (options?.locale && newTexts?.length) {
          await this.db.getModel('localizationTranslations').bulkCreate(
            newTexts.map((text) => ({
              locale: options.locale,
              translation: text.get('text'),
              textId: text.get('id'),
            })),
            {
              transaction: options?.transaction,
            },
          );
        }
      })
      .catch((err) => {
        this.log.error(err);
      });
  };

  afterAdd() {
    this.app.on('afterLoad', () => this.handleLocaleSourceTextsSaved());
    this.app.on('afterLoad', () => this.registerAITranslateTaskType());
  }

  beforeLoad() {}

  private registerAITranslateTaskType() {
    if (this.aiTranslateTaskRegistered) {
      return;
    }
    try {
      const taskManager = this.app.container.get('AsyncTaskManager') as AsyncTasksManager;
      taskManager.registerTaskType(LocalizationAITranslateTask);
      this.aiTranslateTaskRegistered = true;
    } catch (error) {
      this.log.warn('AsyncTaskManager is not available, skip localization AI translate task registration.');
    }
  }

  async load() {
    this.registerAITranslateTaskType();

    this.app.resourceManager.define({
      name: 'localizationTexts',
      actions: localizationTexts,
    });
    this.app.resourceManager.define({
      name: 'localization',
      actions: {
        ...localization,
        ...aiTranslate,
      },
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.localization`,
      actions: ['localization:*', 'localizationTexts:*', 'localizationTranslations:*'],
    });
    this.app.acl.registerSnippet({
      name: 'ui.localization',
      actions: ['localizationTexts:missing'],
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

    this.app.localeManager.registerSource('local', {
      title: tval('System & Plugins', { ns: pkg.name }),
      sync: async (ctx) => {
        const resources = await ctx.app.localeManager.getBuiltInResources(ctx.get('X-Locale') || 'en-US');
        const result: Record<string, Record<string, string>> = {};
        Object.entries(resources).forEach(([module, resource]) => {
          const name = module.startsWith(OFFICIAL_PLUGIN_PREFIX) ? module.replace(OFFICIAL_PLUGIN_PREFIX, '') : module;
          result[name] = {
            ...(result[name] || {}),
            ...(resource as Record<string, string>),
          };
        });
        return result;
      },
    });
    this.app.localeManager.registerSource('db', {
      title: tval('Collections & Fields', { ns: pkg.name }),
      namespace: NAMESPACE_COLLECTIONS,
      sync: async (ctx) => {
        const db = ctx.db;
        const result = {};
        const collections = Array.from(db.collections.values()) as any[];
        for (const collection of collections) {
          const fields = (
            Array.from(collection.fields.values()) as {
              name: string;
              options?: { translation?: boolean };
            }[]
          )
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
      const collection = model.collection as any;
      if (!collection) {
        return;
      }
      const texts = [];
      const fields = (Array.from(collection.fields.values()) as { name: string; options?: { translation?: boolean } }[])
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

  private handleLocaleSourceTextsSaved() {
    for (const [sourceName, source] of this.app.localeManager.sources.getEntities() as Iterable<
      [string, LocaleSource]
    >) {
      if (!source.collections) {
        continue;
      }
      for (const [index, collectionOptions] of source.collections.entries()) {
        const hookKey = `${sourceName}:${index}:${collectionOptions.collection}`;
        if (this.localeSourceTextHookKeys.has(hookKey)) {
          continue;
        }
        this.localeSourceTextHookKeys.add(hookKey);
        this.db.on(`${collectionOptions.collection}.afterSave`, async (instance: Model, options) => {
          let texts = [];
          if (collectionOptions.getTexts) {
            texts = await collectionOptions.getTexts(instance, options);
          } else {
            const fields = collectionOptions.fields || [];
            const changedFields = fields.filter((field) => instance['_changed'].has(field));
            if (!changedFields.length) {
              return;
            }
            texts = changedFields
              .map((field) => instance.get(field))
              .filter(Boolean)
              .map((text) => ({ text, module: `resources.${source.namespace}` }));
          }
          if (!texts?.length) {
            return;
          }
          await this.addNewTexts(texts, options);
        });
      }
    }
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

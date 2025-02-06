/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import PluginUISchemaStorageServer from '@nocobase/plugin-ui-schema-storage';
import { InstallOptions, Plugin } from '@nocobase/server';
import localization from './actions/localization';
import localizationTexts from './actions/localizationTexts';
import Resources from './resources';
import { getTextsFromDBRecord } from './utils';
import { NAMESPACE_COLLECTIONS, NAMESPACE_MENUS } from './constans';

export class PluginLocalizationServer extends Plugin {
  resources: Resources;

  registerUISchemahook(plugin?: PluginUISchemaStorageServer) {
    const uiSchemaStoragePlugin = plugin || this.app.getPlugin<PluginUISchemaStorageServer>('ui-schema-storage');
    if (!uiSchemaStoragePlugin) {
      return;
    }

    uiSchemaStoragePlugin.serverHooks.register('onSelfSave', 'extractTextToLocale', async ({ schemaInstance }) => {
      const module = `resources.${NAMESPACE_MENUS}`;
      const schema = schemaInstance.get('schema');
      const title = schema?.title || schema?.['x-component-props']?.title;
      if (!title) {
        return;
      }
      const result = await this.resources.filterExists([{ text: title, module }]);
      if (!result.length) {
        return;
      }
      this.db
        .getRepository('localizationTexts')
        .create({
          values: {
            module,
            text: title,
          },
        })
        .then((res) => {
          this.resources.updateCacheTexts([res]);
          this.sendSyncMessage({
            type: 'updateCacheTexts',
            texts: [res],
          });
        })
        .catch((err) => {
          this.log.error(err);
        });
    });
  }

  afterAdd() {}

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

    this.db.on('afterSave', async (instance: Model, options) => {
      const module = `resources.${NAMESPACE_COLLECTIONS}`;
      const model = instance.constructor as typeof Model;
      const collection = model.collection;
      if (!collection) {
        return;
      }
      let texts = [];
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
      texts = await this.resources.filterExists(texts, options?.transaction);
      this.db
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
    });

    const cache = await this.app.cacheManager.createCache({
      name: 'localization',
      prefix: 'localization',
      store: 'memory',
    });
    this.resources = new Resources(this.db, cache);

    this.registerUISchemahook();

    this.app.localeManager.registerResourceStorer('plugin-localization', {
      getResources: (lang: string) => this.resources.getResources(lang),
      reset: () => this.resources.reset(),
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

  async afterDisable() {
    const uiSchemaStoragePlugin = this.app.getPlugin<PluginUISchemaStorageServer>('ui-schema-storage');
    if (!uiSchemaStoragePlugin) {
      return;
    }
    uiSchemaStoragePlugin.serverHooks.remove('onSelfSave', 'extractTextToLocale');
  }

  async remove() {}
}

export default PluginLocalizationServer;

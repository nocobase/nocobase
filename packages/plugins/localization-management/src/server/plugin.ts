import { Cache, createCache } from '@nocobase/cache';
import { Model } from '@nocobase/database';
import { UiSchemaStoragePlugin } from '@nocobase/plugin-ui-schema-storage';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import localization from './actions/localization';
import { CACHE_KEY } from './constans';
import { getTextsFromDBRecord } from './utils';

export class LocalizationManagementPlugin extends Plugin {
  cache: Cache;

  async getCacheTexts() {
    const texts = ((await this.cache.get(CACHE_KEY)) as string[]) || [];
    return texts;
  }

  async setCacheTexts(texts: string[]) {
    const oldTexts = await this.getCacheTexts();
    const newTexts = [...oldTexts, ...texts];
    await this.cache.set(CACHE_KEY, newTexts);
  }

  async loadTexts() {
    const result = await this.db.getRepository('localizationTexts').find({
      fields: ['text'],
    });
    const texts = result.map((item) => item.text);
    await this.cache.set(CACHE_KEY, texts);
  }

  registerUISchemahook(plugin?: UiSchemaStoragePlugin) {
    const uiSchemaStoragePlugin = plugin || this.app.getPlugin<UiSchemaStoragePlugin>('ui-schema-storage');
    if (!uiSchemaStoragePlugin) {
      return;
    }

    uiSchemaStoragePlugin.serverHooks.register('onSelfSave', 'extractTextToLocale', async ({ schemaInstance }) => {
      const title = schemaInstance.get('schema')?.title;
      if (!title) {
        return;
      }
      const cacheTexts = await this.getCacheTexts();
      if (cacheTexts.includes(title)) {
        return;
      }
      this.db
        .getRepository('localizationTexts')
        .create({
          values: {
            module: 'resources.client',
            text: title,
          },
        })
        .then(() => this.setCacheTexts([title]))
        .catch((err) => {});
    });
  }

  afterAdd() {}

  beforeLoad() {}

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.db.addMigrations({
      namespace: 'localization-management',
      directory: resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
    });

    this.app.resource({
      name: 'localization',
      actions: localization,
    });

    this.app.acl.allow('localization', 'all', 'public');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.localization`,
      actions: ['localization:*'],
    });

    this.db.on('afterSave', async (instance: Model) => {
      const model = instance.constructor as typeof Model;
      const collection = model.collection;
      const cacheTexts = await this.getCacheTexts();
      const texts = [];
      const fields = Array.from(collection.fields.values())
        .filter((field) => field.options?.translation && instance['_changed'].has(field.name))
        .map((field) => field.name);
      if (!fields.length) {
        return;
      }
      const textsFromDB = getTextsFromDBRecord(fields, instance);
      textsFromDB.forEach((text) => {
        if (!cacheTexts.includes(text)) {
          texts.push(text);
        }
      });

      this.db
        .getModel('localizationTexts')
        .bulkCreate(texts.map((text) => ({ module: 'resources.client', text })))
        .then(() => this.setCacheTexts(texts))
        .catch((err) => {});
    });

    this.cache = createCache();

    // ui-schema-storage loaded before localization-management
    this.registerUISchemahook();

    this.app.on('afterLoadPlugin', async (plugin) => {
      if (plugin.name === 'ui-schema-storage') {
        // ui-schema-storage loaded after localization-management
        this.registerUISchemahook(plugin);
      }
      if (plugin.name === 'localization-management') {
        await this.loadTexts();
      }
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default LocalizationManagementPlugin;

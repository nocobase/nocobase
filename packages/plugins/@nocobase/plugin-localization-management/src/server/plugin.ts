import { Model } from '@nocobase/database';
import { UiSchemaStoragePlugin } from '@nocobase/plugin-ui-schema-storage';
import { InstallOptions, Plugin } from '@nocobase/server';
import deepmerge from 'deepmerge';
import { resolve } from 'path';
import localization from './actions/localization';
import localizationTexts from './actions/localizationTexts';
import Resources from './resources';
import { getTextsFromDBRecord } from './utils';
import { NAMESPACE_COLLECTIONS, NAMESPACE_MENUS } from './constans';

export class LocalizationManagementPlugin extends Plugin {
  resources: Resources;

  registerUISchemahook(plugin?: UiSchemaStoragePlugin) {
    const uiSchemaStoragePlugin = plugin || this.app.getPlugin<UiSchemaStoragePlugin>('ui-schema-storage');
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
        .then((res) => this.resources.updateCacheTexts([res]))
        .catch((err) => {});
    });
  }

  afterAdd() {}

  beforeLoad() {}

  async load() {
    await this.importCollections(resolve(__dirname, 'collections'));

    this.db.addMigrations({
      namespace: 'localization-management',
      directory: resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
    });

    this.app.resource({
      name: 'localizationTexts',
      actions: localizationTexts,
    });

    this.app.resource({
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
        .then((newTexts) => this.resources.updateCacheTexts(newTexts, options?.transaction))
        .catch((err) => {});
    });

    const cache = await this.app.cacheManager.createCache({
      name: 'localization',
      prefix: 'localization',
      store: 'memory',
    });
    this.resources = new Resources(this.db, cache);

    this.registerUISchemahook();

    this.app.resourcer.use(async (ctx, next) => {
      await next();
      const { resourceName, actionName } = ctx.action.params;
      if (resourceName === 'app' && actionName === 'getLang') {
        const custom = await this.resources.getResources(ctx.get('X-Locale') || 'en-US');
        const appLang = ctx.body;
        const resources = { ...appLang.resources };
        Object.keys(custom).forEach((key) => {
          const module = key.replace('resources.', '');
          const resource = appLang.resources[module];
          const customResource = custom[key];
          resources[module] = resource ? deepmerge(resource, customResource) : customResource;
        });
        ctx.body = {
          ...appLang,
          resources,
        };
      }
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {
    const uiSchemaStoragePlugin = this.app.getPlugin<UiSchemaStoragePlugin>('ui-schema-storage');
    if (!uiSchemaStoragePlugin) {
      return;
    }
    uiSchemaStoragePlugin.serverHooks.remove('onSelfSave', 'extractTextToLocale');
  }

  async remove() {}
}

export default LocalizationManagementPlugin;

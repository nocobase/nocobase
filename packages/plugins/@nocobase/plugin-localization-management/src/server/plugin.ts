import { Model } from '@nocobase/database';
import { UiSchemaStoragePlugin } from '@nocobase/plugin-ui-schema-storage';
import { InstallOptions, Plugin } from '@nocobase/server';
import deepmerge from 'deepmerge';
import { resolve } from 'path';
import localization from './actions/localization';
import localizationTexts from './actions/localizationTexts';
import Resources from './resources';
import { getTextsFromDBRecord } from './utils';

export class LocalizationManagementPlugin extends Plugin {
  resources: Resources;

  registerUISchemahook(plugin?: UiSchemaStoragePlugin) {
    const uiSchemaStoragePlugin = plugin || this.app.getPlugin<UiSchemaStoragePlugin>('ui-schema-storage');
    if (!uiSchemaStoragePlugin) {
      return;
    }

    uiSchemaStoragePlugin.serverHooks.register('onSelfSave', 'extractTextToLocale', async ({ schemaInstance }) => {
      const schema = schemaInstance.get('schema');
      const title = schema?.title || schema?.['x-component-props']?.title;
      if (!title) {
        return;
      }
      const result = await this.resources.filterExists([title]);
      if (!result.length) {
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
        .then((res) => this.resources.updateCacheTexts([res]))
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

    this.db.on('afterSave', async (instance: Model) => {
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
        texts.push(text);
      });
      texts = await this.resources.filterExists(texts);
      this.db
        .getModel('localizationTexts')
        .bulkCreate(texts.map((text) => ({ module: 'resources.client', text })))
        .then((newTexts) => this.resources.updateCacheTexts(newTexts))
        .catch((err) => {});
    });

    this.resources = new Resources(this.db);

    this.registerUISchemahook();

    this.app.resourcer.use(async (ctx, next) => {
      await next();
      const { resourceName, actionName } = ctx.action.params;
      if (resourceName === 'app' && actionName === 'getLang') {
        const custom = await this.resources.getResources(ctx.get('X-Locale') || 'en-US');
        const appLang = ctx.body;
        const resources = {};
        Object.keys(appLang.resources).forEach((key) => {
          const resource = custom[`resources.${key}`];
          resources[key] = resource ? deepmerge(appLang.resources[key], resource) : { ...appLang.resources[key] };
        });
        // For duplicate texts, use translations from client to override translations in other modules
        const client = resources['client'] || {};
        Object.keys(resources).forEach((key) => {
          if (key === 'client') {
            return;
          }
          Object.keys(resources[key]).forEach((text) => {
            if (client[text]) {
              resources[key][text] = client[text];
            }
          });
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

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
      const title = schemaInstance.get('schema')?.title;
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
      actions: ['localization:*', 'localizationTexts:*'],
    });

    this.db.on('afterSave', async (instance: Model) => {
      if (!this.enabled) {
        return;
      }
      const model = instance.constructor as typeof Model;
      const collection = model.collection;
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

    // ui-schema-storage loaded before localization-management
    this.registerUISchemahook();

    this.app.on('afterLoadPlugin', async (plugin) => {
      if (plugin.name === 'ui-schema-storage') {
        // ui-schema-storage loaded after localization-management
        this.registerUISchemahook(plugin);
      }
    });

    this.app.resourcer.use(async (ctx, next) => {
      await next();
      const { resourceName, actionName } = ctx.action.params;
      if (resourceName === 'app' && actionName === 'getLang') {
        const custom = await this.resources.getResources(ctx.get('X-Locale') || 'en-US');
        const appLang = ctx.body;
        Object.keys(appLang.resources).forEach((key) => {
          if (custom[`resources.${key}`]) {
            appLang.resources[key] = deepmerge(appLang.resources[key], custom[`resources.${key}`]);
          }
        });
        // For duplicate texts, use translations from client to override translations in other modules
        const client = appLang.resources.client || {};
        Object.keys(appLang.resources).forEach((key) => {
          if (key === 'client') {
            return;
          }
          Object.keys(appLang.resources[key]).forEach((text) => {
            if (client[text]) {
              appLang.resources[key][text] = client[text];
            }
          });
        });
        ctx.body = appLang;
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

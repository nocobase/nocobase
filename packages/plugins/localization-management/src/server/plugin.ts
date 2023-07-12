import { Model } from '@nocobase/database';
import { UiSchemaStoragePlugin } from '@nocobase/plugin-ui-schema-storage';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import localization from './actions/localization';
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
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default LocalizationManagementPlugin;

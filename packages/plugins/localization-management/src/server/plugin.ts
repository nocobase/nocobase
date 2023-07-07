import { Model } from '@nocobase/database';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import localization from './actions/localization';
import { getTextsFromDBRecord } from './utils';

export class LocalizationManagementPlugin extends Plugin {
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
      const texts = [];

      // if (collection.name === 'uiSchemas') {
      //   const schema = instance.get('schema');
      //   texts.push(...getTextsFromUISchema(schema));
      // } else {
      const fields = Array.from(collection.fields.values())
        .filter((field) => field.options?.translation && instance['_changed'].has(field.name))
        .map((field) => field.name);
      if (!fields.length) {
        return;
      }
      texts.push(...getTextsFromDBRecord(fields, instance));
      // }

      this.db
        .getModel('localizationTexts')
        .bulkCreate(
          texts.map((text) => ({ module: 'resources.client', text })),
          {
            ignoreDuplicates: true,
          },
        )
        .catch((err) => {});
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default LocalizationManagementPlugin;

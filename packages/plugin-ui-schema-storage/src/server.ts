import { MagicAttributeModel } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import path from 'path';
import { uiSchemaActions } from './actions/ui-schema-action';
import UiSchemaRepository from './repository';

export default class PluginUiSchema extends Plugin {
  registerRepository() {
    this.app.db.registerRepositories({
      UiSchemaRepository,
    });
  }

  async beforeLoad() {
    const db = this.app.db;

    this.app.db.registerModels({ MagicAttributeModel });

    this.registerRepository();

    db.on('ui_schemas.beforeCreate', function setUid(model) {
      model.set('uid', model.get('x-uid'));
    });

    db.on('ui_schemas.afterCreate', async function insertSchema(model, options) {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection('ui_schemas').repository as UiSchemaRepository;

      await uiSchemaRepository.insert(model.toJSON(), {
        transaction,
      });
    });

    db.on('ui_schemas.afterUpdate', async function patchSchema(model, options) {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection('ui_schemas').repository as UiSchemaRepository;

      await uiSchemaRepository.patch(model.toJSON(), {
        transaction,
      });
    });

    this.app.resourcer.define({
      name: 'ui_schemas',
      actions: uiSchemaActions,
    });
  }

  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }
}

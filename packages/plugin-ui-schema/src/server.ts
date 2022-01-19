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

  async load() {
    const db = this.app.db;

    this.app.db.registerModels({ MagicAttributeModel });

    this.registerRepository();

    await db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    db.on('ui_schemas.beforeCreate', (model) => {
      model.set('uid', model.get('x-uid'));
    });

    db.on('ui_schemas.afterCreate', async (model, options) => {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection('ui_schemas').repository as UiSchemaRepository;

      await uiSchemaRepository.insert(model.toJSON(), {
        transaction,
      });
    });

    db.on('ui_schemas.afterUpdate', async (model, options) => {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection('ui_schemas').repository as UiSchemaRepository;

      await uiSchemaRepository.patch(model.toJSON(), {
        transaction,
      });
    });

    await db.getCollection('ui_schemas').sync({
      force: false,
      alter: {
        drop: false,
      },
    });

    await db.getCollection('ui_schema_tree_path').sync({
      force: false,
      alter: {
        drop: false,
      },
    });

    this.app.resourcer.define({
      name: 'ui_schemas',
      actions: uiSchemaActions,
    });
  }
}

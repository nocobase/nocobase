import { Plugin } from '@nocobase/server';
import path from 'path';
import { uiSchemaActions } from './actions/ui-schema-action';
import UiSchemaRepository from './repository';
import { UiSchemaModel } from './model';

export default class PluginUiSchema extends Plugin {
  registerRepository() {
    this.app.db.registerRepositories({
      UiSchemaRepository,
    });
  }

  registerModel() {
    this.app.db.registerModels({
      UiSchemaModel,
    });
  }

  async load() {
    const db = this.app.db;

    this.registerRepository();

    await db.import({
      directory: path.resolve(__dirname, 'collections'),
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

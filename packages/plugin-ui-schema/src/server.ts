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

    this.registerRepository();

    await db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    this.app.resourcer.define({
      name: 'ui_schemas',
      actions: uiSchemaActions,
    });
  }
}

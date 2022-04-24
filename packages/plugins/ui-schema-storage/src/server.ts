import { MagicAttributeModel } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import path from 'path';
import { uiSchemaActions } from './actions/ui-schema-action';
import { UiSchemaModel } from './model';
import UiSchemaRepository from './repository';
import { ServerHooks } from './server-hooks';
import { ServerHookModel } from './server-hooks/model';

export class UiSchemaStoragePlugin extends Plugin {
  serverHooks: ServerHooks;

  registerRepository() {
    this.app.db.registerRepositories({
      UiSchemaRepository,
    });
  }

  async beforeLoad() {
    const db = this.app.db;

    this.serverHooks = new ServerHooks(db);

    this.app.db.registerModels({ MagicAttributeModel, UiSchemaModel, ServerHookModel });

    this.registerRepository();

    db.on('uiSchemas.beforeCreate', function setUid(model) {
      if (!model.get('name')) {
        model.set('name', uid());
      }
    });

    db.on('uiSchemas.afterCreate', async function insertSchema(model, options) {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection('uiSchemas').repository as UiSchemaRepository;

      const context = options.context;

      if (context?.disableInsertHook) {
        return;
      }

      await uiSchemaRepository.insert(model.toJSON(), {
        transaction,
      });
    });

    db.on('uiSchemas.afterUpdate', async function patchSchema(model, options) {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection('uiSchemas').repository as UiSchemaRepository;

      await uiSchemaRepository.patch(model.toJSON(), {
        transaction,
      });
    });

    this.app.resourcer.define({
      name: 'uiSchemas',
      actions: uiSchemaActions,
    });

    this.app.acl.allow('uiSchemas', '*', 'loggedIn');
    this.app.acl.allow('uiSchemaTemplates', '*', 'loggedIn');
  }

  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}

export default UiSchemaStoragePlugin;

import { InstallOptions, Plugin } from '@nocobase/server';
import { CustomRequestCollectionName } from './constants';
import { MagicAttributeModel } from '@nocobase/database';
import { CustomRequestModel } from './model';
import { ServerHookModel } from '@nocobase/plugin-ui-schema-storage/src/server-hooks/model';
import { uiSchemaActions } from './actions/custom-request-action';
import { uid } from '@nocobase/utils';
import path, { resolve } from 'path';
import CustomRequestRepository from '../repository';

export class CustomRequestPlugin extends Plugin {
  registerRepository() {
    this.app.db.registerRepositories({
      CustomRequestRepository,
    });
  }

  afterAdd() {}

  beforeLoad() {
    const db = this.app.db;

    this.app.db.registerModels({ MagicAttributeModel, CustomRequestModel, ServerHookModel });

    this.registerRepository();
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.block-templates`,
      actions: ['customRequest:*'],
    });

    this.app.acl.registerSnippet({
      name: `${CustomRequestCollectionName}`,
      actions: [
        `${CustomRequestCollectionName}:insert`,
        `${CustomRequestCollectionName}:insertNewSchema`,
        `${CustomRequestCollectionName}:remove`,
        `${CustomRequestCollectionName}:patch`,
        `${CustomRequestCollectionName}:batchPatch`,
        `${CustomRequestCollectionName}:clearAncestor`,
        `${CustomRequestCollectionName}:insertBeforeBegin`,
        `${CustomRequestCollectionName}:insertAfterBegin`,
        `${CustomRequestCollectionName}:insertBeforeEnd`,
        `${CustomRequestCollectionName}:insertAfterEnd`,
        `${CustomRequestCollectionName}:insertAdjacent`,
        `${CustomRequestCollectionName}:saveAsTemplate`,
      ],
    });

    db.on(`${CustomRequestCollectionName}.beforeCreate`, function setUid(model) {
      if (!model.get('name')) {
        model.set('name', uid());
      }
    });

    db.on(`${CustomRequestCollectionName}.afterCreate`, async function insertSchema(model, options) {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection(CustomRequestCollectionName).repository as CustomRequestRepository;

      const context = options.context;

      if (context?.disableInsertHook) {
        return;
      }

      await uiSchemaRepository.insert(model.toJSON(), {
        transaction,
      });
    });

    db.on(`${CustomRequestCollectionName}.afterUpdate`, async function patchSchema(model, options) {
      const { transaction } = options;
      const uiSchemaRepository = db.getCollection(CustomRequestCollectionName).repository as CustomRequestRepository;

      await uiSchemaRepository.patch(model.toJSON(), {
        transaction,
      });
    });

    this.app.resourcer.define({
      name: CustomRequestCollectionName,
      actions: uiSchemaActions,
    });

    this.app.acl.allow(CustomRequestCollectionName, ['getProperties', 'getJsonSchema'], 'loggedIn');
    this.app.acl.allow('uiSchemaTemplates', ['get', 'list'], 'loggedIn');
  }

  async load() {
    console.log('load');
    await this.app.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CustomRequestPlugin;

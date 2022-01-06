import { Plugin } from '@nocobase/server';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema';
import { CollectionManager, FieldOptions } from './collection-manager';
import { collectionsActions } from './actions/collection';
import { fieldActions } from './actions/fields';
import { Database } from '@nocobase/database';
import { CollectionModel } from './models/collection-model';
import { FieldModel } from './models/field-model';
import { CollectionRepository } from './repositories/collection-repository';
import { FieldRepository } from './repositories/field-repository';
import lodash from 'lodash';

export default class PluginCollectionManager extends Plugin {
  name() {
    return 'collection-manager';
  }

  registerModel(db: Database) {
    db.registerModels({
      CollectionModel,
      FieldModel,
    });
  }

  registerRepository(db: Database) {
    db.registerRepositories({
      CollectionRepository,
      FieldRepository,
    });
  }

  async load() {
    const db = this.app.db;

    this.registerModel(db);
    this.registerRepository(db);

    await CollectionManager.import(db);

    this.app.resourcer.registerActionHandler('collections:create', collectionsActions.create);
    this.app.resourcer.registerActionHandler('collections:get', collectionsActions.get);

    this.app.resourcer.registerActionHandler('collections.fields:create', fieldActions.create);
    this.app.resourcer.registerActionHandler('collections.fields:get', fieldActions.get);
    this.app.resourcer.registerActionHandler('collections.fields:destroy', fieldActions.destroy);
    this.app.resourcer.registerActionHandler('collections.fields:list', fieldActions.list);

    db.on('collections.beforeDestroy', async (model: FieldModel, options) => {
      const transaction = options.transaction;

      // fields keys
      const fields = await db.getCollection('fields').repository.find({
        filter: {
          collectionKey: model.get('key'),
        },
        transaction,
      });

      const fieldKeys = fields.map((field) => field.get('key'));

      // destroy reverse fields
      await db.getCollection('fields').repository.destroy({
        filter: {
          reverseKey: fieldKeys,
        },
        transaction,
      });

      // destroy fields
      await db.getCollection('fields').repository.destroy({
        filter: {
          collectionKey: model.get('key'),
        },
        transaction,
      });
    });

    db.on('fields.beforeDestroy', async (model: FieldModel, options) => {
      const transaction = options.transaction;

      if (model.isSubTableField()) {
        const targetName = model.get('options')['target'];

        // destroy subTable collection
        await db.getCollection('collections').repository.destroy({
          filter: {
            name: targetName,
          },
          transaction,
        });
      }

      if (model.get('uiSchemaUid')) {
        const uiSchemaRepository = db.getCollection('ui_schemas').repository as UiSchemaRepository;

        await uiSchemaRepository.remove(model.get('uiSchemaUid') as string, {
          transaction,
        });
      }
    });

    db.on('fields.afterCreate', async (model: FieldModel, options) => {
      const transaction = options.transaction;

      const fieldOptions = model.get('options') as FieldOptions;

      if (model.isSubTableField()) {
        const subFields = [];
        for (const childrenField of fieldOptions.children) {
          const child = await db.getCollection('fields').repository.create({
            values: {
              collectionName: fieldOptions.target,
              ...childrenField,
            },
            transaction,
          });
          subFields.push(child);
        }

        // @ts-ignore
        await model.setChildren(subFields, { transaction });
      }

      if (FieldModel.isRelationFieldType(fieldOptions.type) && !model.get('reverseKey')) {
        // create reverse field
        const reverseFieldType = lodash.get(fieldOptions, 'reverseField.type')
          ? lodash.get(fieldOptions, 'reverseField.type')
          : FieldModel.reverseRelationType(fieldOptions.type);

        if (!reverseFieldType) {
          throw new Error('can not set reverse field: unknown reverse field type');
        }

        const reverseFieldOptions: FieldOptions = {
          type: reverseFieldType,
          name: lodash.get(fieldOptions, 'reverseField.name'),
          reverseKey: model.get('key'),
          collectionName: fieldOptions.target,
          target: fieldOptions.collectionName,
          uiSchema: lodash.get(fieldOptions, 'reverseField.uiSchema'),
        };

        const reverseFieldInstance = await db.getCollection('fields').repository.create({
          values: reverseFieldOptions,
          transaction,
        });

        // @ts-ignore
        await model.setReverseField(reverseFieldInstance, {
          transaction,
        });
      }
    });

    db.on('fields.afterCreate', async function insertUiSchema(model: FieldModel, options) {
      const transaction = options.transaction;

      const uiSchemaOptions = model.get('options')['uiSchema'];

      const uiSchemaRepository = db.getCollection('ui_schemas').repository as UiSchemaRepository;
      const insertedNodes = await uiSchemaRepository.insert(uiSchemaOptions, {
        transaction,
      });

      const rootNode = insertedNodes[0];

      // @ts-ignore
      await model.setUiSchema(rootNode, {
        transaction,
      });
    });
  }
}

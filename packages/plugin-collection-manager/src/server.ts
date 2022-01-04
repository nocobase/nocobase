import { Plugin } from '@nocobase/server';
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
  }
}

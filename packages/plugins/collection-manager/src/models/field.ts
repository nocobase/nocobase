import Database, { MagicAttributeModel } from '@nocobase/database';
import { SyncOptions, Transactionable, UniqueConstraintError } from 'sequelize';

interface LoadOptions extends Transactionable {
  // TODO
  skipExist?: boolean;
}

function findFieldUniqueIndex(field, indexes) {
  return indexes.find(item => item.fields.map(f => typeof f === 'string' ? f : f.attribute).join() === field.name && item.unique);
}

export class FieldModel extends MagicAttributeModel {
  get db(): Database {
    return (<any>this.constructor).database;
  }

  async load(loadOptions?: LoadOptions) {
    const { skipExist = false } = loadOptions || {};
    const collectionName = this.get('collectionName');
    if (!this.db.hasCollection(collectionName)) {
      return;
    }
    const collection = this.db.getCollection(collectionName);
    const name = this.get('name');
    if (skipExist && collection.hasField(name)) {
      return collection.getField(name);
    }
    const options = this.get();
    if (options.uiSchemaUid) {
      const UISchema = this.db.getModel('uiSchemas');
      const uiSchema = await UISchema.findByPk(options.uiSchemaUid, {
        transaction: loadOptions.transaction,
      });
      Object.assign(options, { uiSchema: uiSchema.get() });
    }
    return collection.setField(name, options);
  }

  async migrate(options: SyncOptions & Transactionable = {}) {
    const field = await this.load({
      transaction: options.transaction,
    });
    if (!field) {
      return;
    }
    const { model } = field.collection;
    const queryInterface = this.db.sequelize.getQueryInterface();
    try {
      const existedIndexes = await queryInterface.showIndex(model.tableName, { transaction: options.transaction }) as any[];
      const indexBefore = findFieldUniqueIndex(field, existedIndexes);
      if (indexBefore && !field.options.unique) {
        await queryInterface.removeConstraint(model.tableName, indexBefore.name, { transaction: options.transaction });
      }
      await field.sync(options);
      const updatedIndexes = await queryInterface.showIndex(model.tableName, { transaction: options.transaction }) as any[];
      const indexAfter = findFieldUniqueIndex(field, updatedIndexes);
      if (field.options.unique && !indexAfter) {
        throw new UniqueConstraintError({
          fields: { [field.name]: undefined }
        });
      }
    } catch (error) {
      // field sync failed, delete from memory
      field.remove();
      throw error;
    }
  }

  async remove(options?: any) {
    const collectionName = this.get('collectionName');
    if (!this.db.hasCollection(collectionName)) {
      return;
    }
    const collection = this.db.getCollection(collectionName);
    const field = collection.getField(this.get('name'));
    if (!field) {
      return;
    }
    return field.removeFromDb({
      transaction: options.transaction,
    });
  }
}

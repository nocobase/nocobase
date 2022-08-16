import Database, { MagicAttributeModel } from '@nocobase/database';
import { SyncOptions, Transactionable } from 'sequelize';

interface LoadOptions extends Transactionable {
  // TODO
  skipExist?: boolean;
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

  async migrate({ transaction, ...options }: SyncOptions & Transactionable = {}) {
    const field = await this.load({
      transaction,
    });
    if (!field) {
      return;
    }
    // TODO: to use `model.options.indexes` to determine if the index exists will not be stable
    const { model } = field.collection;
    const uniqueIndex = model.options.indexes.find(item => item.unique && item.fields.join() === field.name);
    try {
      if (uniqueIndex && !field.options.unique) {
        const queryInterface = this.db.sequelize.getQueryInterface();
        await queryInterface.removeIndex(model.tableName, uniqueIndex.name);
      }
      await field.sync(options);
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

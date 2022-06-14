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
      return collection.setField(name, { ...options, uiSchema: uiSchema.get() });
    } else {
      return collection.setField(name, options);
    }
  }

  async migrate(options?: SyncOptions & Transactionable) {
    const field = await this.load({
      transaction: options.transaction,
    });
    if (!field) {
      return;
    }
    try {
      await field.sync(options);
    } catch (error) {
      // field sync failed, delete from memory
      field.remove();
      throw error;
    }
  }

  /**
   * TODO: drop column from the database
   * 
   * @param options 
   * @returns 
   */
  async remove(options?: any) {
    const collectionName = this.get('collectionName');
    const fieldName = this.get('name');
    if (!this.db.hasCollection(collectionName)) {
      return;
    }
    const collection = this.db.getCollection(collectionName);
    // delete from memory
    const result = collection.removeField(this.get('name'));
    // TODO: drop column from the database
    // this.db.sequelize.getQueryInterface().removeColumn(collectionName, fieldName);
    return result;
  }
}

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
    const UISchema = this.db.getModel('uiSchemas');
    const uiSchema = await UISchema.findByPk(this.get('uiSchemaUid'), {
      transaction: loadOptions.transaction,
    });
    return collection.setField(name, { ...options, uiSchema });
  }

  async migrate(options?: SyncOptions & Transactionable) {
    const field = await this.load({
      transaction: options.transaction,
    });
    if (!field) {
      return;
    }
    await field.sync(options);
  }
}

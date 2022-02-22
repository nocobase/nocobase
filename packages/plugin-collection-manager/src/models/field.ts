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
    return collection.setField(name, this.get());
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

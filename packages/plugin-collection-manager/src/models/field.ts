import { SyncOptions } from 'sequelize';
import Database, { MagicAttributeModel } from '@nocobase/database';

interface LoadOptions {
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
      throw new Error(`${collectionName} collection does not exist.`);
    }
    const collection = this.db.getCollection(collectionName);
    const name = this.get('name');
    if (skipExist && collection.hasField(name)) {
      return collection.getField(name);
    }
    return collection.setField(name, this.get());
  }

  async migrate(options?: SyncOptions) {
    const field = await this.load();
    await field.sync(options);
  }
}

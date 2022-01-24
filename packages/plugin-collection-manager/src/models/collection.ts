import { SyncOptions } from 'sequelize';
import Database, { Collection, MagicAttributeModel } from '@nocobase/database';
import { FieldModel } from './field';

interface LoadOptions {
  // TODO
  skipField?: boolean;
  skipExist?: boolean;
}

export class CollectionModel extends MagicAttributeModel {
  get db(): Database {
    return (<any>this.constructor).database;
  }

  async load(loadOptions: LoadOptions = {}) {
    const { skipExist, skipField } = loadOptions;
    const name = this.get('name');

    let collection: Collection;

    if (this.db.hasCollection(name)) {
      collection = this.db.getCollection(name);
      if (skipExist) {
        return collection;
      }
      collection.updateOptions(this.get());
    } else {
      collection = this.db.collection(this.get());
    }

    if (!skipField) {
      await this.loadFields();
    }
    return collection;
  }

  async loadFields() {
    // @ts-ignore
    const instances: FieldModel[] = await this.getFields();
    for (const instance of instances) {
      await instance.load();
    }
  }

  async migrate(options?: SyncOptions) {
    const collection = await this.load();
    await collection.sync({
      force: false,
      alter: {
        drop: false,
      },
      ...options,
    });
  }
}

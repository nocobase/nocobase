import Database, { Collection, MagicAttributeModel } from '@nocobase/database';
import { SyncOptions, Transactionable } from 'sequelize';
import { FieldModel } from './field';

interface LoadOptions extends Transactionable {
  // TODO
  skipField?: boolean;
  skipExist?: boolean;
}

export class CollectionModel extends MagicAttributeModel {
  get db(): Database {
    return (<any>this.constructor).database;
  }

  async load(loadOptions: LoadOptions = {}) {
    const { skipExist, skipField, transaction } = loadOptions;
    const name = this.get('name');

    let collection: Collection;

    if (this.db.hasCollection(name)) {
      collection = this.db.getCollection(name);
      if (skipExist) {
        return collection;
      }
      collection.updateOptions({
        ...this.get(),
        fields: [],
      });
    } else {
      collection = this.db.collection({
        ...this.get(),
        fields: [],
      });
    }

    if (!skipField) {
      await this.loadFields({ transaction });
    }
    return collection;
  }

  async loadFields(options: Transactionable = {}) {
    // @ts-ignore
    const instances: FieldModel[] = await this.getFields(options);

    for (const instance of instances) {
      await instance.load(options);
    }
  }

  async remove(options?: any) {
    const { transaction } = options || {};
    const name = this.get('name');
    const collection = this.db.getCollection(name);
    if (!collection) {
      return;
    }
    const fields = await this.db.getRepository('fields').find({
      filter: {
        'type.$in': ['belongsToMany', 'belongsTo', 'hasMany', 'hasOne'],
      },
      transaction,
    });
    for (const field of fields) {
      if (field.get('target') && field.get('target') === name) {
        await field.destroy({ transaction });
      } else if (field.get('through') && field.get('through') === name) {
        await field.destroy({ transaction });
      }
    }
    await collection.removeFromDb({
      transaction,
    });
  }

  async migrate(options?: SyncOptions & Transactionable) {
    const collection = await this.load({
      transaction: options?.transaction,
    });
    try {
      await collection.sync({
        force: false,
        alter: {
          drop: false,
        },
        ...options,
      });
    } catch (error) {
      const name = this.get('name');
      this.db.removeCollection(name);
    }
  }
}

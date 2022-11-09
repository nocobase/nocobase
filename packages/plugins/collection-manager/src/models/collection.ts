import Database, { Collection, MagicAttributeModel } from '@nocobase/database';
import { SyncOptions, Transactionable } from 'sequelize';
import { FieldModel } from './field';
import lodash from 'lodash';

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

    const collectionOptions = {
      ...this.get(),
      fields: [],
    };

    if (this.db.hasCollection(name)) {
      collection = this.db.getCollection(name);

      if (skipExist) {
        return collection;
      }

      collection.updateOptions(collectionOptions);
    } else {
      collection = this.db.collection(collectionOptions);
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
      console.error(error);
      const name = this.get('name');
      this.db.removeCollection(name);
    }
  }

  isInheritedModel() {
    return this.get('inherits');
  }

  // sync fields from parents
  async syncParentFields(options: Transactionable) {
    const { transaction } = options;

    const findModelParents = async (model: CollectionModel, carry = []) => {
      if (!model.get('inherits')) {
        return;
      }
      const parents = lodash.castArray(model.get('inherits'));

      for (const parent of parents) {
        const parentModel = (await this.db.getCollection('collections').repository.findOne({
          filterByTk: parent,
          transaction,
        })) as CollectionModel;

        carry.push(parentModel.get('name'));

        await findModelParents(parentModel, carry);
      }

      return carry;
    };

    const ancestors = await findModelParents(this);

    const ancestorFields = await this.db.getCollection('fields').repository.find({
      filter: {
        collectionName: { $in: ancestors },
      },
    });

    const inheritedFields = ancestorFields.filter((field: FieldModel) => {
      return !field.isAssociationField();
    });

    for (const inheritedField of inheritedFields) {
      await this.createField(lodash.omit(inheritedField.toJSON(), ['key', 'collectionName', 'sort']), {
        transaction,
      });
    }
  }
}

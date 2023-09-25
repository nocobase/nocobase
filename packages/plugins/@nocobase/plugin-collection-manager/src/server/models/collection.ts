import Database, { Collection, MagicAttributeModel, SyncOptions, Transactionable } from '@nocobase/database';
import lodash from 'lodash';
import { FieldModel } from './field';

interface LoadOptions extends Transactionable {
  // TODO
  skipField?: boolean | Array<string>;
  skipExist?: boolean;
  resetFields?: boolean;
}

export class CollectionModel extends MagicAttributeModel {
  get db(): Database {
    return (<any>this.constructor).database;
  }

  async load(loadOptions: LoadOptions = {}) {
    const { skipExist, skipField, resetFields, transaction } = loadOptions;
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

      if (resetFields) {
        collection.resetFields();
      }

      collection.updateOptions(collectionOptions);
    } else {
      collection = this.db.collection(collectionOptions);
    }

    if (!skipField) {
      await this.loadFields({ transaction });
    }

    if (lodash.isArray(skipField)) {
      await this.loadFields({ transaction, skipField });
    }

    await this.db.emitAsync('collection:loaded', {
      collection,
      transaction,
    });

    return collection;
  }

  async loadFields(
    options: Transactionable & {
      skipField?: Array<string>;
      includeFields?: Array<string>;
    } = {},
  ) {
    let fields = this.get('fields') || [];

    if (!fields.length) {
      fields = await this.getFields(options);
    }

    if (options.skipField) {
      fields = fields.filter((field) => !options.skipField.includes(field.name));
    }

    if (options.includeFields) {
      fields = fields.filter((field) => options.includeFields.includes(field.name));
    }

    // @ts-ignore
    const instances: FieldModel[] = fields;

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

    // postgres support zero column table, other database should not sync it to database
    // @ts-ignore
    if (Object.keys(collection.model.tableAttributes).length == 0 && !this.db.inDialect('postgres')) {
      return;
    }

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
      throw error;
    }
  }

  isInheritedModel() {
    return this.get('inherits');
  }

  async findParents(options: Transactionable) {
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

    return findModelParents(this);
  }

  async parentFields(options: Transactionable) {
    const { transaction } = options;

    return this.db.getCollection('fields').repository.find({
      filter: {
        collectionName: { $in: await this.findParents({ transaction }) },
      },
      transaction,
    });
  }

  // sync fields from parents
  async syncParentFields(options: Transactionable) {
    const { transaction } = options;

    const ancestorFields = await this.parentFields({ transaction });

    const selfFields = await this.getFields({ transaction });

    const inheritedFields = ancestorFields.filter((field: FieldModel) => {
      return (
        !field.isAssociationField() &&
        !selfFields.find((selfField: FieldModel) => selfField.get('name') == field.get('name'))
      );
    });

    for (const inheritedField of inheritedFields) {
      await this.createField(lodash.omit(inheritedField.toJSON(), ['key', 'collectionName', 'sort']), {
        transaction,
      });
    }
  }
}

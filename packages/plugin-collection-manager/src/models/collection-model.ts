import { Collection, Database, HasManyRepository, Model } from '@nocobase/database';
import { FieldOptions } from '../collection-manager';
import { FieldModel } from './field-model';
import lodash from 'lodash';
import { Transaction } from 'sequelize';

export class CollectionModel extends Model {
  getKey() {
    return this.get('key') as string;
  }

  getName() {
    return this.get('name') as string;
  }

  async load(loadOptions?: { loadField: boolean }): Promise<Collection> {
    const instance = this;

    // @ts-ignore
    const db: Database = this.constructor.database;

    const options = instance.asCollectionOptions();

    // @ts-ignore
    const collectionFields: FieldModel[] = await instance.getFields();

    const fieldsAsObject: { [key: string]: FieldModel } = collectionFields.reduce((carry, field) => {
      carry[field.get('name') as string] = field;
      return carry;
    }, {});

    let collection = db.getCollection(options.name);

    if (!collection) {
      // create new collection
      collection = db.collection(options);
    }

    if (lodash.get(loadOptions, 'loadField', true) == false) {
      return collection;
    }

    const existsFields = collection.fields;

    // add field
    const addFieldNames = lodash.difference(Object.keys(fieldsAsObject), Array.from(existsFields.keys()));

    for (const addFieldName of addFieldNames) {
      const fieldModel = fieldsAsObject[addFieldName];
      await fieldModel.load();
    }

    return collection;
  }

  async migrate() {
    const collection = await this.load();

    await collection.sync({
      force: false,
      alter: {
        drop: false,
      },
    });
  }

  asCollectionOptions() {
    return {
      name: this.get('name') as string,
    };
  }

  /**
   * addField by FieldOptions
   * @param options
   * @param db
   * @param transaction
   */
  static async addField(options: FieldOptions, db: Database, transaction?: Transaction): Promise<FieldModel> {
    let handleTransaction = false;

    if (!transaction) {
      transaction = await db.sequelize.transaction();
      handleTransaction = true;
    }

    try {
      const metaCollection = db.getCollection('collections');

      const newFieldValues = {
        name: options.name,
        type: options.type,
        interface: options.interface,
        uiSchema: options.uiSchema,
        options: options,
      };

      if (options.reverseKey) {
        newFieldValues['reverseKey'] = options.reverseKey;
      }

      const isSubTableField = FieldModel.isSubTableOptions(options);
      // sub table
      if (isSubTableField) {
        // create new collection as subTable
        const subTableCollection = await metaCollection.repository.create({
          values: {
            name: `sub-table${lodash.random(111111, 999999)}`,
          },
          transaction,
        });

        // set hasMany relation target attribute
        newFieldValues['options']['target'] = subTableCollection.get('name');
      }

      const fieldRelationRepository = <HasManyRepository>(
        metaCollection.repository.relation('fields').of(options.collectionName, 'name')
      );

      const fieldInstance = await fieldRelationRepository.create({
        values: newFieldValues,
        transaction,
      });

      if (isSubTableField) {
        // add subfield in sub table collection
        const subFields = [];
        for (const childrenField of options.children) {
          const child = await this.addField(
            {
              collectionName: newFieldValues['options'].target,
              ...childrenField,
            },
            db,
            transaction,
          );
          subFields.push(child);
        }

        await fieldInstance.setChildren(subFields, { transaction });
      }

      if (FieldModel.isRelationFieldType(options.type) && !fieldInstance.get('reverseKey')) {
        // create reverse field
        const reverseFieldType = lodash.get(options, 'reverseField.type')
          ? lodash.get(options, 'reverseField.type')
          : FieldModel.reverseRelationType(options.type);

        if (!reverseFieldType) {
          throw new Error('can not set reverse field: unknown reverse field type');
        }

        const reverseFieldOptions: FieldOptions = {
          type: reverseFieldType,
          name: lodash.get(options, 'reverseField.name'),
          reverseKey: fieldInstance.get('key'),
          collectionName: newFieldValues.options.target,
          target: options.collectionName,
          uiSchema: lodash.get(options, 'reverseField.uiSchema'),
        };

        const reverseFieldInstance = await this.addField(reverseFieldOptions, db, transaction);
        await fieldInstance.setReverseField(reverseFieldInstance, {
          transaction,
        });
      }

      if (handleTransaction) {
        await transaction.commit();
      }

      return fieldInstance;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

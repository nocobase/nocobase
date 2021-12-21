import { Model, Transaction } from 'sequelize';
import { MetaCollectionOptions } from './meta-collection-options';
import { Collection, Database, HasManyRepository } from '@nocobase/database';
import { FieldOptions } from './collection-manager';
import lodash, { random } from 'lodash';
import { FieldModel } from './field-model';

export class CollectionModel {
  model: Model;
  db: Database;

  options: MetaCollectionOptions;

  constructor(model: Model, db: Database) {
    this.model = model;
    this.db = db;
    this.options = new MetaCollectionOptions(model.get('options'));
  }

  async migrate() {
    const collection = await this.load();
    await collection.sync({
      alter: true,
    });
  }

  // load collection to database
  async load(): Promise<Collection> {
    const newFields = await this.getFields();
    const newFieldsAsObject = newFields.reduce((carry, field) => {
      carry[field.get('name')] = field;
      return carry;
    }, {});

    const existCollection = this.db.getCollection(this.getName());

    if (!existCollection) {
      // create new collection
      return this.db.collection({
        name: this.getName(),
        fields: newFields.map((field) => {
          return { type: field.type, name: field.name };
        }),
      });
    }

    const existsFields = existCollection.fields;

    // add field
    const addFieldNames = lodash.difference(Object.keys(newFieldsAsObject), Array.from(existsFields.keys()));

    addFieldNames.forEach((addFieldName) => {
      const fieldModel = new FieldModel(newFieldsAsObject[addFieldName], this.db);
      existCollection.addField(addFieldName, fieldModel.asFieldOption());
    });

    // delete field
    return existCollection;
  }

  getName() {
    return this.model.get('name') as string;
  }

  getKey() {
    return this.model.get('key') as string;
  }

  metaCollection() {
    return this.db.getCollection('collections');
  }

  /**
   * addField by FieldOptions
   * @param options
   * @param db
   * @param transaction
   */
  static async addField(options: FieldOptions, db: Database, transaction?: Transaction) {
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

      if (options.reverseField) {
        newFieldValues['reverseField'] = options.reverseField;
      }

      const isSubTableField =
        options.type == 'hasMany' && lodash.isArray(options.children) && options.children.length > 0;

      // sub table
      if (isSubTableField) {
        // create new collection
        const subTableCollection = await metaCollection.repository.create({
          values: {
            name: `sub-table${lodash.random(111111, 999999)}`,
          },
          transaction,
        });

        newFieldValues['options'] = {
          ...newFieldValues['options'],
          target: subTableCollection.get('name'),
        };
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
          reverseKey: fieldInstance.get('key'),
          collectionName: newFieldValues.options.target,
          target: options.collectionName,
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

  async getFields() {
    // @ts-ignore
    return await this.model.getFields();
  }
}

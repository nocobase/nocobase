import { Collection, Database, FieldOptions as DBFieldOptions } from '@nocobase/database';
import path from 'path';
import { MetaCollectionOptions } from './meta-collection-options';
import { CollectionModel } from './models/collection-model';
import lodash from 'lodash';

const SchemaDirectory = path.join(__dirname, './schema');

export interface CollectionOptions {
  name?: string; // alias name of collection, if empty, same as key
  title?: string; // readable name of collection
  fields?: FieldOptions[]; // fields of collection
  sortable?: boolean; // if true, add a sort type field to collection
  logging?: boolean; // options for plugin-action-logs
  createdBy?: boolean; // options for plugin-users
  updatedBy?: boolean; // options for plugin-users

  scopes?: any;
  defaultScope?: any;
  timestamps?: boolean;
  paranoid?: boolean;
  createdAt?: string | boolean;
  deletedAt?: string | boolean;
  updatedAt?: string | boolean;
}

export interface FieldOptions {
  name?: string; // Field Name
  collectionName?: string; // Collection Key
  interface?: string; // Component template of React
  uiSchema?: any; // Formily Schema
  children?: FieldOptions[]; // Children Field
  [key: string]: any; // other options
}

export class CollectionManager {
  // import meta collection table struct
  static async import(db: Database) {
    await db.import({
      directory: SchemaDirectory,
    });

    // sync meta collection to database
    await db.getCollection('collections').sync({
      force: false,
      alter: {
        drop: false,
      },
    });
  }

  static async createCollection(collectionOptions: CollectionOptions, db: Database): Promise<CollectionModel> {
    const transaction = await db.sequelize.transaction();

    try {
      const options = new MetaCollectionOptions(collectionOptions);

      const collectionSaveValues = options.asCollectionOptions();

      const collectionInstance = await db.getCollection('collections').repository.create<CollectionModel>({
        values: collectionSaveValues,
        transaction,
      });

      if (lodash.get(collectionOptions, 'sortable')) {
        await CollectionModel.addField(
          {
            collectionName: collectionInstance.getName(),
            name: 'sort',
            type: 'sort',
          },
          db,
          transaction,
        );
      }

      await transaction.commit();
      return collectionInstance;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * save field to field table only
   * @param fieldOptions
   */
  static async createField(fieldOptions: FieldOptions, db: Database) {
    const collectionInstance = await db.getCollection('collections').repository.findOne({
      filter: {
        name: fieldOptions.collectionName,
      },
    });

    if (!collectionInstance) {
      throw new Error(`${fieldOptions.collectionName} collection not exist`);
    }

    return await CollectionModel.addField(fieldOptions, db);
  }
}

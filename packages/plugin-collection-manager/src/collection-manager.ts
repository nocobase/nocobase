import { Database, FieldOptions as DBFieldOptions } from '@nocobase/database';
import path from 'path';
import { MetaCollectionOptions } from './meta-collection-options';
import { Model } from 'sequelize';
import { CollectionModel } from './collection-model';

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
  collectionName?: string; // Collection Name
  collectionKey?: string; // Collection Key
  interface?: string; // Component template of React
  uiSchema?: any; // Formily Schema
  children?: FieldOptions[]; // Children Field
  [key: string]: any;
}

export class CollectionManager {
  db: Database;

  /**
   *
   * @param schemaDirectory Collection Schema directory
   */
  constructor(db: Database) {
    this.db = db;
  }

  metaCollection() {
    return this.db.getCollection('collections');
  }

  filedSchemaCollection() {
    return this.db.getCollection('fields');
  }

  // import meta collection table struct
  static async import(db: Database) {
    await db.import({
      directory: SchemaDirectory,
    });

    // sync meta collection to database
    await db.getCollection('collections').sync();
  }

  async createCollection(collectionOptions: CollectionOptions): Promise<CollectionModel> {
    const options = new MetaCollectionOptions(collectionOptions);

    const collectionInstance = await this.metaCollection().repository.create({
      values: options.collectionValues,
    });

    return new CollectionModel(collectionInstance, this.db);
  }
}

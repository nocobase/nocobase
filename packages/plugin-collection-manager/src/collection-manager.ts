import { Collection, Database, FieldOptions as DBFieldOptions } from '@nocobase/database';
import path from 'path';
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
}

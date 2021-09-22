import { Sequelize, ModelCtor, Model, Options, SyncOptions } from 'sequelize';
import { EventEmitter } from 'events';
import { Collection, CollectionOptions } from './collection';
import {
  RelationField,
  StringField,
  HasOneField,
  HasManyField,
  BelongsToField,
  BelongsToManyField,
  JsonField,
  JsonbField,
} from './schema-fields';

export interface PendingOptions {
  field: RelationField;
  model: ModelCtor<Model>;
}

export type DatabaseOptions = Options | Sequelize;

export class Database extends EventEmitter {
  sequelize: Sequelize;
  schemaTypes = new Map();
  models = new Map();
  repositories = new Map();
  collections: Map<string, Collection>;
  pendingFields = new Map<string, RelationField[]>();

  constructor(options: DatabaseOptions) {
    super();
    if (options instanceof Sequelize) {
      this.sequelize = options;
    } else {
      this.sequelize = new Sequelize(options);
    }
    this.collections = new Map();
    this.on('collection.init', (collection) => {
      const items = this.pendingFields.get(collection.name);
      for (const field of items || []) {
        field.bind();
      }
    });
    this.registerSchemaTypes({
      string: StringField,
      json: JsonField,
      jsonb: JsonbField,
      hasOne: HasOneField,
      hasMany: HasManyField,
      belongsTo: BelongsToField,
      belongsToMany: BelongsToManyField,
    });
  }

  collection(options: CollectionOptions) {
    let collection = this.collections.get(options.name);
    if (collection) {
      collection.schema.set(options.schema);
    } else {
      collection = new Collection(options, { database: this });
    }
    this.collections.set(collection.name, collection);
    return collection;
  }

  getCollection(name: string) {
    return this.collections.get(name);
  }

  addPendingField(field: RelationField) {
    const associating = this.pendingFields;
    const items = this.pendingFields.get(field.target) || [];
    items.push(field);
    associating.set(field.target, items);
  }

  removePendingField(field: RelationField) {
    const items = this.pendingFields.get(field.target) || [];
    const index = items.indexOf(field);
    if (index !== -1) {
      delete items[index];
      this.pendingFields.set(field.target, items);
    }
  }

  registerSchemaTypes(schemaTypes: any) {
    for (const [type, schemaType] of Object.entries(schemaTypes)) {
      this.schemaTypes.set(type, schemaType);
    }
  }

  registerModels(models: any) {
    for (const [type, schemaType] of Object.entries(models)) {
      this.models.set(type, schemaType);
    }
  }

  registerRepositories(repositories: any) {
    for (const [type, schemaType] of Object.entries(repositories)) {
      this.repositories.set(type, schemaType);
    }
  }

  buildSchemaField(options, context) {
    const { type } = options;
    const Field = this.schemaTypes.get(type);
    return new Field(options, context);
  }

  async sync(options?: SyncOptions) {
    return this.sequelize.sync(options);
  }

  async close() {
    return this.sequelize.close();
  }
}

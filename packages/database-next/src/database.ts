import {
  Sequelize,
  ModelCtor,
  Model,
  Options,
  SyncOptions,
  Op,
  Utils,
} from 'sequelize';
import { EventEmitter } from 'events';
import { Collection, CollectionOptions } from './collection';
import * as FieldTypes from './fields';
import { RelationField } from './fields';

export interface PendingOptions {
  field: RelationField;
  model: ModelCtor<Model>;
}

export type DatabaseOptions = Options | Sequelize;

export class Database extends EventEmitter {
  sequelize: Sequelize;
  fieldTypes = new Map();
  models = new Map();
  repositories = new Map();
  operators = new Map();
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

    this.on('collection.afterDefine', (collection) => {
      const items = this.pendingFields.get(collection.name);
      for (const field of items || []) {
        field.bind();
      }
    });

    for (const [name, field] of Object.entries(FieldTypes)) {
      if (['Field', 'RelationField'].includes(name)) {
        continue;
      }
      let key = name.replace(/Field$/g, '');
      key = key.substring(0, 1).toLowerCase() + key.substring(1);
      this.registerFieldTypes({
        [key]: field,
      });
    }

    const operators = new Map();

    // Sequelize 内置
    for (const key in Op) {
      operators.set('$' + key, Op[key]);
      const val = Utils.underscoredIf(key, true);
      operators.set('$' + val, Op[key]);
      operators.set('$' + val.replace(/_/g, ''), Op[key]);
    }

    this.operators = operators;
  }

  /**
   * Add collection to database
   *
   *
   * @param options
   */
  collection<Attributes = any, CreateAttributes = Attributes>(
    options: CollectionOptions,
  ) {
    let collection = this.collections.get(options.name);

    if (collection) {
      collection.extend(options);
    } else {
      collection = new Collection<Attributes, CreateAttributes>(options, {
        database: this,
      });

      this.collections.set(collection.name, collection);
    }

    this.emit('collection.afterDefine', collection);

    return collection as Collection<Attributes, CreateAttributes>;
  }

  /**
   * get exists collection by it's name
   * @param name
   */
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

  registerFieldTypes(fieldTypes: any) {
    for (const [type, fieldType] of Object.entries(fieldTypes)) {
      this.fieldTypes.set(type, fieldType);
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

  registerOperators(operators) {
    for (const [key, operator] of Object.entries(operators)) {
      this.operators.set(key, operator);
    }
  }

  buildField(options, context) {
    const { type } = options;
    const Field = this.fieldTypes.get(type);
    return new Field(options, context);
  }

  async sync(options?: SyncOptions) {
    const isMySQL = this.sequelize.getDialect() === 'mysql';
    if (isMySQL) {
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', null);
    }
    const result = await this.sequelize.sync(options);
    if (isMySQL) {
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null);
    }
    return result;
  }

  async close() {
    return this.sequelize.close();
  }
}

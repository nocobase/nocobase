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
import { Field, FieldContext, RelationField } from './fields';
import { Repository } from './repository';
import lodash from 'lodash';
import { ModelHooks, SequelizeHooks } from 'sequelize/types/lib/hooks';

export interface PendingOptions {
  field: RelationField;
  model: ModelCtor<Model>;
}

interface MapOf<T> {
  [key: string]: T;
}

export type DatabaseOptions = Options | Sequelize;

interface RegisterOperatorsContext {
  db?: Database;
  path?: string;
  field?: Field;
}

type OperatorFunc = (value: any, ctx?: RegisterOperatorsContext) => any;

export class Database extends EventEmitter {
  sequelize: Sequelize;
  fieldTypes = new Map();
  models = new Map<string, ModelCtor<any>>();
  repositories = new Map<string, Repository>();
  operators = new Map();
  collections = new Map<string, Collection>();
  pendingFields = new Map<string, RelationField[]>();

  constructor(options: DatabaseOptions) {
    super();

    if (options instanceof Sequelize) {
      this.sequelize = options;
    } else {
      this.sequelize = new Sequelize(options);
    }

    this.collections = new Map();

    this.on('afterDefineCollection', (collection) => {
      // after collection defined, call bind method on pending fields
      this.pendingFields.get(collection.name)?.forEach((field) => field.bind());
    });

    // register database field types
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
   * @param options
   */
  collection<Attributes = any, CreateAttributes = Attributes>(
    options: CollectionOptions,
  ): Collection<Attributes, CreateAttributes> {
    let collection = this.collections.get(options.name);

    if (collection) {
      collection.updateOptions(options);
    } else {
      collection = new Collection<Attributes, CreateAttributes>(options, {
        database: this,
      });

      this.collections.set(collection.name, collection);
    }

    this.emit('afterDefineCollection', collection);

    return collection;
  }

  /**
   * get exists collection by it's name
   * @param name
   */
  getCollection(name: string): Collection {
    return this.collections.get(name);
  }

  hasCollection(name: string): boolean {
    return this.collections.has(name);
  }

  removeCollection(name: string) {
    const collection = this.collections.get(name);
    this.emit('beforeDefineCollection', collection);

    const result = this.collections.delete(name);

    if (result) {
      this.emit('afterDefineCollection', collection);
    }
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

  registerFieldTypes(fieldTypes: MapOf<typeof Field>) {
    for (const [type, fieldType] of Object.entries(fieldTypes)) {
      this.fieldTypes.set(type, fieldType);
    }
  }

  registerModels(models: MapOf<ModelCtor<any>>) {
    for (const [type, schemaType] of Object.entries(models)) {
      this.models.set(type, schemaType);
    }
  }

  registerRepositories(repositories: MapOf<Repository>) {
    for (const [type, schemaType] of Object.entries(repositories)) {
      this.repositories.set(type, schemaType);
    }
  }

  registerOperators(operators: MapOf<OperatorFunc>) {
    for (const [key, operator] of Object.entries(operators)) {
      this.operators.set(key, operator);
    }
  }

  buildField(options, context: FieldContext) {
    const { type } = options;
    const Field = this.fieldTypes.get(type);
    if (!Field) {
      throw Error(`unsupported field type ${type}`);
    }
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

  on(event: string | symbol, listener: (...args: any[]) => void): this {
    const isModelHook = (eventName) => {
      if (lodash.isString(eventName) && eventName.split('.').length == 2) {
        const [modelName, _eventName] = eventName.split('.');
        if (this.sequelize.modelManager.getModel(modelName)) {
          return true;
        }
      }

      return false;
    };

    if (isModelHook(event)) {
      const [modelName, eventName] = (<string>event).split('.');
      const model = this.sequelize.models[modelName];
      model.addHook(<any>eventName, listener);
      return this;
    }

    return super.on(event, listener);
  }
}

export default Database;

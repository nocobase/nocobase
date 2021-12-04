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
import { Collection, CollectionOptions, RepositoryType } from './collection';
import * as FieldTypes from './fields';
import {
  BaseFieldOptions,
  Field,
  FieldContext,
  FieldOptions,
  RelationField,
} from './fields';
import { applyMixins, AsyncEmitter } from '@nocobase/utils';

import merge from 'deepmerge';
import { ModelHook } from './model-hook';
import { ImporterReader, ImportFileExtension } from './collection-importer';

import dateOperators from './operators/date';
import multipleSelect from './operators/array';
import associationOperator from './operators/association';

export interface MergeOptions extends merge.Options {}

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

export class Database extends EventEmitter implements AsyncEmitter {
  sequelize: Sequelize;
  fieldTypes = new Map();
  models = new Map<string, ModelCtor<any>>();
  repositories = new Map<string, RepositoryType>();
  operators = new Map();
  collections = new Map<string, Collection>();
  pendingFields = new Map<string, RelationField[]>();

  modelHook: ModelHook;

  delayCollectionExtend = new Map<
    string,
    { collectionOptions: CollectionOptions; mergeOptions?: any }[]
  >();

  constructor(options: DatabaseOptions) {
    super();

    if (options instanceof Sequelize) {
      this.sequelize = options;
    } else {
      this.sequelize = new Sequelize(options);
    }

    this.collections = new Map();
    this.modelHook = new ModelHook(this);

    this.on('afterDefineCollection', (collection: Collection) => {
      // after collection defined, call bind method on pending fields
      this.pendingFields.get(collection.name)?.forEach((field) => field.bind());
      this.delayCollectionExtend
        .get(collection.name)
        ?.forEach((collectionExtend) => {
          collection.updateOptions(
            collectionExtend.collectionOptions,
            collectionExtend.mergeOptions,
          );
        });
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

    this.initOperators();
  }

  /**
   * Add collection to database
   * @param options
   */
  collection<Attributes = any, CreateAttributes = Attributes>(
    options: CollectionOptions,
  ): Collection<Attributes, CreateAttributes> {
    this.emit('beforeDefineCollection', options);

    const collection = new Collection(options, {
      database: this,
    });

    this.collections.set(collection.name, collection);

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
    this.emit('beforeRemoveCollection', collection);

    const result = this.collections.delete(name);

    if (result) {
      this.emit('afterRemoveCollection', collection);
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

  registerRepositories(repositories: MapOf<RepositoryType>) {
    for (const [type, schemaType] of Object.entries(repositories)) {
      this.repositories.set(type, schemaType);
    }
  }

  initOperators() {
    const operators = new Map();

    // Sequelize 内置
    for (const key in Op) {
      operators.set('$' + key, Op[key]);
      const val = Utils.underscoredIf(key, true);
      operators.set('$' + val, Op[key]);
      operators.set('$' + val.replace(/_/g, ''), Op[key]);
    }

    this.operators = operators;

    this.registerOperators({
      ...dateOperators,
      ...multipleSelect,
      ...associationOperator,
    });
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
    const modelEventName = this.modelHook.isModelHook(event);

    if (modelEventName && !this.modelHook.hasBindEvent(modelEventName)) {
      this.sequelize.addHook(
        modelEventName,
        this.modelHook.sequelizeHookBuilder(modelEventName),
      );

      this.modelHook.bindEvent(modelEventName);
    }

    return super.on(event, listener);
  }

  async import(options: {
    directory: string;
    extensions?: ImportFileExtension[];
  }): Promise<Map<string, Collection>> {
    const reader = new ImporterReader(options.directory, options.extensions);
    const modules = await reader.read();
    const result = new Map<string, Collection>();

    for (const module of modules) {
      if (module.extend) {
        const collectionName = module.collectionOptions.name;
        const existCollection = this.getCollection(collectionName);
        if (existCollection) {
          existCollection.updateOptions(
            module.collectionOptions,
            module.mergeOptions,
          );
        } else {
          const existDelayExtends =
            this.delayCollectionExtend.get(collectionName) || [];

          this.delayCollectionExtend.set(collectionName, [
            ...existDelayExtends,
            module,
          ]);
        }
      } else {
        const collection = this.collection(module);
        result.set(collection.name, collection);
      }
    }

    return result;
  }

  emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;
}

export function extend(
  collectionOptions: CollectionOptions,
  mergeOptions?: MergeOptions,
) {
  return {
    collectionOptions,
    mergeOptions,
    extend: true,
  };
}

applyMixins(Database, [AsyncEmitter]);

export default Database;

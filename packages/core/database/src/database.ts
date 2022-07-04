import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import merge from 'deepmerge';
import { EventEmitter } from 'events';
import glob from 'glob';
import lodash from 'lodash';
import { basename, isAbsolute, resolve } from 'path';
import semver from 'semver';
import {
  ModelCtor,
  Op,
  Options,
  QueryInterfaceDropAllTablesOptions,
  QueryOptions,
  Sequelize,
  SyncOptions,
  Transactionable,
  Utils
} from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { Collection, CollectionOptions, RepositoryType } from './collection';
import { ImporterReader, ImportFileExtension } from './collection-importer';
import * as FieldTypes from './fields';
import { Field, FieldContext, RelationField } from './fields';
import { Migrations } from './migration';
import { Model } from './model';
import { ModelHook } from './model-hook';
import extendOperators from './operators';
import { RelationRepository } from './relation-repository/relation-repository';
import { Repository } from './repository';

export interface MergeOptions extends merge.Options {}

export interface PendingOptions {
  field: RelationField;
  model: ModelCtor<Model>;
}

interface MapOf<T> {
  [key: string]: T;
}

export interface IDatabaseOptions extends Options {
  tablePrefix?: string;
  migrator?: any;
}

export type DatabaseOptions = IDatabaseOptions;

interface RegisterOperatorsContext {
  db?: Database;
  path?: string;
  field?: Field;
  app?: any;
}

export interface CleanOptions extends QueryInterfaceDropAllTablesOptions {
  drop?: boolean;
}

export type AddMigrationsOptions = {
  context?: any;
  namespace?: string;
  extensions?: string[];
  directory: string;
};

type OperatorFunc = (value: any, ctx?: RegisterOperatorsContext) => any;

class DatabaseVersion {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async satisfies(versions) {
    const dialects = {
      sqlite: {
        sql: 'select sqlite_version() as version',
        get: (v) => v,
      },
      mysql: {
        sql: 'select version() as version',
        get: (v) => v,
      },
      postgres: {
        sql: 'select version() as version',
        get: (v) => {
          const keys = v.split(' ');
          keys.shift();
          return semver.minVersion(keys.shift()).version;
        },
      },
    };
    for (const dialect of Object.keys(dialects)) {
      if (this.db.inDialect(dialect)) {
        if (!versions?.[dialect]) {
          return false;
        }
        const [result] = (await this.db.sequelize.query(dialects[dialect].sql)) as any;
        console.log(`db version: ${dialects[dialect].get(result?.[0]?.version)}`);
        return semver.satisfies(dialects[dialect].get(result?.[0]?.version), versions[dialect]);
      }
    }
    return false;
  }
}

export class Database extends EventEmitter implements AsyncEmitter {
  sequelize: Sequelize;
  migrator: Umzug;
  migrations: Migrations;
  fieldTypes = new Map();
  options: IDatabaseOptions;
  models = new Map<string, ModelCtor<Model>>();
  repositories = new Map<string, RepositoryType>();
  operators = new Map();
  collections = new Map<string, Collection>();
  pendingFields = new Map<string, RelationField[]>();
  modelCollection = new Map<ModelCtor<any>, Collection>();

  modelHook: ModelHook;
  version: DatabaseVersion;

  delayCollectionExtend = new Map<string, { collectionOptions: CollectionOptions; mergeOptions?: any }[]>();

  constructor(options: DatabaseOptions) {
    super();

    this.version = new DatabaseVersion(this);

    const opts = {
      sync: {
        alter: {
          drop: false,
        },
        force: false,
      },
      ...options,
    };

    if (options.storage && options.storage !== ':memory:') {
      if (!isAbsolute(options.storage)) {
        opts.storage = resolve(process.cwd(), options.storage);
      }
    }

    if (options.dialect === 'sqlite') {
      delete opts.timezone;
    } else if (!opts.timezone) {
      opts.timezone = '+00:00';
    }

    this.sequelize = new Sequelize(opts);
    this.options = opts;
    this.collections = new Map();
    this.modelHook = new ModelHook(this);

    this.on('afterDefineCollection', (collection: Collection) => {
      // after collection defined, call bind method on pending fields
      this.pendingFields.get(collection.name)?.forEach((field) => field.bind());
      this.delayCollectionExtend.get(collection.name)?.forEach((collectionExtend) => {
        collection.updateOptions(collectionExtend.collectionOptions, collectionExtend.mergeOptions);
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

    const migratorOptions: any = this.options.migrator || {};

    const context = {
      db: this,
      sequelize: this.sequelize,
      queryInterface: this.sequelize.getQueryInterface(),
      ...migratorOptions.context,
    };

    this.migrations = new Migrations(context);
    this.migrator = new Umzug({
      logger: migratorOptions.logger || console,
      migrations: this.migrations.callback(),
      context,
      storage: new SequelizeStorage({
        modelName: `${this.options.tablePrefix || ''}migrations`,
        ...migratorOptions.storage,
        sequelize: this.sequelize,
      }),
    });
  }

  addMigration(item) {
    return this.migrations.add(item);
  }

  addMigrations(options: AddMigrationsOptions) {
    const { namespace, context, extensions = ['js', 'ts'], directory } = options;
    const patten = `${directory}/*.{${extensions.join(',')}}`;
    const files = glob.sync(patten, {
      ignore: ['**/*.d.ts'],
    });
    for (const file of files) {
      let filename = basename(file);
      filename = filename.substring(0, filename.lastIndexOf('.')) || filename;
      this.migrations.add({
        name: namespace ? `${namespace}/${filename}` : filename,
        migration: this.requireModule(file),
        context,
      });
    }
  }

  inDialect(...dialect: string[]) {
    return dialect.includes(this.sequelize.getDialect());
  }

  private requireModule(module: any) {
    if (typeof module === 'string') {
      module = require(module);
    }
    if (typeof module !== 'object') {
      return module;
    }
    return module.__esModule ? module.default : module;
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
    this.modelCollection.set(collection.model, collection);

    this.emit('afterDefineCollection', collection);

    return collection;
  }

  getTablePrefix() {
    return this.options.tablePrefix || '';
  }

  /**
   * get exists collection by its name
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

    this.sequelize.modelManager.removeModel(collection.model);

    if (result) {
      this.emit('afterRemoveCollection', collection);
    }

    return collection;
  }

  getModel<M extends Model>(name: string) {
    return this.getCollection(name).model as ModelCtor<M>;
  }

  getRepository<R extends Repository>(name: string): R;
  getRepository<R extends RelationRepository>(name: string, relationId: string | number): R;

  getRepository<R extends RelationRepository>(name: string, relationId?: string | number): Repository | R {
    if (relationId) {
      const [collection, relation] = name.split('.');
      return this.getRepository(collection)?.relation(relation)?.of(relationId) as R;
    }

    return this.getCollection(name)?.repository;
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
      ...extendOperators,
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

  async clean(options: CleanOptions) {
    const { drop, ...others } = options;
    if (drop) {
      await this.sequelize.getQueryInterface().dropAllTables(others);
    }
  }

  async collectionExistsInDb(name, options?: Transactionable) {
    const tables = await this.sequelize.getQueryInterface().showAllTables({
      transaction: options?.transaction,
    });
    return !!tables.find((table) => table === `${this.getTablePrefix()}${name}`);
  }

  public isSqliteMemory() {
    return this.sequelize.getDialect() === 'sqlite' && lodash.get(this.options, 'storage') == ':memory:';
  }

  async auth(options: QueryOptions & { retry?: number } = {}) {
    const { retry = 10, ...others } = options;
    const delay = (ms) => new Promise((yea) => setTimeout(yea, ms));
    let count = 1;
    const authenticate = async () => {
      try {
        await this.sequelize.authenticate(others);
        console.log('Connection has been established successfully.');
        return true;
      } catch (error) {
        if (count >= retry) {
          throw error;
        }
        console.log('reconnecting...', count);
        ++count;
        await delay(500);
        return await authenticate();
      }
    };
    return await authenticate();
  }

  async reconnect() {
    if (this.isSqliteMemory()) {
      return;
    }
    // @ts-ignore
    const ConnectionManager = this.sequelize.dialect.connectionManager.constructor;
    // @ts-ignore
    const connectionManager = new ConnectionManager(this.sequelize.dialect, this.sequelize);
    // @ts-ignore
    this.sequelize.dialect.connectionManager = connectionManager;
    // @ts-ignore
    this.sequelize.connectionManager = connectionManager;
  }

  closed() {
    // @ts-ignore
    return this.sequelize.connectionManager.pool._draining;
  }

  async close() {
    if (this.isSqliteMemory()) {
      return;
    }

    return this.sequelize.close();
  }

  on(event: string | symbol, listener): this {
    // NOTE: to match if event is a sequelize or model type
    const type = this.modelHook.match(event);

    if (type && !this.modelHook.hasBoundEvent(type)) {
      this.sequelize.addHook(type, this.modelHook.buildSequelizeHook(type));
      this.modelHook.bindEvent(type);
    }

    return super.on(event, listener);
  }

  async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>> {
    const reader = new ImporterReader(options.directory, options.extensions);
    const modules = await reader.read();
    const result = new Map<string, Collection>();

    for (const module of modules) {
      if (module.extend) {
        const collectionName = module.collectionOptions.name;
        const existCollection = this.getCollection(collectionName);
        if (existCollection) {
          existCollection.updateOptions(module.collectionOptions, module.mergeOptions);
        } else {
          const existDelayExtends = this.delayCollectionExtend.get(collectionName) || [];

          this.delayCollectionExtend.set(collectionName, [...existDelayExtends, module]);
        }
      } else {
        const collection = this.collection(module);
        result.set(collection.name, collection);
      }
    }

    return result;
  }

  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;
}

export function extend(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions) {
  return {
    collectionOptions,
    mergeOptions,
    extend: true,
  };
}

export const defineCollection = (collectionOptions: CollectionOptions) => {
  return collectionOptions;
};

export const extendCollection = (collectionOptions: CollectionOptions, mergeOptions?: MergeOptions) => {
  return {
    collectionOptions,
    mergeOptions,
    extend: true,
  };
};

applyMixins(Database, [AsyncEmitter]);

export default Database;

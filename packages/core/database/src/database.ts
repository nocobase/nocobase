/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createConsoleLogger, createLogger, Logger, LoggerOptions } from '@nocobase/logger';
import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import chalk from 'chalk';
import merge from 'deepmerge';
import { EventEmitter } from 'events';
import { backOff } from 'exponential-backoff';
import glob from 'glob';
import lodash from 'lodash';
import { nanoid } from 'nanoid';
import { basename, isAbsolute, resolve } from 'path';
import safeJsonStringify from 'safe-json-stringify';
import {
  DataTypes,
  ModelStatic,
  Op,
  Options,
  QueryInterfaceDropAllTablesOptions,
  QueryOptions,
  Sequelize,
  SyncOptions,
  Transactionable,
  Utils,
} from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { Collection, CollectionOptions, RepositoryType } from './collection';
import { CollectionFactory } from './collection-factory';
import { ImporterReader, ImportFileExtension } from './collection-importer';
import DatabaseUtils from './database-utils';
import { BaseDialect } from './dialects/base-dialect';
import ReferencesMap from './features/references-map';
import { referentialIntegrityCheck } from './features/referential-integrity-check';
import { ArrayFieldRepository } from './field-repository/array-field-repository';
import * as FieldTypes from './fields';
import { Field, FieldContext, RelationField } from './fields';
import { checkDatabaseVersion, registerDialects } from './helpers';
import { InheritedCollection } from './inherited-collection';
import InheritanceMap from './inherited-map';
import { InterfaceManager } from './interface-manager';
import { registerInterfaces } from './interfaces/utils';
import { registerBuiltInListeners } from './listeners';
import { MigrationItem, Migrations } from './migration';
import { Model } from './model';
import { ModelHook } from './model-hook';
import extendOperators from './operators';
import QueryInterface from './query-interface/query-interface';
import buildQueryInterface from './query-interface/query-interface-builder';
import { RelationRepository } from './relation-repository/relation-repository';
import { Repository, TargetKey } from './repository';
import {
  AfterDefineCollectionListener,
  BeforeDefineCollectionListener,
  CreateListener,
  CreateWithAssociationsListener,
  DatabaseAfterDefineCollectionEventType,
  DatabaseAfterRemoveCollectionEventType,
  DatabaseBeforeDefineCollectionEventType,
  DatabaseBeforeRemoveCollectionEventType,
  DestroyListener,
  EventType,
  ModelCreateEventTypes,
  ModelCreateWithAssociationsEventTypes,
  ModelDestroyEventTypes,
  ModelSaveEventTypes,
  ModelSaveWithAssociationsEventTypes,
  ModelUpdateEventTypes,
  ModelUpdateWithAssociationsEventTypes,
  ModelValidateEventTypes,
  RemoveCollectionListener,
  SaveListener,
  SaveWithAssociationsListener,
  SyncListener,
  UpdateListener,
  UpdateWithAssociationsListener,
  ValidateListener,
} from './types';
import { patchSequelizeQueryInterface, snakeCase } from './utils';
import { BaseValueParser, registerFieldValueParsers } from './value-parsers';
import { ViewCollection } from './view-collection';

export type MergeOptions = merge.Options;

export interface PendingOptions {
  field: RelationField;
  model: ModelStatic<Model>;
}

interface MapOf<T> {
  [key: string]: T;
}

export interface IDatabaseOptions extends Options {
  tablePrefix?: string;
  migrator?: any;
  usingBigIntForId?: boolean;
  underscored?: boolean;
  logger?: LoggerOptions | Logger;
  customHooks?: any;
  instanceId?: string;
  addAllCollections?: boolean;
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

type RunSQLOptions = {
  filter?: Record<string, any>;
  bind?: Record<string, any> | Array<any>;
  type?: 'selectVar' | 'selectRow' | 'selectRows';
} & Transactionable;

export class Database extends EventEmitter implements AsyncEmitter {
  static dialects = new Map<string, typeof BaseDialect>();

  sequelize: Sequelize;
  migrator: Umzug;
  migrations: Migrations;
  fieldTypes = new Map();
  fieldValueParsers = new Map();
  options: IDatabaseOptions;
  models = new Map<string, ModelStatic<Model>>();
  repositories = new Map<string, RepositoryType>();
  operators = new Map();
  collections = new Map<string, Collection>();
  collectionsSort = new Map<string, number>();
  pendingFields = new Map<string, RelationField[]>();
  modelCollection = new Map<ModelStatic<any>, Collection>();
  modelNameCollectionMap = new Map<string, Collection>();
  tableNameCollectionMap = new Map<string, Collection>();
  context: any = {};
  queryInterface: QueryInterface;
  utils = new DatabaseUtils(this);
  referenceMap = new ReferencesMap(this);
  inheritanceMap = new InheritanceMap();
  importedFrom = new Map<string, Set<string>>();
  modelHook: ModelHook;
  delayCollectionExtend = new Map<string, { collectionOptions: CollectionOptions; mergeOptions?: any }[]>();
  logger: Logger;
  interfaceManager = new InterfaceManager(this);
  collectionFactory: CollectionFactory = new CollectionFactory(this);
  dialect: BaseDialect;

  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;

  static registerDialect(dialect: typeof BaseDialect) {
    this.dialects.set(dialect.dialectName, dialect);
  }

  static getDialect(name: string) {
    return this.dialects.get(name);
  }

  constructor(options: DatabaseOptions) {
    super();

    const dialectClass = Database.getDialect(options.dialect);

    if (!dialectClass) {
      throw new Error(`unsupported dialect ${options.dialect}`);
    }

    // @ts-ignore
    this.dialect = new dialectClass();

    const opts = {
      sync: {
        alter: {
          drop: false,
        },
        force: false,
      },
      ...lodash.clone(options),
    };

    if (options.logger) {
      if (typeof options.logger['log'] === 'function') {
        this.logger = options.logger as Logger;
      } else {
        this.logger = createLogger(options.logger);
      }
    } else {
      this.logger = createConsoleLogger();
    }

    if (!options.instanceId) {
      this._instanceId = nanoid();
    } else {
      this._instanceId = options.instanceId;
    }

    if (options.storage && options.storage !== ':memory:') {
      if (!isAbsolute(options.storage)) {
        opts.storage = resolve(process.cwd(), options.storage);
      }
    }

    // @ts-ignore
    opts.rawTimezone = opts.timezone;

    if (options.dialect === 'sqlite') {
      delete opts.timezone;
    } else if (!opts.timezone) {
      opts.timezone = '+00:00';
    }

    if (options.dialect === 'postgres') {
      const types = require('pg').types;

      types.setTypeParser(types.builtins.INT8, function (val) {
        if (val <= Number.MAX_SAFE_INTEGER) {
          return Number(val);
        }

        return val;
      });
    }

    if (options.logging && process.env['DB_SQL_BENCHMARK'] == 'true') {
      opts.benchmark = true;
    }

    this.options = opts;

    this.logger.debug(
      `create database instance: ${safeJsonStringify(
        // remove sensitive information
        lodash.omit(this.options, ['storage', 'host', 'password']),
      )}`,
      {
        databaseInstanceId: this.instanceId,
      },
    );

    const sequelizeOptions = this.sequelizeOptions(this.options);
    this.sequelize = new Sequelize(sequelizeOptions);

    this.queryInterface = buildQueryInterface(this);

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
    for (const [name, field] of Object.entries<any>(FieldTypes)) {
      if (['Field', 'RelationField'].includes(name)) {
        continue;
      }
      let key = name.replace(/Field$/g, '');
      key = key.substring(0, 1).toLowerCase() + key.substring(1);
      this.registerFieldTypes({
        [key]: field,
      });
    }

    registerInterfaces(this);
    registerFieldValueParsers(this);

    this.initOperators();

    const migratorOptions: any = this.options.migrator || {};

    const context = {
      db: this,
      sequelize: this.sequelize,
      queryInterface: this.sequelize.getQueryInterface(),
      ...migratorOptions.context,
    };

    this.migrations = new Migrations(context);

    this.sequelize.beforeDefine((model, opts) => {
      if (this.options.tablePrefix) {
        if (opts.tableName && opts.tableName.startsWith(this.options.tablePrefix)) {
          return;
        }
        opts.tableName = `${this.options.tablePrefix}${opts.tableName || opts.modelName || opts.name.plural}`;
      }
    });

    this.collection({
      name: 'migrations',
      autoGenId: false,
      timestamps: false,
      dumpRules: 'required',
      migrationRules: ['schema-only', 'overwrite'],
      origin: '@nocobase/database',
      fields: [{ type: 'string', name: 'name', primaryKey: true }],
    });

    this.migrator = new Umzug({
      logger: migratorOptions.logger || console,
      migrations: this.migrations.callback(),
      context,
      storage: new SequelizeStorage({
        tableName: `${this.options.tablePrefix || ''}migrations`,
        modelName: 'migrations',
        ...migratorOptions.storage,
        sequelize: this.sequelize,
      }),
    });

    this.initListener();
    patchSequelizeQueryInterface(this);

    this.registerCollectionType();
  }

  _instanceId: string;

  get instanceId() {
    return this._instanceId;
  }

  /**
   * @internal
   */
  createMigrator({ migrations }) {
    const migratorOptions: any = this.options.migrator || {};
    const context = {
      db: this,
      sequelize: this.sequelize,
      queryInterface: this.sequelize.getQueryInterface(),
      ...migratorOptions.context,
    };
    return new Umzug({
      logger: migratorOptions.logger || console,
      migrations: Array.isArray(migrations) ? lodash.sortBy(migrations, (m) => m.name) : migrations,
      context,
      storage: new SequelizeStorage({
        tableName: `${this.options.tablePrefix || ''}migrations`,
        modelName: 'migrations',
        ...migratorOptions.storage,
        sequelize: this.sequelize,
      }),
    });
  }

  /**
   * @internal
   */
  setContext(context: any) {
    this.context = context;
  }

  /**
   * @internal
   */
  sequelizeOptions(options) {
    return this.dialect.getSequelizeOptions(options);
  }

  /**
   * @internal
   */
  initListener() {
    this.on('afterConnect', async (client) => {
      if (this.inDialect('postgres')) {
        await client.query('SET search_path = public');
      }
    });

    this.on('beforeDefine', (model, options) => {
      if (this.options.underscored && options.underscored === undefined) {
        options.underscored = true;
      }
    });

    this.on('afterCreate', async (instance) => {
      instance?.toChangedWithAssociations?.();
    });

    this.on('beforeValidate', async (instance) => {
      for (const [key, attribute] of Object.entries(instance.constructor.rawAttributes)) {
        // @ts-ignore
        if (attribute.unique && instance.changed(key)) {
          if (instance.get(key) === '') {
            instance.set(key, null);
          }
        }
      }
    });

    this.on('afterUpdate', async (instance) => {
      instance?.toChangedWithAssociations?.();
    });

    this.on('beforeDestroy', async (instance, options) => {
      await referentialIntegrityCheck({
        db: this,
        referencedInstance: instance,
        transaction: options.transaction,
      });
    });

    this.on('afterRemoveCollection', (collection) => {
      this.inheritanceMap.removeNode(collection.name);
    });

    this.on('afterDefine', (model) => {
      if (lodash.get(this.options, 'usingBigIntForId', true)) {
        const idAttribute = model.rawAttributes['id'];
        if (idAttribute && idAttribute.primaryKey) {
          model.rawAttributes['id'].type = DataTypes.BIGINT;
          model.refreshAttributes();
        }
      }
    });

    this.on('afterUpdateCollection', (collection, options) => {
      if (collection.options.schema) {
        collection.model._schema = collection.options.schema;
      }
      if (collection.options.sql) {
        collection.modelInit();
      }
    });

    this.on('beforeDefineCollection', (options) => {
      if (this.options.underscored && options.underscored === undefined) {
        options.underscored = true;
      }

      if (options.underscored) {
        if (lodash.get(options, 'indexes')) {
          // change index fields to snake case
          options.indexes = options.indexes.map((index) => {
            if (index.fields) {
              index.fields = index.fields.map((field) => {
                if (field.name) {
                  return { name: snakeCase(field.name), ...field };
                }
                return snakeCase(field);
              });
            }

            return index;
          });
        }
      }

      if (this.options.schema && !options.schema) {
        options.schema = this.options.schema;
      }
    });

    this.on('afterDefineCollection', async (collection: Collection) => {
      const options = collection.options;
      if (options.origin) {
        const existsSet = this.importedFrom.get(options.origin) || new Set();
        existsSet.add(collection.name);
        this.importedFrom.set(options.origin, existsSet);
      }
    });

    registerBuiltInListeners(this);
  }

  addMigration(item: MigrationItem) {
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
        migration: file,
        context,
      });
    }
  }

  inDialect(...dialect: string[]) {
    return dialect.includes(this.sequelize.getDialect());
  }

  isMySQLCompatibleDialect() {
    return this.inDialect('mysql', 'mariadb');
  }

  isPostgresCompatibleDialect() {
    return this.inDialect('postgres');
  }

  /**
   * Add collection to database
   * @param options
   */
  collection<Attributes = any, CreateAttributes = Attributes>(
    options: CollectionOptions,
  ): Collection<Attributes, CreateAttributes> {
    options = lodash.cloneDeep(options);

    if (typeof options.underscored !== 'boolean') {
      if (this.options.underscored) {
        options.underscored = true;
      }
    }

    this.logger.trace(`beforeDefineCollection: ${safeJsonStringify(options)}`, {
      databaseInstanceId: this.instanceId,
    });

    this.emit('beforeDefineCollection', options);

    const collection = this.collectionFactory.createCollection(options);

    this.collections.set(collection.name, collection);

    this.emit('afterDefineCollection', collection);

    return collection;
  }

  getTablePrefix() {
    return this.options.tablePrefix || '';
  }

  getFieldByPath(path: string) {
    if (!path) {
      return;
    }

    const [collectionName, associationName, ...args] = path.split('.');
    const collection = this.getCollection(collectionName);

    if (!collection) {
      return;
    }

    const field = collection.getField(associationName);

    if (!field) {
      return;
    }

    if (args.length > 0) {
      return this.getFieldByPath(`${field?.target}.${args.join('.')}`);
    }

    return field;
  }

  getCollectionByModelName(name: string) {
    return this.modelNameCollectionMap.get(name);
  }

  /**
   * get exists collection by its name
   * @param name
   */
  getCollection(name: string): Collection {
    if (!name) {
      return null;
    }

    const [collectionName, associationName] = name.split('.');
    const collection = this.collections.get(collectionName);

    if (associationName) {
      const target = collection.getField(associationName)?.target;
      return target ? this.collections.get(target) : null;
    }

    return collection;
  }

  hasCollection(name: string): boolean {
    return !!this.getCollection(name);
  }

  removeCollection(name: string) {
    const collection = this.collections.get(name);
    this.emit('beforeRemoveCollection', collection);

    collection.resetFields();

    const result = this.collections.delete(name);

    this.sequelize.modelManager.removeModel(collection.model);

    if (result) {
      this.emit('afterRemoveCollection', collection);
    }

    return collection;
  }

  getModel<M extends Model>(name: string) {
    return this.getCollection(name).model as ModelStatic<M>;
  }

  getRepository<R extends Repository>(name: string): R;

  getRepository<R extends RelationRepository>(name: string, relationId: TargetKey): R;

  getRepository<R extends ArrayFieldRepository>(name: string, relationId: TargetKey): R;

  getRepository<R extends RelationRepository>(name: string, relationId?: TargetKey): Repository | R {
    const [collection, relation] = name.split('.');
    if (relation) {
      return this.getRepository(collection)?.relation(relation)?.of(relationId) as R;
    }
    return this.getCollection(name)?.repository;
  }

  /**
   * @internal
   */
  addPendingField(field: RelationField) {
    const associating = this.pendingFields;
    const items = this.pendingFields.get(field.target) || [];
    items.push(field);
    associating.set(field.target, items);
  }

  /**
   * @internal
   */
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

  registerFieldValueParsers(parsers: MapOf<any>) {
    for (const [type, parser] of Object.entries(parsers)) {
      this.fieldValueParsers.set(type, parser);
    }
  }

  buildFieldValueParser<T extends BaseValueParser>(field: Field, ctx: any) {
    const Parser =
      field && this.fieldValueParsers.has(field.type)
        ? this.fieldValueParsers.get(field.type)
        : this.fieldValueParsers.get('default');
    const parser = new Parser(field, ctx);
    return parser as T;
  }

  registerModels(models: MapOf<ModelStatic<any>>) {
    for (const [type, schemaType] of Object.entries(models)) {
      this.models.set(type, schemaType);
    }
  }

  registerRepositories(repositories: MapOf<RepositoryType>) {
    for (const [type, schemaType] of Object.entries(repositories)) {
      this.repositories.set(type, schemaType);
    }
  }

  /**
   * @internal
   */
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
      ...(extendOperators as unknown as MapOf<OperatorFunc>),
    });
  }

  registerOperators(operators: MapOf<OperatorFunc>) {
    for (const [key, operator] of Object.entries(operators)) {
      this.operators.set(key, operator);
    }
  }

  /**
   * @internal
   */
  buildField(options, context: FieldContext) {
    const { type } = options;

    const Field = this.fieldTypes.get(type);

    if (!Field) {
      throw Error(`unsupported field type ${type}`);
    }

    const { collection } = context;

    if (options.field && collection.options.underscored && !collection.isView()) {
      options.field = snakeCase(options.field);
    }

    if (Object.prototype.hasOwnProperty.call(options, 'defaultValue') && options.defaultValue === null) {
      delete options.defaultValue;
    }

    return new Field(options, context);
  }

  async sync(options?: SyncOptions) {
    const isMySQL = this.isMySQLCompatibleDialect();
    if (isMySQL) {
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', null);
    }

    if (this.options.schema && this.inDialect('postgres')) {
      await this.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${this.options.schema}"`, null);
    }

    const result = await this.sequelize.sync(options);

    if (isMySQL) {
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null);
    }

    return result;
  }

  async clean(options: CleanOptions) {
    const { drop, ...others } = options || {};
    if (drop !== true) {
      return;
    }

    if (this.options.schema) {
      const tableNames = (await this.sequelize.getQueryInterface().showAllTables()).map((table) => {
        return `"${this.options.schema}"."${table}"`;
      });

      const skip = options.skip || [];

      // @ts-ignore
      for (const tableName of tableNames) {
        if (skip.includes(tableName)) {
          continue;
        }
        await this.sequelize.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
      }
      return;
    }

    await this.queryInterface.dropAll(options);
  }

  async collectionExistsInDb(name: string, options?: Transactionable) {
    const collection = this.getCollection(name);

    if (!collection) {
      return false;
    }

    return await this.queryInterface.collectionTableExists(collection, options);
  }

  isSqliteMemory() {
    return this.sequelize.getDialect() === 'sqlite' && lodash.get(this.options, 'storage') == ':memory:';
  }

  /* istanbul ignore next -- @preserve */
  async auth(options: Omit<QueryOptions, 'retry'> & { retry?: number | Pick<QueryOptions, 'retry'> } = {}) {
    const { retry = 9, ...others } = options;
    const startingDelay = 50;
    const timeMultiple = 2;

    let attemptNumber = 1; // To track the current attempt number

    const authenticate = async () => {
      try {
        await this.sequelize.authenticate(others);
        this.logger.info('connection has been established successfully.', { method: 'auth' });
      } catch (error) {
        this.logger.warn(`attempt ${attemptNumber}/${retry}: Unable to connect to the database: ${error.message}`, {
          method: 'auth',
        });
        const nextDelay = startingDelay * Math.pow(timeMultiple, attemptNumber - 1);
        attemptNumber++;
        if (attemptNumber < (retry as number)) {
          this.logger.warn(`will retry in ${nextDelay}ms...`, { method: 'auth' });
        }
        throw error; // Re-throw the error so that backoff can catch and handle it
      }
    };

    try {
      await backOff(authenticate, {
        numOfAttempts: retry as number,
        startingDelay: startingDelay,
        timeMultiple: timeMultiple,
      });
    } catch (error) {
      throw new Error(`Unable to connect to the database`, { cause: error });
    }
  }

  /**
   * @internal
   */
  async checkVersion() {
    return process.env.DB_SKIP_VERSION_CHECK === 'on' || (await checkDatabaseVersion(this));
  }

  /**
   * @internal
   */
  async prepare() {
    if (this.isMySQLCompatibleDialect()) {
      const result = await this.sequelize.query(`SHOW VARIABLES LIKE 'lower_case_table_names'`, { plain: true });

      if (result?.Value === '1' && !this.options.underscored) {
        throw new Error(
          `Your database lower_case_table_names=1, please add ${chalk.yellow('DB_UNDERSCORED=true')} to the .env file`,
        );
      }
    }

    if (this.inDialect('postgres') && this.options.schema && this.options.schema != 'public') {
      await this.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${this.options.schema}"`, null);
    }
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

    await this.emitAsync('beforeClose', this);

    const closeResult = this.sequelize.close();

    if (this.options?.customHooks?.['afterClose']) {
      await this.options.customHooks['afterClose'](this);
    }

    return closeResult;
  }

  on(event: EventType, listener: any): this;

  on(event: ModelValidateEventTypes, listener: SyncListener): this;

  on(event: ModelValidateEventTypes, listener: ValidateListener): this;

  on(event: ModelCreateEventTypes, listener: CreateListener): this;

  on(event: ModelUpdateEventTypes, listener: UpdateListener): this;

  on(event: ModelSaveEventTypes, listener: SaveListener): this;

  on(event: ModelDestroyEventTypes, listener: DestroyListener): this;

  on(event: ModelCreateWithAssociationsEventTypes, listener: CreateWithAssociationsListener): this;

  on(event: ModelUpdateWithAssociationsEventTypes, listener: UpdateWithAssociationsListener): this;

  on(event: ModelSaveWithAssociationsEventTypes, listener: SaveWithAssociationsListener): this;

  on(event: DatabaseBeforeDefineCollectionEventType, listener: BeforeDefineCollectionListener): this;

  on(event: DatabaseAfterDefineCollectionEventType, listener: AfterDefineCollectionListener): this;

  on(
    event: DatabaseBeforeRemoveCollectionEventType | DatabaseAfterRemoveCollectionEventType,
    listener: RemoveCollectionListener,
  ): this;

  on(event: EventType, listener: any): this {
    // NOTE: to match if event is a sequelize or model type
    const type = this.modelHook.match(event);

    if (type && !this.modelHook.hasBoundEvent(type)) {
      this.sequelize.addHook(type, this.modelHook.buildSequelizeHook(type));
      this.modelHook.bindEvent(type);
    }

    return super.on(event, listener);
  }

  extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions) {
    collectionOptions = lodash.cloneDeep(collectionOptions);
    const collectionName = collectionOptions.name;
    const existCollection = this.getCollection(collectionName);
    if (existCollection) {
      existCollection.updateOptions(collectionOptions, mergeOptions);
    } else {
      const existDelayExtends = this.delayCollectionExtend.get(collectionName) || [];

      this.delayCollectionExtend.set(collectionName, [...existDelayExtends, { collectionOptions, mergeOptions }]);
    }
  }

  async import(options: {
    directory: string;
    from?: string;
    extensions?: ImportFileExtension[];
  }): Promise<Map<string, Collection>> {
    const reader = new ImporterReader(options.directory, options.extensions);
    const modules = await reader.read();
    const result = new Map<string, Collection>();

    for (const module of modules) {
      if (module.extend) {
        this.extendCollection(module.collectionOptions, module.mergeOptions);
      } else {
        const collection = this.collection({
          ...module,
          origin: options.from,
        });

        result.set(collection.name, collection);
      }
    }

    return result;
  }

  private registerCollectionType() {
    this.collectionFactory.registerCollectionType(InheritedCollection, {
      condition: (options) => {
        return options.inherits && lodash.castArray(options.inherits).length > 0;
      },
    });

    this.collectionFactory.registerCollectionType(ViewCollection, {
      condition: (options) => {
        return options.viewName || options.view;
      },

      async onSync() {
        return;
      },

      async onDump(dumper, collection: Collection) {
        try {
          const viewDef = await collection.db.queryInterface.viewDef(collection.getTableNameWithSchemaAsString());

          dumper.writeSQLContent(`view-${collection.name}`, {
            sql: [
              `DROP VIEW IF EXISTS ${collection.getTableNameWithSchemaAsString()}`,
              `CREATE VIEW ${collection.getTableNameWithSchemaAsString()} AS ${viewDef}`,
            ],
            group: 'required',
          });
        } catch (e) {
          return;
        }
        return;
      },
    });
  }

  async runSQL(sql: string, options: RunSQLOptions = {}) {
    const { filter, bind, type, transaction } = options;
    let finalSQL = sql;

    if (filter) {
      let where = {};
      const tmpCollection = new Collection({ name: 'tmp', underscored: false }, { database: this });
      const r = tmpCollection.repository;
      where = r.buildQueryOptions({ filter }).where;
      const queryGenerator = this.sequelize.getQueryInterface().queryGenerator as any;
      const wSQL = queryGenerator.getWhereConditions(where, null, null, { bindParam: true });

      if (wSQL) {
        // 标准化 SQL，去除多余空格
        const normalizedSQL = sql.replace(/\s+/g, ' ').trim();

        // 检查是否已有 WHERE 子句
        const hasWhere = /\bwhere\b/i.test(normalizedSQL);

        // 在标准化的 SQL 上查找关键字位置
        const orderByMatch = normalizedSQL.match(/\border\s+by\b/i);
        const groupByMatch = normalizedSQL.match(/\bgroup\s+by\b/i);
        const havingMatch = normalizedSQL.match(/\bhaving\b/i);
        const limitMatch = normalizedSQL.match(/\blimit\b/i);
        const offsetMatch = normalizedSQL.match(/\boffset\b/i);

        // 找到最早出现的关键字位置
        const matches = [orderByMatch, groupByMatch, havingMatch, limitMatch, offsetMatch]
          .filter((match) => match !== null)
          .map((match) => ({ index: match.index, keyword: match[0] }));

        if (matches.length > 0) {
          // 有后续子句，需要在它们之前插入 WHERE 条件
          const earliestMatch = matches.reduce((prev, curr) => (prev.index < curr.index ? prev : curr));

          // 使用标准化的 SQL 进行分割，确保索引位置正确
          const beforeClause = normalizedSQL.substring(0, earliestMatch.index).trim();
          const afterClause = normalizedSQL.substring(earliestMatch.index).trim();

          if (hasWhere) {
            finalSQL = `${beforeClause} AND (${wSQL}) ${afterClause}`;
          } else {
            finalSQL = `${beforeClause} WHERE (${wSQL}) ${afterClause}`;
          }
        } else {
          // 没有后续子句，直接在末尾添加
          if (hasWhere) {
            finalSQL = `${normalizedSQL} AND (${wSQL})`;
          } else {
            // 处理末尾分号
            if (normalizedSQL.endsWith(';')) {
              finalSQL = `${normalizedSQL.slice(0, -1)} WHERE (${wSQL});`;
            } else {
              finalSQL = `${normalizedSQL} WHERE (${wSQL})`;
            }
          }
        }
      }
    }
    const result = await this.sequelize.query(finalSQL, { bind, transaction });
    if (type === 'selectVar') {
      return Object.values(result[0][0] || {}).shift();
    }
    if (type === 'selectRow') {
      return result[0][0] || null;
    }
    if (type === 'selectRows') {
      return result[0] || [];
    }
    return result[0];
  }
}

export function extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions) {
  return {
    collectionOptions,
    mergeOptions,
    extend: true,
  };
}

export const extend = extendCollection;

export const defineCollection = (collectionOptions: CollectionOptions) => {
  return collectionOptions;
};

applyMixins(Database, [AsyncEmitter]);
registerDialects();

export default Database;

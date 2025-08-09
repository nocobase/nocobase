/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import merge from 'deepmerge';
import { EventEmitter } from 'events';
import { default as _, default as lodash } from 'lodash';
import safeJsonStringify from 'safe-json-stringify';
import {
  ModelOptions,
  ModelStatic,
  QueryInterfaceDropTableOptions,
  QueryInterfaceOptions,
  SyncOptions,
  Transactionable,
  Utils,
} from 'sequelize';
import { BuiltInGroup } from './collection-group-manager';
import { Database } from './database';
import { BelongsToField, Field, FieldOptions, HasManyField, RelationField } from './fields';
import { Model } from './model';
import { Repository } from './repository';
import { checkIdentifier, md5, snakeCase } from './utils';
import { buildJoiSchema, getJoiErrorMessage } from './utils/field-validation';

export type RepositoryType = typeof Repository;

export type CollectionSortable =
  | string
  | boolean
  | {
      name?: string;
      scopeKey?: string;
    };

type dumpable = 'required' | 'optional' | 'skip';
type dumpableType = 'meta' | 'business' | 'config';

function EnsureAtomicity(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const model = this.model;
    const beforeAssociationKeys = Object.keys(model.associations);
    const beforeRawAttributes = Object.keys(model.rawAttributes);
    const fieldName = args[0];
    const beforeField = this.getField(fieldName);

    try {
      return originalMethod.apply(this, args);
    } catch (error) {
      // remove associations created in this method
      const afterAssociationKeys = Object.keys(model.associations);
      const createdAssociationKeys = lodash.difference(afterAssociationKeys, beforeAssociationKeys);
      for (const key of createdAssociationKeys) {
        delete this.model.associations[key];
      }

      const afterRawAttributes = Object.keys(model.rawAttributes);
      const createdRawAttributes = lodash.difference(afterRawAttributes, beforeRawAttributes);
      for (const key of createdRawAttributes) {
        delete this.model.rawAttributes[key];
      }

      // remove field created in this method
      if (!beforeField) {
        this.removeField(fieldName);
      }

      throw error;
    }
  };

  return descriptor;
}

export type BaseDumpRules = {
  delayRestore?: any;
};

export type DumpRules =
  | BuiltInGroup
  | ({ required: true } & BaseDumpRules)
  | ({ skipped: true } & BaseDumpRules)
  | ({ group: BuiltInGroup | string } & BaseDumpRules);

export type MigrationRule = 'overwrite' | 'skip' | 'upsert' | 'schema-only' | 'insert-ignore' | (string & {}) | null;

export interface CollectionOptions extends Omit<ModelOptions, 'name' | 'hooks'> {
  name: string;
  title?: string;
  namespace?: string;
  migrationRules?: MigrationRule[];
  dumpRules?: DumpRules;
  tableName?: string;
  inherits?: string[] | string;
  viewName?: string;
  writableView?: boolean;
  isThrough?: boolean;
  filterTargetKey?: string | string[];
  fields?: FieldOptions[];
  fieldSort?: string[];

  model?: string | ModelStatic<Model>;
  repository?: string | RepositoryType;
  sortable?: CollectionSortable;
  /**
   * @default true
   */
  autoGenId?: boolean;
  /**
   * @default 'options'
   */
  magicAttribute?: string;
  tree?: string;
  template?: string;

  simplePaginate?: boolean;

  /**
   * where is the collection from
   *
   * values
   * - 'plugin' - collection is from plugin
   * - 'core' - collection is from core
   * - 'user' - collection is from user
   */
  origin?: string;
  asStrategyResource?: boolean;

  [key: string]: any;
}

export interface CollectionContext {
  database: Database;
}

export class Collection<
  TModelAttributes extends {} = any,
  TCreationAttributes extends {} = TModelAttributes,
> extends EventEmitter {
  options: CollectionOptions;
  context: CollectionContext;
  isThrough?: boolean;
  fields: Map<string, any> = new Map<string, any>();
  model: ModelStatic<Model>;
  repository: Repository<TModelAttributes, TCreationAttributes>;

  constructor(options: CollectionOptions, context: CollectionContext) {
    super();
    this.context = context;
    this.options = options;

    this.checkOptions(options);

    this.bindFieldEventListener();
    this.modelInit();

    this.db.modelCollection.set(this.model, this);
    this.db.modelNameCollectionMap.set(this.model.name, this);

    // set tableName to collection map
    // the form of key is `${schema}.${tableName}` if schema exists
    // otherwise is `${tableName}`
    this.db.tableNameCollectionMap.set(this.getTableNameWithSchemaAsString(), this);

    if (!options.inherits) {
      this.setFields(options.fields);
    }

    this.setRepository(options.repository);
    this.setSortable(options.sortable);
  }

  get filterTargetKey(): string | string[] {
    const targetKey = this.options?.filterTargetKey;

    if (Array.isArray(targetKey)) {
      if (targetKey.length === 1) {
        return targetKey[0];
      }

      return targetKey;
    }

    if (targetKey && this.model.getAttributes()[targetKey]) {
      return targetKey;
    }

    if (this.model.primaryKeyAttributes.length > 1) {
      return null;
    }

    return this.model.primaryKeyAttribute;
  }

  get name() {
    return this.options.name;
  }

  get origin() {
    return this.options.origin || 'core';
  }

  get titleField() {
    return (this.options.titleField as string) || this.model.primaryKeyAttribute;
  }

  get db() {
    return this.context.database;
  }

  get treeParentField(): BelongsToField | null {
    for (const [_, field] of this.fields) {
      if (field.options.treeParent) {
        return field;
      }
    }
  }

  get treeChildrenField(): HasManyField | null {
    for (const [_, field] of this.fields) {
      if (field.options.treeChildren) {
        return field;
      }
    }
  }

  validate(options: {
    values: Record<string, any> | Record<string, any>[];
    operation: 'create' | 'update';
    context: { t: Function };
  }) {
    const { values: updateValues, context, operation } = options;
    if (!updateValues) {
      return;
    }
    const values = Array.isArray(updateValues) ? updateValues : [updateValues];
    const { t } = context || { t: (key: string, options: any) => key };
    const helper = (field: Field, value: Object) => {
      const val = value[field.name];
      if (!field.options.validation) {
        return;
      }

      if (field instanceof RelationField) {
        if (field.options?.validation.rules) {
          const isRequired = field.options?.validation.rules.some((rule) => rule.name === 'required');
          if (isRequired && !val) {
            throw new Error(
              t('{{#label}} is required', { ns: 'client', label: field.options.uiSchema?.title || field.name }),
            );
          }
        }
        return;
      }

      const fieldLabel = field.options.uiSchema?.title || field.name;
      const joiSchema = buildJoiSchema(field.options.validation, {
        label: `${t('Field', { ns: 'client' })}: ${fieldLabel}`,
        value: val,
      });
      const { error } = joiSchema.validate(val, {
        messages: getJoiErrorMessage(t),
      });
      if (error) {
        throw error;
      }
    };
    for (const value of values) {
      if (operation === 'create') {
        for (const [, field] of this.fields) {
          helper(field, value);
        }
      }
      if (operation === 'update') {
        for (const key of Object.keys(value)) {
          const field = this.getField(key);
          if (field) {
            helper(field, value);
          }
        }
      }
    }
  }

  isMultiFilterTargetKey() {
    return Array.isArray(this.filterTargetKey) && this.filterTargetKey.length > 1;
  }

  tableName() {
    const { name, tableName } = this.options;
    const tName = tableName || name;
    return this.options.underscored ? snakeCase(tName) : tName;
  }

  /**
   * @internal
   */
  modelInit() {
    if (this.model) {
      return;
    }

    const { name, model, autoGenId = true } = this.options;
    let M: ModelStatic<Model> = Model;

    if (this.context.database.sequelize.isDefined(name)) {
      const m = this.context.database.sequelize.model(name);
      if ((m as any).isThrough) {
        // @ts-ignore
        this.model = m;
        // @ts-ignore
        this.model.database = this.context.database;
        // @ts-ignore
        this.model.collection = this;
        return;
      }
    }

    if (typeof model === 'string') {
      M = this.context.database.models.get(model) || Model;
    } else if (model) {
      M = model;
    }

    const collection = this;

    // @ts-ignore
    this.model = class extends M {};

    Object.defineProperty(this.model, 'primaryKeyAttribute', {
      get: function () {
        const singleFilterTargetKey: string = (() => {
          if (!collection.options.filterTargetKey) {
            return null;
          }

          if (Array.isArray(collection.options.filterTargetKey) && collection.options.filterTargetKey.length === 1) {
            return collection.options.filterTargetKey[0];
          }

          return collection.options.filterTargetKey as string;
        })();

        if (!this._primaryKeyAttribute && singleFilterTargetKey && collection.getField(singleFilterTargetKey)) {
          return singleFilterTargetKey;
        }

        return this._primaryKeyAttribute;
      }.bind(this.model),

      set(value) {
        this._primaryKeyAttribute = value;
      },
    });

    Object.defineProperty(this.model, 'primaryKeyAttributes', {
      get: function () {
        if (Array.isArray(this._primaryKeyAttributes) && this._primaryKeyAttributes.length) {
          return this._primaryKeyAttributes;
        }

        if (collection.options.filterTargetKey) {
          const fields = lodash.castArray(collection.options.filterTargetKey);
          if (fields.every((field) => collection.getField(field))) {
            return fields;
          }
        }

        return this._primaryKeyAttributes;
      }.bind(this.model),

      set(value) {
        this._primaryKeyAttributes = value;
      },
    });

    Object.defineProperty(this.model, 'primaryKeyField', {
      get: function () {
        if (this.primaryKeyAttribute) {
          return this.rawAttributes[this.primaryKeyAttribute].field || this.primaryKeyAttribute;
        }

        return null;
      }.bind(this.model),

      set(val) {
        this._primaryKeyField = val;
      },
    });

    this.model.init(null, this.sequelizeModelOptions());

    this.model.options.modelName = this.options.name;

    if (!autoGenId) {
      this.model.removeAttribute('id');
    }

    // @ts-ignore
    this.model.database = this.context.database;
    // @ts-ignore
    this.model.collection = this;
  }

  setRepository(repository?: RepositoryType | string) {
    let repo = Repository;
    if (typeof repository === 'string') {
      repo = this.context.database.repositories.get(repository) || Repository;
    }
    this.repository = new repo(this);
  }

  forEachField(callback: (field: Field) => void) {
    return [...this.fields.values()].forEach(callback);
  }

  findField(callback: (field: Field) => boolean) {
    return [...this.fields.values()].find(callback);
  }

  hasField(name: string) {
    return this.fields.has(name);
  }

  getField<F extends Field>(name: string): F {
    return this.fields.get(name);
  }

  getFieldByField(field: string): Field {
    return this.findField((f) => f.options.field === field);
  }

  getFields() {
    return [...this.fields.values()];
  }

  addField(name: string, options: FieldOptions): Field {
    return this.setField(name, options);
  }

  checkFieldType(name: string, options: FieldOptions) {
    if (!this.options.underscored) {
      return;
    }

    const fieldName = options.field || snakeCase(name);
    const field = this.findField((f) => {
      if (f.name === name) {
        return false;
      }
      if (f.field) {
        return f.field === fieldName;
      }
      return snakeCase(f.name) === fieldName;
    });

    if (!field) {
      return;
    }
    if (options.type === field.type) {
      return;
    }
    const isContextTypeMatch = (data, dataType: string): boolean => {
      return [data.dataType?.key, data.type?.toUpperCase()].includes(dataType?.toUpperCase());
    };
    if (options.type === 'context' && isContextTypeMatch(field, options.dataType)) {
      return;
    }
    if (field.type === 'context' && isContextTypeMatch(options, field.dataType.key)) {
      return;
    }

    throw new Error(`fields with same column must be of the same type ${JSON.stringify(options)}`);
  }

  /**
   * @internal
   */
  correctOptions(options) {
    if (options.primaryKey && options.autoIncrement) {
      delete options.defaultValue;
    }
  }

  @EnsureAtomicity
  setField(name: string, options: FieldOptions): Field {
    checkIdentifier(name);
    this.checkFieldType(name, options);

    const { database } = this.context;

    database.logger.trace(`beforeSetField: ${safeJsonStringify(options)}`, {
      databaseInstanceId: database.instanceId,
      collectionName: this.name,
      fieldName: name,
    });

    if (options.source) {
      const [sourceCollectionName, sourceFieldName] = options.source.split('.');
      const sourceCollection = this.db.collections.get(sourceCollectionName);
      if (!sourceCollection) {
        this.db.logger.warn(
          `source collection "${sourceCollectionName}" not found for field "${name}" at collection "${this.name}"`,
        );
        return null;
      } else {
        const sourceField = sourceCollection.fields.get(sourceFieldName);

        if (!sourceField) {
          this.db.logger.warn(
            `Source field "${sourceFieldName}" not found for field "${name}" at collection "${this.name}". Source collection: "${sourceCollectionName}"`,
          );
          return null;
        } else {
          options = { ...lodash.omit(sourceField.options, ['name', 'primaryKey']), ...options };
        }
      }
    }

    this.correctOptions(options);
    this.emit('field.beforeAdd', name, options, { collection: this });

    const field = database.buildField(
      { name, ...options },
      {
        ...this.context,
        collection: this,
      },
    );

    const oldField = this.fields.get(name);

    if (oldField && oldField.options.inherit && field.typeToString() != oldField.typeToString()) {
      throw new Error(
        `Field type conflict: cannot set "${name}" on "${this.name}" to ${options.type}, parent "${name}" type is ${oldField.options.type}`,
      );
    }

    this.removeField(name);
    this.fields.set(name, field);
    this.emit('field.afterAdd', field);

    this.db.emit('field.afterAdd', {
      collection: this,
      field,
    });

    // refresh children models
    if (this.isParent()) {
      for (const child of this.context.database.inheritanceMap.getChildren(this.name, {
        deep: false,
      })) {
        const childCollection = this.db.getCollection(child);
        const existField = childCollection.getField(name);

        if (!existField || existField.options.inherit) {
          childCollection.setField(name, {
            ...options,
            inherit: true,
          });
        }
      }
    }

    return field;
  }

  setFields(fields: FieldOptions[], resetFields = true) {
    if (!Array.isArray(fields)) {
      return;
    }

    if (resetFields) {
      this.resetFields();
    }

    for (const { name, ...options } of fields) {
      this.addField(name, options);
    }
  }

  resetFields() {
    const fieldNames = this.fields.keys();
    for (const fieldName of fieldNames) {
      this.removeField(fieldName);
    }
  }

  remove() {
    return this.context.database.removeCollection(this.name);
  }

  async removeFieldFromDb(name: string, options?: QueryInterfaceOptions) {
    const field = this.getField(name);
    if (!field) {
      return;
    }

    const attribute = this.model.rawAttributes[name];

    if (!attribute) {
      field.remove();
      // console.log('field is not attribute');
      return;
    }

    // @ts-ignore
    if (this.isInherited() && this.parentFields().has(name)) {
      return;
    }

    if ((this.model as any)._virtualAttributes.has(this.name)) {
      field.remove();
      // console.log('field is virtual attribute');
      return;
    }

    if (this.model.options.timestamps !== false) {
      // timestamps 相关字段不删除
      let timestampsFields = ['createdAt', 'updatedAt', 'deletedAt'];
      if (this.db.options.underscored) {
        timestampsFields = timestampsFields.map((fieldName) => snakeCase(fieldName));
      }
      if (timestampsFields.includes(field.columnName())) {
        this.fields.delete(name);
        return;
      }
    }

    // 排序字段通过 sortable 控制
    const sortable = this.options.sortable;
    if (sortable) {
      let sortField: any;
      if (sortable === true) {
        sortField = 'sort';
      } else if (typeof sortable === 'string') {
        sortField = sortable;
      } else if (sortable.name) {
        sortField = sortable.name || 'sort';
      }
      if (field.name === sortField) {
        return;
      }
    }

    if (this.isView()) {
      field.remove();
      return;
    }

    const columnReferencesCount = _.filter(this.model.rawAttributes, (attr) => attr.field == field.columnName()).length;

    if (
      (await field.existsInDb({
        transaction: options?.transaction,
      })) &&
      columnReferencesCount == 1
    ) {
      const columns = await this.model.sequelize
        .getQueryInterface()
        .describeTable(this.getTableNameWithSchema(), options);

      if (Object.keys(columns).length == 1) {
        // remove table if only one column left
        await this.removeFromDb({
          ...options,
          cascade: true,
          dropCollection: false,
        });
      } else {
        const queryInterface = this.db.sequelize.getQueryInterface();
        await queryInterface.removeColumn(this.getTableNameWithSchema(), field.columnName(), options);
      }
    }

    field.remove();
  }

  async removeFromDb(options?: QueryInterfaceDropTableOptions & { dropCollection?: boolean }) {
    if (
      !this.isView() &&
      (await this.existsInDb({
        transaction: options?.transaction,
      }))
    ) {
      const queryInterface = this.db.sequelize.getQueryInterface();
      await queryInterface.dropTable(this.getTableNameWithSchema(), options);
    }

    if (options?.dropCollection !== false) {
      return this.remove();
    }
  }

  async existsInDb(options?: Transactionable) {
    return this.db.queryInterface.collectionTableExists(this, options);
  }

  removeField(name: string): void | Field {
    if (!this.fields.has(name)) {
      return;
    }

    const field = this.fields.get(name);

    const bool = this.fields.delete(name);

    if (bool) {
      if (this.isParent()) {
        for (const child of this.db.inheritanceMap.getChildren(this.name, {
          deep: false,
        })) {
          const childCollection = this.db.getCollection(child);
          const existField = childCollection.getField(name);
          if (existField && existField.options.inherit) {
            childCollection.removeField(name);
          }
        }
      }

      this.emit('field.afterRemove', field);
    }

    return field as Field;
  }

  updateOptions(options: CollectionOptions, mergeOptions?: any) {
    let newOptions = lodash.cloneDeep(options);
    newOptions = merge(this.options, newOptions, mergeOptions);

    if (options.filterTargetKey) {
      newOptions.filterTargetKey = options.filterTargetKey;
    }

    this.context.database.emit('beforeUpdateCollection', this, newOptions);

    this.options = newOptions;
    this.setFields(options.fields, false);
    if (options.repository) {
      this.setRepository(options.repository);
    }

    this.context.database.emit('afterUpdateCollection', this);
    return this;
  }

  setSortable(sortable) {
    if (!sortable) {
      return;
    }
    if (sortable === true) {
      this.setField('sort', {
        type: 'sort',
        hidden: true,
      });
    }
    if (typeof sortable === 'string') {
      this.setField(sortable, {
        type: 'sort',
        hidden: true,
      });
    } else if (typeof sortable === 'object') {
      const { name, ...opts } = sortable;
      this.setField(name || 'sort', { type: 'sort', hidden: true, ...opts });
    }
  }

  updateField(name: string, options: FieldOptions) {
    if (!this.hasField(name)) {
      throw new Error(`field ${name} not exists`);
    }

    if (options.name && options.name !== name) {
      this.removeField(name);
    }

    this.setField(options.name || name, options);
  }

  addIndex(
    index:
      | string
      | string[]
      | {
          fields: string[];
          unique?: boolean;
          [key: string]: any;
        },
  ) {
    if (!index) {
      return;
    }

    // collection defined indexes
    const indexes: any = this.model.options.indexes || [];

    let indexName = [];
    let indexItem;

    if (typeof index === 'string') {
      indexItem = {
        fields: [index],
      };
      indexName = [index];
    } else if (Array.isArray(index)) {
      indexItem = {
        fields: index,
      };
      indexName = index;
    } else if (index?.fields) {
      indexItem = index;
      indexName = index.fields;
    }

    if (lodash.isEqual(this.model.primaryKeyAttributes, indexName)) {
      return;
    }

    const name: string = this.model.primaryKeyAttributes.join(',');

    if (name.startsWith(`${indexName.join(',')},`)) {
      return;
    }

    for (const item of indexes) {
      if (lodash.isEqual(item.fields, indexName)) {
        return;
      }

      const name: string = item.fields.join(',');
      if (name.startsWith(`${indexName.join(',')},`)) {
        return;
      }
    }

    if (!indexItem) {
      return;
    }

    indexes.push(indexItem);

    const tableName = this.model.getTableName();
    // @ts-ignore
    this.model._indexes = this.model.options.indexes
      // @ts-ignore
      .map((index) => Utils.nameIndex(this.model._conformIndex(index), tableName))
      .map((item) => {
        if (item.name && item.name.length > 63) {
          item.name = 'i_' + md5(item.name);
        }
        return item;
      });

    this.refreshIndexes();
  }

  removeIndex(fields: any) {
    if (!fields) {
      return;
    }
    // @ts-ignore
    const indexes: any[] = this.model._indexes;
    // @ts-ignore
    this.model._indexes = indexes.filter((item) => {
      return !lodash.isEqual(item.fields, fields);
    });

    this.refreshIndexes();
  }

  /**
   * @internal
   */
  refreshIndexes() {
    // @ts-ignore
    const indexes: any[] = this.model._indexes;

    // @ts-ignore
    this.model._indexes = lodash.uniqBy(
      indexes
        .filter((item) => {
          return item.fields.every((field) => this.model.rawAttributes[field]);
        })
        .map((item) => {
          item.fields = item.fields.map((field) => this.model.rawAttributes[field].field);
          return item;
        }),
      'name',
    );
  }

  async sync(syncOptions?: SyncOptions) {
    const modelNames = new Set([this.model.name]);

    const { associations } = this.model;

    for (const associationKey in associations) {
      const association = associations[associationKey];
      modelNames.add(association.target.name);

      if ((<any>association).through) {
        modelNames.add((<any>association).through.model.name);
      }
    }

    const models: ModelStatic<Model>[] = [];
    // @ts-ignore
    this.context.database.sequelize.modelManager.forEachModel((model) => {
      if (modelNames.has(model.name)) {
        models.push(model);
      }
    });

    for (const model of models) {
      await model.sync(
        syncOptions || {
          force: false,
          alter: {
            drop: false,
          },
        },
      );
    }
  }

  public isInherited() {
    return false;
  }

  public isParent() {
    return this.context.database.inheritanceMap.isParentNode(this.name);
  }

  public getTableNameWithSchema() {
    const tableName = this.model.tableName;

    if (this.collectionSchema() && this.db.inDialect('postgres')) {
      return this.db.utils.addSchema(tableName, this.collectionSchema());
    }

    return tableName;
  }

  public tableNameAsString(options?: { ignorePublicSchema: boolean }) {
    const tableNameWithSchema = this.getTableNameWithSchema();
    if (lodash.isString(tableNameWithSchema)) {
      return tableNameWithSchema;
    }

    const schema = tableNameWithSchema.schema;
    const tableName = tableNameWithSchema.tableName;

    if (options?.ignorePublicSchema && schema === 'public') {
      return tableName;
    }

    return `${schema}.${tableName}`;
  }

  public getRealTableName(quoted = false) {
    const realname = this.tableNameAsString();
    return !quoted ? realname : this.db.sequelize.getQueryInterface().quoteIdentifiers(realname);
  }

  public getRealFieldName(name: string, quoted = false) {
    const realname = this.model.getAttributes()[name].field;
    return !quoted ? name : this.db.sequelize.getQueryInterface().quoteIdentifier(realname);
  }

  public getTableNameWithSchemaAsString() {
    const tableName = this.model.tableName;

    if (this.collectionSchema() && this.db.inDialect('postgres')) {
      return `${this.collectionSchema()}.${tableName}`;
    }

    return tableName;
  }

  public quotedTableName() {
    return this.db.utils.quoteTable(this.getTableNameWithSchema());
  }

  public collectionSchema() {
    if (this.options.schema) {
      return this.options.schema;
    }

    if (this.db.options.schema) {
      return this.db.options.schema;
    }

    if (this.db.inDialect('postgres')) {
      return 'public';
    }

    return undefined;
  }

  public isView() {
    return false;
  }

  unavailableActions() {
    return [];
  }

  protected sequelizeModelOptions() {
    const { name } = this.options;

    const attr = {
      ..._.omit(this.options, ['name', 'fields', 'model', 'targetKey']),
      modelName: name,
      sequelize: this.context.database.sequelize,
      tableName: this.tableName(),
    };

    return attr;
  }

  protected bindFieldEventListener() {
    this.on('field.afterAdd', (field: Field) => {
      field.bind();
    });

    this.on('field.afterRemove', (field: Field) => {
      field.unbind();
      this.db.emit('field.afterRemove', field);
    });
  }

  private checkOptions(options: CollectionOptions) {
    checkIdentifier(options.name);
    this.checkTableName();
  }

  private checkTableName() {
    const tableName = this.tableName();
    for (const [k, collection] of this.db.collections) {
      if (
        collection.name != this.options.name &&
        tableName === collection.tableName() &&
        collection.collectionSchema() === this.collectionSchema()
      ) {
        throw new Error(`collection ${collection.name} and ${this.name} have same tableName "${tableName}"`);
      }
    }
  }
}

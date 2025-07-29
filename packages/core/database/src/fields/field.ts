/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { DataType, ModelAttributeColumnOptions, ModelIndexesOptions, SyncOptions, Transactionable } from 'sequelize';
import { Collection } from '../collection';
import { Database } from '../database';
import { ModelEventTypes } from '../types';
import { snakeCase } from '../utils';
import { BasicType, BooleanSchema, NumberSchema, ObjectSchema, StringSchema } from 'joi';

export interface FieldContext {
  database: Database;
  collection: Collection;
}
type RuleSchemaMap = {
  string: StringSchema;
  boolean: BooleanSchema;
  number: NumberSchema;
  object: ObjectSchema;
};

export type FieldValidationRuleName<T extends BasicType> = T extends keyof RuleSchemaMap
  ? keyof RuleSchemaMap[T]
  : never;

export interface FieldValidationRule<T extends BasicType> {
  key: string;
  name: FieldValidationRuleName<T>;
  args?: {
    [key: string]: any;
  };
}

export interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;
  rules: FieldValidationRule<T>[];
  [key: string]: any;
}

export interface BaseFieldOptions<T extends BasicType = BasicType> {
  name?: string;
  hidden?: boolean;
  translation?: boolean;
  validation?: ValidationOptions<T>;

  [key: string]: any;
}

export interface BaseColumnFieldOptions<T extends BasicType = BasicType>
  extends BaseFieldOptions<T>,
    Omit<ModelAttributeColumnOptions, 'type'> {
  dataType?: DataType;
  index?: boolean | ModelIndexesOptions;
}

export abstract class Field {
  options: any;
  context: FieldContext;
  database: Database;
  collection: Collection;

  [key: string]: any;

  constructor(options?: any, context?: FieldContext) {
    this.context = context as any;
    this.database = this.context.database;
    this.collection = this.context.collection;
    this.options = options || {};
    this.init();
  }

  get name() {
    return this.options.name;
  }

  get type() {
    return this.options.type;
  }

  abstract get dataType(): any;

  isRelationField() {
    return false;
  }

  async sync(syncOptions: SyncOptions) {
    await this.collection.sync({
      ...syncOptions,
      force: false,
      alter: {
        drop: false,
      },
    });
  }

  init() {
    // code
  }

  on(eventName: ModelEventTypes, listener: (...args: any[]) => void) {
    this.database.on(`${this.collection.name}.${eventName}`, listener);
    return this;
  }

  off(eventName: string, listener: (...args: any[]) => void) {
    this.database.off(`${this.collection.name}.${eventName}`, listener);
    return this;
  }

  get(name: string) {
    return this.options[name];
  }

  remove() {
    this.collection.removeIndex([this.name]);
    return this.collection.removeField(this.name);
  }

  columnName() {
    if (this.options.field) {
      return this.options.field;
    }

    if (this.database.options.underscored) {
      return snakeCase(this.name);
    }

    return this.name;
  }

  async existsInDb(options?: Transactionable) {
    const opts = {
      transaction: options?.transaction,
    };
    let sql;
    if (this.database.sequelize.getDialect() === 'sqlite') {
      sql = `SELECT *
             from pragma_table_info('${this.collection.model.tableName}')
             WHERE name = '${this.columnName()}'`;
    } else if (this.database.inDialect('mysql', 'mariadb')) {
      sql = `
        select column_name
        from INFORMATION_SCHEMA.COLUMNS
        where TABLE_SCHEMA = '${this.database.options.database}'
          AND TABLE_NAME = '${this.collection.model.tableName}'
          AND column_name = '${this.columnName()}'
      `;
    } else {
      sql = `
        select column_name
        from INFORMATION_SCHEMA.COLUMNS
        where TABLE_NAME = '${this.collection.model.tableName}'
          AND column_name = '${this.columnName()}'
          AND table_schema = '${this.collection.collectionSchema() || 'public'}'
      `;
    }
    const [rows] = await this.database.sequelize.query(sql, opts);
    return rows.length > 0;
  }

  merge(obj: any) {
    Object.assign(this.options, obj);
  }

  bind() {
    const { model } = this.context.collection;
    model.rawAttributes[this.name] = this.toSequelize();

    // @ts-ignore
    model.refreshAttributes();
    if (this.options.index) {
      this.context.collection.addIndex([this.name]);
    }
  }

  unbind() {
    const { model } = this.context.collection;

    delete model.prototype[this.name];

    model.removeAttribute(this.name);
    if (this.options.index || this.options.unique) {
      this.context.collection.removeIndex([this.name]);
    }
  }

  toSequelize(): any {
    const opts = _.omit(this.options, ['name']);

    if (this.dataType) {
      // @ts-ignore
      Object.assign(opts, { type: this.database.sequelize.normalizeDataType(this.dataType) });
    }

    Object.assign(opts, this.additionalSequelizeOptions());

    return opts;
  }

  additionalSequelizeOptions() {
    return {};
  }

  typeToString() {
    return this.dataType.toString();
  }
}

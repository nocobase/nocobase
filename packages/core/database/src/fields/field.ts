import _ from 'lodash';
import {
  DataType,
  ModelAttributeColumnOptions,
  ModelIndexesOptions,
  QueryInterfaceOptions,
  SyncOptions
} from 'sequelize';
import { Collection } from '../collection';
import { Database } from '../database';

export interface FieldContext {
  database: Database;
  collection: Collection;
}

export interface BaseFieldOptions {
  name?: string;
  hidden?: boolean;
  [key: string]: any;
}

export interface BaseColumnFieldOptions extends BaseFieldOptions, Omit<ModelAttributeColumnOptions, 'type'> {
  dataType?: DataType;
  index?: boolean | ModelIndexesOptions;
}

export abstract class Field {
  options: any;
  context: FieldContext;
  database: Database;
  collection: Collection;
  [key: string]: any;

  get name() {
    return this.options.name;
  }

  get type() {
    return this.options.type;
  }

  get dataType() {
    return this.options.dataType;
  }

  constructor(options?: any, context?: FieldContext) {
    this.context = context;
    this.database = context.database;
    this.collection = context.collection;
    this.options = options || {};
    this.init();
  }

  // TODO
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

  on(eventName: string, listener: (...args: any[]) => void) {
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
    return this.collection.removeField(this.name);
  }

  async removeFromDb(options?: QueryInterfaceOptions) {
    if (!this.collection.model.rawAttributes[this.name]) {
      this.remove();
      // console.log('field is not attribute');
      return;
    }
    if ((this.collection.model as any)._virtualAttributes.has(this.name)) {
      this.remove();
      // console.log('field is virtual attribute');
      return;
    }
    const queryInterface = this.database.sequelize.getQueryInterface();
    await queryInterface.removeColumn(this.collection.model.tableName, this.name, options);
    this.remove();
  }

  async existsInDb() {
    if (this.database.sequelize.getDialect() === 'sqlite') {
      const [rows] = await this.database.sequelize.query(
        `SELECT * from pragma_table_info('${this.collection.model.tableName}') WHERE name = '${this.name}'`,
      );
      return rows.length > 0;
    } else {
      const [rows] = await this.database.sequelize.query(`
        select column_name
        from INFORMATION_SCHEMA.COLUMNS
        where TABLE_NAME='${this.collection.model.tableName}' AND column_name='${this.name}'
      `);
      return rows.length > 0;
    }
  }

  merge(obj: any) {
    Object.assign(this.options, obj);
  }

  bind() {
    const { model } = this.context.collection;
    model.rawAttributes[this.name] = this.toSequelize();
    // @ts-ignore
    model.refreshAttributes();
  }

  unbind() {
    const { model } = this.context.collection;
    model.removeAttribute(this.name);
  }

  toSequelize(): any {
    const opts = _.omit(this.options, ['name']);
    if (this.dataType) {
      Object.assign(opts, { type: this.dataType });
    }
    return opts;
  }

  isSqlite() {
    return this.database.sequelize.getDialect() === 'sqlite';
  }
}

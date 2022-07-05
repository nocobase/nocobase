import _ from 'lodash';
import {
  DataType,
  ModelAttributeColumnOptions,
  ModelIndexesOptions,
  QueryInterfaceOptions,
  SyncOptions,
  Transactionable
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
    if (this.collection.model.primaryKeyAttributes.includes(this.name)) {
      // 主键不能删除
      return;
    }
    if (this.collection.model.options.timestamps !== false) {
      // timestamps 相关字段不删除
      if (['createdAt', 'updatedAt', 'deletedAt'].includes(this.name)) {
        return;
      }
    }
    // 排序字段通过 sortable 控制
    const sortable = this.collection.options.sortable;
    if (sortable) {
      let sortField: string;
      if (sortable === true) {
        sortField = 'sort';
      } else if (typeof sortable === 'string') {
        sortField = sortable;
      } else if (sortable.name) {
        sortField = sortable.name || 'sort';
      }
      if (this.name === sortField) {
        return;
      }
    }
    if (this.options.field && this.name !== this.options.field) {
      // field 指向的是真实的字段名，如果与 name 不一样，说明字段只是引用
      this.remove();
      return;
    }
    if (
      await this.existsInDb({
        transaction: options?.transaction,
      })
    ) {
      const queryInterface = this.database.sequelize.getQueryInterface();
      await queryInterface.removeColumn(this.collection.model.tableName, this.name, options);
    }
    this.remove();
  }

  async existsInDb(options?: Transactionable) {
    const opts = {
      transaction: options?.transaction,
    };
    let sql;
    if (this.database.sequelize.getDialect() === 'sqlite') {
      sql = `SELECT * from pragma_table_info('${this.collection.model.tableName}') WHERE name = '${this.name}'`;
    } else if (this.database.inDialect('mysql')) {
      sql = `
        select column_name
        from INFORMATION_SCHEMA.COLUMNS
        where TABLE_SCHEMA='${this.database.options.database}' AND TABLE_NAME='${this.collection.model.tableName}' AND column_name='${this.name}'
      `;
    } else {
      sql = `
        select column_name
        from INFORMATION_SCHEMA.COLUMNS
        where TABLE_NAME='${this.collection.model.tableName}' AND column_name='${this.name}'
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
    model.removeAttribute(this.name);
    if (this.options.index) {
      this.context.collection.removeIndex([this.name]);
    }
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

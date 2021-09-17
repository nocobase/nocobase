import { Sequelize, ModelCtor, Model, DataTypes, Utils } from 'sequelize';
import { EventEmitter } from 'events';
import { Database } from './database';
import { Collection } from './collection';
import { SchemaField } from './schema-fields';

export interface SchemaContext {
  database: Database;
  collection: Collection;
}

export class Schema extends EventEmitter {
  fields: Map<string, any>;
  context: SchemaContext;
  options: any;

  constructor(options?: any, context?: SchemaContext) {
    super();
    this.options = options;
    this.context = context;
    this.fields = new Map<string, any>();
    this.set(options);
  }

  has(name: string) {
    return this.fields.has(name);
  }

  get(name: string) {
    return this.fields.get(name);
  }

  set(name: string | object, obj?: any) {
    if (!name) {
      return this;
    }
    if (typeof name === 'string') {
      const { database } = this.context;
      const field = database.buildSchemaField({ name, ...obj }, {
        ...this.context,
        schema: this,
        model: this.context.collection.model,
      });
      this.fields.set(name, field);
      this.emit('setted', field);
    } else if (Array.isArray(name)) {
      for (const value of name) {
        this.set(value.name, value);
      }
    } else if (typeof name === 'object') {
      for (const [key, value] of Object.entries(name)) {
        console.log({ key, value })
        this.set(key, value);
      }
    }
    return this;
  }

  delete(name: string) {
    const field = this.fields.get(name);
    const bool = this.fields.delete(name);
    this.emit('deleted', field);
    return bool;
  }

  merge(name: string, obj) {
    const field = this.get(name);
    field.merge(obj);
    this.emit('merged', field);
    return field;
  }

  forEach(callback: (field: SchemaField) => void) {
    return [...this.fields.values()].forEach(callback);
  }

  find(callback: (field: SchemaField) => boolean) {
    return [...this.fields.values()].find(callback);
  }
}

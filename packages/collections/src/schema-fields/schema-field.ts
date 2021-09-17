import { Sequelize, ModelCtor, Model, DataTypes, Utils } from 'sequelize';
import { EventEmitter } from 'events';
import { Collection } from '../collection';
import { Database } from '../database';
import { Schema } from '../schema';
import { RelationField } from './relation-field';
import _ from 'lodash';

export interface SchemaFieldContext {
  database: Database;
  collection: Collection;
  schema: Schema;
}

export abstract class SchemaField {
  options: any;
  context: SchemaFieldContext;
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

  constructor(options?: any, context?: SchemaFieldContext) {
    this.context = context;
    this.options = options || {};
    this.init();
  }

  init() {
    // code
  }

  get(name: string) {
    return this.options[name];
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
    return _.omit(this.options, ['name'])
  }
}

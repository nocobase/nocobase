import { Sequelize, ModelCtor, Model, DataTypes, Utils } from 'sequelize';
import { EventEmitter } from 'events';
import { Database } from './database';
import { Field } from './fields';
import _ from 'lodash';
import { Repository } from './repository';
import { ModelAttributes } from 'sequelize/types/lib/model';

export interface CollectionOptions {
  name: string;
  tableName?: string;
  fields?: any;
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
  fields: Map<string, any>;
  model: ModelCtor<Model<TModelAttributes, TCreationAttributes>>;
  repository: Repository<TModelAttributes, TCreationAttributes>;

  get name() {
    return this.options.name;
  }

  constructor(options: CollectionOptions, context?: CollectionContext) {
    super();
    this.options = options;
    this.context = context;
    this.fields = new Map<string, any>();

    this.model = <ModelCtor<Model>>class extends Model {};

    const attributes = {} as any;

    const { name, tableName } = options;

    // TODO: 不能重复 model.init，如果有涉及 InitOptions 参数修改，需要另外处理。
    // init sequelize model
    this.model.init(attributes, {
      ..._.omit(options, ['name', 'fields']),
      sequelize: context.database.sequelize,
      modelName: name,
      tableName: tableName || name,
    });

    // call field bind method on field
    this.on('field.afterAdd', (field: Field) => field.bind());
    this.on('field.afterRemove', (field) => field.unbind());
    // set collection fields
    this.setFields(options.fields);

    // add collection repository
    this.repository = new Repository(this);
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

  getField(name: string) {
    return this.fields.get(name);
  }

  addField(options) {
    const { name, ...others } = options;
    if (!name) {
      return this;
    }
    const { database } = this.context;
    const field = database.buildField(
      { name, ...others },
      {
        ...this.context,
        collection: this,
      },
    );

    this.fields.set(name, field);
    this.emit('field.afterAdd', field);
  }

  setFields(fields: any, reset = true) {
    if (!fields) {
      return this;
    }

    if (reset) {
      this.fields.clear();
    }

    if (Array.isArray(fields)) {
      for (const field of fields) {
        this.addField(field);
      }
    } else if (typeof fields === 'object') {
      for (const [name, options] of Object.entries<any>(fields)) {
        this.addField({ ...options, name });
      }
    }
  }

  removeField(name) {
    const field = this.fields.get(name);
    const bool = this.fields.delete(name);
    if (bool) {
      this.emit('field.afterRemove', field);
    }
    return bool;
  }

  // TODO
  extend(options) {
    const { fields } = options;
    this.setFields(fields);
  }

  sync() {}
}

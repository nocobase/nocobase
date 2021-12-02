import { Sequelize, ModelCtor, Model, ModelOptions } from 'sequelize';
import { EventEmitter } from 'events';
import { Database } from './database';
import { Field } from './fields';
import _ from 'lodash';
import { Repository } from './repository';
import { SyncOptions } from 'sequelize/types/lib/sequelize';
import lodash from 'lodash';
import merge from 'deepmerge';
const { hooks } = require('sequelize/lib/hooks');

interface FieldOptions {
  name: string;
  type: any;

  [key: string]: any;
}

export type RepositoryType = typeof Repository;

export interface CollectionOptions extends Omit<ModelOptions, 'name'> {
  name: string;
  tableName?: string;
  fields?: FieldOptions[];
  model?: string | ModelCtor<Model>;
  repository?: string | RepositoryType;
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
  model: ModelCtor<Model<TModelAttributes, TCreationAttributes>>;
  repository: Repository<TModelAttributes, TCreationAttributes>;

  get name() {
    return this.options.name;
  }

  constructor(options: CollectionOptions, context?: CollectionContext) {
    super();
    this.context = context;
    this.options = options;
    this.bindFieldEventListener();
    this.modelInit();
    this.setFields(options.fields);
    this.setRepository(options.repository);
  }

  private sequelizeModelOptions() {
    const { name, tableName } = this.options;
    return {
      ..._.omit(this.options, ['name', 'fields']),
      modelName: name,
      sequelize: this.context.database.sequelize,
      tableName: tableName || name,
    };
  }

  /**
   * TODO
   */
  modelInit() {
    if (this.model) {
      return;
    }
    const { name, model } = this.options;
    let M = Model;
    if (this.context.database.sequelize.isDefined(name)) {
      const m = this.context.database.sequelize.model(name);
      if ((m as any).isThrough) {
        this.model = m;
        return;
      }
    }
    if (typeof model === 'string') {
      M = this.context.database.models.get(model) || Model;
    } else if (model) {
      M = model;
    }
    this.model = class extends M {};
    this.model.init(null, this.sequelizeModelOptions());
  }

  setRepository(repository?: RepositoryType | string) {
    let repo = Repository;
    if (typeof repository === 'string') {
      repo = this.context.database.repositories.get(repository) || Repository;
    }
    this.repository = new repo(this);
  }

  private bindFieldEventListener() {
    this.on('field.afterAdd', (field: Field) => {
      field.bind();
    });
    this.on('field.afterRemove', (field) => field.unbind());
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

  addField(name: string, options: Omit<FieldOptions, 'name'>): Field {
    return this.setField(name, options);
  }

  setField(name: string, options: Omit<FieldOptions, 'name'>): Field {
    const { database } = this.context;

    const field = database.buildField(
      { name, ...options },
      {
        ...this.context,
        collection: this,
      },
    );

    this.fields.set(name, field);
    this.emit('field.afterAdd', field);
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

  removeField(name) {
    const field = this.fields.get(name);
    const bool = this.fields.delete(name);
    if (bool) {
      this.emit('field.afterRemove', field);
    }
    return bool;
  }

  /**
   * TODO
   *
   * @param name
   * @param options
   */
  updateOptions(options: CollectionOptions, mergeOptions?: any) {
    let newOptions = lodash.cloneDeep(options);
    newOptions = merge(this.options, newOptions, mergeOptions);

    this.context.database.emit('beforeUpdateCollection', this, newOptions);

    this.setFields(options.fields, false);
    this.setRepository(options.repository);

    if (newOptions.hooks) {
      this.setUpHooks(newOptions.hooks);
    }

    this.context.database.emit('afterUpdateCollection', this);
  }

  setUpHooks(bindHooks) {
    (<any>this.model)._setupHooks(bindHooks);
  }

  /**
   * TODO
   *
   * @param name
   * @param options
   */
  updateField(name: string, options: FieldOptions) {
    if (!this.hasField(name)) {
      throw new Error(`field ${name} not exists`);
    }

    if (options.name && options.name !== name) {
      this.removeField(name);
    }

    this.setField(options.name || name, options);
  }

  async sync(syncOptions?: SyncOptions) {
    await this.model.sync(syncOptions);
    const associations = this.model.associations;
    for (const associationKey in associations) {
      const association = associations[associationKey];
      await association.target.sync(syncOptions);
      if ((<any>association).through) {
        await (<any>association).through.model.sync(syncOptions);
      }
    }
  }
}

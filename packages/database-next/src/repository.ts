import {
  Op,
  Model,
  ModelCtor,
  Association,
  FindOptions as SequelizeFindOptions,
  BulkCreateOptions,
  DestroyOptions as SequelizeDestroyOptions,
  CreateOptions as SequelizeCreateOptions,
  UpdateOptions as SequelizeUpdateOptions,
} from 'sequelize';
import { flatten } from 'flat';
import { Collection } from './collection';
import _ from 'lodash';
import { Database } from './database';
import { updateAssociations } from './update-associations';
import { RelationField } from './fields';
import FilterParser from './filterParser';
import { OptionsParser } from './optionsParser';

const debug = require('debug')('noco-database');

export interface IRepository {}

interface CreateManyOptions extends BulkCreateOptions {}

export type Filter = any;
export type Appends = string[];
export type Expect = string[];
export type Fields = string[];
export type Sort = string[];

interface CommonFindOptions {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  expect?: Expect;
  sort?: Sort;
}

export interface FindOptions extends SequelizeFindOptions, CommonFindOptions {}

interface FindOneOptions extends FindOptions, CommonFindOptions {}

interface CreateOptions extends SequelizeCreateOptions {
  values?: any;
  whitelist?: any;
  blacklist?: any;
}

interface UpdateOptions extends SequelizeUpdateOptions {
  values?: any;
  whitelist?: any;
  blacklist?: any;
}

interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: any;
}

interface RelatedQueryOptions {
  database: Database;
  field: RelationField;
  source: {
    idOrInstance: any;
    collection: Collection;
  };
  target: {
    association: Association & {
      accessors: any;
    };
    collection: Collection;
  };
}

type Identity = string | number;

type ID = Identity;

class RelatedQuery {
  options: RelatedQueryOptions;
  sourceInstance: Model;

  constructor(options: RelatedQueryOptions) {
    this.options = options;
  }

  async getSourceInstance() {
    if (this.sourceInstance) {
      return this.sourceInstance;
    }
    const { idOrInstance, collection } = this.options.source;
    if (idOrInstance instanceof Model) {
      return (this.sourceInstance = idOrInstance);
    }
    this.sourceInstance = await collection.model.findByPk(idOrInstance);
    return this.sourceInstance;
  }

  /**
   * same as find
   * @param options
   */
  async findMany(options?: any) {
    const { collection } = this.options.target;
    return await collection.repository.find(options);
  }

  async findOne(options?: any) {
    const { collection } = this.options.target;
    return await collection.repository.findOne(options);
  }

  async create(values?: any, options?: any) {
    const { association } = this.options.target;
    const createAccessor = association.accessors.create;
    const source = await this.getSourceInstance();
    const instance = await source[createAccessor](values, options);
    if (!instance) {
      return;
    }
    await updateAssociations(instance, values);
    return instance;
  }

  async update(values: any, options?: Identity | Model | UpdateOptions) {
    const { association, collection } = this.options.target;
    if (options instanceof Model) {
      return await collection.repository.update(values, options);
    }
    const { field } = this.options;
    if (field.type === 'hasOne' || field.type === 'belongsTo') {
      const getAccessor = association.accessors.get;
      const source = await this.getSourceInstance();
      const instance = await source[getAccessor]();
      return await collection.repository.update(values, instance);
    }
    // TODO
    return await collection.repository.update(values, options);
  }

  async destroy(options?: any) {
    const { association, collection } = this.options.target;
    const { field } = this.options;
    if (field.type === 'hasOne' || field.type === 'belongsTo') {
      const getAccessor = association.accessors.get;
      const source = await this.getSourceInstance();
      const instance = await source[getAccessor]();
      if (!instance) {
        return;
      }
      return await collection.repository.destroy(instance.id);
    }
    return await collection.repository.destroy(options);
  }

  async set(options?: any) {}

  async add(options?: any) {}

  async remove(options?: any) {}

  async toggle(options?: any) {}

  async sync(options?: any) {}
}

class HasOneQuery extends RelatedQuery {}

class HasManyQuery extends RelatedQuery {}

class BelongsToQuery extends RelatedQuery {}

class BelongsToManyQuery extends RelatedQuery {}

export class Repository<
  TModelAttributes extends {} = any,
  TCreationAttributes extends {} = TModelAttributes,
> implements IRepository
{
  database: Database;
  collection: Collection;
  model: ModelCtor<Model>;

  constructor(collection: Collection) {
    this.database = collection.context.database;
    this.collection = collection;
    this.model = collection.model;
  }

  /**
   * return count by filter
   */
  async count(filter?: Filter) {
    return await this.collection.model.count(this.parseFilter(filter));
  }

  /**
   * find
   * @param options
   */
  async find(options?: FindOptions) {
    const model = this.collection.model;

    const opts = {
      subQuery: false,
      ...this.buildQueryOptions(options),
    };

    return await model.findAll({
      ...opts,
    });
  }

  /**
   * find and count
   * @param options
   */
  async findAndCount(options?: FindOptions) {
    const model = this.collection.model;

    const opts = {
      subQuery: false,
      ...this.buildQueryOptions(options),
    };

    return await model.findAndCountAll({
      ...opts,
    });
  }
  /**
   * Find By Id
   *
   */
  findById(id: ID) {
    return this.collection.model.findByPk(id);
  }

  /**
   * Find one record from database
   *
   * @param options
   */
  async findOne(options?: FindOneOptions) {
    const model = this.collection.model;

    const findOptions = {
      subQuery: false,
      ...this.buildQueryOptions(options),
    };

    // set subQuery to false
    const result = await model.findOne(findOptions);

    return result;
  }

  /**
   * Save instance to database
   *
   * @param values
   * @param options
   */
  async create(
    values?: TCreationAttributes,
    options?: CreateOptions,
  ): Promise<Model> {
    const instance = await this.model.create<any>(values, options);
    if (!instance) {
      return;
    }
    await updateAssociations(instance, values, options);
    return instance;
  }

  /**
   * Save Many instances to database
   *
   * @param records
   * @param options
   */
  async createMany(
    records: TCreationAttributes[],
    options?: CreateManyOptions,
  ) {
    const instances = await this.collection.model.bulkCreate(records, options);

    for (let i = 0; i < instances.length; i++) {
      await updateAssociations(instances[i], records[i]);
    }

    return instances;
  }

  /**
   * Update model value
   *
   * @param values
   * @param options
   */
  async update(values: any, options: Identity | Model | UpdateOptions) {
    if (options instanceof Model) {
      await options.update(values);
      await updateAssociations(options, values);
      return options;
    }

    let instance: Model;

    if (typeof options === 'string' || typeof options === 'number') {
      instance = await this.model.findByPk(options);
    } else {
      // @ts-ignore
      instance = await this.findOne(options);
    }

    await instance.update(values);
    await updateAssociations(instance, values);
    return instance;
  }

  async destroy(options: Identity | Identity[] | DestroyOptions) {
    if (typeof options === 'number' || typeof options === 'string') {
      return await this.model.destroy({
        where: {
          [this.model.primaryKeyAttribute]: options,
        },
      });
    }
    if (Array.isArray(options)) {
      return await this.model.destroy({
        where: {
          [this.model.primaryKeyAttribute]: {
            [Op.in]: options,
          },
        },
      });
    }
    const opts = this.buildQueryOptions(options);
    return await this.model.destroy(opts);
  }

  // TODO
  async sort() {}

  relatedQuery(name: string) {
    return {
      for: (sourceIdOrInstance: any) => {
        const field = this.collection.getField(name) as RelationField;
        const database = this.collection.context.database;
        const collection = database.getCollection(field.target);
        const options: RelatedQueryOptions = {
          field,
          database: database,
          source: {
            collection: this.collection,
            idOrInstance: sourceIdOrInstance,
          },
          target: {
            collection,
            association: this.collection.model.associations[name] as any,
          },
        };
        switch (field.type) {
          case 'hasOne':
            return new HasOneQuery(options);
          case 'hasMany':
            return new HasManyQuery(options);
          case 'belongsTo':
            return new BelongsToQuery(options);
          case 'belongsToMany':
            return new BelongsToManyQuery(options);
        }
      },
    };
  }

  protected buildQueryOptions(options: any) {
    const parser = new OptionsParser(this.collection, options);
    const params = parser.toSequelizeParams();
    return { ...options, ...params };
  }

  protected parseFilter(filter: Filter) {
    const parser = new FilterParser(this.collection, filter);
    return parser.toSequelizeParams();
  }
}

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

import { Collection } from './collection';
import _, { omit } from 'lodash';
import { Database } from './database';
import { updateAssociations } from './update-associations';
import { RelationField } from './fields';
import FilterParser from './filterParser';
import { OptionsParser } from './optionsParser';
import { RelationRepository } from './relation-repository/relation-repository';
import { HasOneRepository } from './relation-repository/hasone-repository';
import { BelongsToRepository } from './relation-repository/belongs-to-repository';
import { BelongsToManyRepository } from './relation-repository/belongs-to-many-repository';
import { HasManyRepository } from './relation-repository/hasmany-repository';

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

export interface FindOptions extends SequelizeFindOptions, CommonFindOptions {
  filterByPk?: string | number;
}

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

class RelationRepositoryBuilder {
  collection: Collection;
  associationName: string;
  constructor(collection: Collection, associationName: string) {
    this.collection = collection;
    this.associationName = associationName;
  }
  of<R extends RelationRepository>(id: string | number): R {
    const association =
      this.collection.model.associations[this.associationName];

    const builder = {
      HasOne: () => HasOneRepository,
      BelongsTo: () => BelongsToRepository,
      BelongsToMany: () => BelongsToManyRepository,
      HasMany: () => HasManyRepository,
    };

    const klass = builder[association.associationType]();
    return new klass(this.collection, this.associationName, id);
  }
}

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

    if (opts.include && opts.include.length > 0) {
      const ids = (
        await model.findAll({
          ...opts,
          includeIgnoreAttributes: false,
          attributes: [model.primaryKeyAttribute],
          group: `${model.name}.${model.primaryKeyAttribute}`,
        })
      ).map((row) => row.get(model.primaryKeyAttribute));

      const where = {
        [model.primaryKeyAttribute]: {
          [Op.in]: ids,
        },
      };

      return await model.findAll({
        ...omit(opts, ['limit', 'offset']),
        where,
      });
    }

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
    const rows = await this.find({ ...options, limit: 1 });
    return rows.length == 1 ? rows[0] : null;
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

  /**
   * @param association target association
   */
  relation(association: string): RelationRepositoryBuilder {
    const relationQueryBuilder = new RelationRepositoryBuilder(
      this.collection,
      association,
    );

    return relationQueryBuilder;
  }

  protected buildQueryOptions(options: any) {
    const parser = new OptionsParser(
      this.collection.model,
      this.collection.context.database,
      options,
    );
    const params = parser.toSequelizeParams();
    return { ...options, ...params };
  }

  protected parseFilter(filter: Filter) {
    const parser = new FilterParser(
      this.collection.model,
      this.collection.context.database,
      filter,
    );
    return parser.toSequelizeParams();
  }
}

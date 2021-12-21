import {
  Association,
  BulkCreateOptions,
  CreateOptions as SequelizeCreateOptions,
  UpdateOptions as SequelizeUpdateOptions,
  FindAndCountOptions as SequelizeAndCountOptions,
  DestroyOptions as SequelizeDestroyOptions,
  FindOptions as SequelizeFindOptions,
  Model,
  ModelCtor,
  Op,
  Transaction,
} from 'sequelize';

import { Collection } from './collection';
import lodash, { omit } from 'lodash';
import { Database } from './database';
import { updateAssociations, updateModelByValues } from './update-associations';
import { RelationField } from './fields';
import FilterParser from './filter-parser';
import { OptionsParser } from './options-parser';
import { RelationRepository } from './relation-repository/relation-repository';
import { HasOneRepository } from './relation-repository/hasone-repository';
import { BelongsToRepository } from './relation-repository/belongs-to-repository';
import { BelongsToManyRepository } from './relation-repository/belongs-to-many-repository';
import { HasManyRepository } from './relation-repository/hasmany-repository';
import { UpdateGuard } from './update-guard';
import { transactionWrapperBuilder } from './transaction-decorator';

const debug = require('debug')('noco-database');

export interface IRepository {}

interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}

export interface TransactionAble {
  transaction?: Transaction;
}

export interface FilterAble {
  filter: Filter;
}

export type PrimaryKey = string | number;
export type PK = PrimaryKey | PrimaryKey[];

export type Filter = any;
export type Appends = string[];
export type Except = string[];
export type Fields = string[];
export type Sort = string[];

export type WhiteList = string[];
export type BlackList = string[];
export type AssociationKeysToBeUpdate = string[];

export type Values = any;

export interface CountOptions extends Omit<SequelizeCreateOptions, 'distinct' | 'where' | 'include'>, TransactionAble {
  fields?: Fields;
  filter?: Filter;
}

export interface FilterByPK {
  filterByPk?: PrimaryKey;
}

export interface FindOptions extends SequelizeFindOptions, CommonFindOptions, FilterByPK {}

export interface CommonFindOptions {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

interface FindOneOptions extends FindOptions, CommonFindOptions {}

export interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByPk?: PrimaryKey | PrimaryKey[];
  truncate?: boolean;
  context?: any;
}

interface FindAndCountOptions extends Omit<SequelizeAndCountOptions, 'where' | 'include' | 'order'> {
  // 数据过滤
  filter?: Filter;
  // 输出结果显示哪些字段
  fields?: Fields;
  // 输出结果不显示哪些字段
  except?: Except;
  // 附加字段，用于控制关系字段的输出
  appends?: Appends;
  // 排序，字段前面加上 “-” 表示降序
  sort?: Sort;
}

export interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}

export interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByPk?: PrimaryKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
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

const transaction = transactionWrapperBuilder(function () {
  return (<Repository>this).collection.model.sequelize.transaction();
});

class RelationRepositoryBuilder<R extends RelationRepository> {
  collection: Collection;
  associationName: string;
  association: Association;

  builderMap = {
    HasOne: HasOneRepository,
    BelongsTo: BelongsToRepository,
    BelongsToMany: BelongsToManyRepository,
    HasMany: HasManyRepository,
  };

  constructor(collection: Collection, associationName: string) {
    this.collection = collection;
    this.associationName = associationName;
    this.association = this.collection.model.associations[this.associationName];
  }

  protected builder() {
    return this.builderMap;
  }

  of(id: string | number, associatedKey?: string): R {
    const klass = this.builder()[this.association.associationType];
    return new klass(this.collection, this.associationName, id, associatedKey);
  }
}

export class Repository<TModelAttributes extends {} = any, TCreationAttributes extends {} = TModelAttributes>
  implements IRepository
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
  async count(countOptions?: CountOptions): Promise<number> {
    let options = countOptions ? lodash.clone(countOptions) : {};

    const transaction = await this.getTransaction(options);

    if (countOptions?.filter) {
      options = {
        ...options,
        ...this.parseFilter(countOptions.filter),
      };
    }

    const count = await this.collection.model.count({
      ...options,
      distinct: true,
      transaction,
    });

    return count;
  }

  /**
   * find
   * @param options
   */
  async find(options?: FindOptions) {
    const model = this.collection.model;
    const transaction = await this.getTransaction(options);
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
          transaction,
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
        transaction,
      });
    }

    return await model.findAll({
      ...opts,
      transaction,
    });
  }

  /**
   * find and count
   * @param options
   */
  async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]> {
    const transaction = await this.getTransaction(options);
    options = {
      ...options,
      transaction,
    };

    return [await this.find(options), await this.count(options)];
  }

  /**
   * Find By Id
   *
   */
  findById(id: PrimaryKey) {
    return this.collection.model.findByPk(id);
  }

  /**
   * Find one record from database
   *
   * @param options
   */
  async findOne(options?: FindOneOptions) {
    const transaction = await this.getTransaction(options);

    const rows = await this.find({ ...options, limit: 1, transaction });
    return rows.length == 1 ? rows[0] : null;
  }

  /**
   * Save instance to database
   *
   * @param values
   * @param options
   */
  @transaction()
  async create<M extends Model>(options: CreateOptions): Promise<M> {
    const transaction = await this.getTransaction(options);

    const guard = UpdateGuard.fromOptions(this.model, options);
    const values = guard.sanitize(options.values || {});

    const instance = await this.model.create<any>(values, {
      ...options,
      transaction,
    });

    if (!instance) {
      return;
    }

    await updateAssociations(instance, values, {
      ...options,
      transaction,
    });

    return instance;
  }

  /**
   * Save Many instances to database
   *
   * @param records
   * @param options
   */
  @transaction()
  async createMany(options: CreateManyOptions) {
    const transaction = await this.getTransaction(options);
    const { records } = options;
    const instances = await this.collection.model.bulkCreate(records, {
      ...options,
      transaction,
    });

    for (let i = 0; i < instances.length; i++) {
      await updateAssociations(instances[i], records[i], { ...options, transaction });
    }

    return instances;
  }

  /**
   * Update model value
   *
   * @param values
   * @param options
   */
  @transaction()
  async update(options: UpdateOptions) {
    const transaction = await this.getTransaction(options);
    const guard = UpdateGuard.fromOptions(this.model, options);

    const values = guard.sanitize(options.values);

    const queryOptions = this.buildQueryOptions(options);

    const instances = await this.find({
      ...queryOptions,
      transaction,
    });

    for (const instance of instances) {
      await updateModelByValues(instance, values, {
        ...options,
        sanitized: true,
        transaction,
      });
    }

    return instances;
  }

  @transaction((args, transaction) => {
    return {
      filterByPk: args[0],
      transaction,
    };
  })
  async destroy(options?: PrimaryKey | PrimaryKey[] | DestroyOptions) {
    const transaction = await this.getTransaction(options);

    options = <DestroyOptions>options;

    const filterByPk: PrimaryKey[] | undefined =
      options.filterByPk && !lodash.isArray(options.filterByPk)
        ? [options.filterByPk]
        : (options.filterByPk as PrimaryKey[] | undefined);

    if (filterByPk && !options.filter) {
      return await this.model.destroy({
        ...options,
        where: {
          [this.model.primaryKeyAttribute]: {
            [Op.in]: filterByPk,
          },
        },
        transaction,
      });
    }

    if (options.filter) {
      let pks = (
        await this.find({
          filter: options.filter,
          transaction,
        })
      ).map((instance) => instance[this.model.primaryKeyAttribute]);

      if (filterByPk) {
        pks = lodash.intersection(pks, filterByPk);
      }

      return await this.destroy({
        context: options.context,
        filterByPk: pks,
        transaction,
      });
    }

    if (options.truncate) {
      return await this.model.destroy({
        ...options,
        truncate: true,
        transaction,
      });
    }
  }

  /**
   * @param association target association
   */
  relation<R extends RelationRepository>(association: string): RelationRepositoryBuilder<R> {
    return new RelationRepositoryBuilder<R>(this.collection, association);
  }

  protected buildQueryOptions(options: any) {
    const parser = new OptionsParser(this.collection.model, this.collection.context.database, options);
    const params = parser.toSequelizeParams();
    debug('sequelize query params %o', params);
    return { ...options, ...params };
  }

  protected parseFilter(filter: Filter) {
    const parser = new FilterParser(this.collection.model, this.collection.context.database, filter);
    return parser.toSequelizeParams();
  }

  protected async getTransaction(options: any, autoGen = false) {
    if (lodash.isPlainObject(options) && options.transaction) {
      return options.transaction;
    }

    if (autoGen) {
      return await this.model.sequelize.transaction();
    }

    return null;
  }
}

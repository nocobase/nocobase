import lodash, { omit } from 'lodash';
import {
  Association,
  BulkCreateOptions,
  CountOptions as SequelizeCountOptions,
  CreateOptions as SequelizeCreateOptions,
  DestroyOptions as SequelizeDestroyOptions,
  FindAndCountOptions as SequelizeAndCountOptions,
  FindOptions as SequelizeFindOptions,
  ModelStatic,
  Op,
  Transactionable,
  UpdateOptions as SequelizeUpdateOptions,
  WhereOperators
} from 'sequelize';
import { Collection } from './collection';
import { Database } from './database';
import mustHaveFilter from './decorators/must-have-filter-decorator';
import { transactionWrapperBuilder } from './decorators/transaction-decorator';
import { ArrayFieldRepository } from './field-repository/array-field-repository';
import { ArrayField, RelationField } from './fields';
import FilterParser from './filter-parser';
import { Model } from './model';
import operators from './operators';
import { OptionsParser } from './options-parser';
import { BelongsToManyRepository } from './relation-repository/belongs-to-many-repository';
import { BelongsToRepository } from './relation-repository/belongs-to-repository';
import { HasManyRepository } from './relation-repository/hasmany-repository';
import { HasOneRepository } from './relation-repository/hasone-repository';
import { RelationRepository } from './relation-repository/relation-repository';
import { updateAssociations, updateModelByValues } from './update-associations';
import { UpdateGuard } from './update-guard';
import { handleAppendsQuery } from './utils';

const debug = require('debug')('noco-database');

export interface IRepository {}

interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}

export { Transactionable } from 'sequelize';

export interface FilterAble {
  filter: Filter;
}

export type TargetKey = string | number;
export type TK = TargetKey | TargetKey[];

type FieldValue = string | number | bigint | boolean | Date | Buffer | null | FieldValue[] | FilterWithOperator;

type Operators = keyof typeof operators & keyof WhereOperators;

export type FilterWithOperator = {
  [key: string]:
    | {
        [K in Operators]: FieldValue;
      }
    | FieldValue;
};

export type FilterWithValue = {
  [key: string]: FieldValue;
};

type FilterAnd = {
  $and: Filter[];
};

type FilterOr = {
  $or: Filter[];
};

export type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;

export type Appends = string[];
export type Except = string[];
export type Fields = string[];
export type Sort = string[] | string;

export type WhiteList = string[];
export type BlackList = string[];

export type AssociationKeysToBeUpdate = string[];

export type Values = any;

export type CountOptions = Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'> &
  Transactionable & {
    filter?: Filter;
    context?: any;
  } & FilterByTk;

export interface FilterByTk {
  filterByTk?: TargetKey;
}

export type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;

export interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
  context?: any;
  tree?: boolean;
}

export type FindOneOptions = Omit<FindOptions, 'limit'>;

export interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}

type FindAndCountOptions = Omit<SequelizeAndCountOptions, 'where' | 'include' | 'order'> & CommonFindOptions;

export interface CreateOptions extends SequelizeCreateOptions {
  values?: Values | Values[];
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}

export interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}

interface UpdateManyOptions extends UpdateOptions {
  records: Values[];
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
  association: Association | { associationType: string };

  builderMap = {
    HasOne: HasOneRepository,
    BelongsTo: BelongsToRepository,
    BelongsToMany: BelongsToManyRepository,
    HasMany: HasManyRepository,
    ArrayField: ArrayFieldRepository,
  };

  constructor(collection: Collection, associationName: string) {
    this.collection = collection;
    this.associationName = associationName;
    this.association = this.collection.model.associations[this.associationName];

    if (!this.association) {
      const field = collection.getField(associationName);
      if (field && field instanceof ArrayField) {
        this.association = {
          associationType: 'ArrayField',
        };
      }
    }
  }

  protected builder() {
    return this.builderMap;
  }

  of(id: string | number): R {
    if (!this.association) {
      return;
    }
    const klass = this.builder()[this.association.associationType];
    return new klass(this.collection, this.associationName, id);
  }
}

export class Repository<TModelAttributes extends {} = any, TCreationAttributes extends {} = TModelAttributes>
  implements IRepository
{
  database: Database;
  collection: Collection;
  model: ModelStatic<Model>;

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
        ...this.parseFilter(countOptions.filter, countOptions),
      };
    }

    if (countOptions?.filterByTk) {
      options['where'] = {
        [Op.and]: [
          options['where'] || {},
          {
            [this.collection.filterTargetKey]: options.filterByTk,
          },
        ],
      };
    }

    const queryOptions: any = {
      ...options,
      distinct: Boolean(this.collection.model.primaryKeyAttribute),
    };

    if (queryOptions.include?.length === 0) {
      delete queryOptions.include;
    }

    const count = await this.collection.model.count({
      ...queryOptions,
      transaction,
    });

    // @ts-ignore
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

    let rows;

    if (opts.include && opts.include.length > 0) {
      // @ts-ignore
      const primaryKeyField = model.primaryKeyField || model.primaryKeyAttribute;

      const ids = (
        await model.findAll({
          ...opts,
          includeIgnoreAttributes: false,
          attributes: [primaryKeyField],
          group: `${model.name}.${primaryKeyField}`,
          transaction,
          include: opts.include.filter((include) => {
            return (
              Object.keys(include.where || {}).length > 0 || JSON.stringify(opts?.filter)?.includes(include.association)
            );
          }),
        } as any)
      ).map((row) => {
        return { row, pk: row.get(primaryKeyField) };
      });

      if (ids.length == 0) {
        return [];
      }

      const templateModel = await model.findOne({
        ...opts,
        includeIgnoreAttributes: false,
        attributes: [primaryKeyField],
        group: `${model.name}.${primaryKeyField}`,
        transaction,
        limit: 1,
        offset: 0,
      } as any);

      const where = {
        [primaryKeyField]: {
          [Op.in]: ids.map((id) => id['pk']),
        },
      };

      rows = await handleAppendsQuery({
        queryPromises: opts.include.map((include) => {
          const options = {
            ...omit(opts, ['limit', 'offset']),
            include: include,
            where,
            transaction,
          };

          return model.findAll(options).then((rows) => {
            return { rows, include };
          });
        }),
        templateModel: templateModel,
      });
    } else {
      rows = await model.findAll({
        ...opts,
        transaction,
      });
    }

    if (this.collection.isParent()) {
      for (const row of rows) {
        const rowCollectionName = this.database.tableNameCollectionMap.get(
          options.raw ? row['__tableName'] : row.get('__tableName'),
        ).name;

        options.raw
          ? (row['__collection'] = rowCollectionName)
          : row.set('__collection', rowCollectionName, {
              raw: true,
            });
      }
    }

    return rows;
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

    const count = await this.count(options);
    const results = count ? await this.find(options) : [];

    return [results, count];
  }

  /**
   * Find By Id
   *
   */
  findById(id: string | number) {
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
  async create(options: CreateOptions) {
    if (Array.isArray(options.values)) {
      return this.createMany({
        ...options,
        records: options.values,
      });
    }

    const transaction = await this.getTransaction(options);

    const guard = UpdateGuard.fromOptions(this.model, {
      ...options,
      action: 'create',
      underscored: this.collection.options.underscored,
    });

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

    if (options.hooks !== false) {
      await this.database.emitAsync(`${this.collection.name}.afterCreateWithAssociations`, instance, {
        ...options,
        transaction,
      });
      await this.database.emitAsync(`${this.collection.name}.afterSaveWithAssociations`, instance, {
        ...options,
        transaction,
      });
      instance.clearChangedWithAssociations();
    }

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
    const instances = [];

    for (const values of records) {
      const instance = await this.create({ values, transaction });
      instances.push(instance);
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
  @mustHaveFilter()
  async update(options: UpdateOptions & { forceUpdate?: boolean }) {
    if (Array.isArray(options.values)) {
      return this.updateMany({
        ...options,
        records: options.values,
      });
    }
    const transaction = await this.getTransaction(options);

    const guard = UpdateGuard.fromOptions(this.model, { ...options, underscored: this.collection.options.underscored });

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

    if (options.hooks !== false) {
      for (const instance of instances) {
        await this.database.emitAsync(`${this.collection.name}.afterUpdateWithAssociations`, instance, {
          ...options,
          transaction,
        });
        await this.database.emitAsync(`${this.collection.name}.afterSaveWithAssociations`, instance, {
          ...options,
          transaction,
        });
        instance.clearChangedWithAssociations();
      }
    }

    return instances;
  }

  @transaction()
  async updateMany(options: UpdateManyOptions) {
    const transaction = await this.getTransaction(options);
    const { records } = options;
    const instances = [];

    for (const values of records) {
      const filterByTk = values[this.model.primaryKeyAttribute];
      if (!filterByTk) {
        throw new Error('filterByTk invalid');
      }
      const instance = await this.update({ values, filterByTk, transaction });
      instances.push(instance);
    }

    return instances;
  }

  @transaction((args, transaction) => {
    return {
      filterByTk: args[0],
      transaction,
    };
  })
  async destroy(options?: TargetKey | TargetKey[] | DestroyOptions) {
    const transaction = await this.getTransaction(options);

    const modelFilterKey = this.collection.filterTargetKey;

    options = <DestroyOptions>options;

    if (options['individualHooks'] === undefined) {
      options['individualHooks'] = true;
    }

    const filterByTk: TargetKey[] | undefined =
      options.filterByTk && !lodash.isArray(options.filterByTk)
        ? [options.filterByTk]
        : (options.filterByTk as TargetKey[] | undefined);

    if (
      this.collection.model.primaryKeyAttributes.length !== 1 &&
      filterByTk &&
      !lodash.get(this.collection.options, 'filterTargetKey')
    ) {
      if (this.collection.model.primaryKeyAttributes.length > 1) {
        throw new Error(`filterByTk is not supported for composite primary key`);
      } else {
        throw new Error(`filterByTk is not supported for collection that has no primary key`);
      }
    }

    if (filterByTk && !options.filter) {
      return await this.model.destroy({
        ...options,
        where: {
          [modelFilterKey]: {
            [Op.in]: filterByTk,
          },
        },
        transaction,
      });
    }

    if (options.filter) {
      if (
        this.collection.model.primaryKeyAttributes.length !== 1 &&
        !lodash.get(this.collection.options, 'filterTargetKey')
      ) {
        const queryOptions = {
          ...this.buildQueryOptions(options),
        };

        return await this.model.destroy({
          ...queryOptions,
          transaction,
        });
      }

      let pks = (
        await this.find({
          filter: options.filter,
          transaction,
        })
      ).map((instance) => instance.get(modelFilterKey) as TargetKey);

      if (filterByTk) {
        pks = lodash.intersection(
          pks.map((i) => `${i}`),
          filterByTk.map((i) => `${i}`),
        );
      }

      return await this.destroy({
        ...lodash.omit(options, 'filter'),
        filterByTk: pks,
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

  public buildQueryOptions(options: any) {
    const parser = new OptionsParser(options, {
      collection: this.collection,
    });

    const params = parser.toSequelizeParams();
    debug('sequelize query params %o', params);
    return { where: {}, ...options, ...params };
  }

  protected parseFilter(filter: Filter, options?: any) {
    const parser = new FilterParser(filter, {
      collection: this.collection,
      app: {
        ctx: options?.context,
      },
    });
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

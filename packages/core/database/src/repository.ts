/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isValidFilter } from '@nocobase/utils';
import lodash from 'lodash';
import {
  Association,
  BulkCreateOptions,
  ModelStatic,
  Op,
  QueryTypes,
  Sequelize,
  FindAndCountOptions as SequelizeAndCountOptions,
  CountOptions as SequelizeCountOptions,
  CreateOptions as SequelizeCreateOptions,
  DestroyOptions as SequelizeDestroyOptions,
  FindOptions as SequelizeFindOptions,
  UpdateOptions as SequelizeUpdateOptions,
  Transactionable,
  Utils,
  WhereOperators,
} from 'sequelize';

import _ from 'lodash';
import { BelongsToArrayRepository } from './belongs-to-array/belongs-to-array-repository';
import { Collection } from './collection';
import { SmartCursorBuilder } from './cursor-builder';
import { Database } from './database';
import mustHaveFilter from './decorators/must-have-filter-decorator';
import injectTargetCollection from './decorators/target-collection-decorator';
import { transactionWrapperBuilder } from './decorators/transaction-decorator';
import { EagerLoadingTree } from './eager-loading/eager-loading-tree';
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
import { processIncludes } from './utils';
import { valuesToFilter } from './utils/filter-utils';

const debug = require('debug')('noco-database');

interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}

export { Transactionable } from 'sequelize';

export interface FilterAble {
  filter: Filter;
}

export type BaseTargetKey = string | number;
export type MultiTargetKey = Record<string, BaseTargetKey>;
export type TargetKey = BaseTargetKey | MultiTargetKey | MultiTargetKey[];

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
  filterByTk?: TK;
  targetCollection?: string;
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

export type FindOneOptions = Omit<FindOptions, 'limit'> & {
  targetCollection?: string;
};

export interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}

export type FindAndCountOptions = Omit<SequelizeAndCountOptions, 'where' | 'include' | 'order'> & CommonFindOptions;

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
  targetCollection?: string;
  context?: any;
}

interface UpdateManyOptions extends Omit<UpdateOptions, 'values'> {
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
    BelongsToArray: BelongsToArrayRepository,
  };

  constructor(collection: Collection, associationName: string) {
    this.collection = collection;
    this.associationName = associationName;
    this.association = this.collection.model.associations[this.associationName];

    if (this.association) {
      return;
    }
    const field = collection.getField(associationName);
    if (!field) {
      return;
    }
    if (field instanceof ArrayField) {
      this.association = {
        associationType: 'ArrayField',
      };
    }
  }

  of(id: TargetKey): R {
    if (!this.association) {
      return;
    }
    const klass = this.builder()[this.association.associationType];
    return new klass(this.collection, this.associationName, id);
  }

  protected builder() {
    return this.builderMap;
  }
}

export interface AggregateOptions {
  method: 'avg' | 'count' | 'min' | 'max' | 'sum';
  field?: string;
  filter?: Filter;
  distinct?: boolean;
}

export interface FirstOrCreateOptions extends Transactionable {
  filterKeys: string[];
  values?: Values;
  hooks?: boolean;
  context?: any;
  updateAssociationValues?: AssociationKeysToBeUpdate;
}

export interface UpsertOptions extends Transactionable {
  filterKeys: string[];
  values?: Values;
  hooks?: boolean;
  context?: any;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  /**
   * 是否使用数据库原生的 upsert 能力（如 PostgreSQL 的 ON CONFLICT）
   * 默认为 true，在支持的数据库上会使用原生 upsert
   * 设为 false 则回退到先查询后更新/创建的方式
   */
  useNativeUpsert?: boolean;
}

export class Repository<TModelAttributes extends {} = any, TCreationAttributes extends {} = TModelAttributes> {
  database: Database;
  collection: Collection;
  model: ModelStatic<Model>;
  cursorBuilder: SmartCursorBuilder;

  constructor(collection: Collection) {
    this.database = collection.context.database;
    this.collection = collection;
    this.model = collection.model;

    this.cursorBuilder = new SmartCursorBuilder(this.database.sequelize, this.model.tableName, this.collection);
  }

  public static valuesToFilter = valuesToFilter;

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
      const optionParser = new OptionsParser(options, {
        collection: this.collection,
      });

      options['where'] = {
        [Op.and]: [options['where'] || {}, optionParser.filterByTkToWhereOption()],
      };
    }

    const queryOptions: any = {
      ...options,
      distinct: Boolean(this.collection.model.primaryKeyAttribute) && !this.collection.isMultiFilterTargetKey(),
    };

    if (Array.isArray(queryOptions.include) && queryOptions.include.length > 0) {
      queryOptions.include = processIncludes(queryOptions.include, this.collection.model);
    } else {
      delete queryOptions.include;
    }

    // @ts-ignore
    return await this.collection.model.count({
      ...queryOptions,
      transaction,
    });
  }

  async getEstimatedRowCount() {
    if (_.isFunction(this.collection['isSql']) && this.collection['isSql']()) {
      return 0;
    }
    if (_.isFunction(this.collection['isView']) && this.collection['isView']()) {
      return 0;
    }
    const tableName = this.collection.tableName();
    try {
      if (this.database.isMySQLCompatibleDialect()) {
        const results: any[] = await this.database.sequelize.query(
          `
        SELECT table_rows FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = ?
      `,
          { replacements: [tableName], type: QueryTypes.SELECT },
        );
        return Number(results?.[0]?.[this.database.inDialect('mysql') ? 'TABLE_ROWS' : 'table_rows'] ?? 0);
      }
      if (this.database.isPostgresCompatibleDialect()) {
        const results: any[] = await this.database.sequelize.query(
          `
        SELECT reltuples::BIGINT AS estimate
        FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = ? AND n.nspname = ?;
      `,
          { replacements: [tableName, this.collection.collectionSchema()], type: QueryTypes.SELECT, logging: true },
        );
        return Number(results?.[0]?.estimate ?? 0);
      }

      if (this.database.sequelize.getDialect() === 'mssql') {
        const results: any[] = await this.database.sequelize.query(
          `
        SELECT SUM(row_count) AS estimate
        FROM sys.dm_db_partition_stats
        WHERE object_id = OBJECT_ID(?) AND (index_id = 0 OR index_id = 1)
      `,
          { replacements: [tableName], type: QueryTypes.SELECT },
        );
        return Number(results?.[0]?.estimate ?? 0);
      }

      if (this.database.sequelize.getDialect() === 'oracle') {
        const tableName = this.collection.name.toUpperCase();
        const schemaName = (await this.getOracleSchema()).toUpperCase();

        await this.database.sequelize.query(`BEGIN DBMS_STATS.GATHER_TABLE_STATS(:schema, :table); END;`, {
          replacements: { schema: schemaName, table: tableName },
          type: QueryTypes.RAW,
        });

        const results: any[] = await this.database.sequelize.query(
          `
      SELECT NUM_ROWS AS "estimate"
      FROM ALL_TABLES
      WHERE TABLE_NAME = :table AND OWNER = :schema
      `,
          {
            replacements: { table: tableName, schema: schemaName },
            type: QueryTypes.SELECT,
          },
        );
        return Number(results?.[0]?.estimate ?? 0);
      }
    } catch (error) {
      this.database.logger.error(`Failed to get estimated row count for ${this.collection.name}:`, error);
      return 0;
    }

    return 0;
  }

  private async getOracleSchema(): Promise<string> {
    const [result] = await this.database.sequelize.query(`SELECT USER FROM DUAL`, {
      type: QueryTypes.SELECT,
    });
    return result?.['USER'] ?? '';
  }

  async aggregate(options: AggregateOptions & { optionsTransformer?: (options: any) => any }): Promise<any> {
    const { method, field } = options;

    const queryOptions = this.buildQueryOptions({
      ...options,
      fields: [],
    });

    options.optionsTransformer?.(queryOptions);

    delete queryOptions.order;

    const hasAssociationFilter = (() => {
      if (queryOptions.include && queryOptions.include.length > 0) {
        const filterInclude = queryOptions.include.filter((include) => {
          return (
            Object.keys(include.where || {}).length > 0 ||
            JSON.stringify(queryOptions?.filter)?.includes(include.association)
          );
        });
        return filterInclude.length > 0;
      }
      return false;
    })();

    if (hasAssociationFilter) {
      const primaryKeyField = this.model.primaryKeyAttribute;
      const queryInterface = this.database.sequelize.getQueryInterface();

      const findOptions = {
        ...queryOptions,
        raw: true,
        includeIgnoreAttributes: false,
        attributes: [
          [
            Sequelize.literal(
              `DISTINCT ${queryInterface.quoteIdentifiers(`${this.collection.name}.${primaryKeyField}`)}`,
            ),
            primaryKeyField,
          ],
        ],
      };

      const ids = await this.model.findAll(findOptions);

      return await this.model.aggregate(field, method, {
        ...lodash.omit(queryOptions, ['where', 'include']),
        where: {
          [primaryKeyField]: ids.map((node) => node[primaryKeyField]),
        },
      });
    }

    return await this.model.aggregate(field, method, queryOptions);
  }

  async chunk(
    options: FindOptions & {
      chunkSize: number;
      callback: (rows: Model[], options: FindOptions) => Promise<void>;
      beforeFind?: (options: FindOptions) => Promise<void>;
      afterFind?: (rows: Model[], options: FindOptions & { offset: number }) => Promise<void>;
    },
  ) {
    const { chunkSize, callback, limit: overallLimit, beforeFind, afterFind } = options;
    const transaction = await this.getTransaction(options);

    let offset = 0;
    let totalProcessed = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Calculate the limit for the current chunk
      const currentLimit = overallLimit !== undefined ? Math.min(chunkSize, overallLimit - totalProcessed) : chunkSize;
      const findOptions = {
        ...options,
        limit: currentLimit,
        offset,
        transaction,
      };
      if (beforeFind) {
        await beforeFind(findOptions);
      }
      const rows = await this.find(findOptions);
      if (afterFind) {
        await afterFind(rows, { ...findOptions, offset });
      }
      if (rows.length === 0) {
        break;
      }

      await callback(rows, options);
      offset += currentLimit;
      totalProcessed += rows.length;

      if (overallLimit !== undefined && totalProcessed >= overallLimit) {
        break;
      }
    }
  }

  /**
   * Cursor-based pagination query function.
   * Ideal for large datasets (e.g., millions of rows)
   * Note:
   *  1. does not support jumping to arbitrary pages (e.g., "Page 5")
   *  2. Requires a stable, indexed sort field (e.g. ID, createdAt)
   *  3. If custom orderBy is used, it must match the cursor field(s) and direction, otherwise results may be incorrect or unstable.
   * @param options
   */
  async chunkWithCursor(
    options: FindOptions & {
      chunkSize: number;
      callback: (rows: Model[], options: FindOptions) => Promise<void>;
      beforeFind?: (options: FindOptions) => Promise<void>;
      afterFind?: (rows: Model[], options: FindOptions) => Promise<void>;
    },
  ) {
    return await this.cursorBuilder.chunk({
      ...options,
      find: this.find.bind(this),
    });
  }

  /**
   * find
   * @param options
   */
  async find(options: FindOptions = {}) {
    if (options?.targetCollection && options?.targetCollection !== this.collection.name) {
      return await this.database.getCollection(options.targetCollection).repository.find(options);
    }

    const model = this.collection.model;
    const transaction = await this.getTransaction(options);

    const opts = {
      subQuery: false,
      ...this.buildQueryOptions(options),
    };
    if (!_.isUndefined(opts.limit)) {
      opts.limit = Number(opts.limit);
    }

    let rows;

    if (opts.include && opts.include.length > 0) {
      const eagerLoadingTree = EagerLoadingTree.buildFromSequelizeOptions({
        model,
        rootAttributes: opts.attributes,
        includeOption: opts.include,
        rootOrder: opts.order,
        rootQueryOptions: opts,
        db: this.database,
      });

      await eagerLoadingTree.load(transaction);

      rows = eagerLoadingTree.root.instances;
    } else {
      if (opts.where && model.primaryKeyAttributes.length === 0) {
        opts.where = Utils.mapWhereFieldNames(opts.where, model);
      }

      rows = await model.findAll({
        ...opts,
        transaction,
      });
    }

    await this.collection.db.emitAsync('afterRepositoryFind', {
      findOptions: options,
      dataCollection: this.collection,
      data: rows,
    });

    return rows;
  }

  /**
   * find and count
   * @param options
   */
  async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]> {
    options = {
      ...options,
      transaction: await this.getTransaction(options),
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

  findByTargetKey(targetKey: TargetKey) {
    return this.findOne({ filterByTk: targetKey });
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
   * Get the first record matching the attributes or create it.
   */
  async firstOrCreate(options: FirstOrCreateOptions) {
    const { filterKeys, values, transaction, context, ...rest } = options;
    const filter = Repository.valuesToFilter(values, filterKeys);

    const instance = await this.findOne({ filter, transaction, context });

    if (instance) {
      return instance;
    }

    return this.create({ values, transaction, context, ...rest });
  }

  async updateOrCreate(options: FirstOrCreateOptions & { useNativeUpsert?: boolean }) {
    const { filterKeys, values, transaction, context, useNativeUpsert, ...rest } = options;

    // 对于支持的数据库，默认使用原生 upsert（原子操作，性能更好）
    if (useNativeUpsert !== false && this.database.inDialect('postgres', 'mysql', 'mariadb', 'sqlite')) {
      const [instance] = await this.upsert({
        filterKeys,
        values,
        transaction,
        context,
        useNativeUpsert: true,
        ...rest,
      });
      return instance;
    }

    // 回退到先查询后更新的方式（非原子操作）
    const filter = Repository.valuesToFilter(values, filterKeys);

    const instance = await this.findOne({ filter, transaction, context });

    if (instance) {
      return await this.update({
        filterByTk: instance.get(this.collection.filterTargetKey || this.collection.model.primaryKeyAttribute),
        values,
        transaction,
        context,
        ...rest,
      });
    }

    return this.create({ values, transaction, context, ...rest });
  }

  /**
   * Upsert - 使用数据库原生 upsert 能力（如 PostgreSQL ON CONFLICT）
   * 在支持的数据库上（PostgreSQL 9.5+, MySQL 5.7+, SQLite 3.24+, MariaDB 10.3+）使用原生 upsert
   * 在不支持的数据库上回退到 updateOrCreate
   *
   * @param options
   * @returns [instance, created] - created 为 true 表示是新创建的记录
   */
  async upsert(options: UpsertOptions): Promise<[Model, boolean]> {
    const { filterKeys, values, transaction, context, useNativeUpsert = true, ...rest } = options;

    // 如果不使用原生 upsert 或者数据库不支持，则回退到 updateOrCreate
    if (!useNativeUpsert || !this.database.inDialect('postgres', 'mysql', 'mariadb', 'sqlite')) {
      const result = await this.updateOrCreate({ filterKeys, values, transaction, context, ...rest });
      // updateOrCreate 不返回是否创建，这里需要查询判断，但为了不破坏接口，假设是更新
      return [result as Model, false];
    }

    const tx = transaction || (await this.database.sequelize.transaction());
    const useExternalTransaction = !!transaction;

    try {
      // 1. 准备数据：应用 setter 和 UpdateGuard
      const guard = UpdateGuard.fromOptions(this.model, {
        ...rest,
        action: 'create',
        underscored: this.collection.options.underscored,
      });
      const sanitizedValues = guard.sanitize(values || {});

      // 2. 构建 conflict 字段
      const conflictFields = filterKeys.map((key) => {
        // 处理关联字段，如 'roles.name' -> 暂时只支持简单字段
        if (key.includes('.')) {
          throw new Error(`upsert does not support nested filterKeys like '${key}' yet`);
        }
        return key;
      });

      // 3. 对于 PostgreSQL，使用原生 ON CONFLICT
      if (this.database.isPostgresCompatibleDialect()) {
        const result = await this.upsertPostgres(sanitizedValues, conflictFields, tx, context, rest);
        if (!useExternalTransaction) {
          await tx.commit();
        }
        return result;
      }

      // 4. 对于 MySQL/MariaDB/SQLite，使用 Sequelize 的内置 upsert
      // Sequelize 的 upsert 返回 [instance, created]
      const [instance, created] = await this.model.upsert(sanitizedValues, {
        transaction: tx,
        fields: Object.keys(sanitizedValues),
      });

      // 5. 触发钩子
      if (options.hooks !== false) {
        const eventName = created
          ? `${this.collection.name}.afterCreateWithAssociations`
          : `${this.collection.name}.afterUpdateWithAssociations`;
        await this.database.emitAsync(eventName, instance, { transaction: tx, context });
        await this.database.emitAsync(`${this.collection.name}.afterSaveWithAssociations`, instance, {
          transaction: tx,
          context,
        });
        instance.clearChangedWithAssociations();
      }

      if (!useExternalTransaction) {
        await tx.commit();
      }

      return [instance, created];
    } catch (error) {
      if (!useExternalTransaction) {
        await tx.rollback();
      }
      throw error;
    }
  }

  /**
   * PostgreSQL 原生 ON CONFLICT 实现
   */
  private async upsertPostgres(
    values: Values,
    conflictFields: string[],
    transaction: any,
    context: any,
    rest: any,
  ): Promise<[Model, boolean]> {
    const tableName = this.collection.tableName();
    const schema = this.collection.collectionSchema();
    const fullTableName = schema ? `"${schema}"."${tableName}"` : `"${tableName}"`;

    // 获取所有字段和值
    const fields = Object.keys(values);
    const fieldColumns = fields.map((f) => `"${f}"`).join(', ');
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    // 构建 update set 部分（排除 conflict 字段）
    const updateFields = fields.filter((f) => !conflictFields.includes(f));
    let updateSet = updateFields.length > 0 ? updateFields.map((f) => `"${f}" = EXCLUDED."${f}"`).join(', ') : null;

    // 如果没有需要更新的字段，至少更新 updated_at 字段
    // PostgreSQL ON CONFLICT DO NOTHING 会导致 RETURNING 在冲突时不返回数据
    // 所以必须始终使用 DO UPDATE SET
    if (!updateSet) {
      // @ts-ignore
      const updatedAtField = this.model._timestampAttributes?.updatedAt || 'updatedAt';
      updateSet = `"${updatedAtField}" = CURRENT_TIMESTAMP`;
    }

    // 构建 ON CONFLICT 子句
    const conflictColumns = conflictFields.map((f) => `"${f}"`).join(', ');

    const sql = `
      INSERT INTO ${fullTableName} (${fieldColumns})
      VALUES (${placeholders})
      ON CONFLICT (${conflictColumns})
      DO UPDATE SET ${updateSet}
      RETURNING *,
        (xmax = 0) AS "_upsert_created"
    `;

    // 执行查询
    const [rows, affectedCount] = await this.database.sequelize.query(sql, {
      bind: fields.map((f) => values[f]),
      transaction,
      type: QueryTypes.INSERT,
      model: this.model,
      mapToModel: true,
    });

    // 由于始终使用 DO UPDATE SET，RETURNING 总是会返回数据
    const rawInstance = rows[0];
    // affectedCount 可能是 Model（Sequelize 类型定义问题），需要判断
    let created = typeof affectedCount === 'number' ? affectedCount === 1 : true;

    // 使用 xmax 判断是否是新记录（PostgreSQL 特性）
    // 注意：rawInstance 可能是普通对象或 Model 实例
    const upsertCreated = rawInstance && rawInstance._upsert_created !== false;
    created = upsertCreated;

    // 移除内部字段
    if (rawInstance) {
      delete rawInstance._upsert_created;
    }

    // 将原始数据转换为 Model 实例
    let instance: Model;
    if (rawInstance instanceof Model) {
      instance = rawInstance;
    } else {
      // 构建 Model 实例
      instance = this.model.build(rawInstance, { isNewRecord: created });
      // 如果是已存在的记录，需要标记为已存在
      if (!created) {
        instance.isNewRecord = false;
        // 设置主键
        const pk = this.collection.model.primaryKeyAttribute;
        if (pk && rawInstance[pk]) {
          instance.setDataValue(pk, rawInstance[pk]);
        }
      }
    }

    // 触发钩子
    if (rest.hooks !== false && instance) {
      const eventName = created
        ? `${this.collection.name}.afterCreateWithAssociations`
        : `${this.collection.name}.afterUpdateWithAssociations`;
      await this.database.emitAsync(eventName, instance, { transaction, context });
      await this.database.emitAsync(`${this.collection.name}.afterSaveWithAssociations`, instance, {
        transaction,
        context,
      });
      if (typeof instance.clearChangedWithAssociations === 'function') {
        instance.clearChangedWithAssociations();
      }
    }

    return [instance, created];
  }

  private validate(options: { values: Record<string, any>[]; operation: 'create' | 'update' }) {
    this.collection.validate(options);
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

    const values = (this.model as typeof Model).callSetters(guard.sanitize(options.values || {}), options);
    this.validate({ values: values as any, operation: 'create' });
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
      const instance = await this.create({ ...options, values, transaction });
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
  @injectTargetCollection
  async update(options: UpdateOptions & { forceUpdate?: boolean }) {
    if (Array.isArray(options.values)) {
      return this.updateMany({
        ...options,
        records: options.values,
      });
    }
    const transaction = await this.getTransaction(options);

    const guard = UpdateGuard.fromOptions(this.model, { ...options, underscored: this.collection.options.underscored });

    const values = (this.model as typeof Model).callSetters(guard.sanitize(options.values || {}), options);
    this.validate({ values: values as any, operation: 'update' });
    // NOTE:
    // 1. better to be moved to separated API like bulkUpdate/updateMany
    // 2. strictly `false` comparing for compatibility of legacy api invoking
    if (options.individualHooks === false) {
      const { model: Model } = this.collection;
      // @ts-ignore
      const primaryKeyField = Model.primaryKeyField || Model.primaryKeyAttribute;
      // NOTE:
      // 1. find ids first for reusing `queryOptions` logic
      // 2. estimation memory usage will be N * M bytes (N = rows, M = model object memory)
      // 3. would be more efficient up to 100000 ~ 1000000 rows
      const queryOptions = this.buildQueryOptions({
        ...options,
        fields: [primaryKeyField],
      });
      const rows = await this.find({
        ...queryOptions,
        transaction,
      });
      const [result] = await Model.update(values, {
        where: {
          [primaryKeyField]: rows.map((row) => row.get(primaryKeyField)),
        },
        fields: options.fields,
        hooks: options.hooks,
        validate: options.validate,
        sideEffects: options.sideEffects,
        limit: options.limit,
        silent: options.silent,
        transaction,
      });
      // TODO: not support association fields except belongsTo
      return result;
    }

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

    if (filterByTk && !isValidFilter(options.filter)) {
      const where = [];

      for (const tk of filterByTk) {
        const optionParser = new OptionsParser(
          {
            filterByTk: tk,
          },
          {
            collection: this.collection,
          },
        );

        where.push(optionParser.filterByTkToWhereOption());
      }

      const destroyOptions = {
        ...options,
        where: {
          [Op.or]: where,
        },
        transaction,
      };

      return await this.model.destroy(destroyOptions);
    }

    if (options.filter && isValidFilter(options.filter)) {
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

    const params = parser.toSequelizeParams({ parseSort: _.isBoolean(options?.parseSort) ? options.parseSort : true });
    debug('sequelize query params %o', params);

    if (options.where && params.where) {
      params.where = {
        [Op.and]: [params.where, options.where],
      };
    }

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

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { Association, BelongsTo, BelongsToMany, HasMany, HasOne, ModelStatic, Transaction } from 'sequelize';
import { Collection } from '../collection';
import Database from '../database';
import { transactionWrapperBuilder } from '../decorators/transaction-decorator';
import { RelationField } from '../fields/relation-field';
import FilterParser from '../filter-parser';
import { Model } from '../model';
import { OptionsParser } from '../options-parser';
import { updateAssociations } from '../update-associations';
import { UpdateGuard } from '../update-guard';
import { valuesToFilter } from '../utils/filter-utils';
import { CreateOptions, Filter, FindOptions, FirstOrCreateOptions, TargetKey, UpdateOptions } from './types';

export const transaction = transactionWrapperBuilder(function () {
  return this.sourceCollection.model.sequelize.transaction();
});

export abstract class RelationRepository {
  sourceCollection: Collection;
  association: Association;
  targetModel: ModelStatic<any>;
  targetCollection: Collection;
  associationName: string;
  associationField: RelationField;
  sourceKeyValue: TargetKey;
  sourceInstance: Model;
  db: Database;
  database: Database;

  constructor(sourceCollection: Collection, association: string, sourceKeyValue: TargetKey) {
    this.db = sourceCollection.context.database;
    this.database = this.db;

    this.sourceCollection = sourceCollection;

    this.setSourceKeyValue(sourceKeyValue);

    this.associationName = association;
    this.association = this.sourceCollection.model.associations[association];

    this.associationField = this.sourceCollection.getField(association);

    this.targetModel = this.association.target;
    this.targetCollection = this.sourceCollection.context.database.modelCollection.get(this.targetModel);
  }

  decodeMultiTargetKey(str: string) {
    try {
      const decoded = decodeURIComponent(str);
      const parsed = JSON.parse(decoded);
      return typeof parsed === 'object' && parsed !== null ? parsed : decoded;
    } catch (e) {
      return false;
    }
  }

  setSourceKeyValue(sourceKeyValue: TargetKey) {
    this.sourceKeyValue =
      typeof sourceKeyValue === 'string' ? this.decodeMultiTargetKey(sourceKeyValue) || sourceKeyValue : sourceKeyValue;
  }

  isMultiTargetKey(value?: any) {
    return lodash.isPlainObject(value || this.sourceKeyValue);
  }

  get collection() {
    return this.db.getCollection(this.targetModel.name);
  }

  abstract find(options?: FindOptions): Promise<any>;
  abstract findOne(options?: FindOptions): Promise<any>;
  abstract update(options: UpdateOptions): Promise<any>;

  async chunk(
    options: FindOptions & { chunkSize: number; callback: (rows: Model[], options: FindOptions) => Promise<void> },
  ) {
    const { chunkSize, callback, limit: overallLimit } = options;
    const transaction = await this.getTransaction(options);

    let offset = 0;
    let totalProcessed = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Calculate the limit for the current chunk
      const currentLimit = overallLimit !== undefined ? Math.min(chunkSize, overallLimit - totalProcessed) : chunkSize;

      const rows = await this.find({
        ...options,
        limit: currentLimit,
        offset,
        transaction,
      });

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

  convertTk(options: any) {
    let tk = options;
    if (typeof options === 'object' && 'tk' in options) {
      tk = options['tk'];
    }
    return tk;
  }

  convertTks(options: any) {
    let tk = this.convertTk(options);
    if (typeof tk === 'string') {
      tk = tk.split(',');
    }

    if (tk) {
      return lodash.castArray(tk);
    }

    return [];
  }

  targetKey() {
    return this.associationField.targetKey;
  }

  @transaction()
  async firstOrCreate(options: FirstOrCreateOptions) {
    const { filterKeys, values, transaction, hooks, context } = options;
    const filter = valuesToFilter(values, filterKeys);

    const instance = await this.findOne({ filter, transaction, context });

    if (instance) {
      return instance;
    }

    return this.create({ values, transaction, hooks, context });
  }

  @transaction()
  async updateOrCreate(options: FirstOrCreateOptions) {
    const { filterKeys, values, transaction, hooks, context } = options;
    const filter = valuesToFilter(values, filterKeys);

    const instance = await this.findOne({ filter, transaction, context });

    if (instance) {
      return await this.update({
        filterByTk: instance.get(
          this.targetCollection.filterTargetKey || this.targetCollection.model.primaryKeyAttribute,
        ),
        values,
        transaction,
        hooks,
        context,
      });
    }

    return this.create({ values, transaction, hooks, context });
  }

  @transaction()
  async create(options?: CreateOptions): Promise<any> {
    if (Array.isArray(options.values)) {
      return Promise.all(options.values.map((record) => this.create({ ...options, values: record })));
    }

    const createAccessor = this.accessors().create;

    const guard = UpdateGuard.fromOptions(this.targetModel, options);
    const values = options.values;
    const transaction = await this.getTransaction(options);

    const sourceModel = await this.getSourceModel(transaction);

    const instance = await sourceModel[createAccessor](guard.sanitize(options.values), { ...options, transaction });

    await updateAssociations(instance, values, { ...options, transaction });

    if (options.hooks !== false) {
      await this.db.emitAsync(`${this.targetCollection.name}.afterCreateWithAssociations`, instance, {
        ...options,
        transaction,
      });
      const eventName = `${this.targetCollection.name}.afterSaveWithAssociations`;
      await this.db.emitAsync(eventName, instance, { ...options, transaction });
    }

    return instance;
  }

  async getSourceModel(transaction?: Transaction) {
    if (!this.sourceInstance) {
      this.sourceInstance = this.isMultiTargetKey()
        ? await this.sourceCollection.repository.findOne({
            filter: {
              // @ts-ignore
              ...this.sourceKeyValue,
            },
            transaction,
          })
        : await this.sourceCollection.model.findOne({
            where: {
              [this.associationField.sourceKey]: this.sourceKeyValue,
            },
            transaction,
          });
    }

    return this.sourceInstance;
  }

  public accessors() {
    return (<BelongsTo | HasOne | HasMany | BelongsToMany>this.association).accessors;
  }

  protected buildQueryOptions(options: FindOptions) {
    const parser = new OptionsParser(options, {
      collection: this.targetCollection,
      targetKey: this.targetKey(),
    });
    const params = parser.toSequelizeParams();
    return { ...options, ...params };
  }

  protected parseFilter(filter: Filter, options?: any) {
    const parser = new FilterParser(filter, {
      collection: this.targetCollection,
      app: {
        ctx: options?.context,
      },
    });
    return parser.toSequelizeParams();
  }

  protected async getTransaction(options: any, autoGen = false): Promise<Transaction | null> {
    if (lodash.isPlainObject(options) && options.transaction) {
      return options.transaction;
    }

    if (autoGen) {
      return await this.sourceCollection.model.sequelize.transaction();
    }

    return null;
  }
}

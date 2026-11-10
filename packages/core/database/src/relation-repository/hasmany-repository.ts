/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { castArray, isPlainObject, omit, pick } from 'lodash';
import { HasMany, Op, WhereOptions } from 'sequelize';
import { AggregateOptions, DestroyOptions, FindOptions, TargetKey, TK } from '../repository';
import { MultipleRelationRepository } from './multiple-relation-repository';
import { transaction } from './relation-repository';
import { AssociatedOptions } from './types';

export class HasManyRepository extends MultipleRelationRepository {
  async find(options?: FindOptions): Promise<any> {
    const targetRepository = this.targetCollection.repository;

    const targetFilterOptions = await this.targetRepositoryFilterOptionsBySourceValue();

    const findOptionsOmit = ['where', 'values', 'attributes'];

    if (options?.filterByTk && !this.isMultiTargetKey(options.filterByTk)) {
      // @ts-ignore
      targetFilterOptions[this.associationField.targetKey] = options.filterByTk;
      findOptionsOmit.push('filterByTk');
    }

    const findOptions = {
      ...omit(options, findOptionsOmit),
      filter: {
        $and: [options?.filter || {}, targetFilterOptions],
      },
    };

    return await targetRepository.find(findOptions);
  }

  async aggregate(options: AggregateOptions) {
    const targetRepository = this.targetCollection.repository;

    const aggOptions = {
      ...options,
      filter: {
        $and: [options.filter || {}, await this.targetRepositoryFilterOptionsBySourceValue()],
      },
    };

    return await targetRepository.aggregate(aggOptions);
  }

  async destroy(options?: TK | DestroyOptions): Promise<boolean> {
    if (!isPlainObject(options)) return this.destroyMatching({ filterByTk: options as TK });
    const params = options as DestroyOptions;
    if ('filterByTk' in params || 'filter' in params) return this.destroyMatching(params);
    // A bare object is a key, possibly accompanied by a transaction. Never turn an unknown key into
    // an unfiltered delete. destroy() without arguments still clears the source's association.
    const key = omit(params, ['transaction', 'context', 'hooks', 'individualHooks', 'force', 'truncate']);
    if (Object.keys(key).length || !Object.keys(params).length) {
      return this.destroyMatching({
        transaction: params.transaction,
        filterByTk: key as Record<string, string | number>,
      });
    }
    return this.destroyMatching(params);
  }

  private matchTargetKeys(names: string[], value: unknown): Record<string, string | number>[] {
    const isScalar = (v: unknown): v is string | number => typeof v === 'string' || typeof v === 'number';
    return (Array.isArray(value) ? value : [value]).map((key: unknown) => {
      if (names.length === 1 && names[0] && isScalar(key)) return { [names[0]]: key };
      if (
        isPlainObject(key) &&
        names.length &&
        Object.keys(key as object).length === names.length &&
        names.every((name) => name && Object.prototype.hasOwnProperty.call(key, name) && isScalar(key[name]))
      ) {
        return Object.fromEntries(names.map((name) => [name, key[name]]));
      }
      throw Object.assign(new Error('Invalid filterByTk for ' + this.targetCollection.name), { status: 400 });
    });
  }

  @transaction()
  private async destroyMatching(options: DestroyOptions): Promise<boolean> {
    const transaction = await this.getTransaction(options);
    const sourceModel = await this.getSourceModel(transaction);
    const association = this.association as HasMany & { sourceKey: string };
    const sourceWhere = {
      [association.foreignKey]: sourceModel.get(association.sourceKey),
    };
    const where: WhereOptions[] = [sourceWhere];
    const { filter, filterByTk } = options;
    const targetKeys: string[] = castArray(
      this.associationField.options.targetKey || this.targetCollection.filterTargetKey,
    );
    const keyConditions = filterByTk === undefined ? [] : this.matchTargetKeys(targetKeys, filterByTk);
    const singleKey = targetKeys.length === 1 ? targetKeys[0] : undefined;
    const keyValues = singleKey && keyConditions.map((row) => row[singleKey]);
    if (filterByTk !== undefined) {
      if (!keyConditions.length) return true;
      where.push(singleKey ? { [singleKey]: keyValues } : { [Op.or]: keyConditions });
    }

    if (filter) {
      const parsed = this.parseFilter(filter, options);
      if (parsed.include?.length) {
        const keys = this.targetModel.primaryKeyAttributes.length
          ? [...this.targetModel.primaryKeyAttributes]
          : targetKeys;
        if (!keys.length || !keys.every(Boolean))
          throw new Error('Missing target key for ' + this.targetCollection.name);
        const rows = await this.targetCollection.repository.find({
          fields: keys,
          filter: {
            $and: [
              sourceWhere,
              filter,
              ...(keyConditions.length
                ? [singleKey ? { [singleKey]: { $in: keyValues } } : { $or: keyConditions }]
                : []),
            ],
          },
          transaction,
        });
        if (!rows.length) return true;
        where.push({ [Op.or]: rows.map((row) => pick(row.get(), keys)) });
      } else {
        where.push(parsed.where);
      }
    }

    await this.targetModel.destroy({
      where: {
        [Op.and]: where,
      },
      individualHooks: true,
      transaction,
    });

    return true;
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async set(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void> {
    const transaction = await this.getTransaction(options);

    const sourceModel = await this.getSourceModel(transaction);

    await sourceModel[this.accessors().set](this.convertTks(options), {
      transaction,
    });
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async add(options: TargetKey | TargetKey[] | AssociatedOptions): Promise<void> {
    const transaction = await this.getTransaction(options);
    const sourceModel = await this.getSourceModel(transaction);

    await sourceModel[this.accessors().add](this.convertTks(options), {
      transaction,
    });
  }

  /**
   * @internal
   */
  accessors() {
    return (<HasMany>this.association).accessors;
  }
}

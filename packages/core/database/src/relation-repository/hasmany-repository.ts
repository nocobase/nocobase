/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { omit } from 'lodash';
import { HasMany, Op } from 'sequelize';
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

  @transaction((args, transaction) => {
    return {
      filterByTk: args[0],
      transaction,
    };
  })
  async destroy(options?: TK | DestroyOptions): Promise<boolean> {
    const transaction = await this.getTransaction(options);

    const sourceModel = await this.getSourceModel(transaction);

    const where = [
      {
        [this.association.foreignKey]: sourceModel.get((this.association as any).sourceKey),
      },
    ];

    if (options && options['filter']) {
      const filterResult = this.parseFilter(options['filter'], options);

      if (filterResult.include && filterResult.include.length > 0) {
        return await this.destroyByFilter(
          {
            filter: options['filter'],
            filterByTk: options['filterByTk'],
          },
          transaction,
        );
      }

      where.push(filterResult.where);
    }

    if (options && options['filterByTk']) {
      if (typeof options === 'object' && options['filterByTk']) {
        options = options['filterByTk'];
      }

      where.push({
        [this.targetKey()]: options,
      });
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

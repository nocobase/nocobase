/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SingleAssociationAccessors, Transactionable } from 'sequelize';
import injectTargetCollection from '../decorators/target-collection-decorator';
import { Model } from '../model';
import { FindOptions, TargetKey, UpdateOptions } from './types';
import { updateModelByValues } from '../update-associations';
import { RelationRepository, transaction } from './relation-repository';

interface SetOption extends Transactionable {
  tk?: TargetKey;
}

export abstract class SingleRelationRepository extends RelationRepository {
  abstract filterOptions(sourceModel);

  @transaction()
  async remove(options?: Transactionable): Promise<void> {
    const transaction = await this.getTransaction(options);
    const sourceModel = await this.getSourceModel(transaction);
    return await sourceModel[this.accessors().set](null, {
      transaction,
    });
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async set(options: TargetKey | SetOption): Promise<void> {
    const transaction = await this.getTransaction(options);

    const sourceModel = await this.getSourceModel(transaction);

    return await sourceModel[this.accessors().set](this.convertTk(options), {
      transaction,
    });
  }

  async find(options?: FindOptions): Promise<any> {
    const targetRepository = this.targetCollection.repository;

    const sourceModel = await this.getSourceModel(await this.getTransaction(options));

    if (!sourceModel) return null;

    const addFilter = await this.filterOptions(sourceModel);

    const findOptions = {
      ...options,
      filter: {
        $and: [options?.filter || {}, addFilter],
      },
    };

    return await targetRepository.findOne(findOptions);
  }

  async findOne(options?: FindOptions): Promise<Model<any>> {
    return this.find({ ...options, filterByTk: null } as any);
  }

  @transaction()
  async destroy(options?: Transactionable): Promise<boolean> {
    const transaction = await this.getTransaction(options);

    const target = await this.find({
      transaction,
    });

    await target.destroy({
      transaction,
    });

    return true;
  }

  @transaction()
  @injectTargetCollection
  async update(options: UpdateOptions): Promise<any> {
    const transaction = await this.getTransaction(options);

    const target = await this.find({
      transaction,
      // @ts-ignore
      targetCollection: options.targetCollection,
    });

    if (!target) {
      throw new Error('The record does not exist');
    }

    await updateModelByValues(target, options?.values, {
      ...options,
      transaction,
    });

    if (options.hooks !== false) {
      await this.db.emitAsync(`${this.targetCollection.name}.afterUpdateWithAssociations`, target, {
        ...options,
        transaction,
      });
      const eventName = `${this.targetCollection.name}.afterSaveWithAssociations`;
      await this.db.emitAsync(eventName, target, { ...options, transaction });
    }

    return target;
  }

  /**
   * @internal
   */
  accessors() {
    return <SingleAssociationAccessors>super.accessors();
  }
}

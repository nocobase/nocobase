/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { BelongsToMany, Op, Transaction } from 'sequelize';
import { AggregateOptions, CreateOptions, DestroyOptions, TargetKey } from '../repository';
import { updateAssociations, updateThroughTableValue } from '../update-associations';
import { MultipleRelationRepository } from './multiple-relation-repository';
import { transaction } from './relation-repository';

import { AssociatedOptions, PrimaryKeyWithThroughValues } from './types';

type CreateBelongsToManyOptions = CreateOptions;

export class BelongsToManyRepository extends MultipleRelationRepository {
  async aggregate(options: AggregateOptions) {
    const targetRepository = this.targetCollection.repository;

    const sourceModel = await this.getSourceModel(await this.getTransaction(options));

    const association = this.association as any;

    return await targetRepository.aggregate({
      ...options,
      optionsTransformer: (modelOptions) => {
        modelOptions.include = modelOptions.include || [];
        const throughWhere = {};
        throughWhere[association.foreignKey] = sourceModel.get(association.sourceKey);

        modelOptions.include.push({
          association: association.oneFromTarget,
          required: true,
          attributes: [],
          where: throughWhere,
        });
      },
    });
  }

  @transaction()
  async create(options?: CreateBelongsToManyOptions): Promise<any> {
    if (Array.isArray(options.values)) {
      return Promise.all(options.values.map((record) => this.create({ ...options, values: record })));
    }

    const transaction = await this.getTransaction(options);

    const createAccessor = this.accessors().create;

    const values = options.values || {};

    const sourceModel = await this.getSourceModel(transaction);

    const createOptions = {
      ...options,
      through: values[this.throughName()],
      transaction,
    };

    this.collection.validate(values);
    const instance = await sourceModel[createAccessor](values, createOptions);
    await updateAssociations(instance, values, { ...options, transaction });
    return instance;
  }

  @transaction((args, transaction) => {
    return {
      filterByTk: args[0],
      transaction,
    };
  })
  async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<boolean> {
    const transaction = await this.getTransaction(options);
    const association = <BelongsToMany>this.association;

    const throughModel = this.throughModel();

    const instancesToIds = (instances) => {
      return instances.map((instance) => instance.get(this.targetKey()));
    };

    // Through Table
    const throughTableWhere: Array<any> = [
      {
        [throughModel.rawAttributes[association.foreignKey].field]: this.sourceKeyValue,
      },
    ];

    let ids;

    if (options && options['filter']) {
      const instances = await this.find({
        filter: options['filter'],
        transaction,
      });

      ids = instancesToIds(instances);
    }

    if (options && options['filterByTk']) {
      const instances = (<any>this.association).toInstanceArray(options['filterByTk']);
      ids = ids ? lodash.intersection(ids, instancesToIds(instances)) : instancesToIds(instances);
    }

    if (options && !options['filterByTk'] && !options['filter']) {
      const sourceModel = await this.getSourceModel(transaction);

      const instances = await sourceModel[this.accessors().get]({
        transaction,
      });

      ids = instancesToIds(instances);
    }

    throughTableWhere.push({
      [throughModel.rawAttributes[association.otherKey].field]: {
        [Op.in]: ids,
      },
    });

    // delete through table data
    await this.throughModel().destroy({
      where: throughTableWhere,
      transaction,
    });

    await this.targetModel.destroy({
      where: {
        [this.targetKey()]: {
          [Op.in]: ids,
        },
      },
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
  async add(
    options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void> {
    await this.setTargets('add', options);
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async set(
    options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void> {
    await this.setTargets('set', options);
  }

  @transaction((args, transaction) => {
    return {
      tk: args[0],
      transaction,
    };
  })
  async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void> {
    const transaction = await this.getTransaction(options);
    const sourceModel = await this.getSourceModel(transaction);

    const has = await sourceModel[this.accessors().hasSingle](options['tk'], {
      transaction,
    });

    if (has) {
      await this.remove({
        ...(<any>options),
        transaction,
      });
    } else {
      await this.add({
        ...(<any>options),
        transaction,
      });
    }

    return;
  }

  throughName() {
    return this.throughModel().name;
  }

  throughModel() {
    return (<any>this.association).through.model;
  }

  protected async setTargets(
    call: 'add' | 'set',
    options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ) {
    const handleKeys: TargetKey[] | PrimaryKeyWithThroughValues[] = this.convertTks(options) as any;

    const transaction = await this.getTransaction(options, false);

    const sourceModel = await this.getSourceModel(transaction);

    const setObj = (<any>handleKeys).reduce((carry, item) => {
      if (Array.isArray(item)) {
        carry[item[0]] = item[1];
      } else {
        carry[item] = true;
      }
      return carry;
    }, {});

    const targetKeys = Object.keys(setObj);
    const association = this.association;

    const targetObjects = await this.targetModel.findAll({
      where: {
        [association['targetKey']]: targetKeys,
      },
      transaction,
    });

    await sourceModel[this.accessors()[call]](targetObjects, {
      transaction,
    });

    for (const [id, throughValues] of Object.entries(setObj)) {
      if (typeof throughValues === 'object') {
        const instance = await this.targetModel.findByPk(id, {
          transaction,
        });
        await updateThroughTableValue(instance, this.throughName(), throughValues, sourceModel, transaction);
      }
    }
  }
}

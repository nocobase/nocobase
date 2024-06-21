/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { omit } from 'lodash';
import { Transactionable } from 'sequelize/types';
import { Collection } from '../collection';
import { transactionWrapperBuilder } from '../decorators/transaction-decorator';
import { FindOptions } from '../repository';
import { MultipleRelationRepository } from './multiple-relation-repository';
import Database from '../database';
import { Model } from '../model';

const transaction = transactionWrapperBuilder(function () {
  return this.collection.model.sequelize.transaction();
});

export class BelongsToArrayAssociation {
  db: Database;
  associationType: string;
  source: Model;
  foreignKey: string;
  targetName: string;
  targetKey: string;
  identifierField: string;
  as: string;

  constructor(options: {
    db: Database;
    source: Model;
    as: string;
    foreignKey: string;
    target: string;
    targetKey: string;
  }) {
    const { db, source, as, foreignKey, target, targetKey } = options;
    this.associationType = 'BelongsToArray';
    this.db = db;
    this.source = source;
    this.foreignKey = foreignKey;
    this.targetName = target;
    this.targetKey = targetKey;
    this.identifierField = 'undefined';
    this.as = as;
  }

  get target() {
    return this.db.getModel(this.targetName);
  }
}

export class BelongsToArrayRepository extends MultipleRelationRepository {
  private belongsToArrayAssociation: BelongsToArrayAssociation;

  constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number) {
    super(sourceCollection, association, sourceKeyValue);

    this.belongsToArrayAssociation = this.association as any as BelongsToArrayAssociation;
  }

  protected getInstance(options: Transactionable) {
    return this.sourceCollection.repository.findOne({
      filterByTk: this.sourceKeyValue,
    });
  }

  @transaction()
  async find(options?: FindOptions): Promise<any> {
    const targetRepository = this.targetCollection.repository;
    const instance = await this.getInstance(options);
    const tks = instance.get(this.belongsToArrayAssociation.foreignKey);
    const targetKey = this.belongsToArrayAssociation.targetKey;

    const addFilter = {
      [targetKey]: tks,
    };

    const findOptions = {
      ...omit(options, ['where', 'values', 'attributes']),
      filter: {
        $and: [options.filter || {}, addFilter],
      },
    };

    return await targetRepository.find(findOptions);
  }
}

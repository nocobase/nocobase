/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { omit } from 'lodash';
import { CreateOptions, Transactionable } from 'sequelize/types';
import { Collection } from '../collection';
import { transactionWrapperBuilder } from '../decorators/transaction-decorator';
import { FindOptions } from '../repository';
import { MultipleRelationRepository } from './multiple-relation-repository';
import Database from '../database';
import { Model } from '../model';

const transaction = transactionWrapperBuilder(function () {
  return this.collection.model.sequelize.transaction();
});

export class RecordSetAssociation {
  db: Database;
  associationType: string;
  source: Model;
  sourceKey: string;
  targetName: string;
  targetKey: string;
  identifierField: string;
  as: string;

  constructor(options: { db: Database; source: Model; sourceKey: string; target: string; targetKey: string }) {
    const { db, source, sourceKey, target, targetKey } = options;
    this.associationType = 'RecordSet';
    this.db = db;
    this.source = source;
    this.sourceKey = sourceKey;
    this.targetName = target;
    this.targetKey = targetKey;
    this.identifierField = 'test';
    this.as = sourceKey;
  }

  get target() {
    return this.db.getModel(this.targetName);
  }
}

export class RecordSetRepository extends MultipleRelationRepository {
  private recordSetAssociation: RecordSetAssociation;

  constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number) {
    super(sourceCollection, association, sourceKeyValue);

    this.recordSetAssociation = this.association as any as RecordSetAssociation;
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
    const tks = instance.get(this.associationName);
    const targetKey = this.recordSetAssociation.targetKey;

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

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FindOptions, Model, Collection, RelationRepository, Transaction, Field } from '@nocobase/database';

export class JSONRepository extends RelationRepository {
  fieldName: string;
  field: Field;

  constructor(collection: Collection, fieldName: string, index: number) {
    super(collection, fieldName, index);
    this.fieldName = fieldName;
    this.field = collection.getField(fieldName);
  }

  async getSourceModel(transaction?: Transaction) {
    if (!this.sourceInstance) {
      this.sourceInstance = await this.sourceCollection.repository.findOne({
        filterByTk: this.sourceKeyValue,
        transaction,
      });
    }

    return this.sourceInstance;
  }

  async find(options?: FindOptions): Promise<any> {
    const { filterByTk } = options;
    const sourceModel = await this.getSourceModel(await this.getTransaction(options));
    if (!sourceModel) {
      return null;
    }

    const document = sourceModel.get(this.fieldName);
    if (!document) {
      return null;
    }

    const targetKey = this.field?.options.targetKey || '__json_index';
    if (Array.isArray(document)) {
      return document.find((item) => item[targetKey] == filterByTk);
    }
    return document;
  }

  async findOne(options?: FindOptions): Promise<Model<any>> {
    return this.find(options);
  }
}

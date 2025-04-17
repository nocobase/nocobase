/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { Transactionable } from 'sequelize/types';
import { Collection } from '../collection';
import { transactionWrapperBuilder } from '../decorators/transaction-decorator';
import { ArrayField } from '../fields';

const transaction = transactionWrapperBuilder(function () {
  return this.collection.model.sequelize.transaction();
});

export class ArrayFieldRepository {
  constructor(
    protected collection: Collection,
    protected fieldName: string,
    protected targetValue: string | number,
  ) {
    const field = collection.getField(fieldName);
    if (!(field instanceof ArrayField)) {
      throw new Error('Field must be of type Array');
    }
  }

  @transaction()
  async get(options?: Transactionable) {
    const instance = await this.getInstance(options);
    return instance.get(this.fieldName);
  }

  @transaction()
  async find(options?: Transactionable) {
    return await this.get(options);
  }

  @transaction((args, transaction) => {
    return {
      values: args[0],
      transaction,
    };
  })
  async set(
    options: Transactionable & {
      values: Array<string | number> | string | number;
      hooks?: boolean;
    },
  ) {
    const { transaction } = options;

    const instance = await this.getInstance({
      transaction,
    });

    instance.set(this.fieldName, lodash.castArray(options.values));

    await instance.save({ transaction });

    if (options.hooks !== false) {
      await this.emitAfterSave(instance, options);
    }
  }

  protected async emitAfterSave(instance, options) {
    await this.collection.db.emitAsync(`${this.collection.name}.afterSaveWithAssociations`, instance, {
      ...options,
    });
    instance.clearChangedWithAssociations();
  }

  @transaction((args, transaction) => {
    return {
      value: args[0],
      transaction,
    };
  })
  async toggle(
    options: Transactionable & {
      value: string | number;
      hooks?: boolean;
    },
  ) {
    const { transaction } = options;

    const instance = await this.getInstance({
      transaction,
    });

    const isMSSQL = instance.db.options.dialect === 'mssql';
    const oldValue = isMSSQL
      ? this.parseJSONSafely(instance.get(this.fieldName) || [])
      : instance.get(this.fieldName || []);

    instance.get(this.fieldName) || [];
    const newValue = oldValue.includes(options.value)
      ? lodash.without(oldValue, options.value)
      : [...oldValue, options.value];
    instance.set(this.fieldName, isMSSQL ? this.stringifyJSONSafely(newValue) : newValue);
    await instance.save({ transaction });

    if (options.hooks !== false) {
      await this.emitAfterSave(instance, options);
    }
  }

  @transaction((args, transaction) => {
    return {
      values: args[0],
      transaction,
    };
  })
  async add(
    options: Transactionable & {
      values: Array<string | number> | string | number;
      hooks?: boolean;
    },
  ) {
    const { transaction } = options;

    const instance = await this.getInstance({
      transaction,
    });

    const oldValue = instance.get(this.fieldName) || [];

    const newValue = [...oldValue, ...lodash.castArray(options.values)];
    instance.set(this.fieldName, newValue);
    await instance.save({ transaction });

    if (options.hooks !== false) {
      await this.emitAfterSave(instance, options);
    }
  }

  @transaction((args, transaction) => {
    return {
      values: args[0],
      transaction,
    };
  })
  async remove(
    options: Transactionable & {
      values: Array<string | number> | string | number;
      hooks?: boolean;
    },
  ) {
    const { transaction } = options;

    const instance = await this.getInstance({
      transaction,
    });

    const oldValue = instance.get(this.fieldName) || [];
    const isMSSQL = instance.db.options.dialect === 'mssql';

    const currentValues = isMSSQL ? this.parseJSONSafely(oldValue) : oldValue || [];
    const valuesToRemove = isMSSQL ? this.parseJSONSafely(options.values) : options.values;

    const updatedValues = lodash.without(currentValues, ...lodash.castArray(valuesToRemove));

    const finalValue = isMSSQL ? this.stringifyJSONSafely(updatedValues) : updatedValues;
    instance.set(this.fieldName, finalValue);
    await instance.save({ transaction });

    if (options.hooks !== false) {
      await this.emitAfterSave(instance, options);
    }
  }

  protected getInstance(options: Transactionable) {
    return this.collection.repository.findOne({
      filterByTk: this.targetValue,
    });
  }

  private parseJSONSafely(value: any): any {
    return typeof value === 'string' ? JSON.parse(value) : value;
  }

  private stringifyJSONSafely(value: any): any {
    return Array.isArray(value) ? JSON.stringify(value) : value;
  }
}

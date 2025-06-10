/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseFieldOptions, DataTypes, Field } from '@nocobase/database';
import { evaluators } from '@nocobase/evaluators';
import { toDbType } from '../utils';

export interface FormulaFieldOptions extends BaseFieldOptions {
  type: 'formula';
  engine: string;
  expression: string;
}

const DataTypeMap = {
  boolean: DataTypes.BOOLEAN,
  integer: DataTypes.INTEGER,
  bigInt: DataTypes.BIGINT,
  double: DataTypes.DOUBLE,
  decimal: DataTypes.DECIMAL,
  string: DataTypes.STRING,
  date: DataTypes.DATE(3),
};

export class FormulaField extends Field {
  get dataType() {
    const { dataType } = this.options;
    return DataTypeMap[dataType] ?? DataTypes.DOUBLE;
  }

  calculate(scope) {
    const { expression, engine = 'math.js', dataType = 'double' } = this.options;
    const evaluate = evaluators.get(engine);
    try {
      const result = evaluate(expression, scope);
      return toDbType(result, dataType);
    } catch (e) {
      console.error(e);
    }
    return null;
  }

  initFieldData = async ({ transaction }) => {
    const { name } = this.options;

    const records = await this.collection.repository.find({
      order: [this.collection.model.primaryKeyAttribute],
      transaction,
    });

    for (const record of records) {
      const scope = record.toJSON();
      const result = this.calculate(scope);
      if (result != null) {
        await record.update(
          {
            [name]: result,
          },
          {
            transaction,
            silent: true,
            hooks: false,
          },
        );
      }
    }
  };

  calculateField = async (instances) => {
    instances = Array.isArray(instances) ? instances : [instances];
    const { name } = this.options;
    for (const instance of instances) {
      const result = this.calculate(instance.toJSON());
      instance.set(name, result);
    }
  };

  updateFieldData = async (instance, { transaction }) => {
    if (this.collection.name !== instance.collectionName || instance.name !== this.options.name) {
      return;
    }

    this.options = Object.assign(this.options, instance.options);
    const { name } = this.options;

    const records = await this.collection.repository.find({
      order: [this.collection.model.primaryKeyAttribute],
      transaction,
    });

    for (const record of records) {
      const scope = record.toJSON();
      const result = this.calculate(scope);
      await record.update(
        {
          [name]: result,
        },
        {
          transaction,
          silent: true,
          hooks: false,
        },
      );
    }
  };

  bind() {
    super.bind();
    // this.on('afterSync', this.initFieldData);
    // TODO: should not depends on fields table (which is defined by other plugin)
    this.database.on('fields.afterUpdate', this.updateFieldData);
    this.on('beforeSave', this.calculateField);
    this.on('beforeBulkCreate', this.calculateField);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.calculateField);
    this.off('beforeBulkCreate', this.calculateField);
    // TODO: should not depends on fields table
    this.database.off('fields.afterUpdate', this.updateFieldData);
    // this.off('afterSync', this.initFieldData);
  }
}

import { DataTypes } from 'sequelize';

import { BaseFieldOptions, Field } from '@nocobase/database';
import evaluators from '@nocobase/evaluators';

export interface FormulaFieldOptions extends BaseFieldOptions {
  type: 'formula',
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
}

export class FormulaField extends Field {
  get dataType() {
    const { dataType } = this.options;
    return DataTypeMap[dataType] ?? DataTypes.DOUBLE;
  }

  calculate(scope) {
    const { expression, engine } = this.options;
    const evaluate = evaluators.get(engine);
    try {
      return evaluate(expression, scope);
    } catch (e){
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
      if (result) {
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

  calculateField = async (instance) => {
    const { name } = this.options;
    const result = this.calculate(instance.toJSON());
    if (result === 0 || result) {
      instance.set(name, result);
    }
  };

  updateFieldData = async (instance, { transaction }) => {
    if (this.collection.name === instance.collectionName && instance.name === this.options.name) {
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
    }
  };

  bind() {
    super.bind();
    this.on('afterSync', this.initFieldData);
    // TODO: should not depends on fields table (which is defined by other plugin)
    this.database.on('fields.afterUpdate', this.updateFieldData);
    this.on('beforeSave', this.calculateField);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.calculateField);
    // TODO: should not depends on fields table
    this.database.off('fields.afterUpdate', this.updateFieldData);
    this.off('afterSync', this.initFieldData);
  }
}

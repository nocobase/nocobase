import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';
import * as math from 'mathjs';

export class FormulaField extends Field {
  get dataType() {
    return DataTypes.FLOAT;
  }

  caculate(expression, scope) {
    let result;
    try {
      result = math.evaluate(expression, scope);
      result = math.round(result, 9);
    } catch {}
    return result;
  }

  async initFieldData({ transaction }) {
    const { expression, name } = this.options;
    console.log('initFieldData', expression, name);

    const records = await this.collection.repository.find({
      order: [this.collection.model.primaryKeyAttribute],
      transaction,
    });

    for (const record of records) {
      const scope = record.toJSON();
      const result = this.caculate(expression, scope);
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
  }

  async caculateField(instance) {
    const { expression, name } = this.options;
    const scope = instance.toJSON();
    let result;
    try {
      result = math.evaluate(expression, scope);
      result = math.round(result, 9);
    } catch {}
    if (result) {
      instance.set(name, result);
    }
  }

  bind() {
    super.bind();
    this.on('afterSync', this.initFieldData.bind(this));
    this.on('beforeCreate', this.caculateField.bind(this));
    this.on('beforeUpdate', this.caculateField.bind(this));
  }

  unbind() {
    super.unbind();
    this.off('beforeCreate', this.caculateField.bind(this));
    this.off('beforeUpdate', this.caculateField.bind(this));
    this.off('afterSync', this.initFieldData.bind(this));
  }
}

export interface FormulaFieldOptions extends BaseColumnFieldOptions {
  type: 'formula';

  expression: string;
}
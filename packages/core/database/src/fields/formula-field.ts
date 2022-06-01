import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class FormulaField extends Field {
  get dataType() {
    return DataTypes.FLOAT;
  }

  async initFieldData(model, options) {
    console.log('initFieldData-----', model, options);
    const { expression } = options;

  }

  async caculateField(model, options) {
    console.log('caculateField', model, options);
  }

  init() {
    const { name } = this.options;
    console.log('init', this.options);
    this.listener = async (model, opt) => {
      console.log('listner', model, opt);
      if (!model.changed(name as any)) {
        return;
      }
      // const value = model.get(name) as string;
      // if (value) {
      //   const hash = await this.hash(value);
      //   model.set(name, hash);
      // } else {
      //   model.set(name, null);
      // }
    };
  }

  bind() {
    super.bind();
    this.on('afterSync', this.initFieldData.bind(this));
    this.on('beforeCreate', this.caculateField);
    this.on('beforeUpdate', this.caculateField);
  }

  unbind() {
    super.unbind();
    this.off('beforeCreate', this.caculateField);
    this.off('beforeUpdate', this.caculateField);
    this.off('afterSync', this.initFieldData.bind(this));
  }
}

export interface FormulaFieldOptions extends BaseColumnFieldOptions {
  type: 'float';

  expression: string;
}
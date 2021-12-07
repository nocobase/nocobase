import { lodash } from '@umijs/utils';
import { DataTypes, Model } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class ContextField extends Field {
  get dataType() {
    const type: string = this.options.dataType || 'string';
    return DataTypes[type.toUpperCase()] || DataTypes.STRING;
  }

  init() {
    const { name, dataIndex } = this.options;
    this.listener = async (model: Model, options) => {
      const { context } = options;
      model.set(name, lodash.get(context, dataIndex));
      model.changed(name, true);
    };
  }

  bind() {
    super.bind();
    const { createOnly } = this.options;
    this.on('beforeCreate', this.listener);
    if (!createOnly) {
      this.on('beforeUpdate', this.listener);
    }
  }

  unbind() {
    super.unbind();
    const { createOnly } = this.options;
    this.off('beforeCreate', this.listener);
    if (!createOnly) {
      this.off('beforeUpdate', this.listener);
    }
  }
}

export interface ContextFieldOptions extends BaseColumnFieldOptions {
  type: 'context';
  dataIndex: string;
  dataType?: string;
  createOnly?: boolean;
}

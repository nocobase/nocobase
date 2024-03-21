import { uid } from '@nocobase/utils';
import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class UidField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  init() {
    const { name, prefix = '', pattern } = this.options;
    const re = new RegExp(pattern || '^[A-Za-z0-9_][A-Za-z0-9_-]*$');
    this.listener = async (instance) => {
      const value = instance.get(name);
      if (!value) {
        instance.set(name, `${prefix}${uid()}`);
      } else if (re.test(value)) {
        instance.set(name, value);
      } else {
        throw new Error(
          `${this.collection.name}.${this.options.name} can only include A-Z, a-z, 0-9, _-*$, '${value}' is invalid`,
        );
      }
    };
  }

  bind() {
    super.bind();
    this.on('beforeCreate', this.listener);
    this.on('beforeUpdate', this.listener);
  }

  unbind() {
    super.unbind();
    this.off('beforeCreate', this.listener);
    this.off('beforeUpdate', this.listener);
  }
}

export interface UidFieldOptions extends BaseColumnFieldOptions {
  type: 'uid';
  prefix?: string;
  pattern?: string;
}

import { uid } from '@nocobase/utils';
import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class UidField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }

  init() {
    const { name, prefix = '' } = this.options;
    const { model } = this.context.collection;
    model.beforeCreate(async (instance) => {
      if (!instance.get(name)) {
        instance.set(name, `${prefix}${uid()}`);
      }
    });
  }
}

export interface UidFieldOptions extends BaseColumnFieldOptions {
  type: 'uid';
  prefix?: string;
}

import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class StringField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }
}

export interface StringFieldOptions extends BaseColumnFieldOptions {
  type: 'string';
}

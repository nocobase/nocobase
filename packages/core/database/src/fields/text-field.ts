import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class TextField extends Field {
  get dataType() {
    return DataTypes.TEXT;
  }
}

export interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
}

import { DataTypes } from 'sequelize';
import { BaseFieldOptions, Field } from './field';

export class TextField extends Field {
  get dataType() {
    return DataTypes.TEXT;
  }
}

export interface TextFieldOptions extends BaseFieldOptions {
  type: 'text';
}

import { DataTypes } from 'sequelize';
import { BaseFieldOptions, Field } from './field';

export class StringField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }
}

export interface StringFieldOptions extends BaseFieldOptions {
  type: 'string';
}

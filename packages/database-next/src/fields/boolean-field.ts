import { DataTypes } from 'sequelize';
import { BaseFieldOptions, Field } from './field';

export class BooleanField extends Field {
  get dataType() {
    return DataTypes.BOOLEAN;
  }
}

export interface BooleanFieldOptions extends BaseFieldOptions {
  type: 'boolean';
}

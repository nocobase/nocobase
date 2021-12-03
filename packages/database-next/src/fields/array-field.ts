import { BaseFieldOptions, Field } from './field';
import { DataTypes } from 'sequelize';

export class ArrayField extends Field {
  get dataType() {
    return DataTypes.JSON;
  }
}

export interface ArrayFieldOptions extends BaseFieldOptions {
  type: 'array';
}

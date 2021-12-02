import { DataTypes } from 'sequelize';
import { BaseFieldOptions, Field } from './field';

export class TimeField extends Field {
  get dataType() {
    return DataTypes.TIME;
  }
}

export interface TimeFieldOptions extends BaseFieldOptions {
  type: 'time';
}

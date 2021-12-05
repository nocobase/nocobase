import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class DateField extends Field {
  get dataType() {
    return DataTypes.DATE;
  }
}

export interface DateFieldOptions extends BaseColumnFieldOptions {
  type: 'date';
}

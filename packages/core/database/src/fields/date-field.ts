import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class DateField extends Field {
  get dataType() {
    return DataTypes.DATE(3);
  }
}

export interface DateFieldOptions extends BaseColumnFieldOptions {
  type: 'date';
}

import { DataTypes } from 'sequelize';
import { BaseFieldOptions, Field } from './field';

export class DateField extends Field {
  get dataType() {
    return DataTypes.DATE;
  }
}

export interface DateFieldOptions extends BaseFieldOptions {
  type: 'date';
}

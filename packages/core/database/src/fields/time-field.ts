import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';
import { transformTimeFieldDefaultValue } from './date-field';
export class TimeField extends Field {
  constructor(options: TimeFieldOptions, context: any) {
    transformTimeFieldDefaultValue(options, context);
    super(options, context);
  }

  get dataType() {
    return DataTypes.TIME;
  }
}

export interface TimeFieldOptions extends BaseColumnFieldOptions {
  type: 'time';
}

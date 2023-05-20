import { DataTypes } from 'sequelize';
import type { BaseColumnFieldOptions} from './field';
import { Field } from './field';

export class TimeField extends Field {
  get dataType() {
    return DataTypes.TIME;
  }
}

export interface TimeFieldOptions extends BaseColumnFieldOptions {
  type: 'time';
}

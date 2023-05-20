import { DataTypes } from 'sequelize';
import type { BaseColumnFieldOptions} from './field';
import { Field } from './field';

export class StringField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }
}

export interface StringFieldOptions extends BaseColumnFieldOptions {
  type: 'string';
}

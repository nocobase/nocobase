import { DataTypes } from 'sequelize';
import type { BaseColumnFieldOptions} from './field';
import { Field } from './field';

export class TextField extends Field {
  get dataType() {
    return DataTypes.TEXT;
  }
}

export interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
}

import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class FormulaField extends Field {
  get dataType() {
    return DataTypes.FLOAT;
  }
}

export interface FormulaFieldOptions extends BaseColumnFieldOptions {
  type: 'float';
}
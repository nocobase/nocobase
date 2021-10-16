import { DataTypes } from 'sequelize';
import { Field } from './field';

export class FloatField extends Field {
  get dataType() {
    return DataTypes.FLOAT;
  }
}

import { DataTypes } from 'sequelize';
import { Field } from './field';

export class TimeField extends Field {
  get dataType() {
    return DataTypes.TIME;
  }
}

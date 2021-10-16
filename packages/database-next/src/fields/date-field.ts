import { DataTypes } from 'sequelize';
import { Field } from './field';

export class DateField extends Field {
  get dataType() {
    return DataTypes.DATE;
  }
}

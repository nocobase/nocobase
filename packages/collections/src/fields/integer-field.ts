import { DataTypes } from 'sequelize';
import { Field } from './field';

export class IntegerField extends Field {
  get dataType() {
    return DataTypes.INTEGER;
  }
}

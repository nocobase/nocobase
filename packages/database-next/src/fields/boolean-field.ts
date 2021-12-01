import { DataTypes } from 'sequelize';
import { Field } from './field';

export class BooleanField extends Field {
  get dataType() {
    return DataTypes.BOOLEAN;
  }
}

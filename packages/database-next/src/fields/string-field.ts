import { DataTypes } from 'sequelize';
import { Field } from './field';

export class StringField extends Field {
  get dataType() {
    return DataTypes.STRING;
  }
}

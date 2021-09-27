import { DataTypes } from 'sequelize';
import { Field } from './field';

export class TextField extends Field {
  get dataType() {
    return DataTypes.TEXT;
  }
}

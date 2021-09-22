import { DataTypes } from 'sequelize';
import { SchemaField } from './schema-field';

export class TimeField extends SchemaField {
  get dataType() {
    return DataTypes.TIME;
  }
}

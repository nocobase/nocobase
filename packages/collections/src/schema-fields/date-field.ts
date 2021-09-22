import { DataTypes } from 'sequelize';
import { SchemaField } from './schema-field';

export class DateField extends SchemaField {
  get dataType() {
    return DataTypes.DATE;
  }
}

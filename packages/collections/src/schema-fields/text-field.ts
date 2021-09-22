import { DataTypes } from 'sequelize';
import { SchemaField } from './schema-field';

export class TextField extends SchemaField {
  get dataType() {
    return DataTypes.TEXT;
  }
}

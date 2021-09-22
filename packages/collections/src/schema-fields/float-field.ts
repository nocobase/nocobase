import { DataTypes } from 'sequelize';
import { SchemaField } from './schema-field';

export class FloatField extends SchemaField {
  get dataType() {
    return DataTypes.FLOAT;
  }
}

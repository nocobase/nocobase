import { DataTypes } from 'sequelize';
import { SchemaField } from './schema-field';

export class IntegerField extends SchemaField {
  get dataType() {
    return DataTypes.INTEGER;
  }
}

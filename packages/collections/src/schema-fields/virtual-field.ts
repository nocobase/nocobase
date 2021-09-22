import { DataTypes } from 'sequelize';
import { SchemaField } from './schema-field';

export class VirtualField extends SchemaField {
  get dataType() {
    return DataTypes.VIRTUAL;
  }
}

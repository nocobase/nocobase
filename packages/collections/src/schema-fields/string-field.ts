import { DataTypes } from 'sequelize';
import { SchemaField } from './schema-field';

export class StringField extends SchemaField {
  get dataType() {
    return DataTypes.STRING;
  }

  toSequelize() {
    return {
      ...this.options,
      type: this.dataType,
    };
  }
}

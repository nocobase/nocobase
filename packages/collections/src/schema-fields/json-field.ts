import { DataTypes } from 'sequelize';
import { SchemaField } from './schema-field';

export class JsonField extends SchemaField {
  get dataType() {
    return DataTypes.JSON;
  }
}

export class JsonbField extends SchemaField {
  get dataType() {
    const dialect = this.context.database.sequelize.getDialect();
    if (dialect === 'postgres') {
      return DataTypes.JSONB;
    }
    return DataTypes.JSON;
  }
}

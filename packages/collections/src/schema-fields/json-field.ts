import { DataTypes } from 'sequelize';
import { SchemaField } from './schema-field';

export class JsonField extends SchemaField {
  get dataType() {
    return DataTypes.JSON;
  }

  toSequelize() {
    return {
      ...this.options,
      type: this.dataType,
    };
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

  toSequelize() {
    return {
      ...this.options,
      type: this.dataType,
    };
  }
}

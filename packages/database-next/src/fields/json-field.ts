import { DataTypes } from 'sequelize';
import { BaseFieldOptions, Field } from './field';

export class JsonField extends Field {
  get dataType() {
    return DataTypes.JSON;
  }
}

export interface JsonFieldOptions extends BaseFieldOptions {
  type: 'json';
}

export class JsonbField extends Field {
  get dataType() {
    const dialect = this.context.database.sequelize.getDialect();
    if (dialect === 'postgres') {
      return DataTypes.JSONB;
    }
    return DataTypes.JSON;
  }
}
export interface JsonbFieldOptions extends BaseFieldOptions {
  type: 'jsonb';
}

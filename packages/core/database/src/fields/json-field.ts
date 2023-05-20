import { DataTypes } from 'sequelize';
import type { BaseColumnFieldOptions} from './field';
import { Field } from './field';

export class JsonField extends Field {
  get dataType() {
    return DataTypes.JSON;
  }
}

export interface JsonFieldOptions extends BaseColumnFieldOptions {
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

export interface JsonbFieldOptions extends BaseColumnFieldOptions {
  type: 'jsonb';
}

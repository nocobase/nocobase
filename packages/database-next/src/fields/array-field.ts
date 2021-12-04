import { BaseFieldOptions, Field } from './field';
import { DataTypes } from 'sequelize';

export class ArrayField extends Field {
  get dataType() {
    if (this.database.sequelize.getDialect() === 'postgres') {
      return DataTypes.JSONB;
    }

    return DataTypes.JSON;
  }
}

export interface ArrayFieldOptions extends BaseFieldOptions {
  type: 'array';
}

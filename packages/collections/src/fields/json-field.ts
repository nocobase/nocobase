import { DataTypes } from 'sequelize';
import { Field } from './field';

export class JsonField extends Field {
  get dataType() {
    return DataTypes.JSON;
  }
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

import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class TextField extends Field {
  get dataType() {
    if (this.database.inDialect('mysql', 'mariadb') && this.options.length) {
      return DataTypes.TEXT(this.options.length);
    }
    return DataTypes.TEXT;
  }

  init() {
    if (this.database.inDialect('mysql', 'mariadb')) {
      this.options.defaultValue = null;
    }
  }
}

export interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';
}

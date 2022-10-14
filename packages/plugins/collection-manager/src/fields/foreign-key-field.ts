import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from '@nocobase/database';

export class ForeignKeyField extends Field {
  constructor(options: ForeignKeyFieldOptions, context) {
    super(options, context);
  }

  get dataType() {
    return DataTypes.INTEGER;
  }
}

export interface ForeignKeyFieldOptions extends BaseColumnFieldOptions {
  type: 'foreignKey';
}

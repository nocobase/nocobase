import { Field, BaseColumnFieldOptions } from '@nocobase/database';
import { DataTypes } from 'sequelize';

export class SnapshotField extends Field {
  get dataType() {
    return DataTypes.JSON;
  }
}

export interface SnapshotFieldOptions extends BaseColumnFieldOptions {
  type: 'snapshot';
}

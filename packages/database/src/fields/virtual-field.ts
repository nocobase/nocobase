import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

export class VirtualField extends Field {
  get dataType() {
    return DataTypes.VIRTUAL;
  }
}

export interface VirtualFieldOptions extends BaseColumnFieldOptions {
  type: 'virtual';
}

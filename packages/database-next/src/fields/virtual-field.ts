import { DataTypes } from 'sequelize';
import { BaseFieldOptions, Field } from './field';

export class VirtualField extends Field {
  get dataType() {
    return DataTypes.VIRTUAL;
  }
}

export interface VirtualFieldOptions extends BaseFieldOptions {
  type: 'virtual';
}

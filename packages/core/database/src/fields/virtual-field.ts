import { DataTypes } from 'sequelize';
import type { BaseColumnFieldOptions} from './field';
import { Field } from './field';

export class VirtualField extends Field {
  get dataType() {
    return DataTypes.VIRTUAL;
  }
}

export interface VirtualFieldOptions extends BaseColumnFieldOptions {
  type: 'virtual';
}

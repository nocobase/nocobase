import { DataTypes } from 'sequelize';
import { Field } from './field';

export class VirtualField extends Field {
  get dataType() {
    return DataTypes.VIRTUAL;
  }
}

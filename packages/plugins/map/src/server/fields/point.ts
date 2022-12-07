import { BaseColumnFieldOptions, Field } from '@nocobase/database';
import * as math from 'mathjs';
import { DataTypes } from 'sequelize';

export class PointField extends Field {
  get dataType() {
    return DataTypes.GEOMETRY('POINT');
  }
}

export interface PointFieldOptions extends BaseColumnFieldOptions {
  type: 'point';
}

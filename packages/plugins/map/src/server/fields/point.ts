import { BaseColumnFieldOptions, Field, FieldContext } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import { joinComma } from '../helpers';

class Point extends DataTypes.ABSTRACT {
  key = 'Point';
}

export class PointField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const { name } = options
    super(
      {
        get() {
          const value = this.getDataValue(name);
          return value ? [value.x, value.y] : null
        },
        set(value) {
          this.setDataValue(name, joinComma(value))
        },
        ...options,
      },
      context,
    );
  }

  get dataType() {
    return Point;
  }

}

export interface PointFieldOptions extends BaseColumnFieldOptions {
  type: 'point';
}

import { BaseColumnFieldOptions, Field, FieldContext } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import { isPg, joinComma } from '../helpers';

// @ts-ignore
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
          if (isPg(context)) {
            return value ? [value.x, value.y] : null
          } else {
            return value?.coordinates
          }
        },
        set(value) {
          if (isPg(context)) {
            this.setDataValue(name, joinComma(value))
          } else {
            this.setDataValue(name, {
              type: 'Point',
              coordinates: value
            })
          }
        },
        ...options,
      },
      context,
    );
  }

  get dataType() {
    if (isPg(this.context)) {
      return Point;
    } else {
      return DataTypes.GEOMETRY('POINT');
    }
  }

}

export interface PointFieldOptions extends BaseColumnFieldOptions {
  type: 'point';
}

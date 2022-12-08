import { BaseColumnFieldOptions, Field, FieldContext } from '@nocobase/database';
import { DataTypes } from 'sequelize';

export class PointField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const { name } = options
    super(
      {
        get() {
          const value = this.getDataValue(name);
          return value?.coordinates
        },
        set(value) {
          this.setDataValue(name, {
            type: 'Point',
            coordinates: value
          })
        },
        ...options,
      },
      context,
    );
  }

  get dataType() {
    return DataTypes.GEOMETRY('POINT');
  }

}

export interface PointFieldOptions extends BaseColumnFieldOptions {
  type: 'point';
}

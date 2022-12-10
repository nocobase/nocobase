import { BaseColumnFieldOptions, Field, FieldContext } from '@nocobase/database';
import { DataTypes } from 'sequelize';

export class PolygonField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const { name } = options
    super(
      {
        get() {
          const value = this.getDataValue(name);
          return value?.coordinates[0]
        },
        set(value) {
          this.setDataValue(name, {
            type: 'Polygon',
            coordinates: [value]
          })
        },
        ...options,
      },
      context,
    );
  }

  get dataType() {
    return DataTypes.GEOMETRY('POLYGON');
  }

}

export interface PolygonFieldOptions extends BaseColumnFieldOptions {
  type: 'polygon';
}

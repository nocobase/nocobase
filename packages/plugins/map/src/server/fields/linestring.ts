import { BaseColumnFieldOptions, Field, FieldContext } from '@nocobase/database';
import { DataTypes } from 'sequelize';

export class LinestringField extends Field {
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
            type: 'LineString',
            coordinates: value
          })
        },
        ...options,
      },
      context,
    );
  }

  get dataType() {
    return DataTypes.GEOMETRY('LINESTRING');
  }

}

export interface LinestringOptions extends BaseColumnFieldOptions {
  type: 'linestring';
}

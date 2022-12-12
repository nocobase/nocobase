import { BaseColumnFieldOptions, Field, FieldContext } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import { isPg, joinComma, toValue } from '../helpers';

// @ts-ignore
class Polygon extends DataTypes.ABSTRACT {
  key = 'Polygon'
}

export class PolygonField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const { name } = options
    super(
      {
        get() {
          const value = this.getDataValue(name)
          if (isPg(context)) {
            return toValue(value)
          } else {
            return value?.coordinates[0]
          }
        },
        set(value) {
          if (isPg(context)) {
            this.setDataValue(name, joinComma(value.map((item: any) => joinComma(item))))
          } else {
            this.setDataValue(name, {
              type: 'Polygon',
              coordinates: [value]
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
      return Polygon;
    } else {
      return DataTypes.GEOMETRY('POLYGON');
    }
  }

}

export interface PolygonFieldOptions extends BaseColumnFieldOptions {
  type: 'polygon';
}

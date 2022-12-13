import { BaseColumnFieldOptions, Field, FieldContext } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import { isMysql, isPg, joinComma, toValue } from '../helpers';

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
          } else if (isMysql(context)) {
            return value?.coordinates[0]
          } else {
            return value
          }
        },
        set(value) {
          if (isPg(context)) {
            value = joinComma(value.map((item: any) => joinComma(item)))
          } else if (isMysql(context)) {
            value = {
              type: 'Polygon',
              coordinates: [value]
            }
          }
          this.setDataValue(name, value)
        },
        ...options,
      },
      context,
    );
  }

  get dataType() {
    if (isPg(this.context)) {
      return Polygon;
    } else if (isMysql(this.context)) {
      return DataTypes.GEOMETRY('POLYGON');
    } else {
      return DataTypes.JSON;
    }
  }

}

export interface PolygonFieldOptions extends BaseColumnFieldOptions {
  type: 'polygon';
}

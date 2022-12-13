import { BaseColumnFieldOptions, Field, FieldContext } from '@nocobase/database';
import { DataTypes } from 'sequelize';
import { isPg, joinComma, toValue } from '../helpers';

// @ts-ignore
class LineString extends DataTypes.ABSTRACT {
  key = 'Path';
}

export class LineStringField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const { name } = options
    super(
      {
        get() {
          const value = this.getDataValue(name);
          if (isPg(context)) {
            return toValue(value)
          } else {
            return value?.coordinates
          }
        },
        set(value) {
          if (isPg(context)) {
            this.setDataValue(name, joinComma(value.map(joinComma)))
          } else {
            this.setDataValue(name, {
              type: 'LineString',
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
      return LineString
    } else {
      return DataTypes.GEOMETRY('LINESTRING');
    }
  }

}

export interface LineStringOptions extends BaseColumnFieldOptions {
  type: 'lineString';
}
